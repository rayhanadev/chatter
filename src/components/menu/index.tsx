import { useConnectionState, useUIState } from "../../stores";
import { Create } from "./forms/Create.tsx";
import { Join } from "./forms/Join.tsx";
import { Menu } from "./Menu.tsx";

export function MenuView() {
  const { isConnecting } = useConnectionState();
  const { menuMode, error } = useUIState();

  return (
    <box
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      flexGrow={1}
      gap={1}
    >
      <text fg="#ff69b4">
        <b>@rayhanadev/chatter</b>
      </text>

      <text fg="#888888">Peer-to-peer chat in your terminal</text>

      {error && <text fg="#ff4444">{error}</text>}

      {isConnecting && <text fg="#ff69b4">Connecting...</text>}

      {menuMode === "menu" && <Menu />}
      {menuMode === "create" && <Create />}
      {menuMode === "join" && <Join />}

      <text fg="#444444">Press Ctrl+C to exit</text>
    </box>
  );
}
