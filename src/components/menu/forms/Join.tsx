import { useState } from "react";
import { useKeyboard } from "@opentui/react";
import type { PasteEvent } from "@opentui/core";
import { PeerManager } from "../../../network/manager.ts";
import {
  useConnectionState,
  useConnectionActions,
  useChatState,
  useChatActions,
  useUIActions,
  usePeerManager,
} from "../../../stores";

type InputFocus = "nickname" | "nodeId";

// Iroh node IDs are 64-character hex strings
const NODE_ID_LENGTH = 64;
const NODE_ID_PATTERN = /^[0-9a-f]{64}$/i;

function validateNodeId(nodeId: string): string | null {
  if (!nodeId) {
    return "Room ID is required";
  }
  if (nodeId.length !== NODE_ID_LENGTH) {
    return `Invalid Room ID: expected ${NODE_ID_LENGTH} characters, got ${nodeId.length}`;
  }
  if (!NODE_ID_PATTERN.test(nodeId)) {
    return "Invalid Room ID: must be a valid hex string";
  }
  return null;
}

export function Join() {
  const { isConnecting } = useConnectionState();
  const { setConnecting, setConnected } = useConnectionActions();
  const { nickname } = useChatState();
  const { setNickname } = useChatActions();
  const { setMenuMode, setScreen, setError } = useUIActions();
  const { setPeerManager } = usePeerManager();

  const [nicknameInput, setNicknameInput] = useState(nickname);
  const [nodeIdInput, setNodeIdInput] = useState("");
  const [inputFocus, setInputFocus] = useState<InputFocus>("nickname");

  useKeyboard((key) => {
    if (isConnecting) return;
    if (key.name === "escape") {
      setMenuMode("menu");
    }
  });

  const handleNicknameSubmit = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setNickname(trimmed);
    setInputFocus("nodeId");
  };

  const handleNodeIdSubmit = async (value: string) => {
    const trimmedNodeId = value.trim();
    const trimmedNickname = nicknameInput.trim();

    if (!trimmedNickname || isConnecting) return;

    // Validate node ID format before attempting connection
    const validationError = validateNodeId(trimmedNodeId);
    if (validationError) {
      setError(validationError);
      return;
    }

    setNickname(trimmedNickname);
    setConnecting(true);
    setError(null);

    try {
      const manager = new PeerManager(trimmedNickname);
      await manager.join(trimmedNodeId);

      setPeerManager(manager);
      setConnected(manager.nodeId, trimmedNodeId);
      setScreen("chat");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join room");
    } finally {
      setConnecting(false);
    }
  };

  const handleNicknamePaste = (event: PasteEvent) => {
    setNicknameInput((prev) => prev + event.text);
    event.preventDefault();
  };

  const handleNodeIdPaste = (event: PasteEvent) => {
    setNodeIdInput((prev) => prev + event.text);
    event.preventDefault();
  };

  return (
    <box flexDirection="column" minWidth={40} paddingBottom={2}>
      <text fg="#ffffff">Enter your nickname:</text>
      <box
        border
        borderColor={inputFocus === "nickname" ? "#ff69b4" : "#444444"}
        height={3}
      >
        <input
          placeholder="Your nickname..."
          value={nicknameInput}
          onInput={setNicknameInput}
          onSubmit={handleNicknameSubmit}
          onPaste={handleNicknamePaste}
          focused={inputFocus === "nickname"}
          cursorColor="#ff69b4"
        />
      </box>

      <text fg="#ffffff">Enter the Node ID to connect:</text>
      <box
        border
        borderColor={inputFocus === "nodeId" ? "#ff69b4" : "#444444"}
        height={3}
      >
        <input
          placeholder="Paste the Node ID here..."
          value={nodeIdInput}
          onInput={setNodeIdInput}
          onSubmit={handleNodeIdSubmit}
          onPaste={handleNodeIdPaste}
          focused={inputFocus === "nodeId"}
          cursorColor="#ff69b4"
        />
      </box>
      <text fg="#666666">Press Enter to continue, Esc to go back</text>
    </box>
  );
}
