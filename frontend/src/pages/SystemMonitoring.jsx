import React, { useState, useEffect } from 'react';
import { Card } from '../components/Cards';
import { Activity, ShieldAlert, Cpu, CheckCircle } from 'lucide-react';
import client from '../api/client';

export default function SystemMonitoring() {
  const [monitor, setMonitor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const response = await client.get('/api/monitoring/status');
        setMonitor(response.data);
      } catch (err) {
        console.error("Failed loading monitor metrics:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="py-12 flex items-center justify-center">
        <span className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">System Monitoring</h1>
        <p className="text-sm text-brand-muted mt-1">Check pipeline performance, observability bindings, and API availability.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-brand-card border border-brand-border rounded-xl p-5 shadow-lg space-y-1">
          <span className="text-xxs font-semibold text-brand-muted uppercase tracking-wider">API Router Status</span>
          <div className="flex items-center space-x-2 mt-1">
            <span className="w-3.5 h-3.5 bg-brand-accent rounded-full animate-ping shrink-0 absolute"></span>
            <span className="w-3.5 h-3.5 bg-brand-accent rounded-full shrink-0"></span>
            <span className="text-lg font-bold text-white leading-5">OPERATIONAL</span>
          </div>
        </div>

        <div className="bg-brand-card border border-brand-border rounded-xl p-5 shadow-lg space-y-1">
          <span className="text-xxs font-semibold text-brand-muted uppercase tracking-wider">Observability (Langfuse)</span>
          <div className="flex items-center space-x-2 mt-1">
            <span className={`w-3 h-3 rounded-full ${monitor?.langfuse?.connected ? 'bg-brand-accent' : 'bg-brand-muted'}`}></span>
            <span className="text-sm font-bold text-white capitalize">
              {monitor?.langfuse?.connected ? 'Connected' : 'Mock Mode (Not Configured)'}
            </span>
          </div>
        </div>

        <div className="bg-brand-card border border-brand-border rounded-xl p-5 shadow-lg space-y-1">
          <span className="text-xxs font-semibold text-brand-muted uppercase tracking-wider">Average Screen Latency</span>
          <p className="text-lg font-bold text-white mt-1">{monitor?.latency_sec || 0}s <span className="text-xs text-brand-muted font-normal">/ Resume</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* API Info */}
        <Card title="LLM Credentials & Integration">
          <div className="space-y-4 text-xs">
            <div className="flex justify-between border-b border-brand-border/60 pb-2">
              <span className="text-brand-muted">Target LLM Engine</span>
              <span className="text-white font-semibold font-mono">{monitor?.llm?.model || 'N/A'}</span>
            </div>
            <div className="flex justify-between border-b border-brand-border/60 pb-2">
              <span className="text-brand-muted">Groq API Credentials</span>
              <span className={`font-semibold font-mono ${monitor?.llm?.configured ? 'text-brand-accent' : 'text-red-400'}`}>
                {monitor?.llm?.configured ? 'Valid key loaded' : 'Missing Key (Fallback responses loaded)'}
              </span>
            </div>
            <div className="flex justify-between pb-2">
              <span className="text-brand-muted">Active Environment</span>
              <span className="text-white font-semibold capitalize font-mono">{monitor?.environment || 'development'}</span>
            </div>
          </div>
        </Card>

        {/* Telemetry Info */}
        <Card title="Observability Telemetry (Langfuse)">
          <div className="space-y-4 text-xs">
            <div className="flex justify-between border-b border-brand-border/60 pb-2">
              <span className="text-brand-muted">Langfuse Trace Host</span>
              <span className="text-white font-semibold font-mono">{monitor?.langfuse?.host || 'N/A'}</span>
            </div>
            <div className="flex justify-between border-b border-brand-border/60 pb-2">
              <span className="text-brand-muted">Execution Logs Exported</span>
              <span className="text-white font-semibold font-mono">{monitor?.stats?.completed || 0} Traces</span>
            </div>
            <div className="flex justify-between pb-2">
              <span className="text-brand-muted">State Graph Routing</span>
              <span className="text-brand-accent font-semibold">Active & Audited</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
