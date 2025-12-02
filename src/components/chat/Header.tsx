import { useConnectionState } from "../../stores";

export function Header() {
	const { roomId, peerCount } = useConnectionState();

	return (
		<box
			flexDirection="row"
			height={3}
			border
			paddingLeft={1}
			paddingRight={1}
			gap={2}
		>
			<text fg="#ff69b4">
				<b>Room ID:</b> {roomId ?? "unknown"}
			</text>
			<text fg="#888888">|</text>
			<text fg="#ff69b4">
				<b>{peerCount}</b> {peerCount === 1 ? "peer" : "peers"} connected
			</text>
		</box>
	);
}
