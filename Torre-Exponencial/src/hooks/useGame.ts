import { useEffect, useRef, useState, useCallback } from "react";
import { socket } from "../lib/socket";
import type { LobbyData, GameData, QuestionData, ResultData, RestartStateData } from "../types/game";

export function useGame(onDisconnected?: () => void) {
  const [lobby, setLobby] = useState<LobbyData | null>(null);
  const [game, setGame] = useState<GameData | null>(null);
  const [question, setQuestion] = useState<QuestionData | null>(null);
  const [lastResult, setLastResult] = useState<ResultData | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quitMessage, setQuitMessage] = useState<string | null>(null);
  const [spectating, setSpectating] = useState(false);
  const [restartState, setRestartState] = useState<RestartStateData | null>(null);
  const onDisconnectedRef = useRef(onDisconnected);
  onDisconnectedRef.current = onDisconnected;

  useEffect(() => {
    socket.connect();

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => {
      setConnected(false);
      onDisconnectedRef.current?.();
    });

    socket.on("lobby:update", (data: LobbyData) => {
      setLobby(data);
      setGame(null);
      setQuestion(null);
      setLastResult(null);
      setRestartState(null);
      setSpectating(false);
      setError(null);
    });

    socket.on("game:state", (data: GameData) => {
      setGame(data);
      const me = data.players.find((p) => p.id === socket.id);
      if (me && !me.spectating) setSpectating(false);
      if (data.state === "FINISHED") setQuestion(null);
      if (data.state !== "FINISHED") setRestartState(null);
    });

    socket.on("game:question", (data: QuestionData) => {
      setQuestion(data);
      setLastResult(null);
    });

    socket.on("game:result", (data: ResultData) => {
      setLastResult(data);
    });

    socket.on("game:quit", (data: { name: string; alone: boolean }) => {
      setQuitMessage(`Jogador ${data.name} abandonou a partida. Burrão KKKKKK`);
      setTimeout(() => setQuitMessage(null), 4000);
    });

    socket.on("game:spectating", () => {
      setSpectating(true);
      setQuestion(null);
      setLastResult(null);
    });

    socket.on("game:restart-state", (data: RestartStateData) => {
      setRestartState(data);
    });

    socket.on("error:full", () => setError("Sala cheia (15/15)"));
    socket.on("error:inprogress", () => setError("Partida em andamento"));

    return () => {
      socket.disconnect();
    };
  }, []);

  const join = useCallback((name: string) => {
    socket.emit("player:join", name);
  }, []);

  const startLobby = useCallback(() => {
    socket.emit("lobby:start");
  }, []);

  const answer = useCallback((questionId: string, answerIndex: number) => {
    socket.emit("game:answer", { questionId, answerIndex });
  }, []);

  const quit = useCallback(() => {
    socket.emit("player:quit");
  }, []);

  const restart = useCallback(() => {
    socket.emit("game:restart");
  }, []);

  return {
    connected,
    lobby,
    game,
    question,
    lastResult,
    error,
    quitMessage,
    spectating,
    restartState,
    join,
    startLobby,
    answer,
    quit,
    restart,
  };
}
