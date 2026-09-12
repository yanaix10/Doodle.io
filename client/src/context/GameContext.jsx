import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { getRandomAvatar } from "../lib/avatar";
import { sounds } from "../lib/audio";
import confetti from "canvas-confetti";

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  // User profile
  const [userName, setUserName] = useState(() => localStorage.getItem("skribbl_name") || "");
  const [avatar, setAvatar] = useState(() => {
    try {
      const saved = localStorage.getItem("skribbl_avatar");
      return saved ? JSON.parse(saved) : getRandomAvatar();
    } catch {
      return getRandomAvatar();
    }
  });

  // Save profile changes
  useEffect(() => {
    if (userName) localStorage.setItem("skribbl_name", userName);
  }, [userName]);

  useEffect(() => {
    localStorage.setItem("skribbl_avatar", JSON.stringify(avatar));
  }, [avatar]);

  // Room & Game state
  const [roomData, setRoomData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [wordChoices, setWordChoices] = useState(null);
  const [roundEndData, setRoundEndData] = useState(null);
  const [gameOverData, setGameOverData] = useState(null);
  const [drawerSecretWord, setDrawerSecretWord] = useState(null);
  const [guessedWord, setGuessedWord] = useState(null);
  const [canvasEvents, setCanvasEvents] = useState({ stroke: null, fill: null, clear: 0, history: null });
  const [privateAlert, setPrivateAlert] = useState(null);

  // Initialize socket
  useEffect(() => {
    // Connect to custom backend URL (for production) or same origin proxy (for local dev)
    const serverUrl = import.meta.env.VITE_SERVER_URL || window.location.origin;
    const s = io(serverUrl, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10
    });

    s.on("connect", () => {
      console.log("Connected to socket server");
      setConnected(true);
    });

    s.on("disconnect", () => {
      console.log("Disconnected from socket server");
      setConnected(false);
    });

    s.on("room-state", (data) => {
      setRoomData(data);
      // Reset private drawer word if state left DRAWING
      if (data.gameState !== "DRAWING") {
        setDrawerSecretWord(null);
        setGuessedWord(null);
      }
      if (data.gameState !== "CHOOSING_WORD") {
        setWordChoices(null);
      }
      if (data.gameState !== "ROUND_END") {
        setRoundEndData(null);
      }
    });

    s.on("time-update", ({ timer }) => {
      setRoomData((prev) => (prev ? { ...prev, timer } : prev));
      if (timer <= 5 && timer > 0) {
        sounds.playTick();
      }
    });

    s.on("hint-update", ({ wordHint }) => {
      setRoomData((prev) => (prev ? { ...prev, wordHint } : prev));
    });

    s.on("word-choices", (data) => {
      setWordChoices(data.choices);
      sounds.playTurnStart();
    });

    s.on("your-turn-draw", ({ word }) => {
      setDrawerSecretWord(word);
      setGuessedWord(null);
      setWordChoices(null);
      sounds.playTurnStart();
    });

    s.on("correct-guess", ({ word, points }) => {
      setGuessedWord(word);
      sounds.playCorrectGuess();
    });

    s.on("player-guessed", ({ playerName, points }) => {
      sounds.playCorrectGuess();
    });

    s.on("round-end", (data) => {
      setRoundEndData(data);
      setDrawerSecretWord(null);
      setGuessedWord(null);
      setWordChoices(null);
    });

    s.on("game-over", (data) => {
      setGameOverData(data.podium);
      sounds.playFanfare();
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch {}
    });

    s.on("chat-message", (msg) => {
      setMessages((prev) => [...prev.slice(-100), msg]);
    });

    s.on("private-message", ({ text, type }) => {
      setPrivateAlert({ text, type, timestamp: Date.now() });
      setTimeout(() => {
        setPrivateAlert(null);
      }, 4000);
    });

    // Drawing socket stream
    s.on("draw-stroke", (stroke) => {
      setCanvasEvents((prev) => ({ ...prev, stroke }));
    });

    s.on("canvas-fill", (fill) => {
      setCanvasEvents((prev) => ({ ...prev, fill }));
    });

    s.on("canvas-clear", () => {
      setCanvasEvents((prev) => ({ ...prev, clear: Date.now() }));
    });

    s.on("canvas-history", (history) => {
      setCanvasEvents((prev) => ({ ...prev, history }));
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  // Room actions
  const createRoom = (isPublic = true) => {
    return new Promise((resolve, reject) => {
      if (!socket) return reject(new Error("No socket connection"));
      const name = userName.trim() || "Doodler";
      socket.emit("create-room", { name, avatar, isPublic }, (res) => {
        if (res.success) {
          setMessages([]);
          resolve(res.roomId);
        } else {
          reject(new Error(res.error || "Failed to create room"));
        }
      });
    });
  };

  const joinRoom = (roomId) => {
    return new Promise((resolve, reject) => {
      if (!socket) return reject(new Error("No socket connection"));
      const name = userName.trim() || "Doodler";
      socket.emit("join-room", { roomId, name, avatar }, (res) => {
        if (res.success) {
          setMessages([]);
          resolve(res.roomId);
        } else {
          reject(new Error(res.error || "Failed to join room"));
        }
      });
    });
  };

  const quickPlay = () => {
    return new Promise((resolve, reject) => {
      if (!socket) return reject(new Error("No socket connection"));
      const name = userName.trim() || "Doodler";
      socket.emit("quick-play", { name, avatar }, (res) => {
        if (res.success) {
          setMessages([]);
          resolve(res.roomId);
        } else {
          reject(new Error(res.error || "Failed to find room"));
        }
      });
    });
  };

  const startGame = () => {
    if (socket) socket.emit("start-game");
  };

  const chooseWord = (word) => {
    if (socket) {
      socket.emit("choose-word", { word });
      setWordChoices(null);
    }
  };

  const emitDrawStroke = (strokeData) => {
    if (socket) socket.emit("draw-stroke", strokeData);
  };

  const emitFillCanvas = (fillData) => {
    if (socket) socket.emit("canvas-fill", fillData);
  };

  const emitClearCanvas = () => {
    if (socket) socket.emit("canvas-clear");
  };

  const sendMessage = (text) => {
    if (socket && text.trim()) {
      socket.emit("send-message", { text: text.trim() });
    }
  };

  const updateSettings = (settings) => {
    if (socket) socket.emit("update-settings", settings);
  };

  const addBot = () => {
    if (socket) socket.emit("add-bot");
  };

  const restartGame = () => {
    if (socket) {
      socket.emit("restart-game");
      setGameOverData(null);
      setRoundEndData(null);
      setGuessedWord(null);
    }
  };

  const leaveRoom = () => {
    if (socket) socket.emit("leave-room");
    setRoomData(null);
    setMessages([]);
    setWordChoices(null);
    setRoundEndData(null);
    setGameOverData(null);
    setDrawerSecretWord(null);
    setGuessedWord(null);
  };

  // Helper flags
  const isHost = roomData?.players?.find((p) => p.id === socket?.id)?.isHost || false;
  const isDrawer = roomData?.currentDrawer?.id === socket?.id;
  const myPlayer = roomData?.players?.find((p) => p.id === socket?.id) || null;

  return (
    <GameContext.Provider
      value={{
        socket,
        connected,
        userName,
        setUserName,
        avatar,
        setAvatar,
        roomData,
        messages,
        wordChoices,
        roundEndData,
        gameOverData,
        drawerSecretWord,
        guessedWord,
        canvasEvents,
        privateAlert,
        isHost,
        isDrawer,
        myPlayer,
        createRoom,
        joinRoom,
        quickPlay,
        startGame,
        chooseWord,
        emitDrawStroke,
        emitFillCanvas,
        emitClearCanvas,
        sendMessage,
        updateSettings,
        addBot,
        restartGame,
        leaveRoom
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}
