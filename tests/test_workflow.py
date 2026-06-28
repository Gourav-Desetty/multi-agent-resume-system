from backend.services.graph_service import compiled_graph
from backend.state.graph_state import AgentState

def test_graph_compilation_and_execution():
    initial_state: AgentState = {
        "candidate_id": "test-c2",
        "raw_text": "Priya Sharma, priya@example.com, Python developer with AWS certification.",
        "job_id": "job-1",
        "job_text": "AWS cloud developer with Python knowledge",
        "profile": None,
        "match_result": None,
        "scores": None,
        "warnings": None,
        "skill_gap": None,
        "interview_studio": None,
        "feedback_report": None,
        "errors": []
    }
    
    # Run the graph synchronously
    final_state = compiled_graph.invoke(initial_state)
    
    # Assert each step in the pipeline did its job and mutated the state
    assert final_state["profile"] is not None
    assert final_state["profile"]["name"] == "Priya Sharma"
    assert final_state["match_result"] is not None
    assert final_state["scores"] is not None
    assert final_state["warnings"] is not None
    assert final_state["skill_gap"] is not None
    assert final_state["interview_studio"] is not None
    assert final_state["feedback_report"] is not None
    assert final_state["feedback_report"]["fit_status"] in ["Shortlisted", "Rejected", "Review Required"]
