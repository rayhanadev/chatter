# AGENTS.md

Project documentation for AI coding assistants.

## Project Overview

**Chatter** is a peer-to-peer terminal chat application demonstrating [iroh-ts](https://github.com/rayhanadev/iroh-ts). It features decentralized peer connections, a terminal UI with mouse support, and automatic message synchronization for new peers.

## Tech Stack

- **Runtime**: Bun
- **UI Framework**: React 19 with [OpenTUI](https://github.com/nicksrandall/opentui) for terminal rendering
- **P2P Networking**: [@rayhanadev/iroh](https://github.com/rayhanadev/iroh-ts) (QUIC-based)
- **State Management**: Jotai with Immer integration
- **Serialization**: Protocol Buffers via @bufbuild/protobuf
- **Linting/Formatting**: Biome

## Project Structure

```
src/
├── index.tsx              # Entry point - initializes OpenTUI renderer
├── App.tsx                # Root component - routes between menu and chat views
├── components/
│   ├── chat/              # Chat screen components
│   │   ├── index.tsx      # ChatView container
│   │   ├── Header.tsx     # Room header with node ID
│   │   ├── MessageList.tsx # Scrollable message display
│   │   ├── MessageInput.tsx # Text input for sending messages
│   │   └── Sidebar.tsx    # Connected peers list
│   └── menu/              # Initial menu screen components
│       ├── index.tsx      # MenuView container
│       ├── Menu.tsx       # Main menu (create/join options)
│       └── forms/
│           ├── Create.tsx # Create room form
│           └── Join.tsx   # Join room form
├── network/
│   ├── manager.ts         # PeerManager class - handles all P2P logic
│   ├── protocol.ts        # Protocol constants (ALPN, message size)
│   ├── async-channel.ts   # Async iterator utility for events
│   ├── proto/             # Protobuf source files
│   │   └── chatter/v1/protocol.proto
│   └── generated/         # Generated protobuf code (do not edit)
│       └── chatter/v1/protocol_pb.ts
└── stores/
    ├── peer.ts            # Peer-related atoms (nodeId, peers, peerManager)
    └── ui.ts              # UI state atoms (screen, messages, errors)
```

## Key Concepts

### PeerManager (`src/network/manager.ts`)

The core networking class that:
- Creates/joins chat rooms via Iroh endpoints
- Manages peer connections and discovery
- Handles message broadcasting and receiving
- Provides an event subscription system for UI updates
- Syncs message history to new peers

Key methods:
- `create()` - Start a new room, returns node ID to share
- `join(nodeId)` - Connect to an existing room
- `sendChatMessage(text)` - Broadcast a chat message
- `subscribe()` - Get async iterator of `PeerEvent`s

### Protocol Messages

Defined in `src/network/proto/chatter/v1/protocol.proto`:
- `ChatMessage` - User chat messages
- `JoinMessage` / `LeaveMessage` - Peer presence
- `PeerListMessage` - Share known peers
- `SyncDataMessage` - Sync history to new peers
- `NicknameMessage` - Nickname changes

### State Management

Uses Jotai atoms in `src/stores/`:
- `peerManagerAtom` - The PeerManager instance
- `nodeIdAtom` - Local node's ID
- `peersAtom` - Map of connected peers
- `messagesAtom` - Chat message history (uses Immer)
- `screenAtom` - Current view ("join" or "chat")

## Development Commands

```bash
# Install dependencies
bun install

# Run in development mode (hot reload)
bun run dev

# Run normally
bun run start

# Build standalone binary
bun run build

# Lint and format (auto-fix)
bun run lint

# Format only
bun run format

# Regenerate protobuf types (after editing .proto files)
bun run proto:generate

# Lint protobuf files
bun run proto:lint
```

## Code Style

Enforced by Biome (`biome.json`):
- **Indentation**: Tabs
- **Quotes**: Double quotes for strings
- **Imports**: Auto-organized
- **Linting**: Biome recommended rules

Run `bun run lint` to auto-fix issues.

## Common Tasks

### Adding a new protocol message

1. Edit `src/network/proto/chatter/v1/protocol.proto`
2. Add the message type to the `ProtocolMessage` oneof
3. Run `bun run proto:generate`
4. Handle the new message type in `PeerManager.handleMessage()`

### Adding a new UI component

1. Create component in appropriate `src/components/` subdirectory
2. Use OpenTUI primitives (`<box>`, `<text>`, `<input>`)
3. Access state via Jotai hooks (`useAtom`, `useAtomValue`, `useSetAtom`)
4. For Immer-based atoms, use `useSetImmerAtom` from `jotai-immer`

### Adding new state

1. Define atom in `src/stores/peer.ts` (networking) or `src/stores/ui.ts` (UI)
2. Use `atom()` for simple state, `atomWithImmer()` for complex mutable state

## Testing

No test framework is currently configured. The application can be tested manually by:
1. Running two instances of the app
2. Creating a room in one instance
3. Joining with the node ID in the other instance

## Notes

- JSX uses `@opentui/react` as the JSX import source (configured in tsconfig.json)
- The app uses an alternate terminal screen (won't pollute scroll history)
- Mouse support is enabled for text selection (copies to clipboard)
- Message history is limited to 100 messages per room
