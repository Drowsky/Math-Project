import type { GameData, QuestionData, ResultData } from "../types/game";

interface Props {
  game: GameData;
  question: QuestionData | null;
  lastResult: ResultData | null;
  quitMessage: string | null;
  onAnswer: (questionId: string, answerIndex: number) => void;
  onQuit: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function Game({ game, question, lastResult, quitMessage, onAnswer, onQuit }: Props) {
  const maxFloor = game.maxFloor || 15;
  const matchUrgent = game.matchTimeLeft <= 30;

  return (
    <div className="game">
      <div className="game-header">
        <div className={`match-timer ${matchUrgent ? "urgent" : ""}`}>
          {formatTime(game.matchTimeLeft)}
        </div>
        <div className="round-timer">
          {game.state === "PLAYING" && `${game.timeLeft}s`}
          {game.state === "COUNTDOWN" && `GO`}
        </div>
        <div className="state-badge">{game.state}</div>
        <button className="quit-btn" onClick={onQuit}>Desistir</button>
      </div>

      <div className="game-layout">
        <div className="tower-section">
          <Tower players={game.players} maxFloor={maxFloor} />
        </div>

        <div className="question-section">
          {game.state === "COUNTDOWN" && (
            <div className="countdown-big">{game.timeLeft}</div>
          )}

          {game.state === "PLAYING" && question && (
            <div className={`question-card ${lastResult ? (lastResult.correct ? "correct" : "wrong") : ""}`}>
              <div className="question-difficulty">
                Andar {game.players.find(() => true)?.floor || 1}
              </div>
              <p className="question-text">{question.question.text}</p>
              <div className="options">
                {question.question.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => onAnswer(question.question.id, i)}
                    disabled={!!lastResult}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              {lastResult && (
                <div className={`feedback ${lastResult.correct ? "feedback-correct" : "feedback-wrong"}`}>
                  {lastResult.correct ? "Correto! +1 andar" : "Errado! -1 andar"}
                </div>
              )}
            </div>
          )}

          {game.state === "PLAYING" && !question && (
            <div className="waiting-next">Próxima pergunta...</div>
          )}
        </div>
      </div>

      {quitMessage && (
        <div className="quit-banner">{quitMessage}</div>
      )}

      <div className="players-bar">
        {[...game.players].sort((a, b) => b.floor - a.floor).map((p) => (
          <div key={p.id} className="player-chip">
            <span className="player-name">{p.name}</span>
            <span className="player-floor">{p.floor}°</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Tower({ players, maxFloor }: { players: GameData["players"]; maxFloor: number }) {
  const floors = Array.from({ length: maxFloor }, (_, i) => maxFloor - i);

  return (
    <div className="tower">
      {floors.map((floor) => {
        const playersHere = players.filter((p) => p.floor === floor);
        const isTop = floor === maxFloor;
        return (
          <div key={floor} className={`tower-floor ${playersHere.length > 0 ? "occupied" : ""} ${isTop ? "top-floor" : ""}`}>
            <span className="floor-number">{floor}</span>
            <div className="floor-players">
              {playersHere.map((p) => (
                <div key={p.id} className="tower-player" title={p.name}>
                  {p.name.charAt(0).toUpperCase()}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
