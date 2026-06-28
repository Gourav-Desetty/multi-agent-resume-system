import React, { useState, useEffect } from 'react';
import { Card } from '../components/Cards';
import { Mic, ShieldAlert, Award, FileSpreadsheet } from 'lucide-react';
import client from '../api/client';

export default function InterviewStudio() {
  const [candidates, setCandidates] = useState([]);
  const [selectedCand, setSelectedCand] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCandidates() {
      try {
        const response = await client.get('/api/candidates');
        const completed = response.data.filter(c => c.status === 'completed');
        setCandidates(completed);
        if (completed.length > 0) {
          setSelectedCand(completed[0]);
        }
      } catch (err) {
        console.error("Failed loading interview questions:", err);
      } finally {
        setLoading(false);
      }
    }
    loadCandidates();
  }, []);

  const studio = selectedCand?.interview_studio || {};
  const questions = studio.questions || [];

  const getDifficultyColor = (diff) => {
    const d = diff?.toLowerCase();
    if (d === 'easy') return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
    if (d === 'hard') return 'bg-red-500/10 border-red-500/20 text-red-400';
    return 'bg-amber-500/10 border-amber-500/20 text-amber-400'; // medium
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Interview Studio</h1>
        <p className="text-sm text-brand-muted mt-1">Review tailored interview questions generated specifically for candidates based on resume details and Job Requirements.</p>
      </div>

      {loading ? (
        <div className="py-12 flex items-center justify-center">
          <span className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></span>
        </div>
      ) : candidates.length === 0 ? (
        <div className="bg-brand-card border border-brand-border rounded-xl p-8 text-center text-brand-muted text-sm font-mono">
          No candidates have completed screening. Please screen candidates to generate questions.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Candidates list */}
          <div className="lg:col-span-1">
            <Card title="Select Candidate">
              <div className="space-y-2">
                {candidates.map((cand) => (
                  <div
                    key={cand.id}
                    onClick={() => setSelectedCand(cand)}
                    className={`p-3 border rounded-xl flex items-center justify-between cursor-pointer transition ${
                      selectedCand?.id === cand.id
                        ? 'bg-brand-primary/5 border-brand-primary text-brand-text'
                        : 'bg-brand-dark/40 border-brand-border text-brand-muted hover:border-brand-border/80'
                    }`}
                  >
                    <div className="truncate">
                      <p className="text-xs font-bold text-white truncate">{cand.profile?.name || cand.filename}</p>
                      <p className="text-xxs text-brand-muted truncate">Status: Ready</p>
                    </div>
                    <Mic size={14} className={selectedCand?.id === cand.id ? 'text-brand-primary' : 'text-brand-muted'} />
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Question List View */}
          <div className="lg:col-span-2 space-y-4">
            {selectedCand ? (
              <div className="space-y-4">
                <div className="bg-brand-card border border-brand-border rounded-2xl p-5 shadow-lg flex justify-between items-center mb-2">
                  <div>
                    <h3 className="text-base font-bold text-white">Interview Guide: {selectedCand.profile?.name}</h3>
                    <p className="text-xs text-brand-muted mt-0.5">5 tailored questions categorized by difficulty and type</p>
                  </div>
                </div>

                {questions.length > 0 ? (
                  questions.map((q, index) => (
                    <div key={index} className="bg-brand-card border border-brand-border rounded-2xl p-6 shadow-md space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xxs bg-brand-primary/10 text-brand-primary border border-brand-primary/20 px-2.5 py-0.5 rounded-full font-bold">
                          {q.category || 'Interview Question'}
                        </span>
                        <span className={`text-xxs border px-2 py-0.5 rounded-full font-mono font-semibold ${getDifficultyColor(q.difficulty)}`}>
                          {q.difficulty || 'Medium'}
                        </span>
                      </div>
                      
                      <p className="text-sm font-semibold text-white leading-relaxed">
                        Q{index + 1}: {q.question}
                      </p>

                      {q.expected_answer_points?.length > 0 && (
                        <div className="bg-brand-dark/40 border border-brand-border rounded-xl p-4 mt-2">
                          <h5 className="text-xxs font-bold text-brand-muted uppercase tracking-wider mb-2 flex items-center space-x-1">
                            <Award size={12} className="text-brand-primary" />
                            <span>Candidate evaluation checkpoints:</span>
                          </h5>
                          <ul className="list-disc list-inside text-xs text-brand-text space-y-1">
                            {q.expected_answer_points.map((pt, ptIdx) => (
                              <li key={ptIdx}>{pt}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="bg-brand-card border border-brand-border rounded-xl p-8 text-center text-brand-muted">
                    No tailored questions generated. Run screening.
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-brand-card border border-brand-border rounded-xl p-8 text-center text-brand-muted">
                Select a candidate from the left panel to load questions.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
