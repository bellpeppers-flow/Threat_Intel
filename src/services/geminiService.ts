import { OpenAI } from "openai";
import { Anthropic } from "@anthropic-ai/sdk";
import { GoogleGenAI, Type } from "@google/genai";
import { SecurityReport, ModelType, SecurityTool } from "../types";

export async function generateSecurityReport(
  prompt: string,
  processedFiles: any[],
  scrapedIntel: string[],
  tools: SecurityTool[],
  messageBusData: any[] = [],
  mcpData: any[] = [],
  userApiKey?: string,
  model: ModelType = 'gemini'
): Promise<SecurityReport> {
  const systemInstruction = `You are a Senior Business Intelligent Security Engineer (BISE) and Lead Threat Hunter. 
  Your task is to analyze the user's request and any attached architectural documents to provide an ELABORATED, HIGH-FIDELITY, and TECHNICAL security report.
  
  CRITICAL GUIDELINES:
  1. DO NOT provide generic summaries. Every section must be deeply technical and specific to the technologies identified.
  2. THREAT HUNTING: Include actual detection logic (e.g., KQL, Splunk SPL, Sigma rules, or Python scripts) where applicable.
  3. THREAT INTEL: Identify specific CVE IDs (e.g., CVE-2024-1234), specific Threat Actor groups (e.g., APT29, Lazarus), and detailed TTPs from the MITRE ATT&CK framework.
  4. INCIDENT RESPONSE: Provide a granular, step-by-step technical playbook, not just high-level advice.
  5. REFERENCES: You MUST provide a comprehensive list of URLs for every piece of intelligence mentioned.
  
  FORMATTING GUIDELINES:
  1. LIST INTEGRITY: Every numbered step (e.g., '1.', 'Step 1:') or bullet point MUST start on a new double-newline. Never combine multiple steps into a single paragraph.
  2. CVE ISOLATION: Every CVE mentioned (e.g., CVE-2024-XXXX) must be treated as a primary entity. You MUST use a Markdown Level 3 Header (###) for each CVE ID.
  3. SIDE HEADINGS: Use Markdown Level 3 Headers (###) for all side headings (e.g., "### Management Plane Hardening").
  4. VERTICAL SPACING: Ensure there are exactly TWO blank lines before every Level 3 Header (###) to provide clear visual separation.
  5. COMMAND BLOCK SPACING: Ensure all code/command blocks (using triple backticks) have a blank line before and after them.
  6. SEMANTIC GROUPING: Use bold text for key terms and ensure the report is highly structured.
  7. NO INLINE LISTS: Always use vertical lists.
  
  DYNAMIC ECOSYSTEM INTEGRATIONS:
  The user has configured several security tools and services. Use the data from these integrations to inform your analysis.
  
  MESSAGE BUS / EVENT STREAMING:
  If data from a message bus is provided, it was pulled in real-time by a subscriber specifically for this analysis. Use these events to identify live threats or anomalous patterns.
  
  MCP / DOCUMENTATION SERVERS:
  If data from an MCP server is provided, it contains technical documentation, security standards, or implementation guides retrieved specifically for this context. Use this documentation to ensure your recommendations are aligned with the specified technologies (e.g., Cloudflare security best practices).
  
  CRITICAL: Use the Google Search tool to find the LATEST security intelligence, including:
  1. Recent CVEs and vulnerabilities related to the technologies mentioned in the prompt or files.
  2. Threat intelligence from security blogs, dark web monitoring reports (from clear-web sources like Mandiant, CrowdStrike, BleepingComputer), and OSINT feeds.
  3. Current ransomware trends and incident response playbooks for relevant threats.
  
  USER PROMPT: ${prompt}
  
  INTEGRATED ECOSYSTEM TOOLS: ${tools.map(t => `${t.name} (Type: ${t.type})`).join(", ")}
  
  ${messageBusData.length > 0 ? `REAL-TIME MESSAGE BUS EVENTS (PULLED BY SUBSCRIBER): ${JSON.stringify(messageBusData)}` : ""}
  
  ${mcpData.length > 0 ? `MCP DOCUMENTATION CONTEXT: ${JSON.stringify(mcpData)}` : ""}
  
  FILES ATTACHED: ${processedFiles.map(f => f.name).join(", ")}
  
  ${scrapedIntel.length > 0 ? `ADDITIONAL CONTEXT: ${scrapedIntel.join("\n")}` : ""}
  
  Please provide a report in JSON format with the following structure:
  {
    "technicalOverview": "A deeply technical, elaborated executive summary of the security posture and identified risks.",
    "threatHunting": "Deeply technical, step-by-step threat hunting instructions including specific detection queries (KQL/Splunk/Sigma).",
    "threatIntelligence": "Elaborated technical intelligence including specific CVEs, actor profiles, and recent dark web chatter analysis.",
    "incidentResponse": "A comprehensive, technical incident response playbook tailored to the specific threats identified.",
    "bestPractices": "Detailed strategic and tactical security recommendations with implementation guidance.",
    "references": ["Comprehensive list of URLs used for grounding and further reading"]
  }`;

  if (model === 'gpt' || model === 'ms-copilot') {
    const apiKey = userApiKey || "";
    if (!apiKey) {
      throw new Error(`${model === 'gpt' ? 'OpenAI' : 'Security Copilot'} API Key is required. Please configure it in the sidebar.`);
    }

    const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
    
    const persona = model === 'ms-copilot' 
      ? "You are Microsoft Security Copilot. You specialize in the Microsoft Security ecosystem (Sentinel, Defender, Entra) and provide technical security analysis in JSON format."
      : "You are a Senior Business Intelligent Security Engineer. Return your response in JSON format.";

    const messages: any[] = [
      { role: "system", content: persona },
      {
        role: "user",
        content: [
          { type: "text", text: systemInstruction },
          ...processedFiles.map(f => {
            if (f.type === 'image') {
              return {
                type: "image_url",
                image_url: {
                  url: `data:${f.mimeType};base64,${f.content}`
                }
              };
            } else {
              return { type: "text", text: `File: ${f.name}\nContent: ${f.content}` };
            }
          })
        ]
      }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content || "{}";
    const data = JSON.parse(content);

    return {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      prompt,
      ...data,
      references: [...new Set([...(data.references || [])])]
    };
  }

  if (model === 'claude') {
    const apiKey = userApiKey || "";
    if (!apiKey) {
      throw new Error("Anthropic API Key is required for Claude analysis. Please configure it in the sidebar.");
    }

    const anthropic = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

    const messages: any[] = [
      {
        role: "user",
        content: [
          { type: "text", text: systemInstruction },
          ...processedFiles.map(f => {
            if (f.type === 'image') {
              return {
                type: "image",
                source: {
                  type: "base64",
                  media_type: f.mimeType,
                  data: f.content
                }
              };
            } else {
              return { type: "text", text: `File: ${f.name}\nContent: ${f.content}` };
            }
          })
        ]
      }
    ];

    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 4096,
      system: "You are a Senior Business Intelligent Security Engineer. You MUST return your response as a valid JSON object. Do not include any text outside the JSON object.",
      messages
    });

    const content = response.content[0].type === 'text' ? response.content[0].text : "{}";
    const data = JSON.parse(content);

    return {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      prompt,
      ...data,
      references: [...new Set([...(data.references || [])])]
    };
  }

  const apiKey = userApiKey || process.env.GEMINI_API_KEY || "";
  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        {
          text: systemInstruction
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
      ]
    },
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          technicalOverview: { type: Type.STRING },
          threatHunting: { type: Type.STRING },
          threatIntelligence: { type: Type.STRING },
          incidentResponse: { type: Type.STRING },
          bestPractices: { type: Type.STRING },
          references: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["technicalOverview", "threatHunting", "threatIntelligence", "incidentResponse", "bestPractices", "references"]
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
