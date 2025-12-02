import type { ChatMessage } from "../network/generated/chatter/v1/protocol_pb";

export interface PeerInfo {
	nodeId: string;
	nickname: string;
}

export interface ConnectionState {
	selfNodeId: string | null;
	roomId: string | null;
	isConnecting: boolean;
	isElecting: boolean;
	isHost: boolean;
	peers: Map<string, PeerInfo>;
}

export const initialConnectionState: ConnectionState = {
	selfNodeId: null,
	roomId: null,
	isConnecting: false,
	isElecting: false,
	isHost: false,
	peers: new Map(),
};

export type SystemMessageType =
	| "host-disconnected"
	| "new-host-elected"
	| "you-are-host";

export interface SystemMessage {
	id: string;
	type: SystemMessageType;
	timestamp: bigint;
	newHostId?: string;
	newHostNickname?: string;
}

export type DisplayMessage = ChatMessage | SystemMessage;

export function isSystemMessage(
	message: DisplayMessage,
): message is SystemMessage {
	return "type" in message && !("sender" in message);
}

export interface ChatState {
	messages: DisplayMessage[];
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
