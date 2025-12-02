import { useTerminalDimensions } from "@opentui/react";
import { useCallback } from "react";
import {
  useConnectionState,
  usePeerManager,
  useChatActions,
  useUIState,
  useUIActions,
  usePeerEvents,
} from "../../stores";
import { Header } from "./Header.tsx";
import { MessageInput } from "./MessageInput.tsx";
import { MessageList } from "./MessageList.tsx";
import { Sidebar } from "./Sidebar.tsx";

export function ChatView() {
  const { width, height } = useTerminalDimensions();
  const { selfNodeId } = useConnectionState();
  const { statusMessage } = useUIState();
  const { setStatusMessage } = useUIActions();
  const { peerManager } = usePeerManager();
  const { addMessage } = useChatActions();

  // Subscribe to peer manager events
  usePeerEvents();

  const handleOnSend = useCallback(
    async (text: string) => {
      if (!peerManager || !selfNodeId) return;

      try {
        const message = await peerManager.sendChatMessage(text);
        peerManager.addToHistory(message);
        addMessage(message);
      } catch (err) {
        setStatusMessage(
          err instanceof Error ? err.message : "Failed to send message",
        );
      }
    },
    [selfNodeId, peerManager, addMessage, setStatusMessage],
  );

  return (
    <box flexDirection="column" width={width} height={height} padding={1}>
      <Header />
      <box flexDirection="row" flexGrow={1} gap={1}>
        <box flexDirection="column" flexGrow={1}>
          <MessageList />
        </box>
        <Sidebar />
      </box>

      {/* Input */}
      <box marginTop={1} flexDirection="column">
        <MessageInput onSend={handleOnSend} />
      </box>
      <text fg="#ff69b4" marginTop={1}>
        {statusMessage}
      </text>
    </box>
  );
}
