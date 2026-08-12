export interface PlayerInfo {
  id: string;
  name: string;
  floor: number;
  answered?: boolean;
}

export interface LobbyData {
  state: string;
  players: PlayerInfo[];
  maxPlayers: number;
}

export interface GameData {
  state: string;
  players: PlayerInfo[];
  timeLeft: number;
  matchTimeLeft: number;
  winner: string | null;
  maxFloor: number;
}

export interface QuestionData {
  question: {
    id: string;
    text: string;
    options: string[];
  };
  timeLeft: number;
}

export interface ResultData {
  correct: boolean;
  floor: number;
}

export interface RestartStateData {
  readyPlayers: string[];
  totalPlayers: number;
  timeLeft: number;
}
