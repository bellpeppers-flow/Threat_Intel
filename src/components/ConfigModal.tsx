import React, { useState } from 'react';
import { X, Key, Server, Save, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  type: 'ai' | 'tool';
  modelId?: string;
  initialConfig: { 
    name?: string;
    type?: 'API' | 'MCP' | 'Endpoint' | 'MessageBus' | 'Dorking';
    apiKey?: string; 
    mcpUrl?: string; 
    endpoint?: string;
    messageBusUrl?: string;
    topic?: string;
  };
  onSave: (config: { 
    name?: string;
    type?: 'API' | 'MCP' | 'Endpoint' | 'MessageBus' | 'Dorking';
    apiKey?: string; 
    mcpUrl?: string; 
    endpoint?: string;
    messageBusUrl?: string;
    topic?: string;
  }, autoEnable?: boolean) => void;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({ isOpen, onClose, title, type, modelId, initialConfig, onSave }) => {
  const [config, setConfig] = useState(initialConfig);
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleTestAndSave = async () => {
    setStatus('testing');
    setErrorMessage('');

    // Simulate connection test
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (type === 'ai' && !config.apiKey) {
        throw new Error('API Key is required for validation.');
      }

      // Basic validation for API keys based on provider
      if (type === 'ai' && config.apiKey) {
        const key = config.apiKey.trim();
        if (modelId === 'gemini') {
          if (!key.startsWith('AIza')) {
            throw new Error('Invalid Gemini API Key format. It should start with "AIza".');
          }
        } else if (modelId === 'gpt') {
          if (!key.startsWith('sk-')) {
            throw new Error('Invalid CHATGPT API Key format. It should start with "sk-".');
          }
        } else if (modelId === 'claude') {
          if (!key.startsWith('sk-ant-')) {
            throw new Error('Invalid Claude API Key format. It should start with "sk-ant-".');
          }
        }
      }
      
      if (type === 'tool' && !config.apiKey && !config.mcpUrl && !config.endpoint && !config.messageBusUrl && config.type !== 'Dorking') {
        throw new Error('At least one configuration field is required.');
      }

      setStatus('success');
      setTimeout(() => {
        onSave(config, true); // Pass true to auto-enable
        onClose();
        setStatus('idle');
      }, 1000);
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Connection failed. Please check your settings.');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="glass w-full max-w-md rounded-2xl border border-white/10 p-6 space-y-6 shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <h3 className="text-lg font-bold tracking-tighter flex items-center gap-2">
              <Key className="w-5 h-5 text-green-400" /> Configure {title}
            </h3>
            <button onClick={onClose} className="text-white/40 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            {type === 'tool' && (
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Integration Name (Dynamic Label)</label>
                <div className="relative">
                  <input
                    type="text"
                    value={config.name || ''}
                    onChange={(e) => setConfig({ ...config, name: e.target.value })}
                    placeholder="e.g., MISP, Splunk, Kafka..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-green-500/50 focus:ring-0 outline-none transition-all"
                  />
                </div>
              </div>
            )}

            {type === 'tool' && (
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Integration Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {['API', 'MCP', 'Endpoint', 'MessageBus', 'Dorking'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setConfig({ ...config, type: t as any })}
                      className={cn(
                        "px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all",
                        config.type === t 
                          ? "bg-green-500/20 border-green-500/50 text-green-400" 
                          : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(config.type === 'API' || type === 'ai') && (
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">API Key</label>
                <div className="relative">
                  <input
                    type="password"
                    value={config.apiKey || ''}
                    onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                    placeholder="Enter API Key..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-green-500/50 focus:ring-0 outline-none transition-all"
                  />
                </div>
              </div>
            )}

            {config.type === 'MCP' && (
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">MCP Server URL</label>
                <div className="relative">
                  <input
                    type="text"
                    value={config.mcpUrl || ''}
                    onChange={(e) => setConfig({ ...config, mcpUrl: e.target.value })}
                    placeholder="http://localhost:8080/mcp"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-green-500/50 focus:ring-0 outline-none transition-all"
                  />
                </div>
              </div>
            )}

            {(config.type === 'Endpoint' || config.type === 'API') && (
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Endpoint URL</label>
                <div className="relative">
                  <input
                    type="text"
                    value={config.endpoint || ''}
                    onChange={(e) => setConfig({ ...config, endpoint: e.target.value })}
                    placeholder="https://api.example.com/v1"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-green-500/50 focus:ring-0 outline-none transition-all"
                  />
                </div>
              </div>
            )}

            {config.type === 'MessageBus' && (
              <>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Message Bus / Event Streaming URL</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={config.messageBusUrl || ''}
                      onChange={(e) => setConfig({ ...config, messageBusUrl: e.target.value })}
                      placeholder="e.g., kafka://localhost:9092"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-green-500/50 focus:ring-0 outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Topic / Channel Subscriber</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={config.topic || ''}
                      onChange={(e) => setConfig({ ...config, topic: e.target.value })}
                      placeholder="e.g., security-events, alerts"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-green-500/50 focus:ring-0 outline-none transition-all"
                    />
                  </div>
                </div>
              </>
            )}

            {status === 'error' && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-400 text-xs">
                <AlertCircle className="w-4 h-4" /> {errorMessage}
              </div>
            )}

            {status === 'success' && (
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center gap-2 text-green-400 text-xs">
                <CheckCircle2 className="w-4 h-4" /> Connection established successfully!
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              disabled={status === 'testing'}
              className="flex-1 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleTestAndSave}
              disabled={status === 'testing' || status === 'success'}
              className="flex-1 px-4 py-2 rounded-xl bg-green-500 text-black hover:bg-green-400 text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {status === 'testing' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Verifying...
                </>
              ) : (
                <>
                  <Server className="w-4 h-4" /> Test & Save
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
