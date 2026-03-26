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

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        text: `You are a Business Intelligent Security Engineer (BISE). 
        Your task is to analyze the user's request and any attached architectural documents to provide a high-fidelity security report.
        
        CRITICAL: Use the Google Search tool to find the LATEST security intelligence, including:
        1. Recent CVEs and vulnerabilities related to the technologies mentioned in the prompt or files.
        2. Threat intelligence from security blogs, dark web monitoring reports (from clear-web sources like Mandiant, CrowdStrike, BleepingComputer), and OSINT feeds.
        3. Current ransomware trends and incident response playbooks for relevant threats.
        
        USER PROMPT: ${prompt}
        
        INTEGRATED ECOSYSTEM TOOLS: ${tools.map(t => `${t.name} (${t.type})`).join(", ")}
        
        FILES ATTACHED: ${processedFiles.map(f => f.name).join(", ")}
        
        ${scrapedIntel.length > 0 ? `ADDITIONAL CONTEXT: ${scrapedIntel.join("\n")}` : ""}
        
        Please provide a report in JSON format with the following structure:
        {
          "threatHunting": "Step-by-step technical threat hunting instructions based on current TTPs.",
          "threatIntelligence": "Latest relevant intel, including specific CVEs, actor groups, and dark web chatter summaries.",
          "incidentResponse": "A detailed playbook specifically tailored to the identified threats.",
          "bestPractices": "Strategic and tactical security recommendations.",
          "references": ["List of URLs used for grounding and further reading"]
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
      tools: [{ googleSearch: {} }],
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

  const data = JSON.parse(response.text || "{}");
  
  // Extract grounding URLs if available
  const groundingUrls = response.candidates?.[0]?.groundingMetadata?.groundingChunks
    ?.map(chunk => chunk.web?.uri)
    .filter((uri): uri is string => !!uri) || [];

  return {
    id: Math.random().toString(36).substr(2, 9),
    timestamp: new Date().toISOString(),
    prompt,
    ...data,
    references: [...new Set([...(data.references || []), ...groundingUrls])]
  };
}
