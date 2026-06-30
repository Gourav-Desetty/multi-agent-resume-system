import re
from backend.config import logger
from backend.prompts.templates import SKILL_GAP_PROMPT
from backend.agents.helper import call_llm, parse_json_safely, is_groq_configured
from backend.agents.parser import KNOWN_SKILLS
from backend.state.graph_state import AgentState

LEGACY_MOCK_MISSING_SKILLS = ["Kafka", "GraphQL", "Kubernetes"]

EXTRA_JOB_SKILLS = [
    "FastAPI", "AWS", "Azure", "GCP", "GraphQL", "Kafka", "RabbitMQ", "Celery",
    "Redux", "Express", "Spring Boot", "REST", "REST API", "REST APIs", "CI/CD",
    "Jenkins", "GitHub Actions", "Terraform", "Ansible", "Elasticsearch",
    "Snowflake", "Databricks", "Spark", "Airflow", "Tableau", "Power BI",
]

ALIASES = {
    "next.js": "NextJS",
    "nextjs": "NextJS",
    "react.js": "React",
    "reactjs": "React",
    "nodejs": "Node.js",
    "node.js": "Node.js",
    "tailwindcss": "Tailwind CSS",
    "tailwind css": "Tailwind CSS",
    "postgres": "PostgreSQL",
    "postgresql": "PostgreSQL",
    "mongo": "MongoDB",
    "mongodb": "MongoDB",
    "rest": "REST APIs",
    "rest api": "REST APIs",
    "rest apis": "REST APIs",
    "ci/cd": "CI/CD",
    "github actions": "GitHub Actions",
    "powerbi": "Power BI",
}

JOB_SKILLS = sorted(set(KNOWN_SKILLS + EXTRA_JOB_SKILLS), key=len, reverse=True)

def _canonical_skill(skill: str) -> str:
    clean = re.sub(r"\s+", " ", str(skill)).strip()
    if not clean:
        return ""
    return ALIASES.get(clean.lower(), clean)

def _skill_key(skill: str) -> str:
    return re.sub(r"[^a-z0-9+#]+", "", _canonical_skill(skill).lower())

def _extract_required_skills(job_text: str) -> list[str]:
    required = {}
    for skill in JOB_SKILLS:
        pattern = r"(?<![\w+#.-])" + re.escape(skill) + r"(?![\w+#.-])"
        if re.search(pattern, job_text or "", re.IGNORECASE):
            canonical = _canonical_skill(skill)
            required[_skill_key(canonical)] = canonical
    return list(required.values())

def _roadmap_item(skill: str) -> str:
    return f"Build practical {skill} experience with a small project, then connect it to the target job workflow."

def compute_fallback_skill_gap(profile: dict, job_text: str) -> dict:
    candidate_skills = profile.get("skills", []) if isinstance(profile, dict) else []
    candidate_keys = {_skill_key(skill) for skill in candidate_skills if _skill_key(skill)}
    required_skills = _extract_required_skills(job_text)
    missing = [skill for skill in required_skills if _skill_key(skill) not in candidate_keys]

    return {
        "missing_skills": missing,
        "learning_roadmap": [_roadmap_item(skill) for skill in missing],
        "suggested_certifications": [
            f"{skill} certification or official learning path"
            for skill in missing[:3]
        ],
        "suggested_courses": [
            f"Hands-on {skill} course focused on real project implementation"
            for skill in missing[:3]
        ],
        "improvement_score": min(30, len(missing) * 5)
    }

def is_legacy_mock_skill_gap(skill_gap: dict | None) -> bool:
    if not isinstance(skill_gap, dict):
        return False
    return skill_gap.get("missing_skills") == LEGACY_MOCK_MISSING_SKILLS

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
            
    logger.info("Running heuristic skill gap fallback...")
    return {"skill_gap": compute_fallback_skill_gap(profile, job_text)}
