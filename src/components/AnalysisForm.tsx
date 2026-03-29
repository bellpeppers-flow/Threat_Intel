import React, { useState, useRef } from 'react';
import { Send, Upload, FileText, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface AnalysisFormProps {
  onAnalyze: (prompt: string, files: File[]) => void;
  isAnalyzing: boolean;
}

export const AnalysisForm: React.FC<AnalysisFormProps> = ({ onAnalyze, isAnalyzing }) => {
  const [prompt, setPrompt] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      if (files.length + newFiles.length > 3) {
        setError("Maximum 3 files allowed.");
        return;
      }
      setFiles([...files, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() && files.length === 0) return;
    setError(null); // Clear any file-related errors on submit
    onAnalyze(prompt, files);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto space-y-4">
      <div className="relative glass rounded-2xl p-4 border border-white/10 focus-within:border-green-500/50 transition-all shadow-2xl">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter security prompt or architectural query..."
          className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-white/20 resize-none h-32 font-mono text-sm"
        />
        
        <div className="flex flex-wrap gap-2 mb-4">
          {files.map((file, index) => (
            <div key={index} className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg group">
              {file.type.startsWith('image/') ? <ImageIcon className="w-3 h-3 text-blue-400" /> : <FileText className="w-3 h-3 text-orange-400" />}
              <span className="text-[10px] text-white/60 truncate max-w-[100px]">{file.name}</span>
              <button type="button" onClick={() => removeFile(index)} className="text-white/20 hover:text-red-400">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              className="hidden"
              accept=".pdf,.txt,.png,.jpg,.jpeg"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors flex items-center gap-2 text-xs uppercase tracking-widest font-bold"
            >
              <Upload className="w-4 h-4" /> Attach Docs
            </button>
            <span className="text-[10px] text-white/20 uppercase tracking-widest">Max 3 files (PDF, IMG, TXT)</span>
            {error && <span className="text-[10px] text-red-400 font-bold uppercase ml-2">{error}</span>}
          </div>

          <button
            disabled={isAnalyzing || (!prompt.trim() && files.length === 0)}
            className={cn(
              "px-6 py-2 rounded-xl flex items-center gap-2 font-bold uppercase tracking-widest text-xs transition-all",
              isAnalyzing 
                ? "bg-white/10 text-white/40 cursor-not-allowed" 
                : "bg-green-500 text-black hover:bg-green-400 shadow-[0_0_20px_rgba(34,197,94,0.3)]"
            )}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Analyzing...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" /> Execute Analysis
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
};
