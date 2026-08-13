import type { PlayerInfo, RestartStateData } from "../types/game";

interface Props {
  winner: string | null;
  players: PlayerInfo[];
  restartState: RestartStateData | null;
  onRestart: () => void;
}

export default function Winner({ winner, players, restartState, onRestart }: Props) {
  const sorted = [...players].sort((a, b) => b.floor - a.floor);
  const hasPressed = restartState && restartState.readyPlayers.length > 0;
  const allReady = restartState && restartState.readyPlayers.length >= restartState.totalPlayers;

  return (
    <div className="winner-screen">
      <div className="trophy">🏆</div>
      <h1>Vencedor!</h1>
      <div className="winner-name">{winner}</div>
      <div className="leaderboard">
        <h2>Classificação Final</h2>
        {sorted.map((p, i) => (
          <div key={p.id} className={`leaderboard-row ${i === 0 ? "first" : ""} ${i === 1 ? "second" : ""} ${i === 2 ? "third" : ""}`}>
            <span className="rank">
              {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
            </span>
            <span className="name">{p.name}</span>
            <span className="floor">{p.floor}° andar</span>
          </div>
        ))}
      </div>

      {hasPressed && !allReady && (
        <div className="restart-queue">
          <div className="restart-queue-title">Na fila para jogar:</div>
          <div className="restart-queue-names">
            {restartState!.readyPlayers.map((name: string) => (
              <span key={name} className="restart-player-tag">{name}</span>
            ))}
          </div>
          <div className="restart-timer-info">
            {restartState!.readyPlayers.length}/{restartState!.totalPlayers} prontos
            {restartState!.timeLeft > 0 && ` · ${restartState!.timeLeft}s`}
          </div>
        </div>
      )}

      <button onClick={onRestart}>
        {allReady ? "Reiniciando..." : hasPressed ? "Aguardando jogadores..." : "Jogar Novamente"}
      </button>
    </div>
  );
}
