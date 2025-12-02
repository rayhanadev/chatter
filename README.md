# chatter

A peer-to-peer terminal chat app demonstrating [iroh-ts](https://github.com/rayhanadev/iroh-ts).

## Features

- **Decentralized**: Peers connect directly via Iroh - no central server
- **Terminal UI**: Full TUI with mouse support via [OpenTUI](https://github.com/nicksrandall/opentui)
- **Message Sync**: New peers automatically receive message history when joining

## Usage

```bash
$ bun install -g @rayhanadev/chatter
$ chatter
```

### Creating a Room

1. Select "Create a room"
2. Enter your nickname
3. Share your Node ID with others so they can join

### Joining a Room

1. Select "Join a room"
2. Enter your nickname
3. Paste the Node ID of the room you want to join
