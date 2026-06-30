from backend.state.graph_state import AgentState
from backend.agents.parser import run_parser_agent
from backend.agents.jd_matcher import run_jd_matcher_agent
from backend.agents.scoring import run_scoring_agent
from backend.agents.skill_gap import run_skill_gap_agent

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

def test_parser_agent_extracts_certifications(monkeypatch):
    monkeypatch.setattr("backend.agents.parser.is_groq_configured", lambda: False)
    state: AgentState = {
        "candidate_id": "test-certs",
        "raw_text": """Alex Mercer
alex@example.com
CERTIFICATIONS
- Mastering Retrieval-Augmented Generation - Neo4j | Oct 2025
- Machine Learning Onramp - MathWorks | Jul 2025
PROJECTS
Example App - Built with Python
""",
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

    assert result["profile"]["certifications"] == [
        {
            "name": "Mastering Retrieval-Augmented Generation",
            "issuer": "Neo4j",
            "year": "Oct 2025",
        },
        {
            "name": "Machine Learning Onramp",
            "issuer": "MathWorks",
            "year": "Jul 2025",
        },
    ]

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

def test_skill_gap_fallback_uses_actual_job_requirements(monkeypatch):
    monkeypatch.setattr("backend.agents.skill_gap.is_groq_configured", lambda: False)
    state: AgentState = {
        "candidate_id": "test-c1",
        "raw_text": "",
        "job_id": "job-1",
        "job_text": "Need Python, Kafka and Kubernetes experience.",
        "profile": {
            "skills": ["Python", "Kubernetes"]
        },
        "match_result": None,
        "scores": None,
        "warnings": None,
        "skill_gap": None,
        "interview_studio": None,
        "feedback_report": None,
        "errors": []
    }

    result = run_skill_gap_agent(state)

    assert result["skill_gap"]["missing_skills"] == ["Kafka"]
