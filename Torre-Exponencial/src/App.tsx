import { useState } from "react";
import { useGame } from "./hooks/useGame";
import Lobby from "./components/Lobby";
import Game from "./components/Game";
import Winner from "./components/Winner";

function App() {
  const [playerName, setPlayerName] = useState("");
  const [joined, setJoined] = useState(false);
  const { connected, lobby, game, question, lastResult, error, quitMessage, spectating, restartState, join, startLobby, answer, quit, restart } = useGame(() => {
    setJoined(false);
    setPlayerName("");
  });

  if (!connected) {
    return (
      <div className="app">
        <div className="loading">Conectando ao servidor...</div>
      </div>
    );
  }

  if (!joined) {
    return (
      <div className="app">
        <div className="join-screen">
          <h1>Torre Exponencial</h1>
          <p>Jogo multiplayer de matemática</p>
          <input
            type="text"
            placeholder="Seu nome"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            maxLength={15}
          />
          <button
            onClick={() => {
              if (playerName.trim()) {
                join(playerName.trim());
                setJoined(true);
              }
            }}
            disabled={!playerName.trim()}
          >
            Jogar
          </button>
          {error && <div className="error">{error}</div>}
          <div style={{ position: "fixed", bottom: 8, right: 12, fontSize: 12, opacity: 0.5 }}>v1.0.6</div>
        </div>
      </div>
    );
  }

  if (game?.state === "FINISHED") {
    return (
      <div className="app">
        {quitMessage && <div className="quit-banner">{quitMessage}</div>}
        <Winner winner={game.winner} players={game.players} restartState={restartState} onRestart={restart} />
      </div>
    );
  }

  if (lobby && !game) {
    return (
      <div className="app">
        <Lobby lobby={lobby} onStart={startLobby} error={error} />
      </div>
    );
  }

  if (game) {
    return (
      <div className="app">
        {spectating && <div className="quit-banner">Esperando próxima partida</div>}
        <Game
          game={game}
          question={spectating ? null : question}
          lastResult={spectating ? null : lastResult}
          quitMessage={quitMessage}
          spectating={spectating}
          onAnswer={answer}
          onQuit={quit}
        />
      </div>
    );
  }

  return (
    <div className="app">
      <div className="loading">Carregando...</div>
    </div>
  );
}

export default App;
