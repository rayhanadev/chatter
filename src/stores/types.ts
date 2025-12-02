import type { ChatMessage } from "../network/generated/chatter/v1/protocol_pb";

export interface PeerInfo {
  nodeId: string;
  nickname: string;
  connected: boolean;
}

export interface ConnectionState {
  selfNodeId: string | null;
  roomId: string | null;
  isConnecting: boolean;
  peers: Map<string, PeerInfo>;
}

export const initialConnectionState: ConnectionState = {
  selfNodeId: null,
  roomId: null,
  isConnecting: false,
  peers: new Map(),
};

export interface ChatState {
  messages: ChatMessage[];
  nickname: string;
}

export const initialChatState: ChatState = {
  messages: [],
  nickname: "",
};

export type Screen = "menu" | "chat";
export type MenuMode = "menu" | "create" | "join";

export interface UIState {
  screen: Screen;
  menuMode: MenuMode;
  menuSelection: number;
  error: string | null;
  statusMessage: string | null;
}

export const initialUIState: UIState = {
  screen: "menu",
  menuMode: "menu",
  menuSelection: 0,
  error: null,
  statusMessage: null,
};
