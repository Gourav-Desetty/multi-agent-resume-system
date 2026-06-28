from typing import TypedDict, List, Optional, Dict, Any

class AgentState(TypedDict):
    candidate_id: str
    raw_text: str
    job_id: Optional[str]
    job_text: Optional[str]
    
    # Agent Outputs
    profile: Optional[Dict[str, Any]]
    match_result: Optional[Dict[str, Any]]
    scores: Optional[Dict[str, Any]]
    warnings: Optional[List[str]]
    skill_gap: Optional[Dict[str, Any]]
    interview_studio: Optional[Dict[str, Any]]
    feedback_report: Optional[Dict[str, Any]]
    
    # Metadata & Tracking
    errors: Optional[List[str]]
    last_updated: Optional[str]
