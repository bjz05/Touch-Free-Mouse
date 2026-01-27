import { GoogleGenAI, Type } from "@google/genai";
import { Point } from "../types";

// Helper to get the AI client
const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found in environment");
  return new GoogleGenAI({ apiKey });
};

export const analyzeTrajectory = async (points: Point[]): Promise<string> => {
  try {
    const ai = getAiClient();
    
    // Normalize points for the model
    const trajectoryData = points.map(p => ({ x: p.x.toFixed(3), y: p.y.toFixed(3), t: p.timestamp }));
    const jsonStr = JSON.stringify(trajectoryData.slice(-30)); // Last 30 points

    const prompt = `
      You are a computer vision expert analyzing hand tracking data for a gesture control app.
      
      The user is trying to perform one of two gestures:
      1. "Vertical Scroll": Moving two fingers vertically in a straight line.
      2. "Reset Arc": Moving fingers in a semi-circle to the left to reset position without scrolling.

      Here is the recent trajectory data (x, y normalized 0-1, t in ms):
      ${jsonStr}

      Analyze this movement. Is it a clean vertical line? Is it a reset arc? Is it jittery?
      Provide a concise, helpful tip to the user in 1-2 sentences. 
      If it looks like a good vertical scroll, say "Good vertical control.".
      If it looks like a reset, say "Reset detected.".
      If it's messy, explain why.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "Could not analyze gesture.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "AI is currently unavailable. Please check your API key.";
  }
};

export const askAssistant = async (question: string): Promise<string> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a helpful assistant for a contactless gesture control app. 
      The app allows users to scroll by moving fingers vertically and reset by drawing a left semi-circle.
      User Question: ${question}
      Keep the answer short and friendly.`,
    });
    return response.text || "I couldn't generate a response.";
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "I'm having trouble connecting to the server.";
  }
};
