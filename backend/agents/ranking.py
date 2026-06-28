import json
from backend.config import logger
from backend.prompts.templates import RANKING_PROMPT
from backend.agents.helper import call_llm, parse_json_safely, is_groq_configured
from backend.state.graph_state import AgentState

def run_ranking_agent(state: AgentState) -> dict:
    logger.info("Executing Ranking Agent Node...")
    profile = state.get("profile") or {}
    
    if is_groq_configured():
        prompt = RANKING_PROMPT.format(candidate_profile=json.dumps(profile))
        res_str = call_llm(prompt)
        warnings = parse_json_safely(res_str)
        # Note: we expect warnings to be a list of strings
        if isinstance(warnings, list):
            logger.info("Successfully audited candidate profile using Groq.")
            return {"warnings": warnings}
            
    # Mock / Heuristics fallback audit
    logger.info("Running mock ranking/audit fallback...")
    warnings = []
    
    # Heuristics check
    skills = [s.lower() for s in profile.get("skills", [])]
    
    # Check for target requirements
    job_text = (state.get("job_text") or "").lower()
    if "fastapi" in job_text and "fastapi" not in skills:
        warnings.append("Missing explicit experience in target FastAPI backend framework.")
    if "react" in job_text and "react" not in skills:
        warnings.append("Missing explicit experience in React frontend styling libraries.")
        
    # Mock date gap
    warnings.append("Candidate shows a potential career gap of 6 months between graduation and their first job.")
    
    return {"warnings": warnings}
