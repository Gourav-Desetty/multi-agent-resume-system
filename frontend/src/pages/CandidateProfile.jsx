import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/Cards';
import { ArrowLeft, Download, FileText, Briefcase, GraduationCap, Award, Cpu, ShieldCheck } from 'lucide-react';
import client from '../api/client';

export default function CandidateProfile() {
  const { cid } = useParams();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await client.get(`/api/candidates/${cid}`);
        setCandidate(response.data);
      } catch (err) {
        console.error("Failed loading candidate profile:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [cid]);

  if (loading) {
    return (
      <div className="py-12 flex items-center justify-center">
        <span className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></span>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="bg-brand-card border border-brand-border rounded-xl p-8 text-center text-brand-muted">
        Candidate profile not found.
        <button onClick={() => navigate('/candidates')} className="mt-4 block mx-auto bg-brand-primary text-white px-4 py-2 rounded-lg text-sm">
          Return to repository
        </button>
      </div>
    );
  }

  const profile = candidate.profile || {};
  const report = candidate.feedback_report || {};
  const scores = candidate.scores || {};

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header controls */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate('/candidates')} 
          className="flex items-center space-x-2 text-brand-muted hover:text-white transition text-sm"
        >
          <ArrowLeft size={16} />
          <span>Back to candidates</span>
        </button>

        <div className="flex space-x-3">
          <a
            href={`/api/reports/${candidate.id}/pdf`}
            download
            className="flex items-center space-x-2 bg-brand-primary hover:bg-brand-primary/95 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-lg transition"
          >
            <Download size={14} />
            <span>Download PDF Report</span>
          </a>
          <a
            href={`/api/candidates/${candidate.id}/file`}
            download
            className="flex items-center space-x-2 bg-brand-card border border-brand-border hover:border-brand-primary text-brand-text px-4 py-2 rounded-xl text-xs transition"
          >
            <FileText size={14} />
            <span>Download Original Resume</span>
          </a>
        </div>
      </div>

      {/* Candidate Card Banner */}
      <div className="bg-brand-card border border-brand-border rounded-2xl p-6 shadow-lg flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
        <div className="w-16 h-16 rounded-2xl bg-brand-primary/10 border border-brand-primary/30 flex items-center justify-center text-brand-primary font-bold text-2xl">
          {profile.name?.charAt(0).toUpperCase() || '?'}
        </div>
        <div className="flex-1 text-center md:text-left space-y-1">
          <h2 className="text-xl font-bold text-white tracking-tight">{profile.name || candidate.filename}</h2>
          <p className="text-sm text-brand-muted">{profile.email || 'No email parsed'} | {profile.phone || 'No phone parsed'}</p>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-2">
            <span className="bg-brand-dark border border-brand-border px-2.5 py-0.5 rounded text-xxs font-mono text-brand-muted">
              ID: {candidate.id.slice(0, 8)}
            </span>
            <span className={`px-2.5 py-0.5 rounded text-xxs font-semibold border ${
              candidate.status === 'completed' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
              candidate.status === 'processing' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
              'bg-slate-500/10 border-slate-500/20 text-slate-400'
            }`}>
              Status: {candidate.status}
            </span>
          </div>
        </div>

        {candidate.status === 'completed' && (
          <div className="bg-brand-dark/50 border border-brand-border rounded-xl p-4 flex flex-col items-center">
            <span className="text-xxs font-semibold text-brand-muted uppercase tracking-wider">Overall Score</span>
            <span className="text-3xl font-extrabold text-brand-primary mt-1">{scores.final_score}/100</span>
            <span className="text-xxs text-brand-accent font-semibold mt-1">{report.fit_status || 'Review Required'}</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-brand-border space-x-4">
        {['overview', 'experience', 'education', 'skills', 'raw'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-sm font-semibold capitalize transition ${
              activeTab === tab 
                ? 'text-brand-primary border-b-2 border-brand-primary' 
                : 'text-brand-muted hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left summary cards */}
            <div className="md:col-span-2 space-y-6">
              <Card title="Assessment Summary">
                <p className="text-sm text-brand-text leading-relaxed whitespace-pre-line">
                  {report.summary || 'AI Assessment report has not been generated for this candidate. Click "Run Screen" from the repository to trigger assessment.'}
                </p>
              </Card>

              {candidate.status === 'completed' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-5">
                    <h4 className="text-sm font-bold text-emerald-400 mb-3 flex items-center space-x-2">
                      <ShieldCheck size={16} />
                      <span>Key Strengths</span>
                    </h4>
                    <ul className="space-y-2 text-xs text-brand-text list-disc list-inside">
                      {scores.strengths?.map((str, idx) => (
                        <li key={idx}>{str}</li>
                      )) || <li>None parsed</li>}
                    </ul>
                  </div>

                  <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-5">
                    <h4 className="text-sm font-bold text-red-400 mb-3 flex items-center space-x-2">
                      <ShieldCheck size={16} className="rotate-180" />
                      <span>Areas of Improvement / Gaps</span>
                    </h4>
                    <ul className="space-y-2 text-xs text-brand-text list-disc list-inside">
                      {scores.weaknesses?.map((wk, idx) => (
                        <li key={idx}>{wk}</li>
                      )) || <li>None parsed</li>}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Right scores column */}
            <div className="space-y-6">
              <Card title="AI Score Details">
                {candidate.status === 'completed' ? (
                  <div className="space-y-4">
                    {[
                      { label: 'Technical Skills', val: scores.technical_skills },
                      { label: 'Experience Level', val: scores.experience },
                      { label: 'Education Alignment', val: scores.education },
                      { label: 'Projects Quality', val: scores.projects },
                      { label: 'Certifications', val: scores.certifications },
                      { label: 'Soft Skills Fit', val: scores.soft_skills }
                    ].map((item) => (
                      <div key={item.label} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-brand-muted">{item.label}</span>
                          <span className="text-white">{item.val}/100</span>
                        </div>
                        <div className="w-full bg-brand-dark rounded-full h-1.5 overflow-hidden border border-brand-border">
                          <div className="bg-brand-primary h-full rounded-full" style={{ width: `${item.val}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-brand-muted text-center font-mono">No score data compiled</p>
                )}
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'experience' && (
          <Card title="Work History & Projects">
            {profile.experience?.length > 0 ? (
              <div className="space-y-6 relative border-l border-brand-border pl-6 ml-3">
                {profile.experience.map((exp, idx) => (
                  <div key={idx} className="relative">
                    <span className="absolute -left-[31px] top-1.5 w-3 h-3 bg-brand-primary rounded-full border-2 border-brand-dark"></span>
                    <div className="space-y-1">
                      <div className="flex justify-between items-start">
                        <h4 className="text-sm font-bold text-white">{exp.role}</h4>
                        <span className="text-xxs text-brand-muted font-mono">{exp.duration}</span>
                      </div>
                      <p className="text-xs text-brand-muted font-medium">{exp.company}</p>
                      <ul className="list-disc list-inside text-xs text-brand-text space-y-1 mt-2">
                        {exp.responsibilities?.map((resp, rIdx) => (
                          <li key={rIdx} className="leading-relaxed">{resp}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-brand-muted font-mono text-center">No experience parsed.</p>
            )}
          </Card>
        )}

        {activeTab === 'education' && (
          <Card title="Education & Credentials">
            {profile.education?.length > 0 ? (
              <div className="space-y-4">
                {profile.education.map((edu, idx) => (
                  <div key={idx} className="flex items-start space-x-3 p-3 bg-brand-dark/40 border border-brand-border rounded-xl">
                    <GraduationCap className="text-brand-primary shrink-0 mt-1" size={20} />
                    <div className="space-y-0.5">
                      <h4 className="text-sm font-bold text-white">{edu.degree}</h4>
                      <p className="text-xs text-brand-muted">{edu.institution} {edu.year ? `(${edu.year})` : ''}</p>
                      {edu.major && <p className="text-xxs text-brand-muted font-mono">Major: {edu.major}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-brand-muted font-mono text-center">No education history parsed.</p>
            )}
          </Card>
        )}

        {activeTab === 'skills' && (
          <Card title="Parsed Skills Matrix">
            <div className="flex flex-wrap gap-2">
              {profile.skills?.map((skill) => (
                <span 
                  key={skill} 
                  className="bg-brand-dark hover:bg-brand-border text-brand-text px-3 py-1 rounded-lg text-xs border border-brand-border font-medium cursor-default transition"
                >
                  {skill}
                </span>
              )) || <p className="text-xs text-brand-muted font-mono">No skills extracted.</p>}
            </div>
          </Card>
        )}

        {activeTab === 'raw' && (
          <Card title="Raw Resume Text Extracted">
            <pre className="bg-brand-dark/60 border border-brand-border rounded-xl p-4 text-xs font-mono text-brand-muted leading-relaxed whitespace-pre-wrap overflow-x-auto h-96">
              {candidate.raw_text}
            </pre>
          </Card>
        )}
      </div>
    </div>
  );
}
