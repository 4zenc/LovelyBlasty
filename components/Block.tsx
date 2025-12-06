import React from 'react';
import { BlockShape } from '../types';

interface BlockProps {
  shape: BlockShape;
  color: string;
  values?: (number | null)[][];
  cellSize?: number;
  className?: string;
  isGhost?: boolean;
}

export const Block: React.FC<BlockProps> = ({ shape, color, values, cellSize = 20, className = "", isGhost = false }) => {
  const rows = shape.length;
  const cols = shape[0].length;

  return (
    <div 
      className={`grid gap-px ${className}`}
      style={{
        display: 'grid',
        gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
        gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
      }}
    >
      {shape.map((row, r) => (
        row.map((cell, c) => {
          const val = values ? values[r][c] : null;
          return (
            <div key={`${r}-${c}`} className="w-full h-full flex justify-center items-center">
              {cell === 1 && (
                <div 
                  className={`
                    w-full h-full rounded-md shadow-sm border border-white/20
                    ${isGhost ? 'bg-gray-400 opacity-40' : color}
                    ${!isGhost && 'shadow-[inset_0_2px_4px_rgba(255,255,255,0.4)]'}
                    flex items-center justify-center
                  `}
                  style={{
                      width: `${cellSize - 2}px`,
                      height: `${cellSize - 2}px`
                  }}
                >
                    {val !== null && !isGhost && (
                        <span className="text-white font-bold text-[10px] drop-shadow-md">
                            {val}
                        </span>
                    )}
                </div>
              )}
            </div>
          );
        })
      ))}
    </div>
  );
};