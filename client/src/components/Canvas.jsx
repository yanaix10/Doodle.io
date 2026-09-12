import React, { useRef, useEffect, useState, useCallback } from "react";
import { useGame } from "../context/GameContext";
import {
  Paintbrush,
  Eraser,
  PaintBucket,
  Trash2,
  Minus
} from "lucide-react";
import { sounds } from "../lib/audio";

const PALETTE = [
  "#ffffff", "#c1c1c1", "#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899",
  "#000000", "#4b5563", "#991b1b", "#c2410c", "#854d0e", "#166534", "#155e75", "#1e40af", "#581c87", "#9d174d"
];

const BRUSH_SIZES = [
  { size: 3, label: "Fine" },
  { size: 8, label: "Medium" },
  { size: 16, label: "Thick" },
  { size: 28, label: "Heavy" }
];

export function Canvas() {
  const {
    roomData,
    isDrawer,
    emitDrawStroke,
    emitFillCanvas,
    emitClearCanvas,
    canvasEvents
  } = useGame();

  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const currentStrokeRef = useRef(null);

  // Drawing tools state
  const [activeTool, setActiveTool] = useState("brush"); // 'brush' | 'eraser' | 'fill'
  const [selectedColor, setSelectedColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(8);

  // Canvas internal dimensions
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;

  // Initialize canvas with white background
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }, []);

  useEffect(() => {
    initCanvas();
  }, [initCanvas]);

  // Execute stroke on canvas
  const drawStrokeSegment = useCallback((stroke) => {
    const canvas = canvasRef.current;
    if (!canvas || !stroke || !stroke.points || stroke.points.length < 2) return;
    const ctx = canvas.getContext("2d");

    ctx.save();
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.beginPath();
    const p0 = stroke.points[0];
    ctx.moveTo(p0.x * CANVAS_WIDTH, p0.y * CANVAS_HEIGHT);

    for (let i = 1; i < stroke.points.length; i++) {
      const p = stroke.points[i];
      ctx.lineTo(p.x * CANVAS_WIDTH, p.y * CANVAS_HEIGHT);
    }
    ctx.stroke();
    ctx.restore();
  }, []);

  // HTML5 Flood Fill algorithm
  const executeFloodFill = useCallback((normX, normY, fillHex) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const startX = Math.floor(normX * CANVAS_WIDTH);
    const startY = Math.floor(normY * CANVAS_HEIGHT);

    if (startX < 0 || startX >= CANVAS_WIDTH || startY < 0 || startY >= CANVAS_HEIGHT) return;

    const imgData = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    const data = imgData.data;

    // Convert hex to RGBA
    const r = parseInt(fillHex.slice(1, 3), 16);
    const g = parseInt(fillHex.slice(3, 5), 16);
    const b = parseInt(fillHex.slice(5, 7), 16);
    const fillR = r, fillG = g, fillB = b, fillA = 255;

    const startIndex = (startY * CANVAS_WIDTH + startX) * 4;
    const targetR = data[startIndex];
    const targetG = data[startIndex + 1];
    const targetB = data[startIndex + 2];
    const targetA = data[startIndex + 3];

    // If target color matches fill color, do nothing
    if (targetR === fillR && targetG === fillG && targetB === fillB && targetA === fillA) {
      return;
    }

    const colorMatch = (idx) => {
      return (
        Math.abs(data[idx] - targetR) < 30 &&
        Math.abs(data[idx + 1] - targetG) < 30 &&
        Math.abs(data[idx + 2] - targetB) < 30 &&
        Math.abs(data[idx + 3] - targetA) < 30
      );
    };

    // Breadth-first flood fill
    const queue = [startX, startY];
    const visited = new Uint8Array(CANVAS_WIDTH * CANVAS_HEIGHT);
    visited[startY * CANVAS_WIDTH + startX] = 1;

    let head = 0;
    while (head < queue.length) {
      const cx = queue[head++];
      const cy = queue[head++];
      const idx = (cy * CANVAS_WIDTH + cx) * 4;

      data[idx] = fillR;
      data[idx + 1] = fillG;
      data[idx + 2] = fillB;
      data[idx + 3] = fillA;

      const neighbors = [
        [cx + 1, cy],
        [cx - 1, cy],
        [cx, cy + 1],
        [cx, cy - 1]
      ];

      for (let i = 0; i < 4; i++) {
        const [nx, ny] = neighbors[i];
        if (nx >= 0 && nx < CANVAS_WIDTH && ny >= 0 && ny < CANVAS_HEIGHT) {
          const nCoord = ny * CANVAS_WIDTH + nx;
          if (!visited[nCoord]) {
            visited[nCoord] = 1;
            const nIdx = nCoord * 4;
            if (colorMatch(nIdx)) {
              queue.push(nx, ny);
            }
          }
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
  }, []);

  // Sync canvas events from socket
  useEffect(() => {
    if (canvasEvents.stroke) {
      drawStrokeSegment(canvasEvents.stroke);
    }
  }, [canvasEvents.stroke, drawStrokeSegment]);

  useEffect(() => {
    if (canvasEvents.fill) {
      executeFloodFill(canvasEvents.fill.x, canvasEvents.fill.y, canvasEvents.fill.color);
    }
  }, [canvasEvents.fill, executeFloodFill]);

  useEffect(() => {
    if (canvasEvents.clear) {
      initCanvas();
    }
  }, [canvasEvents.clear, initCanvas]);

  useEffect(() => {
    if (canvasEvents.history) {
      initCanvas();
      canvasEvents.history.forEach((action) => {
        if (action.type === "stroke") drawStrokeSegment(action);
        if (action.type === "fill") executeFloodFill(action.x, action.y, action.color);
      });
    }
  }, [canvasEvents.history, initCanvas, drawStrokeSegment, executeFloodFill]);

  // Pointer event handlers for drawing
  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0]?.clientX);
    const clientY = e.clientY || (e.touches && e.touches[0]?.clientY);
    if (clientX === undefined || clientY === undefined) return null;

    const normX = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const normY = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));

    return { x: normX, y: normY };
  };

  const handlePointerDown = (e) => {
    if (!isDrawer || roomData?.gameState !== "DRAWING") return;
    const coords = getCoordinates(e);
    if (!coords) return;

    if (activeTool === "fill") {
      sounds.playPop();
      executeFloodFill(coords.x, coords.y, selectedColor);
      emitFillCanvas({
        type: "fill",
        x: coords.x,
        y: coords.y,
        color: selectedColor
      });
      return;
    }

    isDrawingRef.current = true;
    const color = activeTool === "eraser" ? "#ffffff" : selectedColor;
    const size = activeTool === "eraser" ? brushSize * 1.5 : brushSize;

    currentStrokeRef.current = {
      type: "stroke",
      color,
      size,
      points: [coords, coords]
    };

    drawStrokeSegment(currentStrokeRef.current);
  };

  const handlePointerMove = (e) => {
    if (!isDrawingRef.current || !isDrawer || roomData?.gameState !== "DRAWING") return;
    const coords = getCoordinates(e);
    if (!coords) return;

    const stroke = currentStrokeRef.current;
    if (!stroke) return;

    const lastPoint = stroke.points[stroke.points.length - 1];
    // Throttle slight movements
    const distSq = Math.pow(coords.x - lastPoint.x, 2) + Math.pow(coords.y - lastPoint.y, 2);
    if (distSq < 0.000004) return;

    const segment = {
      type: "stroke",
      color: stroke.color,
      size: stroke.size,
      points: [lastPoint, coords]
    };

    drawStrokeSegment(segment);
    emitDrawStroke(segment);

    stroke.points.push(coords);
  };

  const handlePointerUp = () => {
    isDrawingRef.current = false;
    currentStrokeRef.current = null;
  };

  const handleClear = () => {
    if (!isDrawer || roomData?.gameState !== "DRAWING") return;
    sounds.playPop();
    initCanvas();
    emitClearCanvas();
  };

  const canDraw = isDrawer && roomData?.gameState === "DRAWING";

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-w-0 max-w-4xl mx-auto w-full">
      {/* Canvas Container */}
      <div className="relative w-full bg-white rounded-2xl shadow-lg border-2 border-slate-200 overflow-hidden aspect-[4/3] max-h-[560px] flex items-center justify-center select-none">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
          className={`w-full h-full block touch-none ${
            canDraw
              ? activeTool === "fill"
                ? "cursor-crosshair"
                : activeTool === "eraser"
                ? "cursor-cell"
                : "cursor-crosshair"
              : "cursor-default"
          }`}
        />

        {/* Overlay if not drawing state */}
        {roomData?.gameState === "LOBBY" && (
          <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[1px] flex flex-col items-center justify-center text-slate-500">
            <span className="text-xl font-black">Game has not started yet</span>
            <span className="text-sm font-semibold">Join in or wait for the host to start!</span>
          </div>
        )}

        {roomData?.gameState === "CHOOSING_WORD" && !isDrawer && (
          <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[1px] flex flex-col items-center justify-center text-slate-600 animate-pulse">
            <span className="text-2xl font-black">
              {roomData.currentDrawer?.name || "Drawer"} is choosing a word...
            </span>
          </div>
        )}
      </div>

      {/* Drawer Toolbar */}
      {canDraw && (
        <div className="w-full mt-3 bg-white rounded-2xl shadow-lg border-2 border-slate-200 p-2.5 flex flex-wrap items-center justify-between gap-3 animate-in fade-in select-none">
          {/* Active color preview swatch */}
          <div className="flex items-center gap-2">
            <div
              className="w-10 h-10 rounded-xl border-2 border-slate-300 shadow-inner shrink-0"
              style={{
                backgroundColor: activeTool === "eraser" ? "#ffffff" : selectedColor
              }}
              title="Active Color"
            />

            {/* Tool Selection */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1">
              <button
                onClick={() => {
                  sounds.playPop();
                  setActiveTool("brush");
                }}
                className={`p-2 rounded-lg transition-all ${
                  activeTool === "brush"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
                }`}
                title="Brush"
              >
                <Paintbrush className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  sounds.playPop();
                  setActiveTool("fill");
                }}
                className={`p-2 rounded-lg transition-all ${
                  activeTool === "fill"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
                }`}
                title="Fill Bucket"
              >
                <PaintBucket className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  sounds.playPop();
                  setActiveTool("eraser");
                }}
                className={`p-2 rounded-lg transition-all ${
                  activeTool === "eraser"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
                }`}
                title="Eraser"
              >
                <Eraser className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Color Palette (2 Rows) */}
          <div className="grid grid-rows-2 grid-flow-col gap-1">
            {PALETTE.map((color) => (
              <button
                key={color}
                onClick={() => {
                  sounds.playPop();
                  setSelectedColor(color);
                  if (activeTool === "eraser") setActiveTool("brush");
                }}
                className={`w-6 h-6 rounded-md border border-slate-300/80 transition-transform active:scale-90 ${
                  selectedColor === color && activeTool !== "eraser"
                    ? "ring-2 ring-indigo-500 scale-110 z-10"
                    : "hover:scale-105"
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>

          {/* Brush Sizes */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            {BRUSH_SIZES.map((b) => (
              <button
                key={b.size}
                onClick={() => {
                  sounds.playPop();
                  setBrushSize(b.size);
                }}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                  brushSize === b.size
                    ? "bg-white text-indigo-600 shadow-xs ring-1 ring-slate-200"
                    : "text-slate-400 hover:text-slate-700 hover:bg-slate-200"
                }`}
                title={`${b.label} (${b.size}px)`}
              >
                <div
                  className="rounded-full bg-current"
                  style={{ width: Math.min(22, b.size + 4), height: Math.min(22, b.size + 4) }}
                />
              </button>
            ))}
          </div>

          {/* Clear Canvas */}
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 px-3 py-2 rounded-xl transition-colors active:scale-95 shadow-xs"
            title="Clear Canvas"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>
      )}
    </div>
  );
}
