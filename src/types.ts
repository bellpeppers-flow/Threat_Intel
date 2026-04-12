export type ModelType = 'gemini' | 'claude' | 'gpt' | 'ms-copilot';

export interface AIConfig {
  apiKey?: string;
  endpoint?: string;
}

export interface SecurityTool {
  id: string;
  name: string;
  type: 'API' | 'MCP' | 'Endpoint' | 'MessageBus' | 'Dorking';
  config: {
    apiKey?: string;
    mcpUrl?: string;
    endpoint?: string;
    messageBusUrl?: string;
    topic?: string;
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
  mitreAttack?: MitreAttackData;
}

export interface MitreAttackData {
  summary: string;
  tactics: {
    id: string;
    name: string;
    description: string;
    techniques: {
      id: string;
      name: string;
      description: string;
      evidence: string;
      mitigation: string;
      detection: string;
    }[];
  }[];
}

export interface IntelItem {
  title: string;
  link: string;
  pubDate: string;
  contentSnippet: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
}

export interface AnalysisRequest {
  prompt: string;
  model: ModelType;
  tools: SecurityTool[];
  files: string[]; // Base64 or IDs
}
