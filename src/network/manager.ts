import { create, fromBinary, toBinary } from "@bufbuild/protobuf";
import { type Connection, Endpoint, type SendStream } from "@rayhanadev/iroh";
import { AsyncChannel } from "./async-channel";
import {
  type ChatMessage,
  ChatMessageSchema,
  JoinMessageSchema,
  LeaveMessageSchema,
  type Peer,
  PeerListMessageSchema,
  PeerSchema,
  type ProtocolMessage,
  ProtocolMessageSchema,
  SyncDataMessageSchema,
  SyncRequestMessageSchema,
} from "./generated/chatter/v1/protocol_pb.ts";
import { ALPN, MAX_MESSAGE_SIZE } from "./protocol";

const CONNECTION_TIMEOUT_MS = 10_000; // 10 seconds

export type PeerEvent =
  | { type: "message"; message: ProtocolMessage }
  | { type: "peer-joined"; peer: PeerInfo }
  | { type: "peer-left"; nodeId: string }
  | { type: "sync-data"; messages: ChatMessage[]; peers: PeerInfo[] }
  | { type: "connected" }
  | { type: "error"; error: Error };

export interface EventSubscription extends AsyncIterable<PeerEvent> {
  unsubscribe(): void;
}

export interface PeerInfo extends Omit<Peer, "$typeName" | "$unknown"> {
  connected: boolean;
}

function serialize(message: ProtocolMessage): Uint8Array {
  return toBinary(ProtocolMessageSchema, message);
}

function deserialize(data: Uint8Array): ProtocolMessage | null {
  try {
    return fromBinary(ProtocolMessageSchema, data);
  } catch {
    return null;
  }
}

function createJoinMessage(nodeId: string, nickname: string): ProtocolMessage {
  return create(ProtocolMessageSchema, {
    payload: {
      case: "join",
      value: create(JoinMessageSchema, { nodeId, nickname }),
    },
  });
}

function createLeaveMessage(nodeId: string): ProtocolMessage {
  return create(ProtocolMessageSchema, {
    payload: {
      case: "leave",
      value: create(LeaveMessageSchema, { nodeId }),
    },
  });
}

function createChatMessage(
  nodeId: string,
  nickname: string,
  text: string,
): ProtocolMessage {
  return create(ProtocolMessageSchema, {
    payload: {
      case: "chat",
      value: create(ChatMessageSchema, {
        id: crypto.randomUUID(),
        sender: nodeId,
        nickname,
        text,
        timestamp: BigInt(Date.now()),
      }),
    },
  });
}

function createPeerListMessage(
  peers: Array<{ nodeId: string; nickname: string }>,
): ProtocolMessage {
  return create(ProtocolMessageSchema, {
    payload: {
      case: "peerList",
      value: create(PeerListMessageSchema, {
        peers: peers.map((p) => create(PeerSchema, p)),
      }),
    },
  });
}

function createSyncDataMessage(
  peers: Array<{ nodeId: string; nickname: string }>,
  messages: ChatMessage[],
): ProtocolMessage {
  return create(ProtocolMessageSchema, {
    payload: {
      case: "syncData",
      value: create(SyncDataMessageSchema, {
        peers: peers.map((p) => create(PeerSchema, p)),
        messages,
      }),
    },
  });
}

function createSyncRequestMessage(): ProtocolMessage {
  return create(ProtocolMessageSchema, {
    payload: {
      case: "syncRequest",
      value: create(SyncRequestMessageSchema, {}),
    },
  });
}

const MAX_HISTORY_SIZE = 100;

export class PeerManager {
  private endpoint: Endpoint | null = null;
  private connections: Map<string, Connection> = new Map();
  private peerInfo: Map<string, PeerInfo> = new Map();
  private messageHistory: ChatMessage[] = [];
  private _nickname: string;
  private _nodeId: string = "";
  private acceptLoopRunning = false;
  private closed = false;

  private subscribers = new Set<AsyncChannel<PeerEvent>>();

  constructor(nickname: string) {
    this._nickname = nickname;
  }

  get nickname(): string {
    return this._nickname;
  }

  get nodeId(): string {
    return this._nodeId;
  }

  get peers(): PeerInfo[] {
    return Array.from(this.peerInfo.values());
  }

  subscribe(): EventSubscription {
    const channel = new AsyncChannel<PeerEvent>();
    this.subscribers.add(channel);

    return {
      [Symbol.asyncIterator]: () => channel[Symbol.asyncIterator](),
      unsubscribe: () => {
        this.subscribers.delete(channel);
        channel.close();
      },
    };
  }

  private emit(event: PeerEvent): void {
    for (const subscriber of this.subscribers) {
      subscriber.send(event);
    }
  }

  addToHistory(message: ChatMessage): void {
    this.messageHistory.push(message);
    if (this.messageHistory.length > MAX_HISTORY_SIZE) {
      this.messageHistory.shift();
    }
  }

