import json
from backend.config import logger
from backend.prompts.templates import SKILL_GAP_PROMPT
from backend.agents.helper import call_llm, parse_json_safely, is_groq_configured
from backend.state.graph_state import AgentState

def run_skill_gap_agent(state: AgentState) -> dict:
    logger.info("Executing Skill Gap Agent Node...")
    profile = state.get("profile") or {}
    job_text = state.get("job_text") or ""
    
    candidate_skills = profile.get("skills", [])
    
    if is_groq_configured():
        prompt = SKILL_GAP_PROMPT.format(
            candidate_skills=", ".join(candidate_skills),
            job_description=job_text
        )
        res_str = call_llm(prompt)
        skill_gap = parse_json_safely(res_str)
        if skill_gap:
            logger.info("Successfully analyzed skill gaps using Groq.")
            return {"skill_gap": skill_gap}
            
    # Mock fallback skill gap logic
    logger.info("Running mock skill gap fallback...")
    
    # Simple gap check
    missing = ["Kafka", "GraphQL", "Kubernetes"]
    
    skill_gap = {
        "missing_skills": missing,
        "learning_roadmap": [
            "Learn Kafka messaging basics: Read official guides and implement a local producer-consumer system.",
            "Integrate Kafka consumers inside a FastAPI microservice flow for async tasks.",
            "Deploy applications inside Docker and orchestrate them using Kubernetes clusters."
        ],
        "suggested_certifications": [
            "Confluent Certified Developer for Apache Kafka",
            "Certified Kubernetes Administrator (CKA)"
        ],
        "suggested_courses": [
            "Apache Kafka Series - Learn Apache Kafka on Udemy",
            "Kubernetes for Developers on Coursera"
        ],
        "improvement_score": 15
    }
    
    return {"skill_gap": skill_gap}
