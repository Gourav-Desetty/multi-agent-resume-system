import json
import re
from backend.config import logger
from backend.prompts.templates import JD_MATCHER_PROMPT
from backend.agents.helper import call_llm, parse_json_safely, is_groq_configured
from backend.state.graph_state import AgentState

def run_jd_matcher_agent(state: AgentState) -> dict:
    logger.info("Executing JD Matcher Agent Node...")
    profile = state.get("profile") or {}
    job_text = state.get("job_text") or "Software Developer"
    
    if is_groq_configured():
        prompt = JD_MATCHER_PROMPT.format(
            candidate_profile=json.dumps(profile),
            job_description=job_text
        )
        res_str = call_llm(prompt)
        match_result = parse_json_safely(res_str)
        if match_result:
            logger.info("Successfully matched candidate against JD using Groq.")
            return {"match_result": match_result}

    logger.info("Running heuristic JD matcher fallback...")
    
    candidate_skills = {s.lower() for s in profile.get("skills", [])}
    jd_lower = job_text.lower()

    required_skills = set()
    skill_aliases = {
        "full-stack": ["javascript", "typescript", "react", "nextjs", "node.js", "html5", "css3", "rest apis"],
        "web": ["javascript", "react", "html5", "css3"],
        "backend": ["python", "fastapi", "flask", "node.js", "sql"],
        "frontend": ["react", "nextjs", "javascript", "typescript", "tailwind css"],
        "database": ["mysql", "postgresql", "mongodb", "redis", "sql"],
    }
    known_skills = set(candidate_skills)
    known_skills.update({
        "python", "java", "c++", "javascript", "typescript", "react", "nextjs", "node.js",
        "fastapi", "flask", "html5", "css3", "tailwind css", "mysql", "postgresql",
        "mongodb", "redis", "docker", "git", "rest apis", "groq", "supabase"
    })

    for skill in known_skills:
        if skill and skill in jd_lower:
            required_skills.add(skill)
    for keyword, implied_skills in skill_aliases.items():
        if keyword in jd_lower:
            required_skills.update(implied_skills)
    
    matched_skills = sorted(candidate_skills.intersection(required_skills))
            
    if required_skills:
        skill_score = min(100, int(45 + (len(matched_skills) / len(required_skills)) * 55))
    else:
        skill_score = min(90, 50 + len(candidate_skills) * 2)

    experiences = profile.get("experience", [])
    experience_text = " ".join(
        f"{exp.get('role', '')} {exp.get('company', '')} {' '.join(exp.get('responsibilities', []))}"
        for exp in experiences
    ).lower()
    relevant_exp_hits = sum(1 for skill in required_skills if skill in experience_text)
    exp_score = min(95, 45 + len(experiences) * 12 + relevant_exp_hits * 8)

    education_text = " ".join(
        f"{edu.get('degree', '')} {edu.get('institution', '')} {edu.get('major', '')}"
        for edu in profile.get("education", [])
    ).lower()
    edu_score = 88 if re.search(r"bachelor|b\.?tech|computer science|engineering|degree", education_text) else 62

    keyword_pool = set(re.findall(r"[a-z][a-z0-9+#.]{2,}", jd_lower))
    candidate_text = json.dumps(profile).lower()
    keyword_hits = sum(1 for kw in keyword_pool if kw in candidate_text)
    kw_score = min(95, 45 + keyword_hits * 5)
    overall = int((skill_score * 0.40) + (exp_score * 0.25) + (edu_score * 0.20) + (kw_score * 0.15))
    
    match_result = {
        "skill_match_score": skill_score,
        "experience_match_score": exp_score,
        "education_match_score": edu_score,
        "keyword_match_score": kw_score,
        "overall_match_score": overall,
        "confidence_score": 85,
        "reasoning": f"Matched skills: {', '.join(matched_skills) or 'none'}. Required signals considered: {', '.join(sorted(required_skills)) or 'general role keywords'}."
    }
    
    return {"match_result": match_result}
