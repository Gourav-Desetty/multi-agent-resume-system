from backend.state.graph_state import AgentState
from backend.agents.parser import run_parser_agent
from backend.agents.jd_matcher import run_jd_matcher_agent
from backend.agents.scoring import run_scoring_agent

def test_parser_agent():
    state: AgentState = {
        "candidate_id": "test-c1",
        "raw_text": "Alex Mercer, email: alex@example.com, React and Python developer.",
        "job_id": None,
        "job_text": None,
        "profile": None,
        "match_result": None,
        "scores": None,
        "warnings": None,
        "skill_gap": None,
        "interview_studio": None,
        "feedback_report": None,
        "errors": []
    }
    
    result = run_parser_agent(state)
    assert "profile" in result
    assert result["profile"]["name"] == "Alex Mercer"
    assert result["profile"]["email"] == "alex@example.com"

def test_jd_matcher_agent():
    state: AgentState = {
        "candidate_id": "test-c1",
        "raw_text": "",
        "job_id": "job-1",
        "job_text": "We are seeking a React and Python Backend Developer.",
        "profile": {
            "skills": ["React", "Python", "FastAPI"]
        },
        "match_result": None,
        "scores": None,
        "warnings": None,
        "skill_gap": None,
        "interview_studio": None,
        "feedback_report": None,
        "errors": []
    }
    
    result = run_jd_matcher_agent(state)
    assert "match_result" in result
    assert result["match_result"]["skill_match_score"] > 50
    assert "reasoning" in result["match_result"]
