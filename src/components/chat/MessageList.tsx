import type { ChatMessage } from "../../network/generated/chatter/v1/protocol_pb";
import { useChatState } from "../../stores";
import { isSystemMessage, type SystemMessage } from "../../stores/types";
import { nicknameToColor } from "../../utils/colors";

function formatTime(timestamp: bigint): string {
	const date = new Date(Number(timestamp));
	const hours = date.getHours().toString().padStart(2, "0");
	const minutes = date.getMinutes().toString().padStart(2, "0");
	return `${hours}:${minutes}`;
}

function SystemMessageItem({ msg }: { msg: SystemMessage }) {
	switch (msg.type) {
		case "host-disconnected":
			return (
				<box key={msg.id} marginBottom={1}>
					<text fg="#666666">Host disconnected. Finding new host...</text>
				</box>
			);
		case "new-host-elected": {
			const nickname = msg.newHostNickname ?? "unknown";
			const nodeIdShort = msg.newHostId?.slice(0, 8) ?? "unknown";
			return (
				<box key={msg.id} marginBottom={1}>
					<text>
						<span fg="#666666">New host elected: </span>
						<span fg={nicknameToColor(nickname)}>
							<b>{nickname}</b>
						</span>
						<span fg="#666666">#{nodeIdShort}!</span>
					</text>
				</box>
			);
		}
		case "you-are-host":
			return (
				<box key={msg.id} marginBottom={1}>
					<text fg="#666666">You are now the host.</text>
				</box>
			);
		default:
			return (
				<box key={msg.id} marginBottom={1}>
					<text fg="#666666">System message</text>
				</box>
			);
	}
}

function ChatMessageItem({ msg }: { msg: ChatMessage }) {
	return (
		<box key={msg.id} marginBottom={1}>
			<text>
				<span fg="#666666">[{formatTime(msg.timestamp)}]</span>{" "}
				<span fg={nicknameToColor(msg.nickname)}>
					<b>{msg.nickname}</b>
					<em fg="#666666">#{msg.sender.slice(0, 8)}</em>
				</span>
				: {msg.text}
			</text>
		</box>
	);
}

export function MessageList() {
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
				messages.map((msg) =>
					isSystemMessage(msg) ? (
						<SystemMessageItem key={msg.id} msg={msg} />
					) : (
						<ChatMessageItem key={msg.id} msg={msg as ChatMessage} />
					),
				)
			)}
		</scrollbox>
	);
}
