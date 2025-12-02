import { usePeers } from "../../stores";

export function Sidebar() {
	const peers = usePeers();

	return (
		<box flexDirection="column" width={20} border title="Peers" padding={1}>
			<scrollbox style={{ flexGrow: 1 }}>
				{peers.map((peer) => (
					<box key={peer.nodeId} marginBottom={1}>
						<text
							fg={
								peer.isSelf ? "#ff69b4" : peer.connected ? "#ffffff" : "#666666"
							}
						>
							{peer.connected ? "*" : "o"} {peer.nickname}
							{peer.isSelf ? " (you)" : ""}
						</text>
					</box>
				))}
			</scrollbox>
		</box>
	);
}
