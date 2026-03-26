import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { AnalysisForm } from './components/AnalysisForm';
import { ReportView } from './components/ReportView';
import { ConfigModal } from './components/ConfigModal';
import { ModelType, SecurityTool, SecurityReport, AIConfig } from './types';
import { generateSecurityReport } from './services/geminiService';
import { Shield, Activity, Globe, Lock, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const INITIAL_TOOLS: SecurityTool[] = [
  { id: '1', name: 'MISP Instance', type: 'MISP', config: {}, enabled: true },
  { id: '2', name: 'Splunk SIEM', type: 'SIEM', config: {}, enabled: false },
  { id: '3', name: 'Vulnerability DB', type: 'Database', config: {}, enabled: true },
  { id: '4', name: 'Nessus Scans', type: 'VulnerabilityScan', config: {}, enabled: false },
];

export default function App() {
  const [selectedModel, setSelectedModel] = useState<ModelType>('gemini');
  const [tools, setTools] = useState<SecurityTool[]>(() => {
    const saved = localStorage.getItem('bise_tools');
    return saved ? JSON.parse(saved) : INITIAL_TOOLS;
  });
  const [aiConfigs, setAiConfigs] = useState<Record<ModelType, AIConfig>>(() => {
    const saved = localStorage.getItem('bise_ai_configs');
    return saved ? JSON.parse(saved) : {};
  });
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState<SecurityReport | null>(null);
  
  const [configModal, setConfigModal] = useState<{
    isOpen: boolean;
    type: 'ai' | 'tool';
    id: string;
    title: string;
  }>({ isOpen: false, type: 'ai', id: '', title: '' });

  useEffect(() => {
    localStorage.setItem('bise_tools', JSON.stringify(tools));
  }, [tools]);

  useEffect(() => {
    localStorage.setItem('bise_ai_configs', JSON.stringify(aiConfigs));
  }, [aiConfigs]);

  const handleToggleTool = (id: string) => {
    setTools(tools.map(t => t.id === id ? { ...t, enabled: !t.enabled } : t));
  };

  const handleConfigureAI = (model: ModelType) => {
    setConfigModal({
      isOpen: true,
      type: 'ai',
      id: model,
      title: model.toUpperCase()
    });
  };

  const handleConfigureTool = (id: string) => {
    const tool = tools.find(t => t.id === id);
    if (tool) {
      setConfigModal({
        isOpen: true,
        type: 'tool',
        id: id,
        title: tool.name
      });
    }
  };

  const handleSaveConfig = (config: any, autoEnable?: boolean) => {
    if (configModal.type === 'ai') {
      setAiConfigs({ ...aiConfigs, [configModal.id]: config });
    } else {
      setTools(tools.map(t => t.id === configModal.id ? { ...t, config, enabled: autoEnable ? true : t.enabled } : t));
    }
  };

  const handleAnalyze = async (prompt: string, files: File[]) => {
    setIsAnalyzing(true);
    setReport(null);

    try {
      const formData = new FormData();
      formData.append('prompt', prompt);
      formData.append('model', selectedModel);
      formData.append('tools', JSON.stringify(tools.filter(t => t.enabled)));
      files.forEach(file => formData.append('files', file));

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Analysis failed');

      const data = await response.json();
      
      // Use user-provided API key if available
      const userApiKey = aiConfigs[selectedModel]?.apiKey;
      
      const finalReport = await generateSecurityReport(
        prompt,
        data.processedFiles,
        data.scrapedIntel,
        tools.filter(t => t.enabled),
        userApiKey
      );

      setReport(finalReport);
    } catch (error) {
      console.error("Analysis error:", error);
      alert("Analysis failed. Please check your API key and try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#050505] text-white overflow-hidden security-grid">
      <Sidebar 
        selectedModel={selectedModel} 
        onModelChange={setSelectedModel}
        tools={tools}
        onToggleTool={handleToggleTool}
        onConfigureAI={handleConfigureAI}
        onConfigureTool={handleConfigureTool}
      />

      <main className="flex-1 overflow-y-auto relative">
        <div className="scanning-line absolute top-0 left-0 w-full pointer-events-none opacity-20" />
        
        <div className="p-8 max-w-6xl mx-auto space-y-12">
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-2xl border border-green-500/20">
                <Cpu className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-white/40">Operation Center</h2>
                <h1 className="text-3xl font-black tracking-tighter">BISE COMMAND</h1>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="glass px-4 py-2 rounded-xl flex items-center gap-3 border-white/5">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">System Online</span>
              </div>
              <div className="glass px-4 py-2 rounded-xl flex items-center gap-3 border-white/5">
                <Activity className="w-4 h-4 text-blue-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Intel Syncing</span>
              </div>
            </div>
          </header>

          <section className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-4xl font-black tracking-tighter bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">
                What are we securing today?
              </h3>
              <p className="text-white/40 text-sm max-w-xl mx-auto">
                Input your architectural query or upload security documents for deep analysis across web, deep web, and dark web intelligence.
              </p>
            </div>
            
            <AnalysisForm onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />
          </section>

          <AnimatePresence mode="wait">
            {report && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <ReportView report={report} />
              </motion.div>
            )}
          </AnimatePresence>

          {!report && !isAnalyzing && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-40">
              {[
                { icon: Globe, title: 'OSINT Scraper', desc: 'Real-time web & deep web intelligence gathering.' },
                { icon: Lock, title: 'Dark Web Monitor', desc: 'Scanning illicit forums for targeted threats.' },
                { icon: Shield, title: 'AI Synthesis', desc: 'Multi-model analysis for precise security mapping.' },
              ].map((item, i) => (
                <div key={i} className="glass p-6 rounded-2xl border-white/5 space-y-3">
                  <item.icon className="w-6 h-6 text-green-400" />
                  <h4 className="font-bold uppercase tracking-widest text-xs">{item.title}</h4>
                  <p className="text-[10px] leading-relaxed text-white/60">{item.desc}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <ConfigModal
        isOpen={configModal.isOpen}
        onClose={() => setConfigModal({ ...configModal, isOpen: false })}
        title={configModal.title}
        type={configModal.type}
        initialConfig={
          configModal.type === 'ai' 
            ? aiConfigs[configModal.id as ModelType] || {} 
            : tools.find(t => t.id === configModal.id)?.config || {}
        }
        onSave={handleSaveConfig}
      />
    </div>
  );
}
