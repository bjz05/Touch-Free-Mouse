import { Point, GestureMode } from "../types";

const HISTORY_SIZE = 12; 
const SCROLL_DEAD_ZONE = 0.0005; // Extremely small deadzone, rely on adaptive smoothing instead
const LINEARITY_THRESHOLD = 0.6; 
const VERTICAL_THRESHOLD_RATIO = 0.4; 

export const calculateCentroid = (p1: {x: number, y: number}, p2: {x: number, y: number}): Point => {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
    timestamp: Date.now(),
    orientation: 'neutral' 
  };
};

export const analyzeMovement = (history: Point[]): { mode: GestureMode, deltaY: number } => {
  if (history.length < 5) return { mode: GestureMode.IDLE, deltaY: 0 };

  const recent = history.slice(-HISTORY_SIZE);
  
  // 1. STABILITY CHECKS (Use larger window)
  // Check Dominant Orientation
  let horizCount = 0;
  let vertCount = 0;
  for (const p of recent) {
    if (p.orientation === 'horizontal') horizCount++;
    if (p.orientation === 'vertical') vertCount++;
  }
  
  const total = recent.length;
  const isStableHorizontal = horizCount > total * 0.7;
  const isStableVertical = vertCount > total * 0.7;

  if (!isStableHorizontal && !isStableVertical) {
    return { mode: GestureMode.IDLE, deltaY: 0 };
  }

  // Linearity Check
  const start = recent[0];
  const end = recent[recent.length - 1];
  
  let maxDeviation = 0;
  const a = start.y - end.y;
  const b = end.x - start.x;
  const c = start.x * end.y - end.x * start.y;
  const den = Math.sqrt(a * a + b * b);
  if (den > 0) {
    for (const p of recent) {
        const dist = Math.abs(a * p.x + b * p.y + c) / den;
        if (dist > maxDeviation) maxDeviation = dist;
    }
  }

  const overallDx = end.x - start.x;
  const overallDy = end.y - start.y;
  const isVerticalMove = Math.abs(overallDy) > Math.abs(overallDx) * VERTICAL_THRESHOLD_RATIO;
  const isLinear = maxDeviation < LINEARITY_THRESHOLD;

  if (isVerticalMove && isLinear) {
      
      // 2. VELOCITY CALCULATION (Use only immediate history for responsiveness)
      // Calculate delta between the very last point and the previous point
      // This gives 1:1 feel without history lag
      const last = history[history.length - 1];
      const prev = history[history.length - 2];
      
      const dy = last.y - prev.y; // Instantaneous dy
      const absDy = Math.abs(dy);
      
      // Skip if completely still (noise gate)
      if (absDy < SCROLL_DEAD_ZONE) {
          return { mode: GestureMode.SCROLLING, deltaY: 0 };
      }

      // 3. DIRECTION ENFORCEMENT
      let allowed = false;

      // Horizontal -> Down Only (dy > 0)
      if (isStableHorizontal && dy > 0) allowed = true;
      // Vertical -> Up Only (dy < 0)
      else if (isStableVertical && dy < 0) allowed = true;

      if (allowed) {
        return { mode: GestureMode.SCROLLING, deltaY: dy };
      }
  }

  return { mode: GestureMode.IDLE, deltaY: 0 };
};