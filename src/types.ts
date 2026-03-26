export type ModelType = 'gemini' | 'claude' | 'gpt' | 'ms-copilot';

export interface AIConfig {
  apiKey?: string;
  endpoint?: string;
}

export interface SecurityTool {
  id: string;
  name: string;
  type: 'MISP' | 'SIEM' | 'Database' | 'VulnerabilityScan' | 'Other';
  config: {
    apiKey?: string;
    mcpUrl?: string;
    endpoint?: string;
  };
  enabled: boolean;
}

export interface SecurityReport {
  id: string;
  timestamp: string;
  prompt: string;
  technicalOverview: string;
  threatHunting: string;
  threatIntelligence: string;
  incidentResponse: string;
  bestPractices: string;
  references: string[];
}

export interface AnalysisRequest {
  prompt: string;
  model: ModelType;
  tools: SecurityTool[];
  files: string[]; // Base64 or IDs
}
