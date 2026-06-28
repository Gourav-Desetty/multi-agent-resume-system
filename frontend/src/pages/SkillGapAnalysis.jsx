import React, { useState, useEffect } from 'react';
import { Card } from '../components/Cards';
import { Cpu, CheckCircle2, AlertCircle, ArrowRight, GraduationCap } from 'lucide-react';
import client from '../api/client';

export default function SkillGapAnalysis() {
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
        console.error("Failed loading gap analysis:", err);
      } finally {
        setLoading(false);
      }
    }
    loadCandidates();
  }, []);

  const gap = selectedCand?.skill_gap || {};
  const profile = selectedCand?.profile || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Skill Gap Analysis</h1>
        <p className="text-sm text-brand-muted mt-1">Check missing skills of candidates and browse suggested certifications and roadmap pathways.</p>
      </div>

      {loading ? (
        <div className="py-12 flex items-center justify-center">
          <span className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></span>
        </div>
      ) : candidates.length === 0 ? (
        <div className="bg-brand-card border border-brand-border rounded-xl p-8 text-center text-brand-muted text-sm font-mono">
          No candidates have completed screening. Please perform evaluations to unlock gap reports.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Candidates Selector Panel */}
          <div className="lg:col-span-1 space-y-4">
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
                      <p className="text-xxs text-brand-muted truncate">Fit Score: {cand.scores?.final_score}%</p>
                    </div>
                    <Cpu size={14} className={selectedCand?.id === cand.id ? 'text-brand-primary animate-pulse' : 'text-brand-muted'} />
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Analysis View Panel */}
          <div className="lg:col-span-2 space-y-6">
            {selectedCand ? (
              <div className="space-y-6">
                {/* Banner */}
                <div className="bg-brand-card border border-brand-border rounded-2xl p-6 shadow-lg flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold text-white">{profile.name}'s Profile Assessment</h3>
                    <p className="text-xs text-brand-muted mt-0.5">Analysing gaps against Linked Job Profile</p>
                  </div>
                  <div className="text-center bg-brand-dark border border-brand-border rounded-xl px-4 py-2">
                    <span className="text-xxs font-semibold text-brand-muted uppercase">Gap Score Potential</span>
                    <p className="text-2xl font-extrabold text-brand-accent mt-0.5">+{gap.improvement_score || 0}%</p>
                  </div>
                </div>

                {/* Skills splits */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-brand-card border border-brand-border rounded-xl p-5 shadow">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center space-x-1.5">
                      <CheckCircle2 className="text-emerald-400" size={14} />
                      <span>Existing Core Skills ({profile.skills?.length || 0})</span>
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.skills?.map(sk => (
                        <span key={sk} className="bg-brand-dark border border-brand-border text-brand-muted text-xxs px-2 py-0.5 rounded">
                          {sk}
                        </span>
                      )) || <span className="text-xxs text-brand-muted">None listed</span>}
                    </div>
                  </div>

                  <div className="bg-brand-card border border-brand-border rounded-xl p-5 shadow">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center space-x-1.5">
                      <AlertCircle className="text-amber-400" size={14} />
                      <span>Identified Skill Gaps ({gap.missing_skills?.length || 0})</span>
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {gap.missing_skills?.map(sk => (
                        <span key={sk} className="bg-amber-400/10 border border-amber-400/20 text-amber-400 text-xxs px-2 py-0.5 rounded">
                          {sk}
                        </span>
                      )) || <span className="text-xxs text-brand-accent font-semibold">Aligns perfectly with JD!</span>}
                    </div>
                  </div>
                </div>

                {/* Learning Roadmap */}
                <Card title="Upskilling Learning Roadmap">
                  {gap.learning_roadmap?.length > 0 ? (
                    <div className="space-y-4">
                      {gap.learning_roadmap.map((step, idx) => (
                        <div key={idx} className="flex items-start space-x-3 text-xs leading-relaxed text-brand-text">
                          <span className="w-5 h-5 rounded-full bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary font-bold font-mono text-xxs shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <p>{step}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-brand-muted font-mono text-center">No roadmap suggestions compiled.</p>
                  )}
                </Card>

                {/* Courses and Certifications */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-brand-card border border-brand-border rounded-xl p-5 shadow">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center space-x-1.5">
                      <GraduationCap className="text-brand-primary" size={14} />
                      <span>Recommended Training Courses</span>
                    </h4>
                    <ul className="space-y-2 text-xs text-brand-text">
                      {gap.suggested_courses?.map((course, idx) => (
                        <li key={idx} className="flex items-start space-x-1">
                          <span className="text-brand-primary shrink-0 mt-0.5">•</span>
                          <span>{course}</span>
                        </li>
                      )) || <li className="text-xxs text-brand-muted">None recommended</li>}
                    </ul>
                  </div>

                  <div className="bg-brand-card border border-brand-border rounded-xl p-5 shadow">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center space-x-1.5">
                      <GraduationCap className="text-brand-primary" size={14} />
                      <span>Suggested Certifications</span>
                    </h4>
                    <ul className="space-y-2 text-xs text-brand-text">
                      {gap.suggested_certifications?.map((cert, idx) => (
                        <li key={idx} className="flex items-start space-x-1">
                          <span className="text-brand-primary shrink-0 mt-0.5">•</span>
                          <span>{cert}</span>
                        </li>
                      )) || <li className="text-xxs text-brand-muted">None recommended</li>}
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-brand-card border border-brand-border rounded-xl p-10 text-center text-brand-muted">
                Select a candidate from the left panel to review skill maps.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
