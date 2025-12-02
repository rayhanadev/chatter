#!/usr/bin/env bun
import { createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";
import sade from "sade";

import { App } from "./App.tsx";
import { version, description } from "../package.json";
import { PeerManager } from "./network/manager.ts";

const cli = sade("chatter");

cli.version(version).describe(description);

cli
  .command("host", "host a new room headlessly")
  .option("nickname", "nickname to use", "host")
  .action(async (options: { nickname: string }) => {
    const manager = new PeerManager(options.nickname);

    const cleanup = async () => {
      console.log("\nShutting down...");
      await manager.close();
      process.exit(0);
    };

    process.on("SIGINT", cleanup);
    process.on("SIGTERM", cleanup);

    const subscription = manager.subscribe();

    (async () => {
      for await (const event of subscription) {
        switch (event.type) {
          case "message":
            if (event.message.payload.case === "chat") {
              const chatMessage = event.message.payload.value;
              manager.addToHistory(chatMessage);
              console.log(`[${chatMessage.nickname}]: ${chatMessage.text}`);
            }
            break;
          case "peer-joined":
            console.log(
              `Peer joined: ${event.peer.nickname} (${event.peer.nodeId.slice(0, 8)}...)`,
            );
            break;
          case "peer-left":
            console.log(`Peer left: ${event.nodeId.slice(0, 8)}...`);
            break;
          case "error":
            console.error(`Error: ${event.error.message}`);
            break;
        }
      }
    })();

    const roomId = await manager.create();

    console.log("Room created successfully!");
    console.log("");
    console.log(`Room ID: ${roomId}`);
    console.log("");
    console.log("Share this Room ID with others to let them join.");
    console.log("Press Ctrl+C to close the room.");
  });

cli
  .command("start", "start interactive chat ui", { default: true })
  .action(async () => {
    const renderer = await createCliRenderer({
      targetFps: 60,
      useAlternateScreen: true,
      useMouse: true,
    });

    const root = createRoot(renderer);
    root.render(<App />);
  });

cli.parse(process.argv);
