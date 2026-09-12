import React from "react";
import { useGame } from "../context/GameContext";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Avatar } from "./Avatar";
import { Trophy, Sparkles, RotateCcw, Award, CheckCircle2, Pencil, Clock } from "lucide-react";
import { sounds } from "../lib/audio";

export function Modals() {
  const {
    wordChoices,
    chooseWord,
    roundEndData,
    gameOverData,
    restartGame,
    isHost,
    myPlayer
  } = useGame();

  const myRoundResult = roundEndData?.scores?.find((s) => s.id === myPlayer?.id);

  return (
    <>
      {/* 1. Word Choice Modal (for Drawer) */}
      <Dialog open={!!wordChoices}>
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl font-black text-indigo-600 flex items-center justify-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-500 fill-amber-300" />
            Choose a Word to Draw!
          </DialogTitle>
          <DialogDescription>
            Pick one of the words below before the timer runs out!
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
          {wordChoices?.map((word) => (
            <Button
              key={word}
              onClick={() => {
                sounds.playPop();
                chooseWord(word);
              }}
              variant="outline"
              className="h-16 text-lg font-black uppercase tracking-wider hover:border-indigo-600 hover:bg-indigo-50/80 hover:text-indigo-600 shadow-sm transition-all"
            >
              {word}
            </Button>
          ))}
        </div>
      </Dialog>

      {/* 2. Round End / Word Reveal Modal */}
      <Dialog open={!!roundEndData}>
        <DialogHeader className="text-center">
          {/* Personalized Status Banner */}
          {myRoundResult && (
            <div className="mb-2">
              {myRoundResult.isDrawer ? (
                <div className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-900 px-3 py-1 rounded-full text-xs font-black">
                  <Pencil className="w-3.5 h-3.5 text-amber-600" />
                  <span>Turn Complete! (+{myRoundResult.pointsEarnedThisRound} pts)</span>
                </div>
              ) : myRoundResult.guessedCorrectly ? (
                <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-900 px-3 py-1 rounded-full text-xs font-black">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>You Guessed Correctly! (+{myRoundResult.pointsEarnedThisRound} pts)</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>You didn't guess the word! (+0 pts)</span>
                </div>
              )}
            </div>
          )}

          <DialogTitle className="text-lg font-black text-slate-700">
            {roundEndData?.reason || "Round Finished!"}
          </DialogTitle>

          <div className="my-3 p-3.5 bg-indigo-50 border-2 border-indigo-200 rounded-2xl">
            <div className="text-xs font-black text-indigo-500 uppercase tracking-wider mb-0.5">
              The Word Was
            </div>
            <div className="text-2xl sm:text-3xl font-black text-indigo-700 uppercase tracking-widest">
              {roundEndData?.word}
            </div>
          </div>

          {/* Scores Breakdown for this Round */}
          {roundEndData?.scores && roundEndData.scores.length > 0 && (
            <div className="my-2 text-left bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 max-h-36 overflow-y-auto space-y-1.5">
              <div className="text-[11px] font-black uppercase text-slate-400 tracking-wider px-1">
                Round Points
              </div>
              {roundEndData.scores.map((p) => {
                const isMe = p.id === myPlayer?.id;
                return (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between text-xs px-2 py-1 rounded-lg ${
                      isMe ? "bg-indigo-100/70 text-indigo-900 font-extrabold" : "bg-white text-slate-700 font-semibold"
                    }`}
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      {p.isDrawer && <Pencil className="w-3 h-3 text-amber-500 shrink-0" />}
                      {p.guessedCorrectly && <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />}
                      <span className="truncate">{p.name} {isMe ? "(You)" : ""}</span>
                    </span>
                    <span className={`font-black shrink-0 ${p.pointsEarnedThisRound > 0 ? "text-emerald-600" : "text-slate-400"}`}>
                      {p.pointsEarnedThisRound > 0 ? `+${p.pointsEarnedThisRound}` : "0"} pts
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <DialogDescription className="text-center font-bold text-slate-500 text-xs mt-2">
            Preparing next player's turn...
          </DialogDescription>
        </DialogHeader>
      </Dialog>

      {/* 3. Game Over / Podium Modal */}
      <Dialog open={!!gameOverData} className="max-w-md">
        <DialogHeader className="text-center">
          <DialogTitle className="text-3xl font-black text-indigo-600 flex items-center justify-center gap-2">
            <Trophy className="w-8 h-8 text-amber-500 fill-amber-400" />
            Game Over!
          </DialogTitle>
          <DialogDescription>
            Congratulations to all artists and guessers!
          </DialogDescription>
        </DialogHeader>

        {/* Podium Layout */}
        <div className="flex items-end justify-center gap-2 my-6 pt-4">
          {/* 2nd Place */}
          {gameOverData?.[1] && (
            <div className="flex flex-col items-center flex-1">
              <Avatar avatar={gameOverData[1].avatar} size="md" className="mb-2" />
              <span className="text-xs font-black text-slate-700 truncate max-w-[80px]">
                {gameOverData[1].name}
              </span>
              <span className="text-[11px] font-bold text-slate-500">
                {gameOverData[1].score} pts
              </span>
              <div className="w-full bg-slate-200 h-20 rounded-t-2xl flex items-center justify-center font-black text-slate-500 text-lg mt-1 border-t-2 border-slate-300">
                2nd
              </div>
            </div>
          )}

          {/* 1st Place Winner */}
          {gameOverData?.[0] && (
            <div className="flex flex-col items-center flex-1 z-10">
              <div className="relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-amber-400">
                  <Award className="w-6 h-6 fill-current" />
                </div>
                <Avatar avatar={gameOverData[0].avatar} size="lg" className="mb-2 ring-4 ring-amber-400 rounded-3xl" />
              </div>
              <span className="text-sm font-black text-slate-900 truncate max-w-[90px]">
                {gameOverData[0].name}
              </span>
              <span className="text-xs font-black text-indigo-600">
                {gameOverData[0].score} pts
              </span>
              <div className="w-full bg-amber-400 h-28 rounded-t-2xl flex items-center justify-center font-black text-white text-2xl mt-1 shadow-md border-t-2 border-amber-300">
                1st
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {gameOverData?.[2] && (
            <div className="flex flex-col items-center flex-1">
              <Avatar avatar={gameOverData[2].avatar} size="md" className="mb-2" />
              <span className="text-xs font-black text-slate-700 truncate max-w-[80px]">
                {gameOverData[2].name}
              </span>
              <span className="text-[11px] font-bold text-slate-500">
                {gameOverData[2].score} pts
              </span>
              <div className="w-full bg-amber-600/70 text-amber-100 h-14 rounded-t-2xl flex items-center justify-center font-black text-base mt-1 border-t-2 border-amber-600">
                3rd
              </div>
            </div>
          )}
        </div>

        {isHost ? (
          <Button
            onClick={() => {
              sounds.playPop();
              restartGame();
            }}
            className="w-full shadow-button"
            size="lg"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Play Again!
          </Button>
        ) : (
          <div className="text-center text-xs font-bold text-slate-400">
            Waiting for host to restart game...
          </div>
        )}
      </Dialog>
    </>
  );
}
