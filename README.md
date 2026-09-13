# Doodle.io - Real-Time Multiplayer Drawing & Guessing Game

A real-time multiplayer drawing and guessing game inspired by Skribbl.io.

**Live**: https://doodle-io-lake.vercel.app/

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, Tailwind CSS |
| Backend | Node.js, Express |
| Real-Time | Socket.IO (WebSocket + Polling) |
| Deployment | Vercel (client), Render (server) |

---

## Folder Structure

```
├── client/
│   └── src/
│       ├── components/     # Canvas, ChatBox, Lobby, Leaderboard, Modals, Avatar
│       ├── context/        # GameContext — global Socket.IO state
│       └── lib/            # Audio, avatar presets, utilities
└── server/
    ├── index.js            # Express + Socket.IO entry
    ├── rooms.js            # Room lifecycle & game state machine
    └── words.js            # Word list & Levenshtein proximity matcher
```

---

## Key Features

- **WebSockets via Socket.IO** — real-time canvas sync, chat, and game state across all clients
- **HTML5 Canvas** — freehand drawing with brush size, color palette, and flood-fill tool
- **Proximity Guess Matching** — Levenshtein distance for near-miss typo detection
- **Room System** — quick play matchmaking and private rooms with 6-character codes
- **DoodleBot** — solo/practice mode with an automated drawing bot
- **Custom Avatar Creator** — SVG-based avatar with expressions, eyes, accessories

---

## Local Setup

**Install dependencies** (run once from project root):

```bash
npm install
npm install --prefix server
npm install --prefix client
```

**Backend** (from `server/`):

```bash
cd server
node index.js
```

Runs on `http://localhost:3001`

**Frontend** (from `client/`):

```bash
cd client
npm run dev
```

Runs on `http://localhost:5173`
