import React from 'react';
import { BlockShape } from '../types';

interface BlockProps {
  shape: BlockShape;
  color: string;
  values?: (number | null)[][];
  cellSize?: number;
  className?: string;
  isGhost?: boolean;
  validity?: 'valid' | 'invalid' | null;
}

export const Block: React.FC<BlockProps> = ({ shape, color, values, cellSize = 20, className = "", isGhost = false, validity = null }) => {
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
          
          // Determine styles based on state
          let cellStyle = color;
          let extraClasses = "";
          
          if (isGhost) {
              cellStyle = "bg-emerald-400/40 border-emerald-300/50";
          } else if (validity === 'valid') {
              cellStyle = "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)] border-emerald-200";
          } else if (validity === 'invalid') {
              cellStyle = "bg-red-500/50 grayscale opacity-80 border-red-200";
          }

          return (
            <div key={`${r}-${c}`} className="w-full h-full flex justify-center items-center">
              {cell === 1 && (
                <div 
                  className={`
                    w-full h-full rounded-md transition-all duration-200
                    ${isGhost ? 'border-2 border-dashed' : 'shadow-sm border border-white/20'}
                    ${cellStyle}
                    ${!isGhost && validity !== 'invalid' && 'shadow-[inset_0_2px_4px_rgba(255,255,255,0.4)]'}
                    flex items-center justify-center
                    ${extraClasses}
                  `}
                  style={{
                      width: `${cellSize - 2}px`,
                      height: `${cellSize - 2}px`
                  }}
                >
                    {val !== null && !isGhost && validity !== 'invalid' && (
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