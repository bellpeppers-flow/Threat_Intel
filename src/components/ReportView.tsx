import React, { useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { SecurityReport } from '../types';
import { ShieldAlert, Info, PlayCircle, CheckCircle, Link as LinkIcon, Download, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
// @ts-ignore
import html2pdf from 'html2pdf.js';

interface ReportViewProps {
  report: SecurityReport;
}

export const ReportView: React.FC<ReportViewProps> = ({ report }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = React.useState(false);

  const sections = [
    { title: 'Technical Overview', icon: Info, content: report.technicalOverview, color: '#a78bfa' }, // violet-400
    { title: 'Threat Intelligence', icon: ShieldAlert, content: report.threatIntelligence, color: '#f87171' }, // red-400
    { title: 'Threat Hunting Steps', icon: Info, content: report.threatHunting, color: '#60a5fa' }, // blue-400
    { title: 'Incident Response Playbook', icon: PlayCircle, content: report.incidentResponse, color: '#fb923c' }, // orange-400
    { title: 'Security Best Practices', icon: CheckCircle, content: report.bestPractices, color: '#4ade80' }, // green-400
  ];

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);

    try {
      const opt = {
        margin:       [15, 15, 15, 15],
        filename:     `BISE_Security_Report_${report.id}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { 
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          onclone: async (clonedDoc: Document) => {
            // Strip unsupported color functions from all style tags
            const styleTags = clonedDoc.getElementsByTagName('style');
            for (let i = 0; i < styleTags.length; i++) {
              if (styleTags[i].innerHTML) {
                styleTags[i].innerHTML = styleTags[i].innerHTML.replace(/[-a-zA-Z0-9]+:\s*[^;}]*\b(oklab|oklch|color-mix|lab|lch|hwb)\([^;}]*(?:;|$)/g, '');
              }
            }

            // Fetch and strip unsupported color functions from linked stylesheets
            const linkTags = Array.from(clonedDoc.getElementsByTagName('link'));
            for (const link of linkTags) {
              if (link.rel === 'stylesheet' && link.href) {
                try {
                  const res = await fetch(link.href);
                  let cssText = await res.text();
                  cssText = cssText.replace(/[-a-zA-Z0-9]+:\s*[^;}]*\b(oklab|oklch|color-mix|lab|lch|hwb)\([^;}]*(?:;|$)/g, '');
                  
                  const newStyle = clonedDoc.createElement('style');
                  newStyle.innerHTML = cssText;
                  link.parentNode?.replaceChild(newStyle, link);
                } catch (e) {
                  console.warn('Failed to fetch stylesheet for PDF export', e);
                }
              }
            }

            const elements = clonedDoc.getElementsByTagName('*');
            for (let i = 0; i < elements.length; i++) {
              const el = elements[i] as HTMLElement;
              
              // Strip inline styles containing unsupported color functions
              const inlineStyle = el.getAttribute('style');
              if (inlineStyle && (inlineStyle.includes('oklch') || inlineStyle.includes('oklab') || inlineStyle.includes('color-mix') || inlineStyle.includes('lab') || inlineStyle.includes('lch') || inlineStyle.includes('hwb'))) {
                el.setAttribute('style', inlineStyle.replace(/[-a-zA-Z0-9]+:\s*[^;}]*\b(oklab|oklch|color-mix|lab|lch|hwb)\([^;}]*(?:;|$)/g, ''));
              }
              
              // Force RGB for everything to avoid oklch/oklab issues
              const style = window.getComputedStyle(el);
              
              if (style.color.includes('oklch') || style.color.includes('oklab')) el.style.color = '#000000';
              if (style.backgroundColor.includes('oklch') || style.backgroundColor.includes('oklab')) el.style.backgroundColor = 'transparent';
              if (style.borderColor.includes('oklch') || style.borderColor.includes('oklab')) el.style.borderColor = 'rgba(0,0,0,0.1)';
              
              // Fix text overflow/wrapping issues for PDF
              el.style.wordBreak = 'break-word';
              el.style.overflowWrap = 'anywhere';
              el.style.whiteSpace = 'normal';
              
              // Strip filters and other problematic modern CSS
              el.style.backdropFilter = 'none';
              (el.style as any).webkitBackdropFilter = 'none';
              el.style.filter = 'none';
              
              // Ensure visibility
              el.style.opacity = '1';
              el.style.visibility = 'visible';
              
              // Fix for glass class
              if (el.classList.contains('glass')) {
                el.style.background = '#ffffff';
                el.style.border = '1px solid #e5e7eb';
                el.style.boxShadow = 'none';
              }
            }

            // Add a style block to the cloned document to force standard colors and wrapping
            const style = clonedDoc.createElement('style');
            style.innerHTML = `
              * { 
                color-scheme: light !important;
                -webkit-print-color-adjust: exact !important;
                max-width: 100% !important;
                box-sizing: border-box !important;
              }
              body, main, div, section, article {
                background-color: #ffffff !important;
                color: #000000 !important;
              }
              .glass { 
                background: #ffffff !important;
                backdrop-filter: none !important;
                border: 1px solid #e5e7eb !important;
                box-shadow: none !important;
                /* Remove page-break-inside: avoid to prevent huge white spaces */
                page-break-inside: auto !important;
                margin-bottom: 2rem !important;
              }
              h1, h2, h3, h4, h5, h6 {
                color: #111827 !important;
                word-break: break-word !important;
                overflow-wrap: break-word !important;
                border-bottom: 1px solid #e5e7eb !important;
                padding-bottom: 0.5rem !important;
                margin-top: 1.5rem !important;
                margin-bottom: 1rem !important;
                page-break-after: avoid !important;
              }
              p, span, li, td, th {
                color: #374151 !important;
                word-break: break-word !important;
                overflow-wrap: break-word !important;
                line-height: 1.6 !important;
              }
              a {
                color: #2563eb !important;
                text-decoration: none !important;
                word-break: break-all !important;
                overflow-wrap: anywhere !important;
                display: inline-block !important;
                max-width: 100% !important;
              }
              .prose { 
                color: #374151 !important; 
                max-width: 100% !important;
              }
              pre {
                background-color: #f3f4f6 !important;
                border: 1px solid #e5e7eb !important;
                padding: 1rem !important;
                border-radius: 0.375rem !important;
                page-break-inside: avoid !important;
                white-space: pre-wrap !important;
                word-break: break-all !important;
                overflow-wrap: anywhere !important;
              }
              code {
                color: #1f2937 !important;
                word-break: break-all !important;
                overflow-wrap: anywhere !important;
              }
              img, svg {
                max-width: 100% !important;
                height: auto !important;
                page-break-inside: avoid !important;
              }
              ul, ol {
                padding-left: 1.5rem !important;
                margin-bottom: 1rem !important;
              }
              li {
                margin-bottom: 0.5rem !important;
              }
              .page-break {
                page-break-before: always !important;
              }
              /* Avoid breaking inside sections */
              section {
                page-break-inside: auto !important;
                margin-bottom: 2rem !important;
              }
            `;
            clonedDoc.head.appendChild(style);
          }
        },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak:    { mode: ['css', 'legacy'] }
      };

      await html2pdf().set(opt).from(reportRef.current).save();
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
              <div className="prose prose-invert prose-sm max-w-none text-white/60 leading-relaxed font-sans break-words overflow-hidden">
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
                  className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs break-all"
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
