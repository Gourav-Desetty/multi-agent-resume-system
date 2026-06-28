import json
from backend.config import logger
from backend.prompts.templates import SCORING_PROMPT
from backend.agents.helper import call_llm, parse_json_safely, is_groq_configured
from backend.state.graph_state import AgentState

def run_scoring_agent(state: AgentState) -> dict:
    logger.info("Executing Scoring Agent Node...")
    profile = state.get("profile") or {}
    match_result = state.get("match_result") or {}
    
    if is_groq_configured():
        prompt = SCORING_PROMPT.format(
            candidate_profile=json.dumps(profile),
            match_result=json.dumps(match_result)
        )
        res_str = call_llm(prompt)
        scores = parse_json_safely(res_str)
        if scores:
            logger.info("Successfully evaluated candidate score using Groq.")
            return {"scores": scores}
            
    logger.info("Running heuristic scoring fallback...")
    
    overall_match = match_result.get("overall_match_score", 80)
    skills = profile.get("skills", [])
    experiences = profile.get("experience", [])
    education = profile.get("education", [])
    projects = profile.get("projects", [])
    certifications = profile.get("certifications", [])
    achievements = profile.get("achievements", [])

    technical_score = min(100, max(35, match_result.get("skill_match_score", 50) + min(15, len(skills) // 4)))
    experience_score = min(100, max(30, match_result.get("experience_match_score", 50) + len(experiences) * 4))
    education_score = match_result.get("education_match_score", 65) if education else 45
    project_score = min(95, 50 + len(projects) * 12 + min(20, len(skills) // 5))
    cert_score = min(90, 45 + len(certifications) * 15)
    soft_score = min(90, 60 + len(achievements) * 5 + len(experiences) * 3)
    achievement_score = min(90, 45 + len(achievements) * 10)
    final_score = int(
        technical_score * 0.30
        + experience_score * 0.22
        + education_score * 0.15
        + project_score * 0.15
        + cert_score * 0.08
        + soft_score * 0.05
        + achievement_score * 0.05
    )

    top_skills = skills[:6]
    strengths = []
    if top_skills:
        strengths.append(f"Relevant technical stack includes {', '.join(top_skills)}.")
    if experiences:
        strengths.append(f"Has {len(experiences)} parsed experience entr{'y' if len(experiences) == 1 else 'ies'} aligned to prior work.")
    if projects:
        strengths.append(f"Shows {len(projects)} parsed project entr{'y' if len(projects) == 1 else 'ies'} supporting practical delivery.")
    if education:
        strengths.append("Education section was parsed and contributes to role alignment.")

    weaknesses = []
    if technical_score < 70:
        weaknesses.append("Limited overlap between parsed skills and the target job requirements.")
    if not certifications:
        weaknesses.append("No certifications were parsed from the resume.")
    if not projects:
        weaknesses.append("No structured projects were parsed from the resume.")
    if len(experiences) == 0:
        weaknesses.append("No structured work experience was parsed from the resume.")

    if not strengths:
        strengths.append("Candidate has a readable profile with basic contact and education details.")
    if not weaknesses:
        weaknesses.append("No major gaps found by the heuristic scorer; review manually for nuance.")
    
    scores = {
        "technical_skills": technical_score,
        "experience": experience_score,
        "education": education_score,
        "projects": project_score,
        "certifications": cert_score,
        "soft_skills": soft_score,
        "achievements": achievement_score,
        "final_score": final_score,
        "strengths": strengths[:4],
        "weaknesses": weaknesses[:4],
        "detailed_explanation": f"Final score {final_score}/100 is based on {len(skills)} parsed skills, {len(experiences)} experience entries, {len(projects)} projects, and an overall JD match of {overall_match}/100."
    }
    
    return {"scores": scores}
