import React, { useState, useEffect } from 'react';
import { Card } from '../components/Cards';
import { FileSpreadsheet, FileText, Download, CheckCircle } from 'lucide-react';
import client from '../api/client';

export default function Reports() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCandidates() {
      try {
        const response = await client.get('/api/candidates');
        setCandidates(response.data.filter(c => c.status === 'completed'));
      } catch (err) {
        console.error("Failed loading candidate list:", err);
      } finally {
        setLoading(false);
      }
    }
    loadCandidates();
  }, []);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">System Reports</h1>
        <p className="text-sm text-brand-muted mt-1">Export recruitment metrics and review candidate assessment profiles.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bulk Data Exporters */}
        <div className="space-y-6">
          <Card title="Recruitment Summary Spreadsheets">
            <p className="text-xs text-brand-muted mb-4">Export all candidate profiles, status pipelines, and screening fit assessments in tabular sheets.</p>
            
            <div className="space-y-3">
              <a 
                href="/api/reports/csv"
                className="flex items-center justify-between p-3.5 bg-brand-dark/50 hover:bg-brand-dark border border-brand-border rounded-xl transition group"
              >
                <div className="flex items-center space-x-3">
                  <FileSpreadsheet className="text-brand-primary" size={20} />
                  <div>
                    <p className="text-xs font-bold text-white">Export CSV Spreadsheet</p>
                    <p className="text-xxs text-brand-muted mt-0.5">Comma-separated values format</p>
                  </div>
                </div>
                <Download className="text-brand-muted group-hover:text-white transition" size={16} />
              </a>

              <a 
                href="/api/reports/excel"
                className="flex items-center justify-between p-3.5 bg-brand-dark/50 hover:bg-brand-dark border border-brand-border rounded-xl transition group"
              >
                <div className="flex items-center space-x-3">
                  <FileSpreadsheet className="text-brand-primary" size={20} />
                  <div>
                    <p className="text-xs font-bold text-white">Export Microsoft Excel Spreadsheet</p>
                    <p className="text-xxs text-brand-muted mt-0.5">Structured multi-column spreadsheet (.xlsx)</p>
                  </div>
                </div>
                <Download className="text-brand-muted group-hover:text-white transition" size={16} />
              </a>
            </div>
          </Card>
        </div>

        {/* Individual Assessment Cards */}
        <div className="space-y-6">
          <Card title="Export Candidate Report Card PDF">
            <p className="text-xs text-brand-muted mb-4">Select and download a compiled PDF containing interview questions and upskilling roadmaps.</p>

            {loading ? (
              <div className="py-4 flex justify-center"><span className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></span></div>
            ) : candidates.length === 0 ? (
              <p className="text-xs text-brand-muted font-mono text-center py-4">No candidate profiles evaluated yet.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {candidates.map((c) => (
                  <a
                    key={c.id}
                    href={`/api/reports/${c.id}/pdf`}
                    download
                    className="flex items-center justify-between p-3 bg-brand-dark/40 hover:bg-brand-border border border-brand-border rounded-xl text-xs transition"
                  >
                    <span className="font-bold text-white truncate max-w-[180px]">{c.profile?.name || c.filename}</span>
                    <span className="flex items-center space-x-1.5 shrink-0 text-brand-muted hover:text-white font-semibold">
                      <span>Download PDF</span>
                      <Download size={12} />
                    </span>
                  </a>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
