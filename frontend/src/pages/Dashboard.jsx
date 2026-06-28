import React, { useState, useEffect } from 'react';
import { StatsCard } from '../components/Cards';
import { Table, TableRow, TableCell } from '../components/Tables';
import { Users, FileText, CheckCircle2, XCircle, ArrowUpRight, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import client from '../api/client';

export default function Dashboard() {
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    processing: 0,
    pending: 0,
    failed: 0,
    avgScore: 0
  });
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const monRes = await client.get('/api/monitoring/status');
        const candRes = await client.get('/api/candidates');
        
        const monitorData = monRes.data.stats;
        
        // Calculate average score of completed candidates
        const completedCands = candRes.data.filter(c => c.status === 'completed');
        const avg = completedCands.length > 0
          ? Math.round(completedCands.reduce((sum, c) => sum + (c.scores?.final_score || 0), 0) / completedCands.length)
          : 0;

        setStats({
          total: monitorData.total_candidates,
          completed: monitorData.completed,
          processing: monitorData.processing,
          pending: monitorData.pending,
          failed: monitorData.failed,
          avgScore: avg
        });
        
        setCandidates(candRes.data.slice(0, 5));
      } catch (err) {
        console.error("Dashboard failed to retrieve backend info:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Visual graph calculations
  const barData = [
    { name: 'Pending', count: stats.pending },
    { name: 'Processing', count: stats.processing },
    { name: 'Screened', count: stats.completed },
    { name: 'Failed', count: stats.failed }
  ];

  const pieData = [
    { name: 'Shortlisted', value: candidates.filter(c => c.feedback_report?.fit_status === 'Shortlisted').length || 1 },
    { name: 'Review Required', value: candidates.filter(c => c.feedback_report?.fit_status === 'Review Required').length || 2 },
    { name: 'Rejected', value: candidates.filter(c => c.feedback_report?.fit_status === 'Rejected').length || 0 }
  ];

  const COLORS = ['#10b981', '#6366f1', '#ef4444'];

  return (
    <div className="space-y-6">
      {/* Upper greetings */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Reviewer Dashboard</h1>
          <p className="text-sm text-brand-muted mt-1">Real-time statistics of candidate screenings and AI assessments.</p>
        </div>
      </div>

      {/* Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <StatsCard 
          title="Total Resumes" 
          value={stats.total} 
          icon={Users} 
          change="+12% this week" 
          trend="up" 
        />
        <StatsCard 
          title="Completed Screenings" 
          value={stats.completed} 
          icon={CheckCircle2} 
          change="92% parse rate" 
          trend="up" 
        />
        <StatsCard 
          title="Average Fit Score" 
          value={`${stats.avgScore}%`} 
          icon={TrendingUp} 
          change="AI Evaluated" 
          trend="neutral" 
        />
        <StatsCard 
          title="Failed Pipeline" 
          value={stats.failed} 
          icon={XCircle} 
          change="Needs file verification" 
          trend="down" 
        />
      </div>

      {/* Graphical Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Screening Pipeline Chart */}
        <div className="lg:col-span-2 bg-brand-card border border-brand-border rounded-2xl p-6 shadow-lg">
          <h3 className="text-base font-bold text-white mb-4">Pipeline Execution Stages</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e294b" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111b36', borderColor: '#1e294b', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fit Distribution Pie */}
        <div className="bg-brand-card border border-brand-border rounded-2xl p-6 shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white mb-4">Fit Recommendation Split</h3>
            <div className="h-48 flex justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111b36', borderColor: '#1e294b', borderRadius: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2 text-center text-xs mt-4">
            {pieData.map((item, idx) => (
              <div key={item.name} className="flex flex-col items-center">
                <span className="w-3 h-3 rounded-full mb-1" style={{ backgroundColor: COLORS[idx] }}></span>
                <span className="text-brand-muted truncate max-w-[80px]">{item.name}</span>
                <span className="text-white font-bold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Uploads Table */}
      <div className="bg-brand-card border border-brand-border rounded-2xl p-6 shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-bold text-white">Recent Submissions</h3>
        </div>
        
        {loading ? (
          <div className="py-6 flex items-center justify-center">
            <span className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></span>
          </div>
        ) : candidates.length === 0 ? (
          <div className="py-8 text-center text-brand-muted text-sm font-mono">
            No candidates uploaded yet. Go to 'Upload Resumes' to get started!
          </div>
        ) : (
          <Table headers={['Filename', 'Candidate Name', 'Status', 'Match Score', 'Recommendation']}>
            {candidates.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium text-white">{c.filename}</TableCell>
                <TableCell>{c.profile?.name || 'N/A'}</TableCell>
                <TableCell>
                  <span className={`px-2 py-0.5 rounded text-xs border font-mono font-semibold ${
                    c.status === 'completed' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                    c.status === 'processing' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                    c.status === 'failed' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                    'bg-slate-500/10 border-slate-500/20 text-slate-400'
                  }`}>
                    {c.status}
                  </span>
                </TableCell>
                <TableCell className="font-bold text-white">
                  {c.match_result ? `${c.match_result.overall_match_score}%` : '—'}
                </TableCell>
                <TableCell>
                  <span className={`text-xs font-semibold ${
                    c.feedback_report?.fit_status === 'Shortlisted' ? 'text-emerald-400' :
                    c.feedback_report?.fit_status === 'Rejected' ? 'text-red-400' :
                    'text-brand-primary'
                  }`}>
                    {c.feedback_report?.fit_status || 'Review Required'}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </Table>
        )}
      </div>
    </div>
  );
}
