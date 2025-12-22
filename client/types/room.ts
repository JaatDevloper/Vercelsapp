export interface Participant {
  odId: string;
  name: string;
  isHost: boolean;
  score: number;
  correctAnswers: number;
  totalQuestions?: number;
  finished: boolean;
  joinedAt: string;
  finishedAt?: string;
}

export interface Room {
  roomCode: string;
  quizId: string;
  status: "waiting" | "active" | "completed";
  participants: Participant[];
  startedAt?: string;
  completedAt?: string;
}

export interface RoomJoinResponse {
  roomCode: string;
  odId: string;
  quizId: string;
  status: string;
  participants: Participant[];
}

export interface WebSocketMessage {
  type: "player_joined" | "player_left" | "quiz_started" | "player_finished" | "joined_room";
  player?: Participant;
  participants?: Participant[];
  quizId?: string;
  odId?: string;
  score?: number;
  correctAnswers?: number;
  allFinished?: boolean;
  roomCode?: string;
}
