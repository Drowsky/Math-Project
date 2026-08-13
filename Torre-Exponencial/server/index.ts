import { Server, Socket } from "socket.io";
import { createServer } from "http";
import express from "express";
import { getQuestionForFloor, type Question } from "./questions.js";

const app = express();

app.get("/health", (_req: express.Request, res: express.Response) => {
  res.json({ status: "ok" });
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: false,
  },
  transports: ["websocket", "polling"],
});

const MAX_FLOOR = 15;
const QUESTION_TIME = 30;
const MATCH_DURATION = 390;
const MIN_PLAYERS = 1;
const COUNTDOWN_SECONDS = 3;

type GameState = "WAITING" | "COUNTDOWN" | "PLAYING" | "FINISHED";

interface Player {
  id: string;
  name: string;
  floor: number;
  currentQuestion: Question | null;
  answered: boolean;
  answerTime: number;
  spectating: boolean;
}

interface GameRoom {
  state: GameState;
  players: Map<string, Player>;
  timer: NodeJS.Timeout | null;
  matchTimer: NodeJS.Timeout | null;
  timeLeft: number;
  matchTimeLeft: number;
  winner: string | null;
  readyForRestart: Set<string>;
  restartTimer: NodeJS.Timeout | null;
}

const RESTART_WAIT = 10;

const room: GameRoom = {
  state: "WAITING",
  players: new Map(),
  timer: null,
  matchTimer: null,
  timeLeft: 0,
  matchTimeLeft: MATCH_DURATION,
  winner: null,
  readyForRestart: new Set(),
  restartTimer: null,
};

function broadcastLobby() {
  const players = Array.from(room.players.values())
    .filter((p) => !p.spectating)
    .map((p) => ({
      id: p.id,
      name: p.name,
      floor: p.floor,
    }));
  io.emit("lobby:update", {
    state: room.state,
    players,
    maxPlayers: 15,
  });
}

function broadcastGameState() {
  const players = Array.from(room.players.values()).map((p) => ({
    id: p.id,
    name: p.name,
    floor: p.floor,
    answered: p.answered,
    spectating: p.spectating,
  }));
  io.emit("game:state", {
    state: room.state,
    players,
    timeLeft: room.timeLeft,
    matchTimeLeft: room.matchTimeLeft,
    winner: room.winner,
    maxFloor: MAX_FLOOR,
  });
}

