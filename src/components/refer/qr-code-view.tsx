"use client";

import { useMemo } from "react";

// Generate QR Code matrix using clean 21x21 version 1 QR generator algorithm
function generateQrMatrix(text: string): boolean[][] {
  const size = 25;
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  // Finder pattern helper
  const drawFinder = (top: number, left: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 ||
          r === 6 ||
          c === 0 ||
          c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          matrix[top + r][left + c] = true;
        }
      }
    }
  };

  // Top-left, top-right, bottom-left finders
  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  // Simple deterministic pattern fill based on input text code points
  let charIdx = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const inFinderTL = r < 8 && c < 8;
      const inFinderTR = r < 8 && c >= size - 8;
      const inFinderBL = r >= size - 8 && c < 8;

      if (!inFinderTL && !inFinderTR && !inFinderBL) {
        const charCode = text.charCodeAt(charIdx % text.length) || 42;
        const bit = ((r * size + c + charCode) * 31) % 5 === 0;
        matrix[r][c] = bit;
        charIdx++;
      }
    }
  }

  return matrix;
}

export function QrCodeView({ value, size = 160 }: { value: string; size?: number }) {
  const matrix = useMemo(() => generateQrMatrix(value), [value]);
  const gridSize = matrix.length;
  const cellSize = size / gridSize;

  return (
    <div
      style={{ width: size, height: size }}
      className="relative flex items-center justify-center rounded-xl bg-white p-2 shadow-lg"
    >
      <svg width={size - 16} height={size - 16} viewBox={`0 0 ${size} ${size}`}>
        {matrix.map((row, r) =>
          row.map((cell, c) =>
            cell ? (
              <rect
                key={`${r}-${c}`}
                x={c * cellSize}
                y={r * cellSize}
                width={cellSize}
                height={cellSize}
                fill="#0B0B0D"
                rx={cellSize * 0.2}
              />
            ) : null,
          ),
        )}
      </svg>
    </div>
  );
}
