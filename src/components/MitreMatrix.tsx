import React, { useState } from 'react';
import { MitreAttackData } from '../types';
import { Shield, ChevronDown, ChevronRight, Target, Search, ShieldCheck, AlertTriangle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

interface MitreMatrixProps {
  data: MitreAttackData;
}

export const MitreMatrix: React.FC<MitreMatrixProps> = ({ data }) => {
  const [expandedTactics, setExpandedTactics] = useState<Set<string>>(new Set([data.tactics[0]?.id]));
  const [selectedTechnique, setSelectedTechnique] = useState<any | null>(null);

  const toggleTactic = (id: string) => {
    const next = new Set(expandedTactics);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedTactics(next);
  };

  return (
    <div className="space-y-6">
      <div className="glass p-6 rounded-2xl border-white/5 bg-green-500/5">
        <div className="flex items-center gap-3 mb-3">
          <Target className="w-5 h-5 text-green-400" />
          <h3 className="text-sm font-bold uppercase tracking-widest">Attack Lifecycle Summary</h3>
        </div>
        <p className="text-sm text-white/70 leading-relaxed italic">
          "{data.summary}"
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {data.tactics.map((tactic) => (
          <div key={tactic.id} className="glass rounded-2xl border-white/5 overflow-hidden">
            <button
              onClick={() => toggleTactic(tactic.id)}
              className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-all text-left"
            >
              <div className="flex items-center gap-4">
                <div className="p-2 bg-white/5 rounded-lg text-green-400">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-white/30 uppercase tracking-tighter">{tactic.id}</span>
                    <h4 className="text-sm font-bold text-white">{tactic.name}</h4>
                  </div>
                  <p className="text-[10px] text-white/40 mt-0.5">{tactic.techniques.length} Techniques Identified</p>
                </div>
              </div>
              {expandedTactics.has(tactic.id) ? <ChevronDown className="w-4 h-4 text-white/20" /> : <ChevronRight className="w-4 h-4 text-white/20" />}
            </button>

            <AnimatePresence>
              {expandedTactics.has(tactic.id) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-white/5"
                >
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {tactic.techniques.map((tech) => (
                      <button
                        key={tech.id}
                        onClick={() => setSelectedTechnique(tech)}
                        className="p-3 rounded-xl bg-white/5 border border-white/5 hover:border-green-500/30 hover:bg-green-500/5 transition-all text-left group"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[9px] font-black text-green-500/50 group-hover:text-green-400">{tech.id}</span>
                          <Info className="w-3 h-3 text-white/10 group-hover:text-white/40" />
                        </div>
                        <h5 className="text-xs font-bold text-white/80 group-hover:text-white line-clamp-1">{tech.name}</h5>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {selectedTechnique && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass w-full max-w-2xl rounded-3xl border border-white/10 overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-500/20 rounded-2xl text-green-400">
                    <Target className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-white/30 uppercase tracking-widest">{selectedTechnique.id}</span>
                      <h3 className="text-xl font-black tracking-tighter">{selectedTechnique.name}</h3>
                    </div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">Technique Deep-Dive</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedTechnique(null)}
                  className="p-2 rounded-xl hover:bg-white/10 text-white/40 hover:text-white transition-all"
                >
                  <ChevronDown className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <section className="space-y-3">
                  <div className="flex items-center gap-2 text-white/40">
                    <Info className="w-4 h-4" />
                    <h4 className="text-[10px] font-bold uppercase tracking-widest">Description</h4>
                  </div>
                  <p className="text-sm text-white/70 leading-relaxed">{selectedTechnique.description}</p>
                </section>

                <section className="space-y-3 p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10">
                  <div className="flex items-center gap-2 text-blue-400">
                    <Search className="w-4 h-4" />
                    <h4 className="text-[10px] font-bold uppercase tracking-widest">Evidence from Analysis</h4>
                  </div>
                  <p className="text-sm text-white/80 italic leading-relaxed">"{selectedTechnique.evidence}"</p>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <section className="space-y-3 p-4 rounded-2xl bg-green-500/5 border border-green-500/10">
                    <div className="flex items-center gap-2 text-green-400">
                      <ShieldCheck className="w-4 h-4" />
                      <h4 className="text-[10px] font-bold uppercase tracking-widest">Mitigation Strategy</h4>
                    </div>
                    <p className="text-xs text-white/70 leading-relaxed">{selectedTechnique.mitigation}</p>
                  </section>

                  <section className="space-y-3 p-4 rounded-2xl bg-orange-500/5 border border-orange-500/10">
                    <div className="flex items-center gap-2 text-orange-400">
                      <AlertTriangle className="w-4 h-4" />
                      <h4 className="text-[10px] font-bold uppercase tracking-widest">Detection Logic</h4>
                    </div>
                    <p className="text-xs text-white/70 leading-relaxed">{selectedTechnique.detection}</p>
                  </section>
                </div>
              </div>

              <div className="p-6 border-t border-white/5 bg-white/5 flex justify-end">
                <button
                  onClick={() => setSelectedTechnique(null)}
                  className="px-8 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold uppercase tracking-widest transition-all"
                >
                  Close Blueprint
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