  async create(): Promise<string> {
    this.endpoint = await Endpoint.createWithOptions({
      alpns: [ALPN],
    });

    this._nodeId = this.endpoint.nodeId();

    await this.endpoint.online();

    this.startAcceptLoop();

    this.emit({ type: "connected" });
    return this._nodeId;
  }

  async join(remoteNodeId: string): Promise<void> {
    this.endpoint = await Endpoint.createWithOptions({
      alpns: [ALPN],
    });

    this._nodeId = this.endpoint.nodeId();

    await this.endpoint.online();

    this.startAcceptLoop();

    // Connect with timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error("Connection timed out. The room may not exist or is unreachable."));
      }, CONNECTION_TIMEOUT_MS);
    });

    try {
      await Promise.race([
        this.connectToPeer(remoteNodeId, true),
        timeoutPromise,
      ]);
    } catch (error) {
      // Clean up on failure
      await this.close();
      throw error;
    }

    this.emit({ type: "connected" });
  }

  private async connectToPeer(nodeId: string, throwOnError = false): Promise<void> {
    if (this.connections.has(nodeId) || nodeId === this._nodeId) {
      return;
    }

    if (!this.endpoint || this.closed) {
      throw new Error("Endpoint not initialized or closed");
    }

    try {
      const conn = await this.endpoint.connect(nodeId, ALPN);
      this.connections.set(nodeId, conn);

      const existingPeer = this.peerInfo.get(nodeId);
      if (existingPeer && !existingPeer.connected) {
        existingPeer.connected = true;
        this.peerInfo.set(nodeId, existingPeer);
      }

      await this.sendTo(
        nodeId,
        createJoinMessage(this._nodeId, this._nickname),
      );

      this.handleConnection(conn, nodeId);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.emit({ type: "error", error: err });
      if (throwOnError) {
        throw err;
      }
    }
  }

  private startAcceptLoop(): void {
    if (this.acceptLoopRunning || !this.endpoint) return;
    this.acceptLoopRunning = true;

    const loop = async () => {
      while (!this.closed && this.endpoint) {
        try {
          const conn = await this.endpoint.accept();
          if (!conn) break;

          const remoteNodeId = conn.remoteNodeId();
          if (!this.connections.has(remoteNodeId)) {
            this.connections.set(remoteNodeId, conn);
            this.handleConnection(conn, remoteNodeId);
          }
        } catch (error) {
          if (!this.closed) {
            this.emit({
              type: "error",
              error: error instanceof Error ? error : new Error(String(error)),
            });
          }
          break;
        }
      }
      this.acceptLoopRunning = false;
    };

    loop().catch((err) => {
      if (!this.closed) {
        this.emit({ type: "error", error: err });
      }
    });
  }

  private handleConnection(conn: Connection, remoteNodeId: string): void {
    const receiveLoop = async () => {
      while (!this.closed && this.connections.has(remoteNodeId)) {
        try {
          const bi = await conn.acceptBi();
          const { recv, send } = bi;

          const data = await recv.readToEnd(MAX_MESSAGE_SIZE);
          const message = deserialize(data);

          if (message) {
            await this.handleMessage(message, send);
          }

          await send.finish();
        } catch {
          break;
        }
      }

      this.handleDisconnect(remoteNodeId);
    };

    receiveLoop().catch(() => {
      this.handleDisconnect(remoteNodeId);
    });
  }

  private async handleMessage(
    message: ProtocolMessage,
    sendStream?: SendStream,
  ): Promise<void> {
    switch (message.payload.case) {
      case "join": {
        const joinMsg = message.payload.value;
        const peer: PeerInfo = {
          nodeId: joinMsg.nodeId,
          nickname: joinMsg.nickname,
          connected: true,
        };
        this.peerInfo.set(joinMsg.nodeId, peer);
        this.emit({ type: "peer-joined", peer });

        if (sendStream) {
          const peerList = this.peers.map((p) => ({
            nodeId: p.nodeId,
            nickname: p.nickname,
          }));
          peerList.push({ nodeId: this._nodeId, nickname: this._nickname });

          const response = createSyncDataMessage(peerList, this.messageHistory);
          await sendStream.writeAll(Buffer.from(serialize(response)));
        }
        break;
      }

      case "peerList": {
        const peerListMsg = message.payload.value;
        for (const peer of peerListMsg.peers) {
          if (peer.nodeId === this._nodeId) continue;

          if (
            this.connections.has(peer.nodeId) &&
            !this.peerInfo.has(peer.nodeId)
          ) {
            const peerInfo: PeerInfo = {
              nodeId: peer.nodeId,
              nickname: peer.nickname,
              connected: true,
            };
            this.peerInfo.set(peer.nodeId, peerInfo);
            this.emit({ type: "peer-joined", peer: peerInfo });
          } else if (
            !this.connections.has(peer.nodeId) &&
            !this.peerInfo.has(peer.nodeId)
          ) {
            const peerInfo: PeerInfo = {
              nodeId: peer.nodeId,
              nickname: peer.nickname,
              connected: false,
            };
            this.peerInfo.set(peer.nodeId, peerInfo);
            this.emit({ type: "peer-joined", peer: peerInfo });

            this.connectToPeer(peer.nodeId).catch((err) => {
              this.emit({ type: "error", error: err });
            });
          }
        }
        break;
      }

      case "syncData": {
        const syncDataMsg = message.payload.value;
        for (const peer of syncDataMsg.peers) {
          if (peer.nodeId === this._nodeId) continue;

          if (!this.peerInfo.has(peer.nodeId)) {
            const peerInfo: PeerInfo = {
              nodeId: peer.nodeId,
              nickname: peer.nickname,
              connected: this.connections.has(peer.nodeId),
            };
            this.peerInfo.set(peer.nodeId, peerInfo);
            this.emit({ type: "peer-joined", peer: peerInfo });

            if (!this.connections.has(peer.nodeId)) {
              this.connectToPeer(peer.nodeId).catch((err) => {
                this.emit({ type: "error", error: err });
              });
            }
          }
        }

        // Emit sync-data with all current peers so UI can always sync
        // Clone peers and messages to avoid readonly issues with Immer
        this.emit({
          type: "sync-data",
          messages: syncDataMsg.messages.map((m) => ({ ...m })),
          peers: this.peers.map((p) => ({ ...p })),
        });
        break;
      }

      case "leave": {
        const leaveMsg = message.payload.value;
        this.handleDisconnect(leaveMsg.nodeId);
        break;
      }

      case "chat": {
        this.emit({ type: "message", message });
        break;
      }

      case "nickname": {
        const nicknameMsg = message.payload.value;
        const peer = this.peerInfo.get(nicknameMsg.nodeId);
        if (peer) {
          peer.nickname = nicknameMsg.nickname;
          this.peerInfo.set(nicknameMsg.nodeId, peer);
        }
        this.emit({ type: "message", message });
        break;
      }

      case "syncRequest": {
        if (sendStream) {
          const peerList = this.peers.map((p) => ({
            nodeId: p.nodeId,
            nickname: p.nickname,
          }));
          peerList.push({ nodeId: this._nodeId, nickname: this._nickname });

          const response = createSyncDataMessage(peerList, this.messageHistory);
          await sendStream.writeAll(Buffer.from(serialize(response)));
        }
        break;
      }
    }
  }

  private handleDisconnect(nodeId: string): void {
    if (this.peerInfo.has(nodeId)) {
      this.peerInfo.delete(nodeId);
      this.connections.delete(nodeId);
      this.emit({ type: "peer-left", nodeId });
    }
  }

  async sendTo(nodeId: string, message: ProtocolMessage): Promise<void> {
    const conn = this.connections.get(nodeId);
    if (!conn) {
      throw new Error(`Not connected to peer: ${nodeId}`);
    }

    try {
      const { send, recv } = await conn.openBi();
      await send.writeAll(Buffer.from(serialize(message)));
      await send.finish();

      try {
        const data = await recv.readToEnd(MAX_MESSAGE_SIZE);
        const response = deserialize(data);
        if (response) {
          await this.handleMessage(response);
        }
      } catch {
        // No response, that's fine
      }
    } catch (error) {
      this.emit({
        type: "error",
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }

  async broadcast(message: ProtocolMessage): Promise<void> {
    const promises: Promise<void>[] = [];

    for (const nodeId of this.connections.keys()) {
      promises.push(this.sendTo(nodeId, message));
    }

    await Promise.allSettled(promises);
  }

  async sendChatMessage(text: string): Promise<ChatMessage> {
    const chat = createChatMessage(this._nodeId, this._nickname, text);
    await this.broadcast(chat);
    return chat.payload.value as ChatMessage;
  }

  async requestSync(targetNodeId?: string): Promise<void> {
    // If a specific target is provided, use that; otherwise use first connection
    const target = targetNodeId ?? this.connections.keys().next().value;
    if (target && this.connections.has(target)) {
      await this.sendTo(target, createSyncRequestMessage());
    }
  }

  async close(): Promise<void> {
    this.closed = true;

    for (const subscriber of this.subscribers) {
      subscriber.close();
    }
    this.subscribers.clear();

    try {
      await this.broadcast(createLeaveMessage(this._nodeId));
    } catch {
      // Ignore errors during cleanup
    }

    for (const conn of this.connections.values()) {
      try {
        conn.close(0, "Leaving room");
      } catch {
        // Ignore
      }
    }

    this.connections.clear();
    this.peerInfo.clear();

    if (this.endpoint) {
      try {
        await this.endpoint.close();
      } catch {
        // Ignore
      }
      this.endpoint = null;
    }
  }
}
