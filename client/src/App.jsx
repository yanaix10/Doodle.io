import React from "react";
import { useGame } from "./context/GameContext";
import { Lobby } from "./components/Lobby";
import { HeaderBar } from "./components/HeaderBar";
import { Leaderboard } from "./components/Leaderboard";
import { Canvas } from "./components/Canvas";
import { ChatBox } from "./components/ChatBox";
import { Modals } from "./components/Modals";

export function GameView() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Game Bar */}
      <HeaderBar />

      {/* Main Game Arena: Left Leaderboard, Center Canvas, Right Chat */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-3 sm:p-4 flex flex-col lg:flex-row gap-4 items-stretch justify-center">
        {/* Left Side: Leaderboard */}
        <Leaderboard />

        {/* Center: HTML5 Canvas and Drawer Toolbar */}
        <Canvas />

        {/* Right Side: Chat and Guessing */}
        <ChatBox />
      </main>

      {/* Dynamic Game Modals */}
      <Modals />
    </div>
  );
}

export default function App() {
  const { roomData } = useGame();

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-800">
      {!roomData ? <Lobby /> : <GameView />}
    </div>
  );
}
