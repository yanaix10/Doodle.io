import React, { useState } from "react";
import { useGame } from "../context/GameContext";
import { Clock, Copy, Check, LogOut, Volume2, VolumeX, Sparkles, Pencil, CheckCircle2 } from "lucide-react";
import { Badge } from "./ui/badge";
import { sounds } from "../lib/audio";

export function HeaderBar() {
  const {
    roomData,
    isDrawer,
    drawerSecretWord,
    guessedWord,
    myPlayer,
    leaveRoom
  } = useGame();

  const [copied, setCopied] = useState(false);
  const [muted, setMuted] = useState(false);

  if (!roomData) return null;

  const timer = roomData.timer || 0;
  const isUrgent = timer <= 10 && timer > 0;
  const currentRound = roomData.currentRound || 1;
  const maxRounds = roomData.settings?.rounds || 3;

  const copyRoomCode = () => {
    sounds.playPop();
    navigator.clipboard.writeText(roomData.roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleSound = () => {
    sounds.enabled = !sounds.enabled;
    setMuted(!sounds.enabled);
  };

  return (
    <header className="w-full bg-white border-b-2 border-slate-200 shadow-sm px-4 py-3 flex flex-wrap items-center justify-between gap-3 select-none">
      {/* Left: Game Title / Room Info */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black tracking-tight text-indigo-600 flex items-center gap-1.5">
            <Sparkles className="w-6 h-6 text-indigo-500 fill-indigo-100" />
            skribbl
          </span>
          <span className="text-xs font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-lg border border-indigo-100">
            clone
          </span>
        </div>

        {/* Room Code Badge */}
        <button
          onClick={copyRoomCode}
          className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs px-3 py-1.5 rounded-xl transition-all active:scale-95 shadow-xs"
          title="Click to copy Room Code"
        >
          <span>Room:</span>
          <span className="font-mono text-indigo-600 tracking-wider">{roomData.roomId}</span>
          {copied ? (
            <Check className="w-3.5 h-3.5 text-emerald-600" />
          ) : (
            <Copy className="w-3.5 h-3.5 text-slate-500" />
          )}
        </button>
      </div>

      {/* Center: Word or Hints Display */}
      <div className="flex-1 flex items-center justify-center min-w-[240px]">
        {roomData.gameState === "LOBBY" && (
          <Badge variant="secondary" className="text-sm px-4 py-1.5">
            Waiting in Lobby...
          </Badge>
        )}

        {roomData.gameState === "CHOOSING_WORD" && (
          <div className="flex items-center gap-2 text-sm font-black text-amber-600 bg-amber-50 px-4 py-1.5 rounded-2xl border border-amber-200 animate-pulse">
            <Pencil className="w-4 h-4" />
            <span>{roomData.currentDrawer?.name || "Drawer"} is choosing a word...</span>
          </div>
        )}

        {roomData.gameState === "DRAWING" && (
          <div className="flex flex-col items-center">
            {isDrawer ? (
              <div className="flex items-center gap-2 bg-indigo-50 border-2 border-indigo-200 px-5 py-1.5 rounded-2xl shadow-xs">
                <span className="text-xs font-black uppercase tracking-wider text-indigo-500">
                  DRAW THIS:
                </span>
                <span className="text-lg font-black text-indigo-700 tracking-wide uppercase">
                  {drawerSecretWord || "YOUR WORD"}
                </span>
              </div>
            ) : (myPlayer?.guessedCorrectly || guessedWord) ? (
              <div className="flex items-center gap-2 bg-emerald-50 border-2 border-emerald-200 px-5 py-1.5 rounded-2xl shadow-xs animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="text-xs font-black uppercase tracking-wider text-emerald-600">
                  WORD:
                </span>
                <span className="text-lg font-black text-emerald-700 tracking-wide uppercase">
                  {guessedWord || "GUESSED!"}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="font-mono text-xl sm:text-2xl font-black tracking-widest text-slate-800 bg-slate-100 px-4 py-1 rounded-2xl border border-slate-200 shadow-inner">
                  {roomData.wordHint || "_ _ _"}
                </span>
                {roomData.wordPattern && (
                  <span className="text-xs font-bold text-slate-400">
                    {roomData.wordPattern}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {roomData.gameState === "ROUND_END" && (
          <div className="text-sm font-black text-indigo-600 bg-indigo-50 px-4 py-1.5 rounded-2xl border border-indigo-200">
            Round Complete!
          </div>
        )}

        {roomData.gameState === "GAME_OVER" && (
          <div className="text-sm font-black text-amber-600 bg-amber-50 px-4 py-1.5 rounded-2xl border border-amber-200">
            Game Over!
          </div>
        )}
      </div>

      {/* Right: Round Counter, Timer, Settings */}
      <div className="flex items-center gap-3">
        {/* Round Counter */}
        <div className="bg-slate-100 px-3 py-1.5 rounded-xl text-xs font-extrabold text-slate-600 border border-slate-200">
          Round <span className="text-indigo-600">{currentRound}</span> of {maxRounds}
        </div>

        {/* Timer Badge */}
        <div
          className={`flex items-center gap-1.5 font-mono font-black text-base px-3.5 py-1 rounded-xl shadow-xs transition-colors ${
            isUrgent
              ? "bg-rose-500 text-white animate-bounce"
              : "bg-indigo-600 text-white"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>{timer}s</span>
        </div>

        {/* Mute audio button */}
        <button
          onClick={toggleSound}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          title={muted ? "Unmute sounds" : "Mute sounds"}
        >
          {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>

        {/* Leave Room button */}
        <button
          onClick={() => {
            sounds.playPop();
            leaveRoom();
          }}
          className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          title="Leave Room"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
