import { atom } from "jotai";
import { atomWithImmer } from "jotai-immer";
import { enableMapSet } from "immer";
import type { PeerManager } from "../network/manager";
import {
  type ConnectionState,
  type ChatState,
  type UIState,
  initialConnectionState,
  initialChatState,
  initialUIState,
} from "./types";

enableMapSet();

export const connectionAtom = atomWithImmer<ConnectionState>(initialConnectionState);
export const chatAtom = atomWithImmer<ChatState>(initialChatState);
export const uiAtom = atomWithImmer<UIState>(initialUIState);
export const peerManagerAtom = atom<PeerManager | null>(null);
