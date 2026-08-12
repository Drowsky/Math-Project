import type { LobbyData } from "../types/game";

interface Props {
  lobby: LobbyData;
  onStart: () => void;
  error: string | null;
}

export default function Lobby({ lobby, onStart, error }: Props) {
  return (
    <div className="lobby">
      <div className="lobby-icon">🏗️</div>
      <h1>Torre Exponencial</h1>
      <p className="lobby-subtitle">Competição multiplayer de matemática</p>
      <div className="lobby-card">
        <div className="lobby-stat">
          <span className="stat-value">{lobby.players.length}</span>
          <span className="stat-label">Jogadores</span>
        </div>
        <div className="lobby-divider" />
        <div className="lobby-stat">
          <span className="stat-value">{lobby.maxPlayers}</span>
          <span className="stat-label">Máximo</span>
        </div>
      </div>
      <div className="player-list">
        {lobby.players.map((p) => (
          <div key={p.id} className="player-item">
            <span className="player-avatar">{p.name.charAt(0).toUpperCase()}</span>
            <span>{p.name}</span>
          </div>
        ))}
      </div>
      {lobby.state === "COUNTDOWN" && (
        <div className="countdown-lobby">Iniciando...</div>
      )}
      <button onClick={onStart} disabled={lobby.players.length < 1 || lobby.state === "COUNTDOWN"}>
        Iniciar Partida
      </button>
      {error && <div className="error">{error}</div>}
    </div>
  );
}
