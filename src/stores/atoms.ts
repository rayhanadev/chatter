import { enableMapSet } from "immer";
import { atom } from "jotai";
import { atomWithImmer } from "jotai-immer";
import type { PeerManager } from "../network/manager";
import {
	type ChatState,
	type ConnectionState,
	initialChatState,
	initialConnectionState,
	initialUIState,
	type UIState,
} from "./types";

enableMapSet();

export const connectionAtom = atomWithImmer<ConnectionState>(
	initialConnectionState,
);
export const chatAtom = atomWithImmer<ChatState>(initialChatState);
export const uiAtom = atomWithImmer<UIState>(initialUIState);
export const peerManagerAtom = atom<PeerManager | null>(null);
