# GestureScroll AI 🖐️✨

> **Touch Nothing.** Experience the first zero-latency, orientation-aware scrolling engine powered by edge-based computer vision (MediaPipe) and Gemini AI.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18-cyan)
![Vite](https://img.shields.io/badge/Vite-5-purple)
![MediaPipe](https://img.shields.io/badge/MediaPipe-Vision-orange)
![Gemini](https://img.shields.io/badge/Google-Gemini_1.5-blue)

## 🌟 Overview

GestureScroll AI is a futuristic web interface that allows users to navigate content without touching their screen or mouse. It utilizes the device's webcam to track hand landmarks in real-time.

Unlike basic gesture apps, this project uses **Gemini 1.5 Flash** to analyze user intent and movement quality, providing an AI assistant that coaches you on how to improve your gesture controls.

### Key Features
*   **Vertical Scrolling**: Orientation-aware scrolling (Vertical hand vs Horizontal hand).
*   **"Air Click"**: Detects Z-axis depth movement (finger push) to click elements.
*   **Gemini Assistant**: An embedded AI chat panel that analyzes your movement trajectory history and gives personalized feedback.
*   **Adaptive Physics**: Dynamic smoothing algorithms to eliminate camera jitter while maintaining responsiveness.

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18 or higher)
*   A webcam
*   A Google Gemini API Key

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/gesturescroll-ai.git
    cd gesturescroll-ai
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment**
    Create a file named `.env` in the root directory. Add your Gemini API Key:
    ```env
    API_KEY=your_actual_google_api_key_here
    ```
    *Note: The `.env` file is gitignored for your security. Never commit it to GitHub.*

4.  **Run Development Server**
    ```bash
    npm run dev
    ```
    Open `http://localhost:3000` in your browser.

## 🎮 Gesture Guide

The app uses a specific "grammar" of hand movements to ensure precision.

| Action | Hand Posture | Movement |
| :--- | :--- | :--- |
| **Scroll Down** | **Sideways Hand** <br> (Thumb up, Index finger above Middle finger) | Move hand **UP** ⬆️ |
| **Scroll Up** | **Upright Hand** <br> (Peace sign / Open palm) | Move hand **DOWN** ⬇️ |
| **Cursor** | **One Finger** <br> (Index finger extended) | Move freely |
| **Click** | **One Finger** <br> (Index finger extended) | Rapidly **PUSH** forward ⏺️ |

## 🛠️ Tech Stack

*   **Frontend**: React + TypeScript + Vite + TailwindCSS
*   **Vision**: Google MediaPipe (Hand Landmarker) running on GPU.
*   **AI Logic**: Google GenAI SDK (Gemini 1.5 Flash).
*   **State**: React Hooks (useRef for high-frequency loop management).

## 🔒 Security Note

This application uses `process.env.API_KEY` to inject your Gemini API key at build time. 
*   **Do not** modify `vite.config.ts` to hardcode the key.
*   Ensure `.env` remains in your `.gitignore`.

## 📄 License

This project is licensed under the MIT License.
