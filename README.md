# SosoAgent: AI-Autonomous Alpha Discovery Dashboard

A premium, professional-grade crypto intelligence dashboard built for the **SoSoValue Buildathon 2026**. SosoAgent bridges the gap between research and execution by leveraging SoSoValue's real-time market data and news feeds to drive an agentic trading workflow.

## 🚀 Vision
In the fast-moving crypto market, traders often struggle with "Analysis Paralysis." SosoAgent uses AI-driven sentiment analysis to distill complex market signals into actionable intelligence, allowing for rapid agent deployment and trade execution.

## ✨ Key Features
- **Real-time Market Intelligence**: Integrated with SoSoValue's `market-snapshot` API for live price tracking of BTC, ETH, and SOL.
- **AI Sentiment Meter**: Aggregates live news feeds via SoSoValue API to calculate a real-time "Fear & Greed" index.
- **Alpha Feed**: A dedicated section for the latest market-moving news with sentiment labeling (Bullish/Bearish).
- **Agentic Execution**: A simulated "Agent Orchestrator" terminal that visualizes the on-chain deployment process.
- **Institutional UI**: A high-performance dashboard featuring glassmorphism, responsive grid layouts, and smooth micro-animations.

## 🛠️ Technical Stack
- **Frontend**: React 19 + TypeScript
- **Bundler**: Vite 8
- **Styling**: Vanilla CSS (Premium Glassmorphism Design System)
- **API**: SoSoValue Open API (Market & News endpoints)
- **State Management**: React Hooks (UseState, UseEffect, UseCallback)

## 📊 Judging Criteria Alignment

### 1. User Value & Practical Impact
SosoAgent provides immediate value by providing a consolidated view of market health and news sentiment, reducing the time from "reading news" to "making a trade."

### 2. Functionality & Working Demo
The dashboard is fully functional with live API integrations and a simulated trading environment that includes P&L tracking and wallet connection.

### 3. Logic, Workflow & Product Design
The "Research -> Intelligence -> Execution" workflow is at the core of the design, making it a true utility for modern traders.

### 4. Data / API Integration
Uses SoSoValue's robust API infrastructure with secure proxy handling and fallback mechanisms for high reliability.

### 5. UX & Clarity
Designed with a "Terminal-First" aesthetic that provides high information density without sacrificing clarity or visual appeal.

## 🚀 Setup & Installation
1. Clone the repository.
2. Create a `.env` file and add your `VITE_SOSO_API_KEY`.
3. Run `npm install`.
4. Start the dev server: `npm run dev`.
5. Build for production: `npm run build`.

---
*Built with ❤️ for the SoSoValue Buildathon 2026.*
