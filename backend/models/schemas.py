from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Any

# Authentication
class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    username: str
    role: str # 'Admin', 'Reviewer', 'HR'

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class TokenData(BaseModel):
    username: Optional[str] = None

# Candidate Resume Entities
class Education(BaseModel):
    degree: str
    institution: str
    year: Optional[str] = None
    major: Optional[str] = None

class Experience(BaseModel):
    role: str
    company: str
    duration: Optional[str] = None
    responsibilities: List[str] = Field(default_factory=list)

class Project(BaseModel):
    title: str
    description: Optional[str] = None
    technologies: List[str] = Field(default_factory=list)

class Certification(BaseModel):
    name: str
    issuer: Optional[str] = None
    year: Optional[str] = None

class CandidateProfile(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    education: List[Education] = Field(default_factory=list)
    experience: List[Experience] = Field(default_factory=list)
    skills: List[str] = Field(default_factory=list)
    projects: List[Project] = Field(default_factory=list)
    certifications: List[Certification] = Field(default_factory=list)
    achievements: List[str] = Field(default_factory=list)

# Job Description Entities
class JobDescription(BaseModel):
    id: str
    title: str
    department: Optional[str] = None
    raw_text: str
    skills: List[str] = Field(default_factory=list)
    experience_years: Optional[float] = None
    education_required: Optional[str] = None
    responsibilities: List[str] = Field(default_factory=list)
    keywords: List[str] = Field(default_factory=list)
    created_at: Optional[str] = None

# Match result (JD Matcher Agent)
class JobMatch(BaseModel):
    skill_match_score: int = 0
    experience_match_score: int = 0
    education_match_score: int = 0
    keyword_match_score: int = 0
    overall_match_score: int = 0
    confidence_score: int = 0
    reasoning: str = ""

# Scoring Grid (Scoring Agent)
class ScoreResult(BaseModel):
    technical_skills: int = 0
    experience: int = 0
    education: int = 0
    projects: int = 0
    certifications: int = 0
    soft_skills: int = 0
    achievements: int = 0
    final_score: int = 0
    strengths: List[str] = Field(default_factory=list)
    weaknesses: List[str] = Field(default_factory=list)
    detailed_explanation: str = ""

# Skill Gaps (Skill Gap Agent)
class SkillGap(BaseModel):
    missing_skills: List[str] = Field(default_factory=list)
    learning_roadmap: List[str] = Field(default_factory=list)
    suggested_certifications: List[str] = Field(default_factory=list)
    suggested_courses: List[str] = Field(default_factory=list)
    improvement_score: int = 0 # Out of 100 improvement potential

# Interview Question (Interview Agent)
class InterviewQuestion(BaseModel):
    question: str
    category: str # 'Technical', 'Behavioral', 'Project-based', 'Scenario-based', 'Coding'
    difficulty: str # 'Easy', 'Medium', 'Hard'
    expected_answer_points: List[str] = Field(default_factory=list)

class InterviewStudio(BaseModel):
    questions: List[InterviewQuestion] = Field(default_factory=list)

# Feedback Summary Report (Feedback Agent)
class FeedbackReport(BaseModel):
    summary: str = ""
    strengths_summary: str = ""
    weaknesses_summary: str = ""
    recommendations: List[str] = Field(default_factory=list)
    fit_status: str = "Review Required" # 'Shortlisted', 'Rejected', 'Review Required'

# Complete candidate entity in DB
class Candidate(BaseModel):
    id: str
    filename: str
    raw_text: str
    status: str = "pending" # 'pending', 'processing', 'completed', 'failed'
    profile: Optional[CandidateProfile] = None
    match_result: Optional[JobMatch] = None
    scores: Optional[ScoreResult] = None
    skill_gap: Optional[SkillGap] = None
    interview_studio: Optional[InterviewStudio] = None
    feedback_report: Optional[FeedbackReport] = None
    last_updated: Optional[str] = None
    active_job_id: Optional[str] = None
    warnings: List[str] = Field(default_factory=list)
