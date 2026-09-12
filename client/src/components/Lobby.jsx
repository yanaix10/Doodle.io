import React, { useState } from "react";
import { useGame } from "../context/GameContext";
import { AvatarCustomizer } from "./AvatarCustomizer";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Sparkles,
  Play,
  PlusCircle,
  LogIn,
  Bot,
  HelpCircle,
  Pencil,
  Lightbulb,
  Trophy,
  AlertCircle
} from "lucide-react";
import { sounds } from "../lib/audio";

export function Lobby() {
  const {
    userName,
    setUserName,
    avatar,
    setAvatar,
    createRoom,
    joinRoom,
    quickPlay,
    addBot,
    startGame
  } = useGame();

  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleQuickPlay = async () => {
    sounds.playPop();
    setErrorMsg("");
    setLoading(true);
    try {
      await quickPlay();
    } catch (err) {
      setErrorMsg(err.message || "Failed to join game");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async () => {
    sounds.playPop();
    setErrorMsg("");
    setLoading(true);
    try {
      await createRoom(true);
    } catch (err) {
      setErrorMsg(err.message || "Failed to create room");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinByCode = async (e) => {
    e?.preventDefault();
    if (!roomCodeInput.trim()) return;
    sounds.playPop();
    setErrorMsg("");
    setLoading(true);
    try {
      await joinRoom(roomCodeInput.trim());
    } catch (err) {
      setErrorMsg(err.message || "Room not found or invalid");
    } finally {
      setLoading(false);
    }
  };

  // One-click solo practice setup for immediate test/play
  const handlePracticeMode = async () => {
    sounds.playPop();
    setErrorMsg("");
    setLoading(true);
    try {
      await createRoom(false);
      // Wait for socket to register room then add bot & start
      setTimeout(() => {
        addBot();
        setTimeout(() => {
          startGame();
        }, 600);
      }, 400);
    } catch (err) {
      setErrorMsg(err.message || "Failed to launch practice");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-start p-4 sm:p-6 lg:p-8 select-none">
      {/* Game Brand Logo */}
      <div className="text-center my-6">
        <div className="inline-flex items-center gap-3 bg-white px-8 py-3.5 rounded-3xl shadow-lg border-2 border-indigo-100 transform hover:scale-105 transition-transform">
          <Sparkles className="w-8 h-8 text-indigo-600 fill-indigo-100 animate-spin-slow" />
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-indigo-600 font-sans">
            skribbl<span className="text-amber-500">.io</span>
          </h1>
        </div>
        <p className="mt-2 text-sm font-bold text-slate-500">
          The Free Multiplayer Drawing & Guessing Game
        </p>
      </div>

      {/* Main Lobby Card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-card border-2 border-slate-200/80 p-6 flex flex-col items-center gap-5">
        {/* Name Input */}
        <div className="w-full space-y-1.5">
          <label className="text-xs font-black uppercase tracking-wider text-slate-500 block">
            Your Nickname
          </label>
          <Input
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="Enter your name..."
            maxLength={20}
            className="text-center font-black text-lg text-slate-800"
          />
        </div>

        {/* Avatar Customizer */}
        <AvatarCustomizer avatar={avatar} onChange={setAvatar} />

        {/* Error Alert */}
        {errorMsg && (
          <div className="w-full bg-rose-50 border-2 border-rose-200 text-rose-700 font-bold p-3 rounded-2xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Primary Action Buttons */}
        <div className="w-full flex flex-col gap-2.5 pt-2">
          {/* Quick Play Button */}
          <Button
            onClick={handleQuickPlay}
            disabled={loading}
            size="lg"
            className="w-full shadow-button text-lg font-black tracking-wide"
          >
            <Play className="w-5 h-5 mr-2 fill-current" />
            Play Now!
          </Button>

          {/* Create Private Room */}
          <Button
            onClick={handleCreateRoom}
            disabled={loading}
            variant="secondary"
            size="default"
            className="w-full font-bold"
          >
            <PlusCircle className="w-5 h-5 mr-2 text-indigo-600" />
            Create Private Room
          </Button>

          {/* Join with Room Code */}
          <form onSubmit={handleJoinByCode} className="flex gap-2 w-full mt-1">
            <Input
              value={roomCodeInput}
              onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
              placeholder="ROOM CODE"
              maxLength={6}
              className="text-center font-mono font-black uppercase tracking-wider"
            />
            <Button
              type="submit"
              disabled={!roomCodeInput.trim() || loading}
              variant="outline"
              className="font-bold shrink-0"
            >
              <LogIn className="w-4 h-4 mr-1.5" />
              Join
            </Button>
          </form>

          {/* Quick Practice Mode with DoodleBot */}
          <button
            onClick={handlePracticeMode}
            disabled={loading}
            className="mt-1 flex items-center justify-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 py-2 rounded-xl hover:bg-indigo-50/50 transition-colors"
          >
            <Bot className="w-4 h-4 text-purple-500" />
            <span>Practice Solo with DoodleBot</span>
          </button>
        </div>
      </div>

      {/* How to Play Guide */}
      <div className="w-full max-w-3xl mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border-2 border-slate-100 shadow-sm flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
            <Lightbulb className="w-6 h-6" />
          </div>
          <h3 className="font-black text-slate-800 text-sm mb-1">1. Choose a Word</h3>
          <p className="text-xs font-semibold text-slate-500 leading-relaxed">
            When it's your turn, select one of the three random words to sketch!
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border-2 border-slate-100 shadow-sm flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
            <Pencil className="w-6 h-6" />
          </div>
          <h3 className="font-black text-slate-800 text-sm mb-1">2. Draw It Out</h3>
          <p className="text-xs font-semibold text-slate-500 leading-relaxed">
            Use color palettes, brushes, and bucket fill to bring your word to life!
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border-2 border-slate-100 shadow-sm flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
            <Trophy className="w-6 h-6" />
          </div>
          <h3 className="font-black text-slate-800 text-sm mb-1">3. Guess & Win</h3>
          <p className="text-xs font-semibold text-slate-500 leading-relaxed">
            Type your guesses quickly in the chat to earn maximum bonus points!
          </p>
        </div>
      </div>
    </div>
  );
}
