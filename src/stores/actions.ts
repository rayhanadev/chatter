import type { ChatMessage } from "../network/generated/chatter/v1/protocol_pb";
import type {
  ConnectionState,
  ChatState,
  UIState,
  PeerInfo,
  MenuMode,
  Screen,
} from "./types";

type ImmerSetter<T> = (fn: (draft: T) => void) => void;

export const connectionActions = {
  setConnected: (
    set: ImmerSetter<ConnectionState>,
    selfNodeId: string,
    roomId: string
  ) => {
    set((draft) => {
      draft.selfNodeId = selfNodeId;
      draft.roomId = roomId;
      draft.isConnecting = false;
    });
  },

  setConnecting: (set: ImmerSetter<ConnectionState>, isConnecting: boolean) => {
    set((draft) => {
      draft.isConnecting = isConnecting;
    });
  },

  addPeer: (set: ImmerSetter<ConnectionState>, peer: PeerInfo) => {
    set((draft) => {
      draft.peers.set(peer.nodeId, {
        nodeId: peer.nodeId,
        nickname: peer.nickname,
        connected: peer.connected,
      });
    });
  },

  removePeer: (set: ImmerSetter<ConnectionState>, nodeId: string) => {
    set((draft) => {
      draft.peers.delete(nodeId);
    });
  },

  setPeerConnected: (
    set: ImmerSetter<ConnectionState>,
    nodeId: string,
    connected: boolean
  ) => {
    set((draft) => {
      const peer = draft.peers.get(nodeId);
      if (peer) {
        peer.connected = connected;
      }
    });
  },

  syncPeers: (set: ImmerSetter<ConnectionState>, peers: PeerInfo[]) => {
    set((draft) => {
      for (const peer of peers) {
        draft.peers.set(peer.nodeId, {
          nodeId: peer.nodeId,
          nickname: peer.nickname,
          connected: peer.connected,
        });
      }
    });
  },

  reset: (set: ImmerSetter<ConnectionState>) => {
    set((draft) => {
      draft.selfNodeId = null;
      draft.roomId = null;
      draft.isConnecting = false;
      draft.peers.clear();
    });
  },
};

export const chatActions = {
  setNickname: (set: ImmerSetter<ChatState>, nickname: string) => {
    set((draft) => {
      draft.nickname = nickname;
    });
  },

  addMessage: (set: ImmerSetter<ChatState>, message: ChatMessage) => {
    set((draft) => {
      draft.messages.push({
        id: message.id,
        sender: message.sender,
        nickname: message.nickname,
        text: message.text,
        timestamp: message.timestamp,
      } as ChatMessage);
    });
  },

  syncMessages: (set: ImmerSetter<ChatState>, messages: ChatMessage[]) => {
    set((draft) => {
      const existingIds = new Set(draft.messages.map((m) => m.id));

      for (const msg of messages) {
        if (!existingIds.has(msg.id)) {
          draft.messages.push({
            id: msg.id,
            sender: msg.sender,
            nickname: msg.nickname,
            text: msg.text,
            timestamp: msg.timestamp,
          } as ChatMessage);
        }
      }

      draft.messages.sort((a, b) => Number(a.timestamp - b.timestamp));
    });
  },

  clearMessages: (set: ImmerSetter<ChatState>) => {
    set((draft) => {
      draft.messages = [];
    });
  },

  reset: (set: ImmerSetter<ChatState>) => {
    set((draft) => {
      draft.messages = [];
    });
  },
};

export const uiActions = {
  setScreen: (set: ImmerSetter<UIState>, screen: Screen) => {
    set((draft) => {
      draft.screen = screen;
    });
  },

  setMenuMode: (set: ImmerSetter<UIState>, mode: MenuMode) => {
    set((draft) => {
      draft.menuMode = mode;
    });
  },

  setMenuSelection: (set: ImmerSetter<UIState>, selection: number) => {
    set((draft) => {
      draft.menuSelection = selection;
    });
  },

  setError: (set: ImmerSetter<UIState>, error: string | null) => {
    set((draft) => {
      draft.error = error;
    });
  },

  setStatusMessage: (set: ImmerSetter<UIState>, message: string | null) => {
    set((draft) => {
      draft.statusMessage = message;
    });
  },

  resetToMenu: (set: ImmerSetter<UIState>) => {
    set((draft) => {
      draft.screen = "menu";
      draft.menuMode = "menu";
      draft.menuSelection = 0;
      draft.error = null;
      draft.statusMessage = null;
    });
  },
};
