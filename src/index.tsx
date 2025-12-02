#!/usr/bin/env bun
import { createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";

import { App } from "./App.tsx";

async function main() {
	const renderer = await createCliRenderer({
		targetFps: 60,
		useAlternateScreen: true,
		useMouse: true,
	});

	const root = createRoot(renderer);
	root.render(<App />);
}

main().catch((error) => {
	console.error("unhandled rejection:", error);
	process.exit(1);
});
