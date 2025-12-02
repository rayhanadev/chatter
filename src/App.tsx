import type { Selection } from "@opentui/core";
import { useKeyboard, useRenderer } from "@opentui/react";
import clipboard from "clipboardy";
import { useEffect } from "react";
import { ChatView } from "./components/chat/index.tsx";
import { MenuView } from "./components/menu/index.tsx";
import { usePeerManager, useUIActions, useUIState } from "./stores";

export function App() {
	const renderer = useRenderer();

	const { screen } = useUIState();
	const { setStatusMessage } = useUIActions();
	const { peerManager } = usePeerManager();

	// Handle Ctrl+C to properly cleanup P2P connections before exiting
	useKeyboard((key) => {
		if (key.ctrl && key.name === "c") {
			(async () => {
				if (peerManager) {
					await peerManager.close();
				}
				process.exit(0);
			})();
		}
	});

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
