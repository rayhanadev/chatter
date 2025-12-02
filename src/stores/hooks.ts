import { useAtomValue, useSetAtom } from "jotai";
import { useEffect, useMemo } from "react";
import type { ChatMessage } from "../network/generated/chatter/v1/protocol_pb";
import { chatActions, connectionActions, uiActions } from "./actions";
import { chatAtom, connectionAtom, peerManagerAtom, uiAtom } from "./atoms";
import type { MenuMode, PeerInfo, Screen, SystemMessage } from "./types";

export function useConnectionState() {
	const state = useAtomValue(connectionAtom);
	return {
		selfNodeId: state.selfNodeId,
		roomId: state.roomId,
		isConnecting: state.isConnecting,
		isElecting: state.isElecting,
		isHost: state.isHost,
		peers: state.peers,
		peerCount: state.peers.size,
	};
}

export function useConnectionActions() {
	const setConnection = useSetAtom(connectionAtom);

	return useMemo(
		() => ({
			setConnected: (
				selfNodeId: string,
				roomId: string,
				isHost: boolean = false,
			) =>
				connectionActions.setConnected(
					setConnection,
					selfNodeId,
					roomId,
					isHost,
				),
			setConnecting: (isConnecting: boolean) =>
				connectionActions.setConnecting(setConnection, isConnecting),
			setElecting: (isElecting: boolean) =>
				connectionActions.setElecting(setConnection, isElecting),
			setHost: (isHost: boolean) =>
				connectionActions.setHost(setConnection, isHost),
			setRoomId: (roomId: string) =>
				connectionActions.setRoomId(setConnection, roomId),
			addPeer: (peer: PeerInfo) =>
				connectionActions.addPeer(setConnection, peer),
			removePeer: (nodeId: string) =>
				connectionActions.removePeer(setConnection, nodeId),
			syncPeers: (peers: PeerInfo[]) =>
				connectionActions.syncPeers(setConnection, peers),
			reset: () => connectionActions.reset(setConnection),
		}),
		[setConnection],
	);
}

export function usePeers() {
	const state = useAtomValue(connectionAtom);
	const selfNodeId = state.selfNodeId;
	const peers = state.peers;

	return useMemo(
		() =>
			Array.from(peers.values()).map((peer) => ({
				...peer,
				isSelf: peer.nodeId === selfNodeId,
			})),
		[peers, selfNodeId],
	);
}

export function useChatState() {
	const state = useAtomValue(chatAtom);
	return {
		messages: state.messages,
		nickname: state.nickname,
	};
}

export function useChatActions() {
	const setChat = useSetAtom(chatAtom);

	return useMemo(
		() => ({
			setNickname: (nickname: string) =>
				chatActions.setNickname(setChat, nickname),
			addMessage: (message: ChatMessage) =>
				chatActions.addMessage(setChat, message),
			addSystemMessage: (message: SystemMessage) =>
				chatActions.addSystemMessage(setChat, message),
			syncMessages: (messages: ChatMessage[]) =>
				chatActions.syncMessages(setChat, messages),
			clearMessages: () => chatActions.clearMessages(setChat),
			reset: () => chatActions.reset(setChat),
		}),
		[setChat],
	);
}

export function useUIState() {
	const state = useAtomValue(uiAtom);
	return {
		screen: state.screen,
		menuMode: state.menuMode,
		menuSelection: state.menuSelection,
		error: state.error,
		statusMessage: state.statusMessage,
	};
}

export function useUIActions() {
	const setUI = useSetAtom(uiAtom);

	return useMemo(
		() => ({
			setScreen: (screen: Screen) => uiActions.setScreen(setUI, screen),
			setMenuMode: (mode: MenuMode) => uiActions.setMenuMode(setUI, mode),
			setMenuSelection: (selection: number) =>
				uiActions.setMenuSelection(setUI, selection),
			setError: (error: string | null) => uiActions.setError(setUI, error),
			setStatusMessage: (message: string | null) =>
				uiActions.setStatusMessage(setUI, message),
			resetToMenu: () => uiActions.resetToMenu(setUI),
		}),
		[setUI],
	);
}

export function usePeerManager() {
	const peerManager = useAtomValue(peerManagerAtom);
	const setPeerManager = useSetAtom(peerManagerAtom);

	return { peerManager, setPeerManager };
}

export function usePeerEvents() {
	const peerManager = useAtomValue(peerManagerAtom);
	const connectionState = useAtomValue(connectionAtom);
	const selfNodeId = connectionState.selfNodeId;
	const roomId = connectionState.roomId;

	const setConnection = useSetAtom(connectionAtom);
	const setChat = useSetAtom(chatAtom);
	const setUI = useSetAtom(uiAtom);

	useEffect(() => {
		if (!peerManager) return;

		const subscription = peerManager.subscribe();

		const processEvents = async () => {
			for await (const event of subscription) {
				switch (event.type) {
					case "message": {
						if (event.message.payload.case === "chat") {
							const chatMessage = event.message.payload.value;
							peerManager.addToHistory(chatMessage);
							chatActions.addMessage(setChat, chatMessage);
						}
						break;
					}

					case "peer-joined": {
						connectionActions.addPeer(setConnection, event.peer);
						break;
					}

					case "peer-left": {
						connectionActions.removePeer(setConnection, event.nodeId);
						break;
					}

					case "sync-data": {
						chatActions.syncMessages(setChat, event.messages);
						connectionActions.syncPeers(setConnection, event.peers);
						break;
					}

					case "error": {
						uiActions.setStatusMessage(setUI, event.error.message);
						break;
					}

					case "host-disconnected": {
						// Set electing state and add system message
						connectionActions.setElecting(setConnection, true);
						chatActions.addSystemMessage(setChat, {
							id: crypto.randomUUID(),
							type: "host-disconnected",
							timestamp: BigInt(Date.now()),
						});
						break;
					}

					case "new-leader": {
						// Update state with new host
						connectionActions.setElecting(setConnection, false);
						connectionActions.setRoomId(setConnection, event.newHostId);
						connectionActions.setHost(setConnection, event.isMe);

						// Add system message about new host
						chatActions.addSystemMessage(setChat, {
							id: crypto.randomUUID(),
							type: "new-host-elected",
							timestamp: BigInt(Date.now()),
							newHostId: event.newHostId,
							newHostNickname: event.newHostNickname,
						});

						// If this peer is the new host, add an additional message
						if (event.isMe) {
							chatActions.addSystemMessage(setChat, {
								id: crypto.randomUUID(),
								type: "you-are-host",
								timestamp: BigInt(Date.now()),
							});
						}
						break;
					}
				}
			}
		};

		processEvents();

		// Request sync if joining an existing room (not the host)
		if (roomId && roomId !== selfNodeId) {
			peerManager.requestSync(roomId).catch(() => {
				// Ignore errors
			});
		}

		return () => {
			subscription.unsubscribe();
		};
	}, [peerManager, roomId, selfNodeId, setConnection, setChat, setUI]);
}
