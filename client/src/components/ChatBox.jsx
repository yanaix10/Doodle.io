import React, { useState, useRef, useEffect } from "react";
import { useGame } from "../context/GameContext";
import { Send, AlertCircle, Sparkles } from "lucide-react";
import { sounds } from "../lib/audio";

export function ChatBox() {
  const {
    messages,
    sendMessage,
    isDrawer,
    roomData,
    myPlayer,
    privateAlert
  } = useGame();

  const [inputVal, setInputVal] = useState("");
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, privateAlert]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    sounds.playPop();
    sendMessage(inputVal);
    setInputVal("");
  };

  const isDrawingNow = isDrawer && roomData?.gameState === "DRAWING";
  const hasAlreadyGuessed = myPlayer?.guessedCorrectly && roomData?.gameState === "DRAWING";

  return (
    <aside className="w-72 lg:w-80 flex flex-col bg-white rounded-2xl shadow-lg border-2 border-slate-100 overflow-hidden shrink-0">
      {/* Chat Header */}
      <div className="bg-slate-50 border-b-2 border-slate-100 px-4 py-3 flex items-center justify-between">
        <h2 className="text-sm font-black text-slate-700 tracking-wide uppercase flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <span>Live Chat & Guesses</span>
        </h2>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[calc(100vh-270px)] min-h-[300px] text-sm">
        {messages.length === 0 && (
          <div className="text-center text-xs font-semibold text-slate-400 py-8">
            Guess the word or chat with other players here!
          </div>
        )}

        {messages.map((msg, index) => {
          if (msg.type === "success") {
            // Correct guess
            return (
              <div
                key={msg.id || index}
                className="bg-emerald-100/80 border border-emerald-200 text-emerald-800 font-bold px-3 py-1.5 rounded-xl text-xs animate-in fade-in"
              >
                {msg.text}
              </div>
            );
          }

          if (msg.type === "info") {
            // System notification
            return (
              <div
                key={msg.id || index}
                className="text-xs font-semibold text-slate-500 bg-slate-100/70 px-2.5 py-1 rounded-lg text-center"
              >
                {msg.text}
              </div>
            );
          }

          const isMyMsg = msg.senderId === myPlayer?.id;

          return (
            <div
              key={msg.id || index}
              className={`p-2 rounded-xl text-xs leading-relaxed break-words ${
                index % 2 === 0 ? "bg-slate-50" : "bg-white"
              }`}
            >
              <span className={`font-black mr-1.5 ${isMyMsg ? "text-indigo-600" : "text-slate-800"}`}>
                {msg.sender}:
              </span>
              <span className="font-semibold text-slate-700">{msg.text}</span>
            </div>
          );
        })}

        {/* Private Close Guess Warning Alert */}
        {privateAlert && (
          <div className="bg-amber-100 border border-amber-300 text-amber-900 font-black px-3 py-2 rounded-xl text-xs flex items-center gap-2 animate-bounce shadow-xs">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{privateAlert.text}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Field / Guess Bar */}
      <form onSubmit={handleSubmit} className="p-2.5 bg-slate-50 border-t-2 border-slate-100">
        <div className="relative flex items-center">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            disabled={isDrawingNow || hasAlreadyGuessed}
            placeholder={
              isDrawingNow
                ? "You cannot guess while drawing!"
                : hasAlreadyGuessed
                ? "You guessed correctly! 🎉"
                : "Type your guess here..."
            }
            maxLength={60}
            className="w-full bg-white border-2 border-slate-200 rounded-xl px-3 py-2 pr-10 text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed transition-all"
          />
          <button
            type="submit"
            disabled={!inputVal.trim() || isDrawingNow || hasAlreadyGuessed}
            className="absolute right-1.5 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            title="Send"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </aside>
  );
}
