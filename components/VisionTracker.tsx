import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/+esm";
import { calculateCentroid, analyzeMovement } from '../utils/geometry';
import { Point, GestureMode, FingerOrientation } from '../types';

interface VisionTrackerProps {
  onScroll: (delta: number) => void;
  onGestureChange: (mode: GestureMode) => void;
  onHistoryUpdate: (points: Point[]) => void;
  onCursorMove: (x: number, y: number) => void;
  onClick: () => void;
}

// Adaptive Smoothing Settings
const MIN_ALPHA = 0.08;
const MAX_ALPHA = 0.6;
const SPEED_THRESHOLD_LOW = 0.002;
const SPEED_THRESHOLD_HIGH = 0.03;

const GESTURE_WARMUP_MS = 400; 
const ORIENTATION_BUFFER_MS = 500; 

// Click thresholds
const CLICK_Z_THRESHOLD = -0.06; // Significant forward movement in normalized Z space
const CLICK_COOLDOWN_MS = 1000;

const getDist = (landmarks: any[], i: number, j: number) => {
  const dx = landmarks[i].x - landmarks[j].x;
  const dy = landmarks[i].y - landmarks[j].y;
  return Math.sqrt(dx*dx + dy*dy);
};

const isScrollGesture = (landmarks: any[]): boolean => {
  const isIndexExtended = getDist(landmarks, 0, 8) > getDist(landmarks, 0, 5) * 1.1;
  const isMiddleExtended = getDist(landmarks, 0, 12) > getDist(landmarks, 0, 9) * 1.1;
  return isIndexExtended && isMiddleExtended;
};

const isPointingGesture = (landmarks: any[]): boolean => {
  const isIndexExtended = getDist(landmarks, 0, 8) > getDist(landmarks, 0, 5) * 1.2;
  const isMiddleCurled = getDist(landmarks, 0, 12) < getDist(landmarks, 0, 9) * 1.1; // Middle tip close to knuckle
  const isRingCurled = getDist(landmarks, 0, 16) < getDist(landmarks, 0, 13) * 1.1;
  
  return isIndexExtended && isMiddleCurled && isRingCurled;
};

const determineOrientation = (p1: {x: number, y: number}, p2: {x: number, y: number}): FingerOrientation => {
  const dx = Math.abs(p1.x - p2.x);
  const dy = Math.abs(p1.y - p2.y);
  
  if (dx > dy * 1.2) return 'horizontal';
  if (dy > dx * 1.2) return 'vertical';
  return 'neutral';
};

