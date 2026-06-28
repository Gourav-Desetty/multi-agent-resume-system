import json
from backend.config import logger
from backend.prompts.templates import INTERVIEW_PROMPT
from backend.agents.helper import call_llm, parse_json_safely, is_groq_configured
from backend.state.graph_state import AgentState

def run_interview_agent(state: AgentState) -> dict:
    logger.info("Executing Interview Agent Node...")
    profile = state.get("profile") or {}
    job_text = state.get("job_text") or ""
    
    if is_groq_configured():
        prompt = INTERVIEW_PROMPT.format(
            candidate_profile=json.dumps(profile),
            job_description=job_text
        )
        res_str = call_llm(prompt)
        studio = parse_json_safely(res_str)
        if studio and "questions" in studio:
            logger.info("Successfully generated interview questions using Groq.")
            return {"interview_studio": studio}
            
    # Mock fallback interview question generator
    logger.info("Running mock interview questions fallback...")
    
    questions = [
        {
            "question": "Can you explain how you optimized database queries or API latency in your previous role at TechSolutions Corp?",
            "category": "Project-based",
            "difficulty": "Medium",
            "expected_answer_points": [
                "Mentions indexing, caching, or query profiling.",
                "Explains the Redis setup or middleware configurations.",
                "Provides concrete metrics (e.g. 30% latency improvement)."
            ]
        },
        {
            "question": "How do you handle dependency injection or state management in FastAPI backend routing architectures?",
            "category": "Technical",
            "difficulty": "Medium",
            "expected_answer_points": [
                "Explains the Depends() mechanism in FastAPI.",
                "Mentions database session cleanups or yield statements.",
                "Discusses security or auth checks within routes."
            ]
        },
        {
            "question": "Implement a function that handles deduplication of candidate profiles based on name similarity. What complexity does it run in?",
            "category": "Coding",
            "difficulty": "Hard",
            "expected_answer_points": [
                "Offers a clean Python dictionary or hashing solution.",
                "Explains space/time complexity (O(N) or O(N log N)).",
                "Suggests string fuzzy matching (e.g., Levenshtein distance)."
            ]
        },
        {
            "question": "Describe a scenario where a production service you built was failing under high load. How did you diagnose and resolve it?",
            "category": "Scenario-based",
            "difficulty": "Hard",
            "expected_answer_points": [
                "Identifies bottleneck (db connections, cpu, network, locks).",
                "Mentions monitoring tools (Prometheus, APMs, logs).",
                "Explains short term scaling vs long term code refactoring."
            ]
        },
        {
            "question": "Tell us about a time you had a technical disagreement with a team member. How did you reach a consensus?",
            "category": "Behavioral",
            "difficulty": "Easy",
            "expected_answer_points": [
                "Focuses on objective data rather than opinion.",
                "Mentions compromises, prototyping, or consulting docs.",
                "Maintains a professional, team-oriented mindset."
            ]
        }
    ]
    
    return {"interview_studio": {"questions": questions}}
