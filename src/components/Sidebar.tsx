import React from 'react';
import { Shield, Settings, Terminal, Database, Activity, Globe, Lock, Key, X } from 'lucide-react';
import { ModelType, SecurityTool } from '../types';
import { cn } from '../lib/utils';

interface SidebarProps {
  selectedModel: ModelType;
  onModelChange: (model: ModelType) => void;
  tools: SecurityTool[];
  onConfigureAI: (model: ModelType) => void;
  onConfigureTool: (id: string) => void;
  onResetAll: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  selectedModel, 
  onModelChange, 
  tools, 
  onConfigureAI,
  onConfigureTool,
  onResetAll
}) => {
  const models: { id: ModelType; name: string; icon: any }[] = [
    { id: 'gemini', name: 'Gemini AI (Default)', icon: Shield },
    { id: 'gpt', name: 'ChatGPT-4', icon: Terminal },
    { id: 'claude', name: 'Claude 3.5', icon: Lock },
    { id: 'ms-copilot', name: 'MS Security Copilot', icon: Shield },
  ];

  return (
    <div className="w-80 h-full glass border-r border-white/10 p-6 flex flex-col gap-8 overflow-y-auto">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-green-500/20 rounded-lg">
          <Shield className="w-8 h-8 text-green-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tighter">BISE</h1>
          <p className="text-[10px] uppercase tracking-widest text-white/40">Security Intelligence</p>
        </div>
      </div>

      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-4 flex items-center gap-2">
          <Settings className="w-3 h-3" /> AI Analysis Engine
        </h2>
        <div className="space-y-2">
          {models.map((model) => (
            <div key={model.id} className="flex gap-2 group">
              <button
                onClick={() => onModelChange(model.id)}
                className={cn(
                  "flex-1 p-3 rounded-xl flex items-center gap-3 transition-all text-left",
                  selectedModel === model.id 
                    ? "bg-green-500/20 border border-green-500/30 text-green-400" 
                    : "hover:bg-white/5 border border-transparent text-white/60"
                )}
              >
                <model.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{model.name}</span>
              </button>
              <button 
                onClick={() => onConfigureAI(model.id)}
                className="p-3 rounded-xl hover:bg-white/10 text-white/20 hover:text-white transition-all"
                title="Configure API"
              >
                <Key className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="flex-1">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-4 flex items-center gap-2">
          <Database className="w-3 h-3" /> Ecosystem Tools
        </h2>
        <div className="space-y-2">
          {tools.map((tool) => (
            <div
              key={tool.id}
              className="p-3 rounded-xl border border-white/5 bg-white/5 flex flex-col gap-3 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    tool.enabled ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-white/20"
                  )} />
                  <div>
                    <p className="text-sm font-medium text-white/80">{tool.name}</p>
                    <p className="text-[10px] text-white/40">{tool.type}</p>
                  </div>
                </div>
                <div className={cn(
                  "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tighter",
                  tool.enabled ? "bg-green-500/20 text-green-400" : "bg-white/10 text-white/40"
                )}>
                  {tool.enabled ? 'Connected' : 'Disconnected'}
                </div>
              </div>
              <button 
                onClick={() => onConfigureTool(tool.id)}
                className="w-full py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white transition-all flex items-center justify-center gap-2"
              >
                <Settings className="w-3 h-3" /> Configure Integration
              </button>
            </div>
          ))}
        </div>
      </section>

      <div className="pt-6 border-t border-white/10 space-y-4">
        <button 
          onClick={onResetAll}
          className="w-full py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-[10px] font-bold uppercase tracking-widest text-red-400 border border-red-500/20 transition-all flex items-center justify-center gap-2"
        >
          <X className="w-3 h-3" /> Reset All Connections
        </button>

        <div className="flex items-center gap-2 text-[10px] text-white/30 uppercase tracking-widest">
          <Globe className="w-3 h-3" /> Global Intel Feed
        </div>
        <div className="mt-3 space-y-2">
          <div className="p-2 rounded bg-white/5 border border-white/5">
            <p className="text-[10px] text-white/60 leading-tight">
              <span className="text-red-400 font-bold">CRITICAL:</span> Zero-day exploit targeting Kubernetes clusters observed in dark web forums.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

