import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, TableRow, TableCell } from '../components/Tables';
import { Search, Filter, Trash2, Eye, Play, ArrowUpDown } from 'lucide-react';
import client from '../api/client';
import Notification from '../components/Notifications';
import Modal from '../components/Modals';

export default function CandidateRepository() {
  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [jobFilter, setJobFilter] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  
  const navigate = useNavigate();

  const loadData = async () => {
    setLoading(true);
    try {
      const candRes = await client.get('/api/candidates');
      const jobRes = await client.get('/api/jobs');
      setCandidates(candRes.data);
      setJobs(jobRes.data);
    } catch (error) {
      console.error("Failed loading repository info:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (cid) => {
    if (!window.confirm("Are you sure you want to delete this candidate?")) return;
    try {
      await client.delete(`/api/candidates/${cid}`);
      setNotification({ type: 'success', message: 'Candidate deleted successfully.' });
      loadData();
    } catch (err) {
      setNotification({ type: 'error', message: 'Failed to delete candidate.' });
    }
  };

  const handleTriggerScreen = async (cid) => {
    if (jobs.length === 0) {
      setNotification({ type: 'warning', message: 'Please create a Job Description first to perform candidate matching.' });
      return;
    }
    
    // Default to the first JD if none is linked
    const defaultJobId = jobs[0].id;
    setNotification({ type: 'info', message: 'Triggering multi-agent screening... This takes a few seconds.' });
    
    try {
      await client.post(`/api/candidates/${cid}/screen?job_id=${defaultJobId}`);
      setNotification({ type: 'success', message: 'AI screening started. Refresh in a few seconds to see the final result.' });
      loadData();
    } catch (err) {
      setNotification({ type: 'error', message: err.response?.data?.detail || 'Screening pipeline execution failed.' });
    }
  };

  // Sorting
  const toggleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filteredCandidates = candidates.filter((c) => {
    const term = search.toLowerCase();
    const name = c.profile?.name?.toLowerCase() || '';
    const email = c.profile?.email?.toLowerCase() || '';
    const file = c.filename?.toLowerCase() || '';
    const skills = c.profile?.skills?.map(s => s.toLowerCase()).join(' ') || '';

    const matchesSearch = name.includes(term) || email.includes(term) || file.includes(term) || skills.includes(term);
    const matchesStatus = statusFilter === '' || c.status === statusFilter;
    const matchesJob = jobFilter === '' || c.active_job_id === jobFilter;

    return matchesSearch && matchesStatus && matchesJob;
  });

  const sortedCandidates = [...filteredCandidates].sort((a, b) => {
    let valA = a.profile?.name || a.filename;
    let valB = b.profile?.name || b.filename;

    if (sortField === 'score') {
      valA = a.scores?.final_score ?? -1;
      valB = b.scores?.final_score ?? -1;
    } else if (sortField === 'status') {
      valA = a.status;
      valB = b.status;
    }

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Candidate Repository</h1>
          <p className="text-sm text-brand-muted mt-1">Review, sort, filter, and execute screening runs against uploaded files.</p>
        </div>
      </div>

      {notification && (
        <Notification 
          message={notification.message} 
          type={notification.type} 
          onClose={() => setNotification(null)} 
        />
      )}

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-brand-card border border-brand-border rounded-xl p-4 shadow-lg">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-brand-dark border border-brand-border rounded-lg pl-10 pr-4 py-2 text-xs text-brand-text placeholder-brand-muted focus:outline-none focus:border-brand-primary"
            placeholder="Search candidates, skills..."
          />
        </div>

        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-xs text-brand-text focus:outline-none focus:border-brand-primary appearance-none cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        <div className="relative">
          <select
            value={jobFilter}
            onChange={(e) => setJobFilter(e.target.value)}
            className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-xs text-brand-text focus:outline-none focus:border-brand-primary appearance-none cursor-pointer"
          >
            <option value="">All Job Matches</option>
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>{job.title}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-end text-xs text-brand-muted font-mono">
          Showing {sortedCandidates.length} of {candidates.length} profiles
        </div>
      </div>

      {/* Candidates List Table */}
      {loading ? (
        <div className="py-12 flex items-center justify-center">
          <span className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></span>
        </div>
      ) : sortedCandidates.length === 0 ? (
        <div className="bg-brand-card border border-brand-border rounded-xl p-8 text-center text-brand-muted text-sm font-mono">
          No candidates found matching the selected filters.
        </div>
      ) : (
        <Table headers={[
          'Candidate Info', 
          <span className="cursor-pointer select-none inline-flex items-center space-x-1" onClick={() => toggleSort('status')}><span>Status</span><ArrowUpDown size={12}/></span>, 
          <span className="cursor-pointer select-none inline-flex items-center space-x-1" onClick={() => toggleSort('score')}><span>Final Score</span><ArrowUpDown size={12}/></span>, 
          'Fit Recommendation', 
          'Actions'
        ]}>
          {sortedCandidates.map((c) => (
            <TableRow key={c.id}>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-semibold text-white">{c.profile?.name || c.filename}</span>
                  <span className="text-xxs text-brand-muted mt-0.5">{c.profile?.email || 'No email parsed'}</span>
                </div>
              </TableCell>
              <TableCell>
                <span className={`px-2 py-0.5 rounded text-xxs font-mono font-semibold ${
                  c.status === 'completed' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                  c.status === 'processing' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                  c.status === 'failed' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                  'bg-slate-500/10 border-slate-500/20 text-slate-400'
                }`}>
                  {c.status}
                </span>
              </TableCell>
              <TableCell className="font-bold text-white text-sm">
                {c.scores ? `${c.scores.final_score}/100` : '—'}
              </TableCell>
              <TableCell>
                <span className={`text-xs font-semibold ${
                  c.feedback_report?.fit_status === 'Shortlisted' ? 'text-emerald-400' :
                  c.feedback_report?.fit_status === 'Rejected' ? 'text-red-400' :
                  'text-brand-primary'
                }`}>
                  {c.feedback_report?.fit_status || 'Needs Screen'}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => navigate(`/candidates/${c.id}`)}
                    className="p-1.5 bg-brand-dark hover:bg-brand-border rounded-lg border border-brand-border text-brand-muted hover:text-white transition"
                    title="View Details"
                  >
                    <Eye size={14} />
                  </button>
                  <button 
                    onClick={() => handleTriggerScreen(c.id)}
                    className="p-1.5 bg-brand-primary/10 hover:bg-brand-primary rounded-lg border border-brand-primary/20 text-brand-primary hover:text-white transition"
                    title="Run Screen Pipeline"
                  >
                    <Play size={14} />
                  </button>
                  <button 
                    onClick={() => handleDelete(c.id)}
                    className="p-1.5 bg-red-500/10 hover:bg-red-500 rounded-lg border border-red-500/20 text-red-400 hover:text-white transition"
                    title="Delete Record"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </Table>
      )}
    </div>
  );
}
