import React from "react";
import { Avatar } from "./Avatar";
import { AVATAR_COLORS, TOTAL_EYES, TOTAL_MOUTHS, TOTAL_HATS, getRandomAvatar } from "../lib/avatar";
import { ChevronLeft, ChevronRight, Dices, Smile, Eye, Crown } from "lucide-react";
import { sounds } from "../lib/audio";

export function AvatarCustomizer({ avatar, onChange }) {
  const cycleProperty = (prop, total, direction) => {
    sounds.playPop();
    const current = avatar[prop] || 0;
    const next = (current + direction + total) % total;
    onChange({ ...avatar, [prop]: next });
  };

  const setColor = (color) => {
    sounds.playPop();
    onChange({ ...avatar, color });
  };

  const handleRandomize = () => {
    sounds.playPop();
    onChange(getRandomAvatar());
  };

  return (
    <div className="flex flex-col items-center bg-white rounded-2xl p-5 shadow-lg border-2 border-slate-100 max-w-sm w-full">
      <div className="flex items-center justify-between w-full mb-3">
        <span className="text-xs font-black uppercase tracking-wider text-slate-400">
          Customize Avatar
        </span>
        <button
          onClick={handleRandomize}
          className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition-colors shadow-sm"
          title="Randomize Avatar"
        >
          <Dices className="w-4 h-4" />
          <span>Randomize</span>
        </button>
      </div>

      {/* Main Avatar Display & Feature Cyclers */}
      <div className="relative flex items-center justify-center py-2">
        <Avatar avatar={avatar} size="xl" className="transform hover:scale-105 transition-transform" />
      </div>

      {/* Cycler Controls */}
      <div className="grid grid-cols-3 gap-2 w-full mt-4">
        {/* Eyes Cycler */}
        <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-1.5 py-1">
          <button
            onClick={() => cycleProperty("eyes", TOTAL_EYES, -1)}
            className="p-1 rounded-lg hover:bg-slate-200 text-slate-600 active:scale-90 transition-transform"
            aria-label="Previous eyes"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="flex items-center gap-1 text-xs font-bold text-slate-700">
            <Eye className="w-3.5 h-3.5 text-indigo-500" />
            {(avatar.eyes || 0) + 1}
          </span>
          <button
            onClick={() => cycleProperty("eyes", TOTAL_EYES, 1)}
            className="p-1 rounded-lg hover:bg-slate-200 text-slate-600 active:scale-90 transition-transform"
            aria-label="Next eyes"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Mouth Cycler */}
        <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-1.5 py-1">
          <button
            onClick={() => cycleProperty("mouth", TOTAL_MOUTHS, -1)}
            className="p-1 rounded-lg hover:bg-slate-200 text-slate-600 active:scale-90 transition-transform"
            aria-label="Previous mouth"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="flex items-center gap-1 text-xs font-bold text-slate-700">
            <Smile className="w-3.5 h-3.5 text-indigo-500" />
            {(avatar.mouth || 0) + 1}
          </span>
          <button
            onClick={() => cycleProperty("mouth", TOTAL_MOUTHS, 1)}
            className="p-1 rounded-lg hover:bg-slate-200 text-slate-600 active:scale-90 transition-transform"
            aria-label="Next mouth"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Hat Cycler */}
        <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-1.5 py-1">
          <button
            onClick={() => cycleProperty("hat", TOTAL_HATS, -1)}
            className="p-1 rounded-lg hover:bg-slate-200 text-slate-600 active:scale-90 transition-transform"
            aria-label="Previous hat"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="flex items-center gap-1 text-xs font-bold text-slate-700">
            <Crown className="w-3.5 h-3.5 text-indigo-500" />
            {avatar.hat === 0 ? "Off" : avatar.hat}
          </span>
          <button
            onClick={() => cycleProperty("hat", TOTAL_HATS, 1)}
            className="p-1 rounded-lg hover:bg-slate-200 text-slate-600 active:scale-90 transition-transform"
            aria-label="Next hat"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Color Palette Selector */}
      <div className="flex flex-wrap items-center justify-center gap-2 mt-4 pt-3 border-t border-slate-100 w-full">
        {AVATAR_COLORS.map((col) => (
          <button
            key={col}
            onClick={() => setColor(col)}
            className={`w-6 h-6 rounded-full transition-transform active:scale-90 ${
              avatar.color === col
                ? "ring-2 ring-offset-2 ring-indigo-600 scale-110"
                : "hover:scale-105"
            }`}
            style={{ backgroundColor: col }}
            title={`Color ${col}`}
          />
        ))}
      </div>
    </div>
  );
}
