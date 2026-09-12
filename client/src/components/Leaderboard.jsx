import React from "react";
import { useGame } from "../context/GameContext";
import { Avatar } from "./Avatar";
import { Pencil, CheckCircle2, Crown, Bot, Play, UserPlus } from "lucide-react";
import { Button } from "./ui/button";
import { sounds } from "../lib/audio";

export function Leaderboard() {
  const { roomData, myPlayer, isHost, startGame, addBot } = useGame();

  if (!roomData) return null;

  // Sort players by score descending
  const sortedPlayers = [...(roomData.players || [])].sort((a, b) => b.score - a.score);

  return (
    <aside className="w-64 lg:w-72 flex flex-col bg-white rounded-2xl shadow-lg border-2 border-slate-100 overflow-hidden shrink-0">
      {/* Leaderboard Header */}
      <div className="bg-slate-50 border-b-2 border-slate-100 px-4 py-3 flex items-center justify-between">
        <h2 className="text-sm font-black text-slate-700 tracking-wide uppercase flex items-center gap-1.5">
          <span>Players</span>
          <span className="text-xs bg-indigo-100 text-indigo-700 font-extrabold px-2 py-0.5 rounded-full">
            {sortedPlayers.length}
          </span>
        </h2>
        {isHost && roomData.gameState === "LOBBY" && (
          <button
            onClick={() => {
              sounds.playPop();
              addBot();
            }}
            className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-xl transition-all active:scale-95"
            title="Add Practice Bot"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Bot</span>
          </button>
        )}
      </div>

      {/* Players List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 max-h-[calc(100vh-250px)]">
        {sortedPlayers.map((player, index) => {
          const isMe = player.id === myPlayer?.id;
          const isDrawing = roomData.currentDrawer?.id === player.id && roomData.gameState === "DRAWING";
          const hasGuessed = player.guessedCorrectly;

          return (
            <div
              key={player.id}
              className={`flex items-center gap-3 p-2.5 rounded-xl border-2 transition-all ${
                isMe
                  ? "bg-indigo-50/70 border-indigo-200 shadow-xs"
                  : "bg-slate-50/60 border-slate-100 hover:border-slate-200"
              } ${hasGuessed ? "border-emerald-300 bg-emerald-50/50" : ""}`}
            >
              {/* Rank */}
              <span className="font-black text-xs text-slate-400 w-4 text-center">
                #{index + 1}
              </span>

              {/* Avatar */}
              <div className="relative">
                <Avatar avatar={player.avatar} size="sm" />
                {player.isHost && (
                  <div
                    className="absolute -top-1.5 -left-1.5 bg-amber-400 text-slate-900 rounded-full p-0.5 shadow-xs"
                    title="Room Host"
                  >
                    <Crown className="w-3 h-3" />
                  </div>
                )}
                {player.isBot && (
                  <div
                    className="absolute -bottom-1 -right-1 bg-purple-500 text-white rounded-full p-0.5 shadow-xs"
                    title="Bot Player"
                  >
                    <Bot className="w-3 h-3" />
                  </div>
                )}
              </div>

              {/* Name & Status */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-extrabold text-slate-800 truncate">
                    {player.name}
                  </span>
                  {isMe && (
                    <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-100/70 px-1.5 py-0.5 rounded-md">
                      You
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-black text-indigo-600">
                    {player.score} <span className="font-semibold text-[10px] text-slate-400">pts</span>
                  </span>

                  {isDrawing && (
                    <span className="flex items-center gap-1 text-[11px] font-black text-amber-600 bg-amber-100 px-1.5 py-0.2 rounded-md animate-pulse">
                      <Pencil className="w-3 h-3" />
                      Drawing
                    </span>
                  )}

                  {hasGuessed && !isDrawing && (
                    <span className="flex items-center gap-1 text-[11px] font-black text-emerald-600 bg-emerald-100 px-1.5 py-0.2 rounded-md">
                      <CheckCircle2 className="w-3 h-3" />
                      Guessed
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Host Controls in Lobby */}
      {roomData.gameState === "LOBBY" && (
        <div className="p-3 bg-slate-50 border-t-2 border-slate-100 flex flex-col gap-2">
          {isHost ? (
            <Button
              onClick={() => {
                sounds.playPop();
                startGame();
              }}
              className="w-full shadow-sm text-sm"
              size="default"
            >
              <Play className="w-4 h-4 mr-1.5 fill-current" />
              Start Game!
            </Button>
          ) : (
            <div className="text-center text-xs font-bold text-slate-400 py-1">
              Waiting for host to start...
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
