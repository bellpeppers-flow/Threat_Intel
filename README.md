# BISE COMMAND - Security Intelligence Platform

BISE (Business Intelligent Security Engineer) Command is a high-fidelity security analysis platform designed for threat hunters and security engineers. It leverages Gemini AI and GPT-4o to analyze architectural documents, code, and images to provide technical security reports.

## Features
- **Multi-Model Analysis**: Toggle between Gemini 3.1 Flash and ChatGPT-4o.
- **Vision Support**: Analyze architectural diagrams, network maps, and screenshots.
- **Real-time Intelligence**: Integrated Google Search grounding for the latest CVEs and threat actor TTPs.
- **Ecosystem Integrations**: Simulated support for Message Bus (Event Streaming) and MCP (Documentation Servers).
- **Technical Playbooks**: Generates KQL/Splunk queries and step-by-step incident response guides.

## Local Development Setup

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation
1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd bise-command
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Create a `.env` file in the root directory and add your API keys:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   # Optional: OpenAI key can also be configured via the UI
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`.

## Deployment to Render.com

This app is a Full-Stack (Express + Vite) application.

1. Create a **New Web Service** on Render.
2. Connect your GitHub repository.
3. **Build Command**: `npm install && npm run build`
4. **Start Command**: `npm run start`
5. **Environment Variables**: Add `GEMINI_API_KEY` and `NODE_ENV=production`.

## Customization & Collaboration Opportunities

This platform is designed to be extensible. Here are several ways to further develop the application:

### 1. Real Integration Hub
- **SIEM/SOAR**: Replace the simulated integration slots with real API calls to Splunk, Sentinel, or MISP.
- **EDR/XDR**: Connect to CrowdStrike or Carbon Black APIs to pull live endpoint telemetry.

### 2. Advanced MCP Servers
- Implement real **Model Context Protocol (MCP)** servers to feed the AI specific internal documentation, compliance standards (SOC2, HIPAA), or private codebases.

### 3. Automated Threat Hunting
- Expand the "Execute Analysis" logic to automatically run the generated KQL/Splunk queries against your environment via API.

### 4. Dark Web Monitoring
- Integrate with services like HaveIBeenPwned or specialized Dark Web intelligence feeds to provide real-time leak detection.

### 5. Multi-Tenant Support
- Add user authentication (Firebase Auth or Auth0) to allow different teams to manage their own security contexts and reports.

---

## License
MIT

---
*Built with AI Studio Build.*
