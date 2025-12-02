import { useChatState } from "../../stores";
import { nicknameToColor } from "../../utils/colors";

function formatTime(timestamp: bigint): string {
  const date = new Date(Number(timestamp));
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
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
        messages.map((msg) => (
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
        ))
      )}
    </scrollbox>
  );
}
