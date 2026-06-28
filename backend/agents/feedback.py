import json
from backend.config import logger
from backend.prompts.templates import FEEDBACK_PROMPT
from backend.agents.helper import call_llm, parse_json_safely, is_groq_configured
from backend.state.graph_state import AgentState

def run_feedback_agent(state: AgentState) -> dict:
    logger.info("Executing Feedback Agent Node...")
    profile = state.get("profile") or {}
    match_result = state.get("match_result") or {}
    scores = state.get("scores") or {}
    warnings = state.get("warnings") or []
    
    scoring_details = {
        "match": match_result,
        "scores": scores,
        "warnings": warnings
    }
    
    if is_groq_configured():
        prompt = FEEDBACK_PROMPT.format(
            candidate_profile=json.dumps(profile),
            scoring_details=json.dumps(scoring_details)
        )
        res_str = call_llm(prompt)
        feedback_report = parse_json_safely(res_str)
        if feedback_report:
            logger.info("Successfully compiled candidate summary using Groq.")
            return {"feedback_report": feedback_report}
            
    logger.info("Running heuristic feedback report fallback...")
    
    final_score = scores.get("final_score", 80)
    candidate_name = profile.get("name") or "The candidate"
    skills = profile.get("skills", [])
    experiences = profile.get("experience", [])
    projects = profile.get("projects", [])
    
    fit_status = "Review Required"
    if final_score >= 82:
        fit_status = "Shortlisted"
    elif final_score < 60:
        fit_status = "Rejected"
        
    feedback_report = {
        "summary": f"{candidate_name} scored {final_score}% against the selected job profile, with {len(skills)} parsed skills, {len(experiences)} experience entries, and {len(projects)} projects considered.",
        "strengths_summary": " ".join(scores.get("strengths", [])[:2]) or "Readable candidate profile with usable parsed resume data.",
        "weaknesses_summary": " ".join(scores.get("weaknesses", [])[:2]) or "No major gaps found by the heuristic scorer.",
        "recommendations": [
            f"Probe the candidate's strongest parsed skills: {', '.join(skills[:5]) or 'not enough skill data parsed'}.",
            "Verify resume parsing output against the original PDF before making a final decision."
        ],
        "fit_status": fit_status
    }
    
    return {"feedback_report": feedback_report}
