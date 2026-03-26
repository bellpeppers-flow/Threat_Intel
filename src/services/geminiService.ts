import { GoogleGenAI, Type } from "@google/genai";
import { SecurityReport, ModelType, SecurityTool } from "../types";

export async function generateSecurityReport(
  prompt: string,
  processedFiles: any[],
  scrapedIntel: string[],
  tools: SecurityTool[],
  userApiKey?: string
): Promise<SecurityReport> {
  const apiKey = userApiKey || process.env.GEMINI_API_KEY || "";
  const ai = new GoogleGenAI({ apiKey });

  const model = ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        text: `You are a Business Intelligent Security Engineer (BISE). 
        Analyze the following data to generate a comprehensive security report.
        
        USER PROMPT: ${prompt}
        
        SCRAPED INTEL: ${scrapedIntel.join("\n")}
        
        INTEGRATED TOOLS: ${tools.map(t => `${t.name} (${t.type})`).join(", ")}
        
        FILES ATTACHED: ${processedFiles.map(f => f.name).join(", ")}
        
        Please provide a report in JSON format with the following structure:
        {
          "threatHunting": "detailed steps",
          "threatIntelligence": "relevant intel",
          "incidentResponse": "playbook steps",
          "bestPractices": "security recommendations",
          "references": ["link1", "link2"]
        }`
      },
      ...processedFiles.map(f => {
        if (f.type === 'image') {
          return {
            inlineData: {
              data: f.content,
              mimeType: f.mimeType
            }
          };
        } else {
          return { text: `File: ${f.name}\nContent: ${f.content}` };
        }
      })
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          threatHunting: { type: Type.STRING },
          threatIntelligence: { type: Type.STRING },
          incidentResponse: { type: Type.STRING },
          bestPractices: { type: Type.STRING },
          references: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["threatHunting", "threatIntelligence", "incidentResponse", "bestPractices", "references"]
      }
    }
  });

  const response = await model;
  const data = JSON.parse(response.text || "{}");

  return {
    id: Math.random().toString(36).substr(2, 9),
    timestamp: new Date().toISOString(),
    prompt,
    ...data
  };
}
