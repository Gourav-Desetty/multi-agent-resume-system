import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/Cards';
import { Table, TableRow, TableCell } from '../components/Tables';
import { AlertTriangle, Trophy, Eye, CheckCircle2 } from 'lucide-react';
import client from '../api/client';

export default function RankingBoard() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadCandidates() {
      try {
        const response = await client.get('/api/candidates');
        // Only show completed ones and sort desc by final score
        const completed = response.data
          .filter(c => c.status === 'completed')
          .sort((a, b) => (b.scores?.final_score || 0) - (a.scores?.final_score || 0));
        setCandidates(completed);
      } catch (err) {
        console.error("Failed loading rankings:", err);
      } finally {
        setLoading(false);
      }
    }
    loadCandidates();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Ranking Board</h1>
        <p className="text-sm text-brand-muted mt-1">Global ranking of all candidates who completed screening. Outliers and warnings are automatically flagged.</p>
      </div>

      {loading ? (
        <div className="py-12 flex items-center justify-center">
          <span className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></span>
        </div>
      ) : candidates.length === 0 ? (
        <div className="bg-brand-card border border-brand-border rounded-xl p-8 text-center text-brand-muted text-sm font-mono">
          No candidates have been evaluated yet. Please perform a screening run on the Candidate Repository screen.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Candidates Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {candidates.slice(0, 3).map((c, index) => (
              <div 
                key={c.id} 
                onClick={() => navigate(`/candidates/${c.id}`)}
                className="bg-brand-card border border-brand-border hover:border-brand-primary/50 transition cursor-pointer rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between"
              >
                {/* Trophy Background overlay */}
                <div className="absolute right-2 bottom-2 text-brand-primary/5 select-none">
                  <Trophy size={96} />
                </div>
                
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-xxs bg-brand-primary/10 text-brand-primary px-2.5 py-0.5 rounded-full font-mono font-bold">
                      RANK #{index + 1}
                    </span>
                    <span className="text-2xl font-extrabold text-white">{c.scores?.final_score}%</span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-3 truncate">{c.profile?.name || c.filename}</h3>
                  <p className="text-xs text-brand-muted truncate">{c.profile?.email || 'N/A'}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-brand-border/60 flex items-center justify-between text-xs text-brand-muted">
                  <span>Match: {c.match_result?.overall_match_score}%</span>
                  <span className="text-brand-accent font-semibold">{c.feedback_report?.fit_status || 'Review'}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Ranking Grid */}
          <Card title="Rankings Leaderboard">
            <Table headers={['Rank', 'Candidate', 'Overall Match', 'Technical Skills', 'Experience Fit', 'Warnings', 'Action']}>
              {candidates.map((c, index) => {
                const warnings = c.warnings || [];
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-bold text-white font-mono text-center w-12">
                      #{index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-white">{c.profile?.name || c.filename}</span>
                        <span className="text-xxs text-brand-muted">{c.profile?.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-bold text-white">{c.match_result?.overall_match_score}%</TableCell>
                    <TableCell>{c.scores?.technical_skills}/100</TableCell>
                    <TableCell>{c.scores?.experience}/100</TableCell>
                    <TableCell>
                      {warnings.length > 0 ? (
                        <div className="flex items-center space-x-1 text-amber-400" title={warnings.join('\n')}>
                          <AlertTriangle size={14} />
                          <span className="text-xxs font-mono">{warnings.length} Flag(s)</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1 text-emerald-400">
                          <CheckCircle2 size={14} />
                          <span className="text-xxs">Clean</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <button 
                        onClick={() => navigate(`/candidates/${c.id}`)}
                        className="p-1.5 bg-brand-dark hover:bg-brand-border rounded-lg border border-brand-border text-brand-muted hover:text-white transition"
                      >
                        <Eye size={12} />
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </Table>
          </Card>
        </div>
      )}
    </div>
  );
}
