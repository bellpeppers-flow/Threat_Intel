import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { AnalysisForm } from './components/AnalysisForm';
import { ReportView } from './components/ReportView';
import { ConfigModal } from './components/ConfigModal';
import { ModelType, SecurityTool, SecurityReport, AIConfig, IntelItem } from './types';
import { generateSecurityReport } from './services/geminiService';
import { Shield, Activity, Globe, Lock, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const compressImage = async (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1920;
        const MAX_HEIGHT = 1080;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas context not available'));
        
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            reject(new Error('Canvas to Blob failed'));
          }
        }, 'image/jpeg', 0.8); // 80% quality JPEG
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

const INITIAL_TOOLS: SecurityTool[] = Array.from({ length: 10 }, (_, i) => ({
  id: `${i + 1}`,
  name: `Integration Slot ${i + 1}`,
  type: 'API',
  config: {},
  enabled: false,
}));

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedModel, setSelectedModel] = useState<ModelType>('gemini');
  const [tools, setTools] = useState<SecurityTool[]>(() => {
    const saved = localStorage.getItem('bise_tools');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Force reset if we find the old hardcoded tools
      if (parsed.some((t: any) => t.name === 'MISP Instance' || t.name === 'Splunk SIEM')) {
        console.log("Old tools detected, resetting to generic slots...");
        return INITIAL_TOOLS;
      }
      return parsed;
    }
    return INITIAL_TOOLS;
  });
  const [aiConfigs, setAiConfigs] = useState<Record<ModelType, AIConfig>>(() => {
    const saved = localStorage.getItem('bise_ai_configs');
    return saved ? JSON.parse(saved) : {};
  });
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState<SecurityReport | null>(null);
  const [intelFeed, setIntelFeed] = useState<IntelItem[]>([]);
  
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

  // Real-time Intel Feed Polling
  useEffect(() => {
    const fetchIntel = async () => {
      try {
        const response = await fetch('/api/intel-feed');
        if (response.ok) {
          const data = await response.json();
          setIntelFeed(data);
        }
      } catch (error) {
        console.error("Failed to fetch intel feed:", error);
      }
    };

    fetchIntel();
    const interval = setInterval(fetchIntel, 15 * 60 * 1000); // 15 minutes
    return () => clearInterval(interval);
  }, []);

  const handleConfigureAI = (model: ModelType) => {
    const displayNames: Record<ModelType, string> = {
      gemini: 'Gemini AI',
      gpt: 'CHATGPT',
      claude: 'Claude',
      'ms-copilot': 'MS Security Copilot'
    };

    setConfigModal({
      isOpen: true,
      type: 'ai',
      id: model,
      title: displayNames[model]
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
      setTools(tools.map(t => t.id === configModal.id ? { 
        ...t, 
        name: config.name || t.name,
        type: config.type || t.type,
        config, 
        enabled: autoEnable ? true : t.enabled 
      } : t));
    }
  };

  const handleAnalyze = async (prompt: string, files: File[]) => {
    const userApiKey = aiConfigs[selectedModel]?.apiKey;
    const defaultApiKey = process.env.GEMINI_API_KEY;

    if (!userApiKey && !defaultApiKey && selectedModel === 'gemini') {
      setReport({
        id: 'error',
        timestamp: new Date().toISOString(),
        prompt,
        technicalOverview: "Configuration required.",
        threatIntelligence: "Error: No Gemini API Key found. Please configure it in the sidebar settings (Key icon) or ensure it's set in the environment.",
        threatHunting: "Configuration required.",
        incidentResponse: "Configuration required.",
        bestPractices: "Configuration required.",
        references: []
      });
      return;
    }

    setIsAnalyzing(true);
    setReport(null);

    try {
      const formData = new FormData();
      formData.append('data', JSON.stringify({
        prompt,
        model: selectedModel,
        tools: tools.filter(t => t.enabled)
      }));
      
      // Compress images before uploading to avoid 413 Request Entity Too Large errors
      for (const file of files) {
        if (file.type.startsWith('image/')) {
          try {
            const compressedFile = await compressImage(file);
            formData.append('files', compressedFile);
          } catch (e) {
            console.warn('Image compression failed, uploading original', e);
            formData.append('files', file);
          }
        } else {
          formData.append('files', file);
        }
      }

      console.log("Sending analysis request to /api/analyze...");
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
        credentials: 'include', // Ensure cookies are sent in cross-site iframe context
      });

      const contentType = response.headers.get("content-type");
      if (!response.ok) {
        let errorMessage = 'Backend processing failed';
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } else {
          const textError = await response.text();
          console.error("Server returned non-JSON error:", textError);
          
          if (textError.includes("Cookie check") || textError.includes("Action required to load your app")) {
            errorMessage = "Authentication required. Please refresh the page or click 'Authenticate' if prompted by the platform. This is common when third-party cookies are blocked in Safari/iOS.";
          } else {
            errorMessage = `Server error (${response.status}): ${textError.substring(0, 100)}...`;
          }
        }
        throw new Error(errorMessage);
      }

      if (!contentType || !contentType.includes("application/json")) {
        const textResponse = await response.text();
        console.error("Server returned non-JSON response:", textResponse);
        
        if (textResponse.includes("Cookie check") || textResponse.includes("Action required to load your app")) {
          throw new Error("Authentication required. Please refresh the page or ensure third-party cookies are allowed for this site.");
        }
        
        throw new Error(`Unexpected server response format. Expected JSON, got ${contentType || 'unknown'}. Response preview: ${textResponse.substring(0, 200)}`);
      }

      const data = await response.json();
      console.log("Received data from server:", data);
      
      const finalReport = await generateSecurityReport(
        prompt,
        data.processedFiles || [],
        data.scrapedIntel || [],
        tools.filter(t => t.enabled),
        data.messageBusData || [],
        data.mcpData || [],
        userApiKey,
        selectedModel
      );

      setReport(finalReport);
    } catch (error: any) {
      console.error("Analysis error:", error);
      
      // Clear any previous report and show the error
      setReport({
        id: 'error',
        timestamp: new Date().toISOString(),
        prompt,
        technicalOverview: "Analysis failed.",
        threatIntelligence: `Analysis failed: ${error.message || 'Unknown error'}. Please check your configuration and try again.`,
        threatHunting: "Analysis failed.",
        incidentResponse: "Analysis failed.",
        bestPractices: "Analysis failed.",
        references: []
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleResetAll = () => {
    console.log("Resetting all connections and configurations...");
    localStorage.clear();
    setTools(INITIAL_TOOLS.map(t => ({ ...t, enabled: false })));
    setAiConfigs({} as any);
    setReport(null);
    setSelectedModel('gemini');
    // Force a re-render by updating a dummy state if needed
  };

  return (
    <div className="flex h-screen w-full bg-[#050505] text-white overflow-hidden security-grid">
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <Sidebar 
              selectedModel={selectedModel} 
              onModelChange={setSelectedModel}
              tools={tools}
              onConfigureAI={handleConfigureAI}
              onConfigureTool={handleConfigureTool}
              onResetAll={handleResetAll}
              intelFeed={intelFeed}
              onClose={() => setIsSidebarOpen(false)}
            />
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 overflow-y-auto relative">
        <div className="scanning-line absolute top-0 left-0 w-full pointer-events-none opacity-20" />
        
        <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 md:space-y-12">
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-3 bg-white/5 rounded-2xl border border-white/10 hover:border-green-500/30 transition-all"
              >
                <Cpu className="w-6 h-6 text-green-400" />
              </button>
              <div>
                <h2 className="text-[10px] md:text-sm font-bold uppercase tracking-[0.3em] text-white/40">Operation Center</h2>
                <h1 className="text-xl md:text-3xl font-black tracking-tighter">BISE COMMAND</h1>
              </div>
            </div>
            
            <div className="flex gap-2 md:gap-4">
              <div className="glass px-3 md:px-4 py-2 rounded-xl flex items-center gap-2 md:gap-3 border-white/5">
                <div className="w-1.5 md:w-2 h-1.5 md:h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-white/60">Online</span>
              </div>
              <div className="hidden sm:flex glass px-4 py-2 rounded-xl items-center gap-3 border-white/5">
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
        key={`${configModal.type}-${configModal.id}`}
        isOpen={configModal.isOpen}
        onClose={() => setConfigModal({ ...configModal, isOpen: false })}
        title={configModal.title}
        type={configModal.type}
        modelId={configModal.id}
        initialConfig={
          configModal.type === 'ai' 
            ? aiConfigs[configModal.id as ModelType] || {} 
            : (() => {
                const tool = tools.find(t => t.id === configModal.id);
                return { 
                  ...(tool?.config || {}), 
                  name: tool?.name || '',
                  type: (tool?.type as any) || 'API' 
                };
              })()
        }
        onSave={handleSaveConfig}
      />
    </div>
  );
}