const VisionTracker: React.FC<VisionTrackerProps> = ({ 
  onScroll, 
  onGestureChange, 
  onHistoryUpdate,
  onCursorMove,
  onClick
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Refs for callbacks to ensure stability in the effect dependency array
  const onScrollRef = useRef(onScroll);
  const onGestureChangeRef = useRef(onGestureChange);
  const onHistoryUpdateRef = useRef(onHistoryUpdate);
  const onCursorMoveRef = useRef(onCursorMove);
  const onClickRef = useRef(onClick);

  // Update refs when props change
  useEffect(() => {
    onScrollRef.current = onScroll;
    onGestureChangeRef.current = onGestureChange;
    onHistoryUpdateRef.current = onHistoryUpdate;
    onCursorMoveRef.current = onCursorMove;
    onClickRef.current = onClick;
  }, [onScroll, onGestureChange, onHistoryUpdate, onCursorMove, onClick]);

  const historyRef = useRef<Point[]>([]);
  const lastProcessRef = useRef<number>(0);
  const gestureStartTimeRef = useRef<number>(0);
  const smoothedCentroidRef = useRef<Point | null>(null);
  const smoothedCursorRef = useRef<{x: number, y: number} | null>(null);
  
  const lastStableOrientationRef = useRef<FingerOrientation>('neutral');
  const transitionStartTimeRef = useRef<number>(0);

  // Click detection refs
  const lastClickTimeRef = useRef<number>(0);
  const zHistoryRef = useRef<number[]>([]);

  useEffect(() => {
    let handLandmarker: HandLandmarker | null = null;
    let animationFrameId: number;

    const setup = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.addEventListener('loadeddata', predictWebcam);
        }
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError("Failed to load camera or model. Please allow camera permissions.");
        setLoading(false);
      }
    };

    const predictWebcam = () => {
      if (!handLandmarker || !videoRef.current || !canvasRef.current) return;
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return;

      // Safe check for video dimensions
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        animationFrameId = requestAnimationFrame(predictWebcam);
        return;
      }

      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      const startTimeMs = performance.now();
      
      try {
        if (lastProcessRef.current !== video.currentTime) {
          lastProcessRef.current = video.currentTime;
          const result = handLandmarker.detectForVideo(video, startTimeMs);

          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.save();
          ctx.scale(-1, 1);
          ctx.translate(-canvas.width, 0);

          if (result.landmarks && result.landmarks.length > 0) {
            const landmarks = result.landmarks[0];
            
            // ---------------------------------------------------------
            // GESTURE 1: SCROLL (Two Fingers)
            // ---------------------------------------------------------
            if (isScrollGesture(landmarks)) {
              // Reset pointing state
              smoothedCursorRef.current = null;
              zHistoryRef.current = [];

              if (gestureStartTimeRef.current === 0) {
                gestureStartTimeRef.current = performance.now();
                historyRef.current = []; 
                smoothedCentroidRef.current = null;
              }
              const timeSinceStart = performance.now() - gestureStartTimeRef.current;
              const isWarmingUp = timeSinceStart < GESTURE_WARMUP_MS;

              const indexTip = landmarks[8];
              const middleTip = landmarks[12];
              const currentOrientation = determineOrientation(indexTip, middleTip);
              
              if (currentOrientation !== 'neutral' && 
                  currentOrientation !== lastStableOrientationRef.current) {
                if (lastStableOrientationRef.current !== 'neutral') {
                  transitionStartTimeRef.current = performance.now();
                }
                lastStableOrientationRef.current = currentOrientation;
              }

              const isInTransition = (performance.now() - transitionStartTimeRef.current) < ORIENTATION_BUFFER_MS;

              // Visuals
              let pointColor = '#60A5FA'; 
              if (isWarmingUp) pointColor = '#FACC15'; 
              if (isInTransition) pointColor = '#F472B6'; 
              if (currentOrientation === 'horizontal') pointColor = '#A78BFA'; 
              if (currentOrientation === 'vertical') pointColor = '#34D399'; 

              ctx.fillStyle = pointColor;
              [indexTip, middleTip].forEach(p => {
                 ctx.beginPath();
                 ctx.arc(p.x * canvas.width, p.y * canvas.height, 8, 0, 2 * Math.PI);
                 ctx.fill();
              });

              if (!isWarmingUp && !isInTransition) {
                  const rawCentroid = calculateCentroid(
                    {x: indexTip.x, y: indexTip.y}, 
                    {x: middleTip.x, y: middleTip.y}
                  );
                  rawCentroid.orientation = currentOrientation;

                  // Smoothing
                  let centroid = rawCentroid;
                  if (smoothedCentroidRef.current) {
                    const prev = smoothedCentroidRef.current;
                    const dx = rawCentroid.x - prev.x;
                    const dy = rawCentroid.y - prev.y;
                    const dist = Math.sqrt(dx*dx + dy*dy);
                    
                    let alpha = MIN_ALPHA;
                    if (dist > SPEED_THRESHOLD_HIGH) {
                      alpha = MAX_ALPHA;
                    } else if (dist > SPEED_THRESHOLD_LOW) {
                       const t = (dist - SPEED_THRESHOLD_LOW) / (SPEED_THRESHOLD_HIGH - SPEED_THRESHOLD_LOW);
                       alpha = MIN_ALPHA + t * (MAX_ALPHA - MIN_ALPHA);
                    }

                    centroid = {
                      x: prev.x + (rawCentroid.x - prev.x) * alpha,
                      y: prev.y + (rawCentroid.y - prev.y) * alpha,
                      timestamp: rawCentroid.timestamp,
                      orientation: currentOrientation 
                    };
                  }
                  smoothedCentroidRef.current = centroid;

                  historyRef.current = [...historyRef.current, centroid].slice(-50);
                  onHistoryUpdateRef.current(historyRef.current);

                  const analysis = analyzeMovement(historyRef.current);
                  onGestureChangeRef.current(analysis.mode);

                  if (analysis.mode === GestureMode.SCROLLING) {
                     ctx.strokeStyle = '#4ADE80';
                     onScrollRef.current(analysis.deltaY);
                  } else {
                     ctx.strokeStyle = '#94A3B8';
                  }
                  
                  // Draw Trail
                  ctx.beginPath();
                  ctx.lineWidth = 4;
                  if (historyRef.current.length > 1) {
                    const first = historyRef.current[0];
                    ctx.moveTo(first.x * canvas.width, first.y * canvas.height);
                    for (const p of historyRef.current) {
                      ctx.lineTo(p.x * canvas.width, p.y * canvas.height);
                    }
                  }
                  ctx.stroke();
              } else {
                  // Warming up visuals
                  const cx = (indexTip.x + middleTip.x) / 2 * canvas.width;
                  const cy = (indexTip.y + middleTip.y) / 2 * canvas.height;
                  ctx.beginPath();
                  ctx.arc(cx, cy, 25, 0, 2 * Math.PI);
                  ctx.strokeStyle = isInTransition ? 'rgba(244, 114, 182, 0.8)' : 'rgba(250, 204, 21, 0.5)';
                  ctx.lineWidth = 3;
                  ctx.setLineDash([5, 5]);
                  ctx.stroke();
                  ctx.setLineDash([]);
                  onGestureChangeRef.current(isInTransition ? GestureMode.TRANSITION : GestureMode.IDLE);
              }
            
            // ---------------------------------------------------------
            // GESTURE 2: POINTING / CLICK (One Finger)
            // ---------------------------------------------------------
            } else if (isPointingGesture(landmarks)) {
              // Reset scrolling state
              historyRef.current = [];
              smoothedCentroidRef.current = null;
              gestureStartTimeRef.current = 0;

              const indexTip = landmarks[8];

              // 1. Cursor Smoothing
              let cursorX = indexTip.x;
              let cursorY = indexTip.y;

              if (smoothedCursorRef.current) {
                  const prev = smoothedCursorRef.current;
                  const dx = cursorX - prev.x;
                  const dy = cursorY - prev.y;
                  const dist = Math.sqrt(dx*dx + dy*dy);
                  
                  // Adaptive Alpha for Cursor
                  let alpha = 0.2; // Base responsiveness
                  if (dist > 0.05) alpha = 0.8; // Fast movement
                  else if (dist < 0.005) alpha = 0.1; // Fine control

                  cursorX = prev.x + (cursorX - prev.x) * alpha;
                  cursorY = prev.y + (cursorY - prev.y) * alpha;
              }
              smoothedCursorRef.current = { x: cursorX, y: cursorY };

              // Emit cursor position (Normalized 0-1)
              onCursorMoveRef.current(1 - cursorX, cursorY);
              
              // 2. Click Detection (Z-Axis Push)
              const currentZ = indexTip.z; // Relative depth
              zHistoryRef.current.push(currentZ);
              if (zHistoryRef.current.length > 5) zHistoryRef.current.shift();

              let isClicking = false;
              // Check for rapid forward movement
              if (zHistoryRef.current.length >= 3) {
                  const startZ = zHistoryRef.current[0];
                  const endZ = zHistoryRef.current[zHistoryRef.current.length - 1];
                  const deltaZ = endZ - startZ;

                  if (deltaZ < CLICK_Z_THRESHOLD && (performance.now() - lastClickTimeRef.current > CLICK_COOLDOWN_MS)) {
                      isClicking = true;
                      lastClickTimeRef.current = performance.now();
                      onClickRef.current();
                      zHistoryRef.current = []; // Reset history after click
                  }
              }

              // Visuals for Pointing
              ctx.beginPath();
              ctx.arc(indexTip.x * canvas.width, indexTip.y * canvas.height, 15, 0, 2 * Math.PI);
              ctx.fillStyle = isClicking ? '#EF4444' : '#60A5FA'; 
              ctx.fill();
              ctx.strokeStyle = '#FFFFFF';
              ctx.lineWidth = 2;
              ctx.stroke();

              onGestureChangeRef.current(isClicking ? GestureMode.CLICKING : GestureMode.POINTING);

            } else {
              // Hand detected, but not a valid gesture
              onGestureChangeRef.current(GestureMode.HAND_DETECTED);
              historyRef.current = [];
              smoothedCentroidRef.current = null;
              smoothedCursorRef.current = null;
              gestureStartTimeRef.current = 0; 
              zHistoryRef.current = [];
            }
          } else {
             // No hand detected
             onGestureChangeRef.current(GestureMode.IDLE);
             historyRef.current = [];
             smoothedCentroidRef.current = null;
             smoothedCursorRef.current = null;
             gestureStartTimeRef.current = 0; 
             zHistoryRef.current = [];
          }
          
          ctx.restore();
        }
      } catch (e) {
        console.error("Tracking Loop Error:", e);
        // Do not setError here to avoid UI flicker, just log and continue next frame
      }
      animationFrameId = requestAnimationFrame(predictWebcam);
    };

    setup();
    return () => {
      cancelAnimationFrame(animationFrameId);
      if (handLandmarker) handLandmarker.close();
      if (videoRef.current && videoRef.current.srcObject) {
         const stream = videoRef.current.srcObject as MediaStream;
         stream.getTracks().forEach(t => t.stop());
      }
    };
  }, []); // Dependencies are now empty because we use refs

  return (
    <div className="relative w-64 h-48 bg-black rounded-xl overflow-hidden shadow-2xl border border-slate-700">
      {loading && <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-xs">Loading Model...</div>}
      {error && <div className="absolute inset-0 flex items-center justify-center text-red-400 text-xs p-4 text-center">{error}</div>}
      <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" autoPlay playsInline muted style={{ transform: 'scaleX(-1)' }} />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover" />
    </div>
  );
};

export default VisionTracker;