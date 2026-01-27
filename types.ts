export enum GestureMode {
  IDLE = 'IDLE',
  HAND_DETECTED = 'HAND_DETECTED',
  SCROLLING = 'SCROLLING',
  POINTING = 'POINTING',
  CLICKING = 'CLICKING',
  RESETTING = 'RESETTING',
  TRANSITION = 'TRANSITION'
}

export type FingerOrientation = 'horizontal' | 'vertical' | 'neutral';

export interface Point {
  x: number;
  y: number;
  timestamp: number;
  orientation: FingerOrientation;
}

export interface GestureState {
  mode: GestureMode;
  scrollDelta: number; // positive = scroll down, negative = scroll up
  confidence: number;
  message: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}