import React, { useEffect, useState } from 'react';
import { Card } from '../components/Cards';
import { KeyRound, Save } from 'lucide-react';
import client from '../api/client';

export default function Settings() {
  const [llmSettings, setLlmSettings] = useState(null);
  const [groqKey, setGroqKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadLLMSettings() {
      try {
        const response = await client.get('/api/settings/llm');
        setLlmSettings(response.data);
      } catch (err) {
        setError(err.response?.data?.detail || 'Could not load LLM settings.');
      }
    }

    loadLLMSettings();
  }, []);

  const handleSaveGroqKey = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!groqKey.trim()) {
      setError('Enter a Groq API key before saving.');
      return;
    }

    setSaving(true);
    try {
      const response = await client.post('/api/settings/llm', {
        groq_api_key: groqKey.trim(),
      });
      setLlmSettings(response.data);
      setGroqKey('');
      setMessage('Groq API key saved. New screening runs will use Groq.');
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not save Groq API key.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">System Settings</h1>
        <p className="text-sm text-brand-muted mt-1">Configure workspace variables, folders, and screening rules.</p>
      </div>

      {(message || error) && (
        <div className={`border rounded-xl px-4 py-3 text-sm ${message ? 'bg-brand-accent/10 border-brand-accent/30 text-brand-accent' : 'bg-red-500/10 border-red-500/30 text-red-300'}`}>
          {message || error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Groq LLM Integration">
          <form onSubmit={handleSaveGroqKey} className="space-y-4 text-xs">
            <div className="flex justify-between border-b border-brand-border/60 pb-2">
              <span className="text-brand-muted">Provider</span>
              <span className="text-white font-semibold font-mono uppercase">{llmSettings?.provider || 'fallback'}</span>
            </div>
            <div className="flex justify-between border-b border-brand-border/60 pb-2">
              <span className="text-brand-muted">Current Key</span>
              <span className={`font-semibold font-mono ${llmSettings?.configured ? 'text-brand-accent' : 'text-red-400'}`}>
                {llmSettings?.configured ? llmSettings?.groq_api_key_masked : 'Missing'}
              </span>
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-brand-muted font-semibold uppercase tracking-wider">Groq API Key</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" size={15} />
                <input
                  type="password"
                  value={groqKey}
                  onChange={(e) => setGroqKey(e.target.value)}
                  placeholder="gsk_..."
                  className="w-full bg-brand-dark/60 border border-brand-border text-brand-text placeholder-brand-muted pl-9 pr-3 py-2 rounded-lg font-mono focus:outline-none focus:border-brand-primary"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-brand-primary hover:bg-brand-primary/95 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition"
            >
              {saving ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <Save size={15} />
                  <span>Save Groq Key</span>
                </>
              )}
            </button>
          </form>
        </Card>

        <Card title="Workspace Settings">
          <div className="space-y-4 text-xs">
            <div className="flex flex-col space-y-1">
              <label className="text-brand-muted font-semibold uppercase tracking-wider">Default Resume Folder</label>
              <input 
                type="text" 
                value="data/resumes" 
                disabled 
                className="bg-brand-dark/60 border border-brand-border text-brand-muted px-3 py-2 rounded-lg font-mono"
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-brand-muted font-semibold uppercase tracking-wider">Default Job Descriptions Folder</label>
              <input 
                type="text" 
                value="data/job_descriptions" 
                disabled 
                className="bg-brand-dark/60 border border-brand-border text-brand-muted px-3 py-2 rounded-lg font-mono"
              />
            </div>
          </div>
        </Card>

        <Card title="Screening Hyperparameters">
          <div className="space-y-4 text-xs">
            <div className="flex justify-between border-b border-brand-border/60 pb-2">
              <span className="text-brand-muted">Technical Threshold Score</span>
              <span className="text-white font-bold font-mono">75/100</span>
            </div>
            <div className="flex justify-between border-b border-brand-border/60 pb-2">
              <span className="text-brand-muted">Strict Date Gap Filter</span>
              <span className="text-brand-accent font-semibold font-mono">ENABLED (&gt; 6mo)</span>
            </div>
            <div className="flex justify-between pb-2">
              <span className="text-brand-muted">Soft Skills Grading weight</span>
              <span className="text-white font-bold font-mono">15%</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
