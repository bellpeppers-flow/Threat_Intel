import React, { useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { SecurityReport } from '../types';
import { ShieldAlert, Info, PlayCircle, CheckCircle, Link as LinkIcon, Download, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ReportViewProps {
  report: SecurityReport;
}

export const ReportView: React.FC<ReportViewProps> = ({ report }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = React.useState(false);

  const sections = [
    { title: 'Threat Intelligence', icon: ShieldAlert, content: report.threatIntelligence, color: 'text-red-400' },
    { title: 'Threat Hunting Steps', icon: Info, content: report.threatHunting, color: 'text-blue-400' },
    { title: 'Incident Response Playbook', icon: PlayCircle, content: report.incidentResponse, color: 'text-orange-400' },
    { title: 'Security Best Practices', icon: CheckCircle, content: report.bestPractices, color: 'text-green-400' },
  ];

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);

    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#050505',
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`BISE_Security_Report_${report.id}.pdf`);
    } catch (error) {
      console.error('PDF Export failed:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-5xl mx-auto space-y-8 pb-20"
    >
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tighter">Analysis Report</h2>
          <p className="text-xs text-white/40 uppercase tracking-widest">Generated at {new Date(report.timestamp).toLocaleString()}</p>
        </div>
        <button 
          onClick={handleExportPDF}
          disabled={isExporting}
          className="flex items-center gap-2 px-4 py-2 glass rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-colors disabled:opacity-50"
        >
          {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {isExporting ? 'Exporting...' : 'Export PDF'}
        </button>
      </div>

      <div ref={reportRef} className="space-y-8 p-4 bg-[#050505]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sections.map((section, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="glass rounded-2xl p-6 border border-white/5 space-y-4"
            >
              <div className="flex items-center gap-3">
                <section.icon className={cn("w-5 h-5", section.color)} />
                <h3 className="font-bold uppercase tracking-widest text-xs text-white/80">{section.title}</h3>
              </div>
              <div className="prose prose-invert prose-sm max-w-none text-white/60 leading-relaxed font-sans">
                <ReactMarkdown>{section.content}</ReactMarkdown>
              </div>
            </motion.div>
          ))}
        </div>

        {report.references && report.references.length > 0 && (
          <div className="glass rounded-2xl p-6 border border-white/5">
            <h3 className="font-bold uppercase tracking-widest text-xs text-white/40 mb-4 flex items-center gap-2">
              <LinkIcon className="w-3 h-3" /> Reference Intelligence Links
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {report.references.map((ref, i) => (
                <div 
                  key={i} 
                  className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs text-blue-400 truncate"
                >
                  {ref}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