function sanitizeName(name: string): string {
  return name.replace(/[<>"'&]/g, "").trim().slice(0, 15) || "Player";
}

function clearAllTimers() {
  if (room.timer) clearInterval(room.timer);
  if (room.matchTimer) clearInterval(room.matchTimer);
  if (room.restartTimer) clearTimeout(room.restartTimer);
  room.timer = null;
  room.matchTimer = null;
  room.restartTimer = null;
}

function sendQuestion(socketId: string) {
  const player = room.players.get(socketId);
  if (!player || player.spectating || room.state !== "PLAYING") return;
  const question = getQuestionForFloor(player.floor);
  player.currentQuestion = question;
  player.answered = false;
  io.to(socketId).emit("game:question", {
    question: {
      id: question.id,
      text: question.text,
      options: question.options,
    },
    timeLeft: room.timeLeft,
  });
}

function startCountdown() {
  clearAllTimers();
  room.readyForRestart.clear();
  room.state = "COUNTDOWN";
  let count = COUNTDOWN_SECONDS;
  room.timeLeft = count;
  broadcastGameState();

  room.timer = setInterval(() => {
    count--;
    room.timeLeft = count;
    broadcastGameState();
    if (count <= 0) {
      clearInterval(room.timer!);
      startGame();
    }
  }, 1000);
}

function startGame() {
  room.state = "PLAYING";
  room.timeLeft = QUESTION_TIME;
  room.matchTimeLeft = MATCH_DURATION;
  room.winner = null;
  for (const [, player] of room.players) {
    player.floor = 1;
    player.answered = false;
    player.currentQuestion = null;
    player.answerTime = Infinity;
  }
  broadcastGameState();
  for (const [id, p] of room.players) {
    if (!p.spectating) sendQuestion(id);
  }
  startQuestionTimer();
  startMatchTimer();
}

function startMatchTimer() {
  if (room.matchTimer) clearInterval(room.matchTimer);
  room.matchTimer = setInterval(() => {
    room.matchTimeLeft--;
    if (room.matchTimeLeft <= 0) {
      endGameByTime();
    }
  }, 1000);
}

function endGameByTime() {
  clearAllTimers();
  let best: Player | null = null;
  for (const [, player] of room.players) {
    if (player.spectating) continue;
    if (!best || player.floor > best.floor) best = player;
  }
  room.state = "FINISHED";
  room.winner = best ? best.name : null;
  room.readyForRestart.clear();
  if (room.restartTimer) clearTimeout(room.restartTimer);
  broadcastGameState();
}

function startQuestionTimer() {
  if (room.timer) clearInterval(room.timer);
  room.timeLeft = QUESTION_TIME;
  room.timer = setInterval(() => {
    room.timeLeft--;
    broadcastGameState();
    if (room.timeLeft <= 0) {
      handleTimeout();
    }
  }, 1000);
}

function handleTimeout() {
  for (const [id, player] of room.players) {
    if (!player.spectating && !player.answered && player.currentQuestion) {
      player.answered = true;
      player.floor = Math.max(1, player.floor - 1);
      io.to(id).emit("game:result", { correct: false, floor: player.floor });
    }
  }
  nextRound();
}

function nextRound() {
  const winner = checkWinner();
  if (winner) {
    endGame(winner);
    return;
  }
  for (const [, player] of room.players) {
    player.answered = false;
    player.currentQuestion = null;
    player.answerTime = Infinity;
  }
  broadcastGameState();
  setTimeout(() => {
    if (room.state !== "PLAYING") return;
    for (const [id, p] of room.players) {
      if (!p.spectating) sendQuestion(id);
    }
    startQuestionTimer();
  }, 200);
}

function checkWinner(): Player | null {
  for (const [, player] of room.players) {
    if (!player.spectating && player.floor >= MAX_FLOOR) return player;
  }
  return null;
}

function endGame(winner: Player) {
  clearAllTimers();
  room.state = "FINISHED";
  room.winner = winner.name;
  room.readyForRestart.clear();
  if (room.restartTimer) clearTimeout(room.restartTimer);
  broadcastGameState();
}

function resetGame() {
  clearAllTimers();
  room.restartTimer = null;
  room.readyForRestart.clear();
  room.state = "WAITING";
  room.winner = null;
  room.timeLeft = 0;
  room.matchTimeLeft = MATCH_DURATION;
  const toDelete: string[] = [];
  for (const [id, player] of room.players) {
    if (player.spectating) {
      toDelete.push(id);
    } else {
      player.floor = 1;
      player.answered = false;
      player.currentQuestion = null;
      player.answerTime = Infinity;
    }
  }
  for (const id of toDelete) {
    room.players.delete(id);
  }
  broadcastLobby();
}

function broadcastRestartState() {
  const readyNames: string[] = [];
  for (const id of room.readyForRestart) {
    const p = room.players.get(id);
    if (p) readyNames.push(p.name);
  }
  io.emit("game:restart-state", {
    readyPlayers: readyNames,
    totalPlayers: room.players.size,
    timeLeft: room.timeLeft,
  });
}

io.on("connection", (socket: Socket) => {
  console.log(`Connected: ${socket.id}`);

  socket.on("player:join", (name: string) => {
    if (room.players.size >= 15) {
      socket.emit("error:full");
      return;
    }
    const isSpectator = room.state !== "WAITING";
    const player: Player = {
      id: socket.id,
      name: sanitizeName(name) || `Player${room.players.size + 1}`,
      floor: 1,
      currentQuestion: null,
      answered: false,
      answerTime: Infinity,
      spectating: isSpectator,
    };
    room.players.set(socket.id, player);

    if (isSpectator) {
      socket.join("game");
      broadcastGameState();
      socket.emit("game:spectating");
    } else {
      broadcastLobby();
      if (room.players.size >= MIN_PLAYERS && room.state === "WAITING") {
        // Auto-start when enough players
      }
    }
  });

  socket.on("lobby:start", () => {
    if (room.state !== "WAITING" || room.players.size < MIN_PLAYERS) return;
    startCountdown();
  });

  socket.on("game:answer", (data: { questionId: string; answerIndex: number }) => {
    const player = room.players.get(socket.id);
    if (!player || player.spectating || room.state !== "PLAYING" || player.answered) return;
    if (!player.currentQuestion || player.currentQuestion.id !== data.questionId) return;
    if (typeof data.answerIndex !== "number" || data.answerIndex < 0 || data.answerIndex >= player.currentQuestion.options.length) return;

    player.answered = true;
    player.answerTime = Date.now();
    const correct = data.answerIndex === player.currentQuestion.correctIndex;

    if (correct) {
      player.floor = Math.min(MAX_FLOOR, player.floor + 1);
    } else {
      player.floor = Math.max(1, player.floor - 1);
    }

    io.to(socket.id).emit("game:result", { correct, floor: player.floor });

    const sortedPlayers = Array.from(room.players.values()).sort((a, b) => {
      if (b.floor !== a.floor) return b.floor - a.floor;
      return a.answerTime - b.answerTime;
    });
    const playersRanked = sortedPlayers.map((p) => ({
      id: p.id,
      name: p.name,
      floor: p.floor,
      answered: p.answered,
    }));
    io.emit("game:state", {
      state: room.state,
      players: playersRanked,
      timeLeft: room.timeLeft,
      matchTimeLeft: room.matchTimeLeft,
      winner: room.winner,
      maxFloor: MAX_FLOOR,
    });

    const allAnswered = Array.from(room.players.values()).every((p) => p.answered);
    if (allAnswered) {
      if (room.timer) clearInterval(room.timer);
      broadcastGameState();
      const winner = checkWinner();
      if (winner) {
        endGame(winner);
      } else {
        setTimeout(() => {
          if (room.state !== "PLAYING") return;
          nextRound();
        }, 1500);
      }
    }
  });

  socket.on("player:quit", () => {
    const player = room.players.get(socket.id);
    if (!player) return;
    const playerName = player.name;

    if (room.state === "WAITING") {
      room.players.delete(socket.id);
      room.readyForRestart.delete(socket.id);
      broadcastLobby();
      return;
    }

    if (room.state === "FINISHED") {
      room.players.delete(socket.id);
      room.readyForRestart.delete(socket.id);
      if (room.players.size === 0) {
        resetGame();
        return;
      }
      broadcastRestartState();
      return;
    }

    if (room.state === "PLAYING" || room.state === "COUNTDOWN") {
      player.spectating = true;
      player.currentQuestion = null;
      player.answered = true;
      room.readyForRestart.delete(socket.id);

      io.to(socket.id).emit("game:spectating");
      io.emit("game:quit", { name: playerName, alone: false });

      const activePlayers = Array.from(room.players.values()).filter((p) => !p.spectating);
      if (activePlayers.length === 0) {
        resetGame();
        return;
      }

      const allAnswered = activePlayers.every((p) => p.answered);
      if (allAnswered && room.state === "PLAYING") {
        if (room.timer) clearInterval(room.timer);
        const winner = checkWinner();
        if (winner) {
          endGame(winner);
        } else {
          setTimeout(() => {
            if (room.state !== "PLAYING") return;
            nextRound();
          }, 1500);
        }
      } else {
        broadcastGameState();
      }
    }
  });

  socket.on("game:restart", () => {
    if (room.state !== "FINISHED") return;
    if (!room.players.has(socket.id)) return;

    room.readyForRestart.add(socket.id);
    broadcastRestartState();

    const allReady = room.readyForRestart.size >= room.players.size;
    if (allReady) {
      if (room.restartTimer) clearTimeout(room.restartTimer);
      startCountdown();
      return;
    }

    if (!room.restartTimer && room.readyForRestart.size > 0) {
      room.timeLeft = RESTART_WAIT;
      broadcastRestartState();
      room.restartTimer = setTimeout(() => {
        room.restartTimer = null;
        startCountdown();
      }, RESTART_WAIT * 1000);
    }
  });

  socket.on("disconnect", () => {
    room.players.delete(socket.id);
    room.readyForRestart.delete(socket.id);
    if (room.state === "WAITING") {
      broadcastLobby();
    } else if (room.state === "FINISHED") {
      if (room.players.size === 0) {
        resetGame();
      } else {
        broadcastRestartState();
      }
    } else if (room.state === "PLAYING" || room.state === "COUNTDOWN") {
      const activePlayers = Array.from(room.players.values()).filter((p) => !p.spectating);
      if (activePlayers.length === 0) {
        resetGame();
      } else {
        const allAnswered = activePlayers.every((p) => p.answered);
        if (allAnswered && room.state === "PLAYING") {
          if (room.timer) clearInterval(room.timer);
          const winner = checkWinner();
          if (winner) {
            endGame(winner);
          } else {
            setTimeout(() => {
              if (room.state !== "PLAYING") return;
              nextRound();
            }, 1500);
          }
        } else {
          broadcastGameState();
        }
      }
    }
    console.log(`Disconnected: ${socket.id}`);
  });
});

const PORT = Number(process.env.PORT) || 3001;
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
