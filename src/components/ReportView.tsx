import React, { useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { SecurityReport } from '../types';
import { ShieldAlert, Info, PlayCircle, CheckCircle, Link as LinkIcon, Download, FileCode, FileJson } from 'lucide-react';
import { motion } from 'framer-motion';

interface ReportViewProps {
  report: SecurityReport;
}

export const ReportView: React.FC<ReportViewProps> = ({ report }) => {
  const reportRef = useRef<HTMLDivElement>(null);

  const sections = [
    { title: 'Technical Overview', icon: Info, content: report.technicalOverview, color: '#a78bfa' }, // violet-400
    { title: 'Threat Intelligence', icon: ShieldAlert, content: report.threatIntelligence, color: '#f87171' }, // red-400
    { title: 'Threat Hunting Steps', icon: Info, content: report.threatHunting, color: '#60a5fa' }, // blue-400
    { title: 'Incident Response Playbook', icon: PlayCircle, content: report.incidentResponse, color: '#fb923c' }, // orange-400
    { title: 'Security Best Practices', icon: CheckCircle, content: report.bestPractices, color: '#4ade80' }, // green-400
  ];

  const handleExportHTML = () => {
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BISE Security Report - ${report.id}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 40px; background: #f9f9f9; }
        .container { background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { border-bottom: 2px solid #eee; padding-bottom: 10px; color: #111; }
        h2 { color: #2563eb; margin-top: 30px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
        .meta { color: #666; font-size: 0.9em; margin-bottom: 30px; }
        .section { margin-bottom: 40px; }
        .references { background: #f0f4f8; padding: 20px; border-radius: 4px; }
        .references ul { list-style: none; padding: 0; }
        .references li { margin-bottom: 10px; word-break: break-all; }
        .references a { color: #2563eb; text-decoration: none; }
        pre { background: #f4f4f4; padding: 15px; border-radius: 4px; overflow-x: auto; }
        code { font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <h1>BISE Security Analysis Report</h1>
        <div class="meta">
            <p><strong>Report ID:</strong> ${report.id}</p>
            <p><strong>Generated:</strong> ${new Date(report.timestamp).toLocaleString()}</p>
            <p><strong>Prompt:</strong> ${report.prompt}</p>
        </div>

        ${sections.map(s => `
            <div class="section">
                <h2>${s.title}</h2>
                <div>${s.content.replace(/\n/g, '<br>')}</div>
            </div>
        `).join('')}

        <div class="section references">
            <h2>Reference Intelligence Links</h2>
            <ul>
                ${report.references.map(ref => `<li><a href="${ref}">${ref}</a></li>`).join('')}
            </ul>
        </div>
    </div>
</body>
</html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BISE_Security_Report_${report.id}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportXML = () => {
    const escapeXml = (unsafe: string) => {
      return unsafe.replace(/[<>&"']/g, (c) => {
        switch (c) {
          case '<': return '&lt;';
          case '>': return '&gt;';
          case '&': return '&amp;';
          case '"': return '&quot;';
          case "'": return '&apos;';
          default: return c;
        }
      });
    };

    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<SecurityReport id="${report.id}">
    <Metadata>
        <Timestamp>${report.timestamp}</Timestamp>
        <Prompt>${escapeXml(report.prompt)}</Prompt>
    </Metadata>
    <Analysis>
        <TechnicalOverview>${escapeXml(report.technicalOverview)}</TechnicalOverview>
        <ThreatIntelligence>${escapeXml(report.threatIntelligence)}</ThreatIntelligence>
        <ThreatHuntingSteps>${escapeXml(report.threatHunting)}</ThreatHuntingSteps>
        <IncidentResponsePlaybook>${escapeXml(report.incidentResponse)}</IncidentResponsePlaybook>
        <SecurityBestPractices>${escapeXml(report.bestPractices)}</SecurityBestPractices>
    </Analysis>
    <References>
        ${report.references.map(ref => `<Link>${escapeXml(ref)}</Link>`).join('\n        ')}
    </References>
</SecurityReport>`;

    const blob = new Blob([xmlContent], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BISE_Security_Report_${report.id}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
        <div className="flex gap-3">
          <button 
            onClick={handleExportHTML}
            className="flex items-center gap-2 px-4 py-2 glass rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-colors"
          >
            <FileCode className="w-4 h-4" /> Export HTML
          </button>
          <button 
            onClick={handleExportXML}
            className="flex items-center gap-2 px-4 py-2 glass rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-colors"
          >
            <FileJson className="w-4 h-4" /> Export XML
          </button>
        </div>
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
