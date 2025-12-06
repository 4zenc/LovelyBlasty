import React, { useState, useEffect, useRef } from 'react';
import { 
  Trophy, 
  RotateCcw, 
  Heart, 
  Sparkles,
  Grid3X3,
  CalendarDays,
  Moon,
  Sun
} from 'lucide-react';
import { 
  BlockDefinition, 
  Coordinate, 
  Affirmation 
} from './types';
import { 
  GRID_SIZE, 
  INITIAL_GRID, 
  generateRandomBlock, 
  AFFIRMATIONS_LIST 
} from './constants';
import { 
  canPlaceBlock, 
  placeBlockOnGrid, 
  checkClears, 
  clearGridCells,
  checkGameOver
} from './utils/gameLogic';
import { Block } from './components/Block';

export default function App() {
  // -- State --
  const [grid, setGrid] = useState(INITIAL_GRID);
  const [trayBlocks, setTrayBlocks] = useState<(BlockDefinition | null)[]>([null, null, null]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [streak, setStreak] = useState(0);
  const [darkMode, setDarkMode] = useState(false);
  
  // Mode State
  const [sudokuMode, setSudokuMode] = useState(false);
  
  // Dragging State
  const [activeBlockIdx, setActiveBlockIdx] = useState<number | null>(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [ghostPos, setGhostPos] = useState<Coordinate | null>(null);
  const [dragValidity, setDragValidity] = useState<'valid' | 'invalid' | null>(null);
  
  // Visual Effects State
  const [affirmations, setAffirmations] = useState<Affirmation[]>([]);
  const [comboCount, setComboCount] = useState(0);
  
  // Refs
  const gridRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // -- Initialization --
  useEffect(() => {
    // 1. Load Local Storage Data
    const savedScore = localStorage.getItem('lovelyBlastHighScore');
    if (savedScore) setHighScore(parseInt(savedScore, 10));
    
    // Dark Mode
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        setDarkMode(true);
        document.documentElement.classList.add('dark');
    }

    // 2. Streak Logic
    const lastPlayDate = localStorage.getItem('lastPlayDate');
    const savedStreak = parseInt(localStorage.getItem('streak') || '0', 10);
    const today = new Date().toDateString();

    if (lastPlayDate !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastPlayDate === yesterday.toDateString()) {
            const newStreak = savedStreak + 1;
            setStreak(newStreak);
            localStorage.setItem('streak', newStreak.toString());
        } else {
            setStreak(1);
            localStorage.setItem('streak', '1');
        }
        localStorage.setItem('lastPlayDate', today);
    } else {
        setStreak(savedStreak);
    }

    // 3. Fill Tray
    fillTray();
  }, []);

  // Persist High Score
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('lovelyBlastHighScore', score.toString());
    }
  }, [score, highScore]);

  const toggleDarkMode = () => {
      const newMode = !darkMode;
      setDarkMode(newMode);
      if (newMode) {
          document.documentElement.classList.add('dark');
          localStorage.setItem('theme', 'dark');
      } else {
          document.documentElement.classList.remove('dark');
          localStorage.setItem('theme', 'light');
      }
  };

  const fillTray = () => {
    const newBlocks = [generateRandomBlock(), generateRandomBlock(), generateRandomBlock()];
    setTrayBlocks(newBlocks);
  };

  const resetGame = () => {
    setGrid(INITIAL_GRID.map(row => row.map(c => ({...c}))));
    setScore(0);
    setGameOver(false);
    setComboCount(0);
    fillTray();
    setAffirmations([]);
  };

  const toggleSudokuMode = () => {
      setSudokuMode(!sudokuMode);
      resetGame();
  };

  // -- Logic Helpers --
  const getGridPosition = (clientX: number, clientY: number, block: BlockDefinition): Coordinate | null => {
    if (!gridRef.current) return null;
    const rect = gridRef.current.getBoundingClientRect();
    
    const padding = 20; 
    if (
      clientX < rect.left - padding || 
      clientX > rect.right + padding || 
      clientY < rect.top - padding || 
      clientY > rect.bottom + padding
    ) {
      return null;
    }

    const cellSize = rect.width / GRID_SIZE;
    const blockWidth = block.shape[0].length * cellSize;
    const blockHeight = block.shape.length * cellSize;
    
    const relativeX = clientX - rect.left - (blockWidth / 2) + (cellSize / 2);
    const relativeY = clientY - rect.top - (blockHeight / 2) + (cellSize / 2);

    const c = Math.round(relativeX / cellSize);
    const r = Math.round(relativeY / cellSize);

    return { r, c };
  };

  // -- Event Handlers --
  const handlePointerDown = (e: React.PointerEvent, idx: number) => {
    if (gameOver) return;
    const block = trayBlocks[idx];
    if (!block) return;

    e.preventDefault();
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
    
    setActiveBlockIdx(idx);
    setDragPos({ x: e.clientX, y: e.clientY });
    setDragValidity(null);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (activeBlockIdx === null) return;
    e.preventDefault();

    setDragPos({ x: e.clientX, y: e.clientY });

    const block = trayBlocks[activeBlockIdx];
    if (block) {
      const gridPos = getGridPosition(e.clientX, e.clientY, block);
      if (gridPos) {
          const isValid = canPlaceBlock(grid, block, gridPos.r, gridPos.c, sudokuMode);
          if (isValid) {
            setGhostPos(gridPos);
            setDragValidity('valid');
          } else {
            setGhostPos(null);
            setDragValidity('invalid');
          }
      } else {
        setGhostPos(null);
        setDragValidity(null); // Reset when outside grid
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (activeBlockIdx === null) return;
    e.preventDefault();
    
    const block = trayBlocks[activeBlockIdx];
    
    if (block && ghostPos) {
      // Place block
      const newGrid = placeBlockOnGrid(grid, block, ghostPos.r, ghostPos.c);
      
      // Check clears
      const clears = checkClears(newGrid);
      const totalCleared = clears.rowsToClear.size + clears.colsToClear.size + clears.boxesToClear.length;
      
      const finalGrid = clearGridCells(newGrid, clears);
      setGrid(finalGrid);
      
      // Update Score
      const placedPoints = block.shape.flat().filter(x => x === 1).length * 10;
      let clearPoints = 0;
      
      if (totalCleared > 0) {
        // Affirmation Trigger
        const randomAffirmation = AFFIRMATIONS_LIST[Math.floor(Math.random() * AFFIRMATIONS_LIST.length)];
        const rect = gridRef.current?.getBoundingClientRect();
        const popupX = rect ? rect.width / 2 : 0;
        const popupY = rect ? rect.height / 2 : 0;
        
        const newAffirm = {
            id: Date.now(),
            text: totalCleared > 1 ? `${randomAffirmation} x${totalCleared}` : randomAffirmation,
            x: popupX,
            y: popupY
        };
        setAffirmations(prev => [...prev, newAffirm]);
        setTimeout(() => {
            setAffirmations(prev => prev.filter(a => a.id !== newAffirm.id));
        }, 2000);

        // Combo Logic
        const comboMultiplier = comboCount + 1;
        clearPoints = (totalCleared * 100) * comboMultiplier;
        setComboCount(c => c + 1);
      } else {
        setComboCount(0);
      }

      setScore(s => s + placedPoints + clearPoints);

      // Tray Logic
      const newTray = [...trayBlocks];
      newTray[activeBlockIdx] = null;
      
      if (newTray.every(b => b === null)) {
        const freshBlocks = [generateRandomBlock(), generateRandomBlock(), generateRandomBlock()];
        setTrayBlocks(freshBlocks);
      } else {
        setTrayBlocks(newTray);
        if (checkGameOver(finalGrid, newTray, sudokuMode)) {
            setGameOver(true);
        }
      }

    }

    setActiveBlockIdx(null);
    setGhostPos(null);
    setDragValidity(null);
  };

  // Re-check game over if tray refills (edge case)
  useEffect(() => {
     if (activeBlockIdx === null && !trayBlocks.every(b => b === null)) {
         if (checkGameOver(grid, trayBlocks, sudokuMode)) {
             setGameOver(true);
         }
     }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trayBlocks, grid]);

  // -- Render Helpers --
  const [cellSize, setCellSize] = useState(0);
  useEffect(() => {
    const updateSize = () => {
      if (gridRef.current) {
        setCellSize(gridRef.current.clientWidth / GRID_SIZE);
      }
    };
    window.addEventListener('resize', updateSize);
    updateSize();
    setTimeout(updateSize, 100);
    return () => window.removeEventListener('resize', updateSize);
  }, []);


  return (
    <div 
      ref={containerRef}
      className={`relative h-full flex flex-col items-center justify-between py-6 max-w-md mx-auto transition-colors duration-300 ${darkMode ? 'text-white' : 'text-slate-800'}`}
      onPointerMove={activeBlockIdx !== null ? handlePointerMove : undefined}
      onPointerUp={activeBlockIdx !== null ? handlePointerUp : undefined}
      onPointerLeave={activeBlockIdx !== null ? handlePointerUp : undefined}
    >
      
      {/* --- Header --- */}
      <div className="flex flex-col items-center w-full px-6 space-y-2">
        <div className="flex items-center justify-between w-full">
            <h1 className="text-4xl font-pacifico text-sky-500 dark:text-sky-400 drop-shadow-sm">Lovely Blast ♡</h1>
            <button 
                onClick={toggleDarkMode} 
                className="p-2 rounded-full bg-white/50 dark:bg-slate-800/50 shadow-sm border border-white/20 dark:border-slate-600 text-sky-500 dark:text-sky-300"
            >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
        </div>
        
        {/* Stats Bar */}
        <div className="flex w-full justify-between items-end">
            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-2xl p-2 flex flex-col items-center shadow-sm w-24 border border-white/20 dark:border-slate-600">
                <span className="text-[10px] text-sky-400 dark:text-sky-300 font-bold uppercase tracking-wider flex items-center gap-1">
                   <Trophy size={10} /> Best
                </span>
                <span className="font-bold text-lg text-sky-600 dark:text-sky-200">{highScore}</span>
            </div>
            
            <div className="flex-1 flex justify-center pb-2">
                 <div className="flex flex-col items-center gap-1">
                     <button 
                        onClick={toggleSudokuMode}
                        className={`
                            px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1
                            ${sudokuMode 
                                ? 'bg-pink-400 text-white shadow-md dark:bg-pink-500' 
                                : 'bg-white/50 dark:bg-slate-800/50 text-sky-400 dark:text-sky-300'
                            }
                        `}
                     >
                        <Grid3X3 size={12} />
                        {sudokuMode ? 'Sudoku ON' : 'Classic'}
                     </button>
                     <div className="flex items-center gap-1 text-pink-400 dark:text-pink-300 text-xs font-bold bg-pink-50 dark:bg-pink-900/20 px-2 py-0.5 rounded-full border border-pink-100 dark:border-pink-800">
                        <CalendarDays size={12} />
                        <span>Day {streak}</span>
                     </div>
                 </div>
            </div>

            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-2xl p-2 flex flex-col items-center shadow-sm w-24 border-2 border-sky-200 dark:border-sky-700">
                <span className="text-[10px] text-sky-400 dark:text-sky-300 font-bold uppercase tracking-wider">Score</span>
                <span className="font-extrabold text-xl text-sky-600 dark:text-sky-200">{score}</span>
            </div>
        </div>
      </div>

      {/* --- Game Board --- */}
      <div className="w-full px-4 flex-1 flex items-center justify-center my-2">
        <div 
            ref={gridRef}
            className="w-full aspect-square bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl rounded-xl p-2 shadow-[0_8px_32px_rgba(31,38,135,0.1)] border border-white/50 dark:border-slate-600 grid gap-1 relative"
            style={{
                gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`
            }}
        >
          {/* Sudoku 3x3 Borders */}
          <div className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden border-2 border-sky-100 dark:border-sky-800">
             <div className="w-full h-full grid grid-cols-3 grid-rows-3">
                {[...Array(9)].map((_, i) => (
                    <div key={i} className="border border-sky-200/50 dark:border-sky-700/50" />
                ))}
             </div>
          </div>

          {/* Cells */}
          {grid.map((row, r) => 
            row.map((cell, c) => {
              let isGhost = false;
              if (activeBlockIdx !== null && ghostPos && trayBlocks[activeBlockIdx]) {
                 const shape = trayBlocks[activeBlockIdx]!.shape;
                 const localR = r - ghostPos.r;
                 const localC = c - ghostPos.c;
                 if (localR >= 0 && localR < shape.length && localC >= 0 && localC < shape[0].length) {
                    if (shape[localR][localC] === 1) isGhost = true;
                 }
              }

              return (
                <div 
                    key={`${r}-${c}`} 
                    className={`
                        rounded-sm transition-colors duration-200 relative flex items-center justify-center
                        ${cell.filled 
                            ? `${cell.color} shadow-sm border-white/20 border` 
                            : 'bg-sky-900/5 dark:bg-slate-200/5'}
                        ${isGhost ? 'bg-emerald-400/40 animate-pulse border-emerald-300/50 border-2 border-dashed' : ''}
                    `}
                >
                    {cell.filled && (
                        <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent rounded-sm" />
                    )}
                    {/* Render Sudoku Numbers if in mode */}
                    {cell.filled && sudokuMode && cell.value !== null && (
                        <span className="relative z-10 text-white font-bold text-xs drop-shadow-md">
                            {cell.value}
                        </span>
                    )}
                </div>
              );
            })
          )}
          
          {/* Affirmation Overlays */}
          {affirmations.map(aff => (
              <div 
                key={aff.id}
                className="absolute z-20 pointer-events-none animate-float-up text-center w-64"
                style={{ 
                    left: '50%', 
                    top: '40%',
                    marginLeft: '-8rem'
                }}
              >
                  <div className="font-pacifico text-3xl text-pink-500 dark:text-pink-300 drop-shadow-md flex flex-col items-center bg-white/80 dark:bg-slate-800/90 backdrop-blur-sm px-4 py-2 rounded-full border-2 border-pink-200 dark:border-pink-700">
                    <span>{aff.text}</span>
                    <Sparkles size={20} className="text-yellow-400 mt-1" />
                  </div>
              </div>
          ))}
        </div>
      </div>

      {/* --- Block Tray --- */}
      <div className="w-full px-6 mb-8 h-32">
        <div className="flex justify-between items-center h-full">
            {trayBlocks.map((block, idx) => (
                <div 
                    key={idx} 
                    className="w-1/3 flex justify-center items-center h-24 relative"
                    onPointerDown={(e) => handlePointerDown(e, idx)}
                >
                    {block && activeBlockIdx !== idx && (
                         <div className="transform transition-transform hover:scale-105 active:scale-95 touch-manipulation cursor-grab">
                             <Block shape={block.shape} color={block.color} values={sudokuMode ? block.values : undefined} cellSize={16} />
                         </div>
                    )}
                    {block && activeBlockIdx === idx && (
                        <div className="opacity-20 transform scale-90">
                            <Block shape={block.shape} color={block.color} values={sudokuMode ? block.values : undefined} cellSize={16} />
                        </div>
                    )}
                </div>
            ))}
        </div>
      </div>

      {/* --- Footer --- */}
      <div className="text-center text-sky-400/80 dark:text-sky-600/80 text-xs font-semibold pb-2">
        Made with ♡ by Kashif for his Good Girl
      </div>

      {/* --- Drag Overlay --- */}
      {activeBlockIdx !== null && trayBlocks[activeBlockIdx] && (
          <div 
            className="fixed z-50 pointer-events-none"
            style={{
                left: dragPos.x,
                top: dragPos.y,
                transform: `translate(-50%, -150%) scale(1.2)`,
            }}
          >
             <div className="drop-shadow-2xl opacity-90">
                <Block 
                    shape={trayBlocks[activeBlockIdx]!.shape} 
                    color={trayBlocks[activeBlockIdx]!.color} 
                    values={sudokuMode ? trayBlocks[activeBlockIdx]!.values : undefined}
                    cellSize={cellSize || 30}
                    validity={dragValidity}
                />
             </div>
          </div>
      )}

      {/* --- Game Over Modal --- */}
      {gameOver && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-sky-900/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-xs w-full shadow-2xl text-center transform scale-100 animate-pop border border-white/20">
                  <div className="mb-4 inline-block bg-pink-100 dark:bg-pink-900/30 p-4 rounded-full">
                    <Heart size={40} className="text-pink-500 dark:text-pink-400 fill-pink-500 animate-pulse" />
                  </div>
                  <h2 className="text-3xl font-pacifico text-sky-600 dark:text-sky-300 mb-2">Good Try Baby!</h2>
                  <p className="text-gray-500 dark:text-slate-400 mb-6 font-nunito">
                    You did amazing! Kashif is so proud of you.<br/>
                    <span className="font-bold text-sky-500 dark:text-sky-300 mt-2 block text-lg">Score: {score}</span>
                  </p>
                  
                  <button 
                    onClick={resetGame}
                    className="w-full py-3 bg-sky-400 hover:bg-sky-500 dark:bg-sky-600 dark:hover:bg-sky-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-sky-200 dark:shadow-none transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                      <RotateCcw size={20} />
                      Play Again
                  </button>
              </div>
          </div>
      )}
    </div>
  );
}