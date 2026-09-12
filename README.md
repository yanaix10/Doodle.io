# 🎨 Skribbl Clone — Real-Time Multiplayer Drawing & Guessing Game

A fast, interactive, real-time multiplayer drawing and guessing web application inspired by Skribbl.io. Built with **React**, **Tailwind CSS**, **Node.js**, **Express**, and **Socket.IO**.

---

## 🌟 Key Features

- 🖌️ **Real-Time Synchronized Canvas**: Smooth brush strokes, customizable thickness, color palette, and flood-fill bucket tool synchronized across all players with zero lag.
- 🎯 **Intelligent Guessing Engine**:
  - Instant recognition of exact and cleaned words.
  - Proximity detection ("close guess" private hint system for near-miss typos).
  - Anti-cheat masking for guessers while drawer sees the active word.
- 👥 **Multiplayer Room System**:
  - **Quick Play**: Automatically matches players into active public lobbies.
  - **Private Rooms**: Generate unique 6-character room codes to invite friends.
  - Custom game settings: Adjustable round counts, draw time, and custom word pools.
- 🤖 **Practice Solo Mode**: Integrated **DoodleBot** for offline/solo play and testing.
- 👤 **Custom Avatar Creator**: Customize expressions, eyes, mouths, accessories, and colors.
- 📱 **Fully Responsive**: Optimized for desktop and mobile devices.

---

## 🏛️ Architecture Overview

```mermaid
graph TD
    Client["React Frontend (Vercel / Custom Domain)"]
    Server["Node.js + Socket.IO Backend (Render)"]
    RoomMgr["Room & Game State Manager"]
    WordsEngine["Word Selector & Proximity Matcher"]

    Client <-->|WebSocket + Polling (Socket.IO)| Server
    Server --> RoomMgr
    RoomMgr --> WordsEngine
```

---

## 📁 Project Structure

```text
├── client/
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── src/
│       ├── components/
│       │   ├── Avatar.jsx            # Dynamic SVG Avatar renderer
│       │   ├── AvatarCustomizer.jsx  # Interactive avatar creator
│       │   ├── Canvas.jsx            # HTML5 drawing canvas & toolset
│       │   ├── ChatBox.jsx           # Live chat stream & guess input
│       │   ├── HeaderBar.jsx         # Round timer, word hint, round count
│       │   ├── Leaderboard.jsx       # Player scores & real-time badges
│       │   ├── Lobby.jsx             # Room creation & joining portal
│       │   └── Modals.jsx            # Word picker & round/game end summaries
│       ├── context/
│       │   └── GameContext.jsx       # Global Socket.IO state provider
│       ├── lib/
│       │   ├── audio.js              # Sound effects synthesizer
│       │   ├── avatar.js             # Avatar presets & generator
│       │   └── utils.js              # CSS class merger utilities
│       ├── App.jsx                   # Main layout container
│       └── main.jsx                  # React DOM entry point
├── server/
│   ├── index.js                      # Express HTTP & Socket.IO server entry
│   ├── rooms.js                      # Room lifecycle, timer & score state machine
│   ├── words.js                      # Word lists, cleaning & Levenshtein matching
│   └── package.json                  # Backend dependencies
├── .gitignore                        # Git exclusion rules
├── package.json                      # Monorepo root scripts & runner
└── README.md
```

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- Node.js (v18 or higher recommended)
- npm (v9 or higher)

### 1. Installation
Install root dependencies and packages for both client and server:
```bash
npm install
npm install --prefix server
npm install --prefix client
```

### 2. Run Locally
Run both the frontend (Vite) and backend (Express) concurrently:
```bash
npm run dev
```

- **Frontend**: `http://localhost:5173`
- **Backend**: `http://localhost:3001`
- **LAN Access**: Available via your local IP address shown in terminal logs for mobile testing.

---

## 🌐 Production Deployment

### Backend Deployment (Render)
1. Push your code to GitHub.
2. In [Render Dashboard](https://dashboard.render.com), click **New +** -> **Web Service**.
3. Connect your GitHub repository.
4. Configure settings:
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
5. Click **Deploy Web Service** and copy your backend URL (e.g. `https://your-server.onrender.com`).

### Frontend Deployment (Vercel)
1. In [Vercel Dashboard](https://vercel.com), click **Add New** -> **Project**.
2. Import the same GitHub repository.
3. Configure settings:
   - **Root Directory**: Select `client`
   - **Framework Preset**: `Vite`
   - **Environment Variables**:
     - Key: `VITE_SERVER_URL`
     - Value: `https://your-server.onrender.com` (Your Render backend URL)
4. Click **Deploy**.

---

## 🔒 Security & Best Practices

- Secret and environment files (`.env*`) are strictly ignored via `.gitignore`.
- Build artifacts (`dist/`) and dependency folders (`node_modules/`) are never committed to version control.
- Strict CORS and sanitization are implemented on WebSocket event handlers.
