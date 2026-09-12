import { getRandomWords, formatWordHint, getWordPattern, cleanWord, isCloseGuess } from "./words.js";

export class RoomManager {
  constructor(io) {
    this.io = io;
    this.rooms = new Map(); // roomId -> Room
  }

  generateRoomCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  createRoom(hostSocket, hostData = {}) {
    let roomId = this.generateRoomCode();
    while (this.rooms.has(roomId)) {
      roomId = this.generateRoomCode();
    }

    const room = new Room(roomId, this.io, hostSocket, hostData);
    this.rooms.set(roomId, room);
    return room;
  }

  getRoom(roomId) {
    if (!roomId) return null;
    return this.rooms.get(roomId.toUpperCase()) || null;
  }

  removeRoom(roomId) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.cleanup();
      this.rooms.delete(roomId);
    }
  }

  findPublicRoom() {
    // Find a room in LOBBY with available slots
    for (const room of this.rooms.values()) {
      if (room.isPublic && room.gameState === "LOBBY" && room.players.length < 8) {
        return room;
      }
    }
    return null;
  }
}

export class Room {
  constructor(id, io, hostSocket, hostData = {}) {
    this.id = id;
    this.io = io;
    this.isPublic = hostData.isPublic ?? true;
    this.players = [];
    this.settings = {
      rounds: 3,
      drawTime: 80,
      customWordsOnly: false,
      customWords: []
    };

    this.gameState = "LOBBY"; // 'LOBBY' | 'CHOOSING_WORD' | 'DRAWING' | 'ROUND_END' | 'GAME_OVER'
    this.currentRound = 1;
    this.currentDrawerIndex = 0;
    this.currentWord = "";
    this.wordChoices = [];
    this.revealedIndices = new Set();
    this.timer = 0;
    this.timerInterval = null;
    this.turnTimeout = null;
    this.skipNextDrawerIncrement = false;
    this.canvasData = []; // History of strokes for current drawing
    this.correctGuessCount = 0;
    this.turnHistory = [];

    // Practice / Bot helpers
    this.botInterval = null;

    if (hostSocket) {
      this.addPlayer(hostSocket, { ...hostData, isHost: true });
    }
  }

  get currentDrawer() {
    return this.players[this.currentDrawerIndex] || null;
  }

