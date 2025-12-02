import { useKeyboard } from "@opentui/react";
import { useConnectionState, useUIState, useUIActions } from "../../stores";

export function Menu() {
  const { isConnecting } = useConnectionState();
  const { menuSelection } = useUIState();
  const { setMenuSelection, setMenuMode } = useUIActions();

  useKeyboard((key) => {
    if (isConnecting) return;

    if (
      key.name === "up" ||
      key.name === "k" ||
      (key.shift && key.name === "tab")
    ) {
      setMenuSelection(menuSelection === 0 ? 1 : 0);
    } else if (key.name === "down" || key.name === "j" || key.name === "tab") {
      setMenuSelection(menuSelection === 1 ? 0 : 1);
    } else if (key.name === "return") {
      setMenuMode(menuSelection === 0 ? "create" : "join");
    }
  });

  const isCreateSelected = menuSelection === 0;
  const isJoinSelected = menuSelection === 1;

  return (
    <box flexDirection="column" minWidth={40} paddingBottom={2}>
      <box
        border
        borderColor={isCreateSelected ? "#ff69b4" : "#444444"}
        backgroundColor={isCreateSelected ? "#2f1a2a" : undefined}
      >
        <text fg={isCreateSelected ? "#ff69b4" : "#888888"}>
          {isCreateSelected ? " > " : "   "}Create a new room
        </text>
      </box>
      <box
        border
        borderColor={isJoinSelected ? "#ff69b4" : "#444444"}
        backgroundColor={isJoinSelected ? "#2f1a2a" : undefined}
      >
        <text fg={isJoinSelected ? "#ff69b4" : "#888888"}>
          {isJoinSelected ? " > " : "   "}Join existing room
        </text>
      </box>
      <text fg="#666666">Use arrows to select, Enter to confirm</text>
    </box>
  );
}
