import type { Selection } from "@opentui/core";
import { useRenderer } from "@opentui/react";
import clipboard from "clipboardy";
import { useEffect } from "react";
import { ChatView } from "./components/chat/index.tsx";
import { MenuView } from "./components/menu/index.tsx";
import { useUIState, useUIActions } from "./stores";

export function App() {
	const renderer = useRenderer();

	const { screen } = useUIState();
	const { setStatusMessage } = useUIActions();

	useEffect(() => {
		const handleSelection = (selection: Selection) => {
			if (!selection.isSelecting) {
				const text = selection.getSelectedText();
				if (text) {
					clipboard.writeSync(text);
					renderer.clearSelection();
					setStatusMessage("Copied to clipboard");
					setTimeout(() => setStatusMessage(null), 2000);
				}
			}
		};

		renderer.on("selection", handleSelection);
		return () => {
			renderer.off("selection", handleSelection);
		};
	}, [renderer, setStatusMessage]);

	return screen === "menu" ? <MenuView /> : <ChatView />;
}
