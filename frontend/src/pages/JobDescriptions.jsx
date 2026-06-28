import React, { useState, useEffect } from 'react';
import { Card } from '../components/Cards';
import { Table, TableRow, TableCell } from '../components/Tables';
import { Briefcase, FileText, Plus, Trash2, CheckCircle } from 'lucide-react';
import client from '../api/client';
import Notification from '../components/Notifications';

export default function JobDescriptions() {
  const [jds, setJds] = useState([]);
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [rawText, setRawText] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedJd, setSelectedJd] = useState(null);
  const [notification, setNotification] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadJds = async () => {
    setLoading(true);
    try {
      const response = await client.get('/api/jobs');
      setJds(response.data);
      if (response.data.length > 0 && !selectedJd) {
        setSelectedJd(response.data[0]);
      }
    } catch (err) {
      console.error("Failed loading JDs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJds();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title || !rawText) {
      setNotification({ type: 'warning', message: 'Title and Raw Job Text are required.' });
      return;
    }

    setSubmitting(true);
    try {
      const response = await client.post(`/api/jobs/?title=${encodeURIComponent(title)}&department=${encodeURIComponent(department)}`, rawText, {
        headers: { 'Content-Type': 'text/plain' }
      });
      setNotification({ type: 'success', message: 'Job Description saved successfully!' });
      setTitle('');
      setDepartment('');
      setRawText('');
      loadJds();
      setSelectedJd(response.data);
    } catch (err) {
      const detail = err.response?.data?.detail;
      const message = Array.isArray(detail)
        ? detail.map((item) => item.msg).join(' ')
        : detail || 'Failed to save Job Description.';
      setNotification({ type: 'error', message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (jid, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this job description?")) return;
    try {
      await client.delete(`/api/jobs/${jid}`);
      setNotification({ type: 'success', message: 'Job Description deleted.' });
      if (selectedJd?.id === jid) {
        setSelectedJd(null);
      }
      loadJds();
    } catch (err) {
      setNotification({ type: 'error', message: 'Failed to delete Job Description.' });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Job Descriptions</h1>
        <p className="text-sm text-brand-muted mt-1">Submit target profiles to rank, score, and evaluate candidates against.</p>
      </div>

      {notification && (
        <Notification 
          message={notification.message} 
          type={notification.type} 
          onClose={() => setNotification(null)} 
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Create & List */}
        <div className="space-y-6 lg:col-span-1">
          {/* Create JD Form */}
          <Card title="Add Job Profile">
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wider mb-2">Job Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-2.5 text-xs text-brand-text placeholder-brand-muted focus:outline-none focus:border-brand-primary"
                  placeholder="e.g. Senior React Developer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wider mb-2">Department</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-2.5 text-xs text-brand-text placeholder-brand-muted focus:outline-none focus:border-brand-primary"
                  placeholder="e.g. Engineering"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wider mb-2">Job Description Text</label>
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  rows={6}
                  className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-2.5 text-xs text-brand-text placeholder-brand-muted focus:outline-none focus:border-brand-primary font-mono leading-relaxed"
                  placeholder="Paste the full job requirements and role description here..."
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-brand-primary hover:bg-brand-primary/95 text-white font-semibold rounded-xl py-2.5 text-xs shadow-lg transition flex items-center justify-center space-x-1.5"
              >
                <Plus size={14} />
                <span>Save Job Profile</span>
              </button>
            </form>
          </Card>

          {/* List JD */}
          <Card title="Previous Profiles">
            {loading ? (
              <div className="py-4 flex justify-center"><span className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></span></div>
            ) : jds.length === 0 ? (
              <p className="text-xs text-brand-muted font-mono text-center py-4">No job descriptions stored.</p>
            ) : (
              <div className="space-y-2">
                {jds.map((job) => (
                  <div
                    key={job.id}
                    onClick={() => setSelectedJd(job)}
                    className={`p-3 border rounded-xl flex items-center justify-between cursor-pointer transition ${
                      selectedJd?.id === job.id
                        ? 'bg-brand-primary/5 border-brand-primary text-brand-text'
                        : 'bg-brand-dark/40 border-brand-border text-brand-muted hover:border-brand-border/80'
                    }`}
                  >
                    <div className="flex items-center space-x-3 truncate">
                      <Briefcase size={16} className={selectedJd?.id === job.id ? 'text-brand-primary' : 'text-brand-muted'} />
                      <div className="truncate">
                        <p className="text-xs font-bold text-white truncate">{job.title}</p>
                        <p className="text-xxs text-brand-muted truncate">{job.department || 'N/A'}</p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDelete(job.id, e)}
                      className="p-1 hover:bg-brand-dark hover:text-red-400 rounded transition shrink-0 ml-2"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Details Viewer */}
        <div className="lg:col-span-2">
          {selectedJd ? (
            <Card title="Job Requirement Details">
              <div className="space-y-5">
                <div className="flex justify-between items-start border-b border-brand-border pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-white">{selectedJd.title}</h2>
                    <p className="text-xs text-brand-muted mt-0.5">{selectedJd.department || 'No department listed'}</p>
                  </div>
                  <span className="bg-brand-dark border border-brand-border px-2.5 py-0.5 rounded text-xxs font-mono text-brand-muted">
                    ID: {selectedJd.id.slice(0, 8)}
                  </span>
                </div>

                {/* Display extracted features or metadata */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-brand-dark/40 border border-brand-border rounded-xl p-4 space-y-1">
                    <span className="text-xxs font-semibold text-brand-muted uppercase tracking-wider">Required Experience</span>
                    <p className="text-sm font-bold text-white">{selectedJd.experience_years ? `${selectedJd.experience_years} Years` : 'Not specified'}</p>
                  </div>
                  <div className="bg-brand-dark/40 border border-brand-border rounded-xl p-4 space-y-1">
                    <span className="text-xxs font-semibold text-brand-muted uppercase tracking-wider">Education Level</span>
                    <p className="text-sm font-bold text-white">{selectedJd.education_required || 'Not specified'}</p>
                  </div>
                </div>

                {/* Raw content text */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Full JD Raw text</h4>
                  <pre className="bg-brand-dark/50 border border-brand-border rounded-xl p-4 text-xs font-mono text-brand-muted leading-relaxed whitespace-pre-wrap h-64 overflow-y-auto">
                    {selectedJd.raw_text}
                  </pre>
                </div>
              </div>
            </Card>
          ) : (
            <div className="bg-brand-card border border-brand-border rounded-2xl p-10 flex flex-col items-center justify-center text-center text-brand-muted h-full min-h-[400px]">
              <Briefcase className="mb-4 text-brand-muted" size={48} />
              <p className="text-sm font-semibold">Select a Job Profile from the list to view requirements</p>
              <p className="text-xs mt-1">Or add a new profile in the left panel</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
