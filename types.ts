export interface Coordinate {
  r: number;
  c: number;
}

export type BlockShape = number[][];

export interface BlockDefinition {
  id: string;
  shape: BlockShape;
  color: string;
  values: (number | null)[][]; // Sudoku values
}

export interface CellData {
  filled: boolean;
  color: string | null;
  id: string | null; // To track which block it came from
  value: number | null; // Sudoku value
}

export interface GameState {
  grid: CellData[][];
  score: number;
  highScore: number;
  streak: number;
  gameOver: boolean;
}

export interface Affirmation {
  id: number;
  text: string;
  x: number;
  y: number;
}