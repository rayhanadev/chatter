# chatter

A decentralized peer-to-peer terminal chat application built with [iroh-ts](https://github.com/rayhanadev/iroh-ts).

## Features

- **Decentralized** - Direct peer-to-peer connections via QUIC, no central server required
- **Terminal UI** - Full TUI with mouse support via [OpenTUI](https://github.com/nicksrandall/opentui)
- **Message Sync** - New peers automatically receive complete message history when joining
- **Leader Election** - Automatic host selection when the current host disconnects
- **Color-coded Peers** - Each participant gets a unique persistent color for visual distinction

## Usage

```bash
$ npm install -g @rayhanadev/chatter
$ chatter
```

or you can run it directly with `npx @rayhanadev/chatter`!

### Creating a Room

1. Select "Create a room"
2. Enter your nickname
3. Share your Node ID (64-character hex) with others so they can join

### Joining a Room

1. Select "Join a room"
2. Enter your nickname
3. Paste the Node ID of the room you want to join

## How It Works

### Networking

Chatter uses [Iroh](https://github.com/n0-computer/iroh), a QUIC-based peer-to-peer networking library. More specifically, it uses the bindings I wrote for Iroh in [@rayhanadev/iroh](https://github.com/rayhanadev/iroh-ts)! Each peer is identified by a unique 64-character hex Node ID. Connections are established directly between peers without any intermediary server.

### Message Protocol

Messages are serialized using Protocol Buffers for efficient transmission:

- **ChatMessage** - User messages with UUID, sender info, text, and timestamp
- **JoinMessage** / **LeaveMessage** - Peer presence notifications
- **SyncDataMessage** - History and peer list sent to new joiners
- **NewLeaderMessage** - Host election announcements

### Leader Election

When the host disconnects, remaining peers automatically elect a new leader using deterministic lexicographic sorting of Node IDs. This ensures all peers agree on the same new host without coordination.

### Synchronization

When a new peer joins:
1. They announce themselves with a JoinMessage
2. The host sends them a SyncDataMessage containing:
   - Complete message history (up to 100 messages)
   - List of all connected peers

## Tech Stack

- **Runtime**: [Bun](https://bun.sh)
- **Language**: TypeScript
- **Networking**: [@rayhanadev/iroh](https://github.com/rayhanadev/iroh-ts)
- **UI**: React + [OpenTUI](https://github.com/nicksrandall/opentui)
- **State**: [Jotai](https://jotai.org) + [Immer](https://immerjs.github.io/immer/)
- **Serialization**: [Protocol Buffers](https://buf.build)

## Development

```bash
# Install dependencies
bun install

# Run in development
bun run dev

# Build
bun run build
```
