import { BlockDefinition } from './types';

export const GRID_SIZE = 9;

export const AFFIRMATIONS_LIST = [
  "Good Girl! ♡",
  "Bacchu you're amazing!",
  "My Baby so smart!",
  "Cutiee pie!",
  "Lovie Dovie ♡",
  "You're a Winner!",
  "I'm so proud of you!",
  "Perfect angel!",
  "Keep shining baby!",
  "Kashif loves you! ♡",
  "Doing so well! ✨"
];

export const COLORS = [
  "bg-blue-400",
  "bg-cyan-400",
  "bg-sky-400",
  "bg-indigo-300",
  "bg-violet-300",
  "bg-pink-300", 
];

// Definition of Tetris-like shapes + custom ones used in Block Blast
// 1 = filled, 0 = empty
const RAW_SHAPES: number[][][] = [
  [[1]], // Dot
  [[1, 1]], // 2-Line H
  [[1], [1]], // 2-Line V
  [[1, 1, 1]], // 3-Line H
  [[1], [1], [1]], // 3-Line V
  [[1, 1, 1, 1]], // 4-Line H
  [[1], [1], [1], [1]], // 4-Line V
  [[1, 1], [1, 1]], // Square
  [[1, 0], [1, 0], [1, 1]], // L
  [[0, 1], [0, 1], [1, 1]], // J
  [[1, 1, 1], [0, 1, 0]], // T
  [[1, 1, 0], [0, 1, 1]], // Z
  [[0, 1, 1], [1, 1, 0]], // S
  [[1, 1, 1], [1, 0, 0]], // Corner big
  [[1, 0], [1, 1]], // Small corner
];

export const generateRandomBlock = (): BlockDefinition => {
  const shape = RAW_SHAPES[Math.floor(Math.random() * RAW_SHAPES.length)];
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  
  // Generate Sudoku values for filled cells
  const values = shape.map(row => row.map(cell => {
    if (cell === 0) return null;
    // Weighted random 1-9
    return Math.floor(Math.random() * 9) + 1;
  }));

  return {
    id: Math.random().toString(36).substring(2, 11),
    shape,
    color,
    values,
  };
};

export const INITIAL_GRID = Array(GRID_SIZE).fill(null).map(() => 
  Array(GRID_SIZE).fill({ filled: false, color: null, id: null, value: null })
);