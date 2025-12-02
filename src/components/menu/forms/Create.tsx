import type { PasteEvent } from "@opentui/core";
import { useKeyboard } from "@opentui/react";
import { useState } from "react";
import { PeerManager } from "../../../network/manager.ts";
import {
  useConnectionState,
  useConnectionActions,
  useChatState,
  useChatActions,
  useUIActions,
  usePeerManager,
} from "../../../stores";

export function Create() {
  const { isConnecting } = useConnectionState();
  const { setConnecting, setConnected } = useConnectionActions();
  const { nickname } = useChatState();
  const { setNickname } = useChatActions();
  const { setMenuMode, setScreen, setError } = useUIActions();
  const { setPeerManager } = usePeerManager();

  const [inputValue, setInputValue] = useState(nickname);

  useKeyboard((key) => {
    if (isConnecting) return;
    if (key.name === "escape") {
      setMenuMode("menu");
    }
  });

  const handleSubmit = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || isConnecting) return;

    setNickname(trimmed);
    setConnecting(true);
    setError(null);

    try {
      const manager = new PeerManager(trimmed);
      const nodeId = await manager.create();

      setPeerManager(manager);
      setConnected(nodeId, nodeId);
      setScreen("chat");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create room");
    } finally {
      setConnecting(false);
    }
  };

  const handlePaste = (event: PasteEvent) => {
    setInputValue((prev) => prev + event.text);
    event.preventDefault();
  };

  return (
    <box flexDirection="column" minWidth={40} paddingBottom={2}>
      <text fg="#ffffff">Enter your nickname:</text>
      <box border borderColor="#ff69b4" height={3}>
        <input
          placeholder="Your nickname..."
          value={inputValue}
          onInput={setInputValue}
          onSubmit={handleSubmit}
          onPaste={handlePaste}
          focused
          cursorColor="#ff69b4"
        />
      </box>
      <text fg="#666666">Press Enter to create room, Esc to go back</text>
    </box>
  );
}
