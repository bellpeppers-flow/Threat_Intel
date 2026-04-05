import React from 'react';
import { Shield, Settings, Terminal, Database, Activity, Globe, Lock, Key, X, Zap, Cpu, Link, Share2, Plus, ExternalLink } from 'lucide-react';
import { ModelType, SecurityTool, IntelItem } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarProps {
  selectedModel: ModelType;
  onModelChange: (model: ModelType) => void;
  tools: SecurityTool[];
  onConfigureAI: (model: ModelType) => void;
  onConfigureTool: (id: string) => void;
  onResetAll: () => void;
  intelFeed: IntelItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  selectedModel, 
  onModelChange, 
  tools, 
  onConfigureAI,
  onConfigureTool,
  onResetAll,
  intelFeed
}) => {
  const models: { id: ModelType; name: string; icon: any }[] = [
    { id: 'gemini', name: 'Gemini AI (Default)', icon: Shield },
    { id: 'gpt', name: 'ChatGPT-4', icon: Terminal },
    { id: 'claude', name: 'Claude 3.5', icon: Lock },
    { id: 'ms-copilot', name: 'MS Security Copilot', icon: Shield },
  ];

  const getToolIcon = (type: string) => {
    switch (type) {
      case 'API': return Zap;
      case 'MCP': return Cpu;
      case 'Endpoint': return Link;
      case 'MessageBus': return Share2;
      default: return Database;
    }
  };

  return (
    <div className="w-80 h-full glass border-r border-white/10 p-6 flex flex-col gap-8 overflow-y-auto">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-green-500/20 rounded-lg">
          <Shield className="w-8 h-8 text-green-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tighter italic">BISE</h1>
          <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Security Intelligence</p>
        </div>
      </div>

      <section>
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 mb-4 flex items-center gap-2">
          <Settings className="w-3 h-3" /> AI Analysis Engine
        </h2>
        <div className="space-y-2">
          {models.map((model) => (
            <div key={model.id} className="flex gap-2 group">
              <button
                onClick={() => onModelChange(model.id)}
                className={cn(
                  "flex-1 p-3 rounded-xl flex items-center gap-3 transition-all text-left border",
                  selectedModel === model.id 
                    ? "bg-green-500/10 border-green-500/30 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.1)]" 
                    : "bg-white/5 border-transparent text-white/60 hover:border-white/10"
                )}
              >
                <model.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{model.name}</span>
              </button>
              <button 
                onClick={() => onConfigureAI(model.id)}
                className="p-3 rounded-xl bg-white/5 border border-transparent hover:border-white/20 text-white/20 hover:text-white transition-all"
                title="Configure API"
              >
                <Key className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="flex-1">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 flex items-center gap-2">
            <Database className="w-3 h-3" /> Integration Hub
          </h2>
          <span className="text-[10px] font-bold text-white/20 bg-white/5 px-2 py-0.5 rounded-full">
            {tools.filter(t => t.enabled).length}/10
          </span>
        </div>
        
        <div className="grid grid-cols-1 gap-2">
          {tools.filter(t => t.enabled).map((tool) => {
            const Icon = getToolIcon(tool.type);
            return (
              <div
                key={tool.id}
                className="p-3 rounded-xl border transition-all group relative bg-green-500/5 border-green-500/20"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-green-500/20 text-green-400">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold truncate max-w-[120px] text-white">
                        {tool.name}
                      </p>
                      <p className="text-[9px] uppercase tracking-tighter text-white/20 font-bold">{tool.type}</p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => onConfigureTool(tool.id)}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-white/10 hover:text-white transition-all"
                    title="Configure"
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <div className="h-1 flex-1 rounded-full overflow-hidden bg-white/5">
                    <div className="h-full transition-all duration-500 w-full bg-green-500" />
                  </div>
                  <span className="text-[8px] font-bold uppercase tracking-tighter text-green-400">
                    Active
                  </span>
                </div>
              </div>
            );
          })}

          {tools.filter(t => !t.enabled).length > 0 && (
            <button
              onClick={() => {
                const nextTool = tools.find(t => !t.enabled);
                if (nextTool) onConfigureTool(nextTool.id);
              }}
              className="p-4 rounded-xl border border-dashed border-white/10 hover:border-green-500/30 hover:bg-green-500/5 transition-all group flex flex-col items-center justify-center gap-2 text-white/20 hover:text-green-400"
            >
              <Plus className="w-5 h-5" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Add Integration</span>
            </button>
          )}
        </div>
      </section>

      <div className="pt-6 border-t border-white/10 space-y-4">
        <button 
          onClick={onResetAll}
          className="w-full py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-[10px] font-bold uppercase tracking-widest text-red-400 border border-red-500/20 transition-all flex items-center justify-center gap-2"
        >
          <X className="w-3 h-3" /> Reset & Clear Cache
        </button>

        <div className="flex items-center gap-2 text-[10px] text-white/30 uppercase tracking-widest">
          <Globe className="w-3 h-3" /> Global Intel Feed
        </div>
        
        <div className="mt-3 space-y-3">
          <AnimatePresence mode="popLayout">
            {intelFeed.length > 0 ? (
              intelFeed.map((item, idx) => (
                <motion.a
                  key={item.link || idx}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.1 }}
                  className="block p-3 rounded-xl bg-white/5 border border-white/5 hover:border-green-500/30 hover:bg-green-500/5 transition-all group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={cn(
                      "text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter",
                      item.severity === 'CRITICAL' ? "bg-red-500/20 text-red-400" :
                      item.severity === 'HIGH' ? "bg-orange-500/20 text-orange-400" :
                      "bg-blue-500/20 text-blue-400"
                    )}>
                      {item.severity}
                    </span>
                    <ExternalLink className="w-2.5 h-2.5 text-white/20 group-hover:text-green-400 transition-colors" />
                  </div>
                  <p className="text-[10px] text-white/80 font-bold leading-tight line-clamp-2 group-hover:text-white transition-colors">
                    {item.title}
                  </p>
                  <p className="text-[9px] text-white/30 mt-1 font-medium">
                    {new Date(item.pubDate).toLocaleDateString()}
                  </p>
                </motion.a>
              ))
            ) : (
              <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col items-center justify-center gap-2 opacity-40">
                <Activity className="w-4 h-4 animate-pulse" />
                <span className="text-[9px] font-bold uppercase tracking-widest">Syncing Intel...</span>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

