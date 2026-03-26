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
    { title: 'Threat Intelligence', icon: ShieldAlert, content: report.threatIntelligence, color: '#f87171' }, // red-400
    { title: 'Threat Hunting Steps', icon: Info, content: report.threatHunting, color: '#60a5fa' }, // blue-400
    { title: 'Incident Response Playbook', icon: PlayCircle, content: report.incidentResponse, color: '#fb923c' }, // orange-400
    { title: 'Security Best Practices', icon: CheckCircle, content: report.bestPractices, color: '#4ade80' }, // green-400
  ];

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);

    try {
      // Use a slightly lower scale for better compatibility with large reports
      const canvas = await html2canvas(reportRef.current, {
        scale: 1.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#050505',
        windowWidth: reportRef.current.scrollWidth,
        windowHeight: reportRef.current.scrollHeight,
        onclone: (clonedDoc) => {
          const elements = clonedDoc.getElementsByTagName('*');
          for (let i = 0; i < elements.length; i++) {
            const el = elements[i] as HTMLElement;
            
            // Force RGB for everything to avoid oklch issues
            const style = window.getComputedStyle(el);
            
            if (style.color.includes('oklch')) el.style.color = '#ffffff';
            if (style.backgroundColor.includes('oklch')) el.style.backgroundColor = 'transparent';
            if (style.borderColor.includes('oklch')) el.style.borderColor = 'rgba(255,255,255,0.1)';
            
            // Strip filters and other problematic modern CSS
            el.style.backdropFilter = 'none';
            (el.style as any).webkitBackdropFilter = 'none';
            el.style.filter = 'none';
            
            // Ensure visibility
            el.style.opacity = '1';
            el.style.visibility = 'visible';
            
            // Fix for glass class
            if (el.classList.contains('glass')) {
              el.style.background = 'rgba(255, 255, 255, 0.05)';
              el.style.border = '1px solid rgba(255, 255, 255, 0.1)';
            }
          }

          // Add a style block to the cloned document to force standard colors
          const style = clonedDoc.createElement('style');
          style.innerHTML = `
            * { 
              color-scheme: dark !important;
              -webkit-print-color-adjust: exact !important;
            }
            .glass { 
              background: rgba(255, 255, 255, 0.05) !important;
              backdrop-filter: none !important;
              border: 1px solid rgba(255, 255, 255, 0.1) !important;
            }
            h2, h3, p, div, span {
              color: white !important;
            }
            .prose { color: rgba(255,255,255,0.7) !important; }
          `;
          clonedDoc.head.appendChild(style);
        }
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      // If the report is longer than one A4 page, we might need multiple pages
      // But for now, let's just scale it to fit the width and handle height
      let heightLeft = pdfHeight;
      let position = 0;
      const pageHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`BISE_Security_Report_${report.id}.pdf`);
    } catch (error) {
      console.error('PDF Export failed:', error);
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
                <section.icon className="w-5 h-5" style={{ color: section.color }} />
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
                  className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs truncate"
                  style={{ color: '#60a5fa' }} // blue-400
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