  cleanupTimers() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    if (this.turnTimeout) {
      clearTimeout(this.turnTimeout);
      this.turnTimeout = null;
    }
  }

  addPlayer(socket, userData = {}) {
    // Check if already in room
    const existing = this.players.find(p => p.id === socket.id);
    if (existing) return existing;

    const player = {
      id: socket.id,
      name: userData.name?.trim() || `Player ${this.players.length + 1}`,
      avatar: userData.avatar || { color: "#6366f1", eyes: 1, mouth: 1 },
      score: 0,
      pointsEarnedThisRound: 0,
      guessedCorrectly: false,
      isHost: userData.isHost || this.players.length === 0,
      isBot: userData.isBot || false,
      connected: true
    };

    this.players.push(player);
    socket.join(this.id);

    // If game in progress, send current canvas and state
    this.broadcastRoomState();

    if (this.canvasData.length > 0) {
      socket.emit("canvas-history", this.canvasData);
    }

    this.broadcastSystemMessage(`${player.name} joined the room!`);
    return player;
  }

  removePlayer(socketId) {
    const index = this.players.findIndex(p => p.id === socketId);
    if (index === -1) return;

    const leavingPlayer = this.players[index];
    this.broadcastSystemMessage(`${leavingPlayer.name} left the room.`);

    const wasDrawer = this.currentDrawer?.id === socketId;
    const wasHost = leavingPlayer.isHost;

    // If the leaving player was at an index before the drawer, adjust drawer index
    if (index < this.currentDrawerIndex) {
      this.currentDrawerIndex--;
    }

    this.players.splice(index, 1);

    // If room is now empty of human players, cleanup
    if (this.players.filter(p => !p.isBot).length === 0) {
      this.cleanup();
      return;
    }

    // Reassign host if needed
    if (wasHost && this.players.length > 0) {
      const nextHost = this.players.find(p => !p.isBot) || this.players[0];
      if (nextHost) nextHost.isHost = true;
    }

    // If active game has fewer than 2 players left, reset to lobby
    if (this.gameState !== "LOBBY" && this.gameState !== "GAME_OVER" && this.players.length < 2) {
      this.cleanupTimers();
      this.gameState = "LOBBY";
      this.broadcastSystemMessage("Game paused: Need at least 2 players to play!", "warning");
      this.broadcastRoomState();
      return;
    }

    // If current drawer left while drawing or choosing
    if (wasDrawer && (this.gameState === "DRAWING" || this.gameState === "CHOOSING_WORD")) {
      this.broadcastSystemMessage("Drawer left! Skipping turn...", "warning");
      // Since drawer was spliced out, the next player is already at currentDrawerIndex
      this.endTurn({ reason: "Drawer left the game", skipped: true, dontIncrementDrawer: true });
    } else {
      if (this.currentDrawerIndex >= this.players.length) {
        this.currentDrawerIndex = 0;
      }
      this.broadcastRoomState();
    }
  }

  updateSettings(newSettings) {
    if (this.gameState !== "LOBBY") return;
    this.settings = { ...this.settings, ...newSettings };
    this.broadcastRoomState();
  }

  broadcastRoomState() {
    const safeData = {
      roomId: this.id,
      gameState: this.gameState,
      players: this.players,
      settings: this.settings,
      currentRound: this.currentRound,
      currentDrawer: this.currentDrawer ? {
        id: this.currentDrawer.id,
        name: this.currentDrawer.name,
        avatar: this.currentDrawer.avatar
      } : null,
      timer: this.timer,
      wordHint: this.gameState === "DRAWING" ? this.getMaskedWord() : null,
      wordPattern: this.gameState === "DRAWING" && this.currentWord ? getWordPattern(this.currentWord).lengths : null
    };

    this.io.to(this.id).emit("room-state", safeData);
  }

  broadcastSystemMessage(text, type = "info") {
    this.io.to(this.id).emit("chat-message", {
      id: `${Date.now()}-${Math.random()}`,
      sender: "System",
      text,
      type,
      timestamp: Date.now()
    });
  }

  getMaskedWord() {
    if (!this.currentWord) return "";
    return formatWordHint(this.currentWord, this.revealedIndices);
  }

  startGame() {
    if (this.players.length < 2) {
      this.broadcastSystemMessage("At least 2 players are needed to start the game!", "warning");
      return;
    }

    this.cleanupTimers();
    this.gameState = "CHOOSING_WORD";
    this.currentRound = 1;
    this.currentDrawerIndex = 0;
    this.players.forEach(p => {
      p.score = 0;
      p.pointsEarnedThisRound = 0;
      p.guessedCorrectly = false;
    });

    this.startTurn();
  }

  startTurn() {
    this.cleanupTimers();

    if (this.players.length < 2) {
      this.gameState = "LOBBY";
      this.broadcastRoomState();
      return;
    }

    if (this.currentDrawerIndex >= this.players.length) {
      this.currentDrawerIndex = 0;
    }

    const drawer = this.currentDrawer;
    if (!drawer) return;

    this.gameState = "CHOOSING_WORD";
    this.canvasData = [];
    this.revealedIndices = new Set();
    this.correctGuessCount = 0;
    this.players.forEach(p => {
      p.guessedCorrectly = false;
      p.pointsEarnedThisRound = 0;
    });

    // Clear board for all
    this.io.to(this.id).emit("canvas-clear");

    // Generate 3 words
    const customPool = this.settings.customWordsOnly && this.settings.customWords?.length >= 3
      ? this.settings.customWords
      : null;
    this.wordChoices = getRandomWords(3, customPool);

    this.timer = 15;
    this.broadcastRoomState();

    // Send word choices only to drawer
    this.io.to(drawer.id).emit("word-choices", {
      choices: this.wordChoices,
      timeout: 15
    });

    this.broadcastSystemMessage(`${drawer.name} is choosing a word...`);

    // If drawer is a bot, pick automatically after 2s
    if (drawer.isBot) {
      this.turnTimeout = setTimeout(() => {
        this.selectWord(this.wordChoices[0]);
      }, 2000);
      return;
    }

    this.timerInterval = setInterval(() => {
      this.timer--;
      this.io.to(this.id).emit("time-update", { timer: this.timer });

      if (this.timer <= 0) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
        // Auto pick first word
        this.selectWord(this.wordChoices[0]);
      }
    }, 1000);
  }

  selectWord(word) {
    if (this.gameState !== "CHOOSING_WORD") return;
    this.cleanupTimers();

    const chosen = (word && this.wordChoices.includes(word)) ? word : (this.wordChoices[0] || word || "apple");
    this.currentWord = cleanWord(chosen);
    this.gameState = "DRAWING";
    this.timer = this.settings.drawTime;
    this.revealedIndices = new Set();

    this.broadcastRoomState();

    const drawer = this.currentDrawer;
    if (drawer) {
      this.io.to(drawer.id).emit("your-turn-draw", {
        word: this.currentWord,
        drawTime: this.settings.drawTime
      });
    }

    this.broadcastSystemMessage(`Round ${this.currentRound}: ${drawer?.name} is now drawing!`);

    // Hint intervals: reveal 1 letter at 60% time, another at 30% time
    const totalTime = this.settings.drawTime;
    const firstHintTime = Math.floor(totalTime * 0.6);
    const secondHintTime = Math.floor(totalTime * 0.3);

    this.timerInterval = setInterval(() => {
      this.timer--;
      this.io.to(this.id).emit("time-update", { timer: this.timer });

      // Check hint reveals
      if (this.timer === firstHintTime || this.timer === secondHintTime) {
        this.revealRandomLetter();
      }

      // Check bot guessing or bot drawing
      this.handleBotTurnTick();

      if (this.timer <= 0) {
        this.cleanupTimers();
        this.endTurn({ reason: "Time's up!" });
      }
    }, 1000);
  }

  revealRandomLetter() {
    if (!this.currentWord) return;
    const unrevealedIndices = [];
    for (let i = 0; i < this.currentWord.length; i++) {
      const ch = this.currentWord[i];
      if (ch !== " " && ch !== "-" && !this.revealedIndices.has(i)) {
        unrevealedIndices.push(i);
      }
    }

    // Keep at least half the letters hidden
    const maxRevealed = Math.floor(this.currentWord.replace(/\s+/g, "").length / 2);
    if (unrevealedIndices.length > 0 && this.revealedIndices.size < maxRevealed) {
      const idx = unrevealedIndices[Math.floor(Math.random() * unrevealedIndices.length)];
      this.revealedIndices.add(idx);
      this.io.to(this.id).emit("hint-update", {
        wordHint: this.getMaskedWord()
      });
    }
  }

  handleGuess(socketId, guessText) {
    const player = this.players.find(p => p.id === socketId);
    if (!player) return;

    // Drawer cannot guess
    if (this.currentDrawer?.id === socketId) {
      socketId && this.io.to(socketId).emit("private-message", {
        text: "You cannot guess while drawing!",
        type: "warning"
      });
      return;
    }

    // If player already guessed correctly in this round
    if (player.guessedCorrectly) {
      socketId && this.io.to(socketId).emit("private-message", {
        text: "You have already guessed the word!",
        type: "info"
      });
      return;
    }

    const cleanGuess = cleanWord(guessText);
    const targetWord = cleanWord(this.currentWord);

    // Check exact match
    if (this.gameState === "DRAWING" && cleanGuess === targetWord) {
      player.guessedCorrectly = true;
      this.correctGuessCount++;

      // Award points
      const timeBonus = Math.max(0.1, this.timer / this.settings.drawTime);
      const rankBonus = Math.max(0, 150 - (this.correctGuessCount - 1) * 30);
      const pointsEarned = Math.round(400 * timeBonus) + 50 + rankBonus;
      player.score += pointsEarned;
      player.pointsEarnedThisRound = pointsEarned;

      // Drawer also receives points for players who guess
      const drawer = this.currentDrawer;
      if (drawer) {
        const drawerBonus = Math.round(60 * timeBonus) + 25;
        drawer.score += drawerBonus;
        drawer.pointsEarnedThisRound = (drawer.pointsEarnedThisRound || 0) + drawerBonus;
      }

      // Send private event to the guesser with the revealed word and points
      this.io.to(socketId).emit("correct-guess", {
        word: this.currentWord,
        points: pointsEarned
      });

      // Broadcast to all players that this player guessed
      this.io.to(this.id).emit("player-guessed", {
        playerId: player.id,
        playerName: player.name,
        points: pointsEarned
      });

      this.broadcastSystemMessage(`🎉 ${player.name} guessed the word! (+${pointsEarned} pts)`, "success");

      // Check if all guessers have guessed
      const guessers = this.players.filter(p => p.id !== this.currentDrawer?.id);
      const allGuessed = guessers.length > 0 && guessers.every(p => p.guessedCorrectly);

      if (allGuessed) {
        this.broadcastSystemMessage("Everyone guessed the word!", "success");
        this.endTurn({ reason: "Everyone guessed the word!", allGuessed: true });
        return;
      }

      // If multiple guessers and at least one still needs to guess, shorten timer to max 20s
      if (this.timer > 20) {
        this.timer = 20;
        this.io.to(this.id).emit("time-update", { timer: this.timer });
      }

      this.broadcastRoomState();
      return;
    }

    // Check if close guess
    if (this.gameState === "DRAWING" && isCloseGuess(cleanGuess, targetWord)) {
      this.io.to(socketId).emit("private-message", {
        text: `'${guessText}' is very close!`,
        type: "warning"
      });
    }

    // Broadcast standard chat message
    this.io.to(this.id).emit("chat-message", {
      id: `${Date.now()}-${Math.random()}`,
      sender: player.name,
      senderId: player.id,
      text: guessText,
      type: "chat",
      timestamp: Date.now()
    });
  }

  endTurn({ reason = null, skipped = false, allGuessed = false, dontIncrementDrawer = false } = {}) {
    this.cleanupTimers();
    this.gameState = "ROUND_END";
    this.skipNextDrawerIncrement = dontIncrementDrawer;

    const wordRevealed = this.currentWord;
    const finalReason = reason || (skipped ? "Drawer disconnected" : (allGuessed ? "Everyone guessed the word!" : "Time's up!"));

    const scores = this.players.map(p => ({
      id: p.id,
      name: p.name,
      score: p.score,
      pointsEarnedThisRound: p.pointsEarnedThisRound || 0,
      guessedCorrectly: p.guessedCorrectly,
      isDrawer: p.id === this.currentDrawer?.id
    }));

    this.io.to(this.id).emit("round-end", {
      word: wordRevealed,
      reason: finalReason,
      allGuessed,
      skipped,
      scores
    });

    this.broadcastSystemMessage(`The word was: ${wordRevealed.toUpperCase()}`);
    this.broadcastRoomState();

    // 4 seconds pause to show results, then advance turn or round
    this.turnTimeout = setTimeout(() => {
      this.turnTimeout = null;
      this.advanceTurn();
    }, 4000);
  }

  advanceTurn() {
    if (this.gameState !== "ROUND_END") return;

    if (this.players.length < 2) {
      this.gameState = "LOBBY";
      this.broadcastRoomState();
      return;
    }

    if (!this.skipNextDrawerIncrement) {
      this.currentDrawerIndex++;
    }
    this.skipNextDrawerIncrement = false;

    // If finished full rotation of players
    if (this.currentDrawerIndex >= this.players.length) {
      this.currentDrawerIndex = 0;
      this.currentRound++;

      if (this.currentRound > this.settings.rounds) {
        this.endGame();
        return;
      }
    }

    this.startTurn();
  }

  endGame() {
    this.cleanupTimers();
    this.gameState = "GAME_OVER";

    const podium = [...this.players].sort((a, b) => b.score - a.score);

    this.io.to(this.id).emit("game-over", {
      podium: podium.map((p, idx) => ({
        rank: idx + 1,
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        score: p.score
      }))
    });

    this.broadcastRoomState();
  }

  restartGame() {
    this.cleanupTimers();
    this.gameState = "LOBBY";
    this.currentRound = 1;
    this.currentDrawerIndex = 0;
    this.canvasData = [];
    this.players.forEach(p => {
      p.score = 0;
      p.guessedCorrectly = false;
      p.pointsEarnedThisRound = 0;
    });
    this.broadcastRoomState();
  }

  handleDrawStroke(stroke) {
    if (this.gameState !== "DRAWING") return;
    this.canvasData.push(stroke);
    // Broadcast stroke to other clients in room
    this.io.to(this.id).emit("draw-stroke", stroke);
  }

  handleCanvasFill(fillData) {
    if (this.gameState !== "DRAWING") return;
    this.canvasData.push(fillData);
    this.io.to(this.id).emit("canvas-fill", fillData);
  }

  handleCanvasClear() {
    if (this.gameState !== "DRAWING") return;
    this.canvasData = [];
    this.io.to(this.id).emit("canvas-clear");
  }

  // --- BOT SIMULATION FOR PRACTICE / TESTING ---
  addBot(name = "DoodleBot") {
    const botId = `bot-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const bot = {
      id: botId,
      name,
      avatar: { color: "#ec4899", eyes: 2, mouth: 2 },
      score: 0,
      pointsEarnedThisRound: 0,
      guessedCorrectly: false,
      isHost: false,
      isBot: true,
      connected: true
    };
    this.players.push(bot);
    this.broadcastRoomState();
    this.broadcastSystemMessage(`${bot.name} (Bot) entered the game!`);
    return bot;
  }

  handleBotTurnTick() {
    // If human is drawing, bot can guess around halfway
    const bot = this.players.find(p => p.isBot && !p.guessedCorrectly && p.id !== this.currentDrawer?.id);
    if (bot && this.gameState === "DRAWING") {
      const halfTime = Math.floor(this.settings.drawTime * 0.5);
      if (this.timer === halfTime) {
        // Bot guesses the word
        this.handleGuess(bot.id, this.currentWord);
      }
    }

    // If bot is drawing, bot draws simple doodle strokes
    if (this.currentDrawer?.isBot && this.gameState === "DRAWING") {
      this.simulateBotDrawingStep();
    }
  }

  simulateBotDrawingStep() {
    const step = this.settings.drawTime - this.timer;
    if (step === 1) {
      // Draw smiley or sun
      this.handleDrawStroke({
        type: "stroke",
        color: "#f59e0b",
        size: 6,
        points: [
          { x: 0.5, y: 0.3 },
          { x: 0.55, y: 0.32 },
          { x: 0.58, y: 0.38 },
          { x: 0.58, y: 0.45 },
          { x: 0.54, y: 0.5 },
          { x: 0.46, y: 0.5 },
          { x: 0.42, y: 0.45 },
          { x: 0.42, y: 0.38 },
          { x: 0.45, y: 0.32 },
          { x: 0.5, y: 0.3 }
        ]
      });
    } else if (step === 3) {
      // Eyes
      this.handleDrawStroke({
        type: "stroke",
        color: "#1e293b",
        size: 8,
        points: [{ x: 0.47, y: 0.38 }, { x: 0.47, y: 0.39 }]
      });
      this.handleDrawStroke({
        type: "stroke",
        color: "#1e293b",
        size: 8,
        points: [{ x: 0.53, y: 0.38 }, { x: 0.53, y: 0.39 }]
      });
    } else if (step === 5) {
      // Smile
      this.handleDrawStroke({
        type: "stroke",
        color: "#ef4444",
        size: 5,
        points: [
          { x: 0.46, y: 0.44 },
          { x: 0.48, y: 0.46 },
          { x: 0.52, y: 0.46 },
          { x: 0.54, y: 0.44 }
        ]
      });
    }
  }

  cleanup() {
    this.cleanupTimers();
  }
}
