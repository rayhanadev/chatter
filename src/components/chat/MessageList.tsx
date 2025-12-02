import { useConnectionState, useChatState } from "../../stores";

function nicknameToColor(nickname: string): string {
	const pinks = [
		"#ff69b4", // hot pink
		"#ff1493", // deep pink
		"#ff85c1", // light hot pink
		"#db7093", // pale violet red
		"#ff6eb4", // hot pink variant
		"#e75480", // dark pink
		"#f78fb3", // soft pink
		"#fd79a8", // pastel pink
		"#ff9de2", // bright pink
		"#d63384", // raspberry
	];

	let hash = 0;
	for (let i = 0; i < nickname.length; i++) {
		hash = ((hash << 5) - hash + nickname.charCodeAt(i)) | 0;
	}

	return pinks[Math.abs(hash) % pinks.length]!;
}

function formatTime(timestamp: bigint): string {
	const date = new Date(Number(timestamp));
	const hours = date.getHours().toString().padStart(2, "0");
	const minutes = date.getMinutes().toString().padStart(2, "0");
	return `${hours}:${minutes}`;
}

export function MessageList() {
	const { selfNodeId } = useConnectionState();
	const { messages } = useChatState();

	return (
		<scrollbox
			style={{
				flexGrow: 1,
				border: true,
				padding: 1,
			}}
			stickyScroll
			stickyStart="bottom"
		>
			{messages.length === 0 ? (
				<text fg="#666666">No messages yet. Start chatting!</text>
			) : (
				messages.map((msg) => (
					<box key={msg.id} marginBottom={1}>
						<text>
							<span fg="#666666">[{formatTime(msg.timestamp)}]</span>{" "}
							<span
								fg={
									msg.sender === selfNodeId
										? "#ff69b4"
										: nicknameToColor(msg.nickname)
								}
							>
								<b>{msg.nickname}</b>
								<em fg="#666666">#{msg.sender.slice(0, 8)}</em>
							</span>
							: {msg.text}
						</text>
					</box>
				))
			)}
		</scrollbox>
	);
}
