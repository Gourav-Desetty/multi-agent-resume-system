import os
from datetime import datetime
from langgraph.graph import StateGraph, END
from backend.config import settings, logger
from backend.database.local_db import db
from backend.state.graph_state import AgentState
from backend.tools.pdf_parser import extract_raw_resume_text

# Import Agent Nodes
from backend.agents.parser import run_parser_agent
from backend.agents.jd_matcher import run_jd_matcher_agent
from backend.agents.scoring import run_scoring_agent
from backend.agents.ranking import run_ranking_agent
from backend.agents.skill_gap import run_skill_gap_agent
from backend.agents.interview import run_interview_agent
from backend.agents.feedback import run_feedback_agent

# Initialize StateGraph
workflow = StateGraph(AgentState)

# Add Nodes
workflow.add_node("parser", run_parser_agent)
workflow.add_node("jd_matcher", run_jd_matcher_agent)
workflow.add_node("scorer", run_scoring_agent)
workflow.add_node("ranker", run_ranking_agent)
workflow.add_node("skill_gap", run_skill_gap_agent)
workflow.add_node("interview", run_interview_agent)
workflow.add_node("feedback", run_feedback_agent)

# Set Entry and Transitions
workflow.set_entry_point("parser")
workflow.add_edge("parser", "jd_matcher")
workflow.add_edge("jd_matcher", "scorer")
workflow.add_edge("scorer", "ranker")
workflow.add_edge("ranker", "skill_gap")
workflow.add_edge("skill_gap", "interview")
workflow.add_edge("interview", "feedback")
workflow.add_edge("feedback", END)

# Compile
compiled_graph = workflow.compile()

def normalize_candidate_profile(profile: dict | None) -> dict:
    profile = profile if isinstance(profile, dict) else {}

    normalized = {
        "name": profile.get("name") or "Unknown Candidate",
        "email": profile.get("email") or "candidate@example.com",
        "phone": profile.get("phone") or "",
        "education": [],
        "experience": [],
        "skills": [],
        "projects": [],
        "certifications": [],
        "achievements": [],
    }

    for edu in profile.get("education") or []:
        if not isinstance(edu, dict):
            continue
        normalized["education"].append({
            "degree": edu.get("degree") or "Not specified",
            "institution": edu.get("institution") or "Not specified",
            "year": edu.get("year"),
            "major": edu.get("major"),
        })

    for exp in profile.get("experience") or []:
        if not isinstance(exp, dict):
            continue
        normalized["experience"].append({
            "role": exp.get("role") or "Not specified",
            "company": exp.get("company") or "Not specified",
            "duration": exp.get("duration"),
            "responsibilities": [
                str(item) for item in (exp.get("responsibilities") or [])
                if item is not None
            ],
        })

    for project in profile.get("projects") or []:
        if not isinstance(project, dict):
            continue
        normalized["projects"].append({
            "title": project.get("title") or "Untitled Project",
            "description": project.get("description"),
            "technologies": [
                str(item) for item in (project.get("technologies") or [])
                if item is not None
            ],
        })

    for cert in profile.get("certifications") or []:
        if not isinstance(cert, dict):
            continue
        normalized["certifications"].append({
            "name": cert.get("name") or "Certification",
            "issuer": cert.get("issuer"),
            "year": cert.get("year"),
        })

    normalized["skills"] = [str(item) for item in (profile.get("skills") or []) if item]
    normalized["achievements"] = [str(item) for item in (profile.get("achievements") or []) if item]

    return normalized

def parse_candidate_resume(candidate: dict) -> dict:
    safe_filename = f"{candidate['id']}_{candidate['filename']}"
    file_path = os.path.join(settings.UPLOAD_DIR, safe_filename)
    warnings = []

    logger.info(f"Extracting raw text from physical file: {file_path}")
    try:
        raw_text = extract_raw_resume_text(file_path)
    except Exception as e:
        logger.error(f"Error parsing resume text for candidate {candidate['id']}: {e}")
        raw_text = ""
        warnings.append(f"Resume text extraction failed: {str(e)}")

    if not raw_text.strip():
        raw_text = f"[Empty content extracted from {candidate['filename']}]"
        warnings.append("No readable text could be extracted from the uploaded resume.")

    parser_state: AgentState = {
        "candidate_id": candidate["id"],
        "raw_text": raw_text,
        "job_id": None,
        "job_text": None,
        "profile": None,
        "match_result": None,
        "scores": None,
        "warnings": warnings,
        "skill_gap": None,
        "interview_studio": None,
        "feedback_report": None,
        "errors": [],
        "last_updated": datetime.now().isoformat()
    }
    parser_result = run_parser_agent(parser_state)

    return {
        "raw_text": raw_text,
        "profile": normalize_candidate_profile(parser_result.get("profile")),
        "warnings": warnings,
    }

def screen_candidate_workflow(candidate_id: str, job_id: str):
    logger.info(f"Starting screen_candidate_workflow for candidate={candidate_id} vs job={job_id}")
    
    # Retrieve records
    candidate = db.get_candidate(candidate_id)
    job = db.get_jd(job_id)
    
    if not candidate:
        logger.error(f"Candidate {candidate_id} not found in database.")
        return
    if not job:
        logger.error(f"Job Description {job_id} not found in database.")
        return

    # Update candidate status to processing
    candidate["status"] = "processing"
    candidate["active_job_id"] = job_id
    if candidate.get("profile"):
        candidate["profile"] = normalize_candidate_profile(candidate["profile"])
    db.save_candidate(candidate)
    
    # Check if raw text needs extracting
    raw_text = candidate.get("raw_text") or ""
    if raw_text == f"[Uploaded File: {candidate['filename']}]" or not raw_text.strip():
        parse_result = parse_candidate_resume(candidate)
        raw_text = parse_result["raw_text"]
        candidate["profile"] = parse_result["profile"]
        candidate["warnings"] = parse_result["warnings"]
             
    # Prepare State
    initial_state: AgentState = {
        "candidate_id": candidate_id,
        "raw_text": raw_text,
        "job_id": job_id,
        "job_text": job.get("raw_text", ""),
        "profile": candidate.get("profile"),
        "match_result": None,
        "scores": None,
        "warnings": None,
        "skill_gap": None,
        "interview_studio": None,
        "feedback_report": None,
        "errors": [],
        "last_updated": datetime.now().isoformat()
    }
    
    # Setup callbacks for Observability (Langfuse)
    callbacks = []
    if settings.LANGFUSE_PUBLIC_KEY and settings.LANGFUSE_SECRET_KEY:
        try:
            from langfuse.callback import CallbackHandler
            handler = CallbackHandler(
                public_key=settings.LANGFUSE_PUBLIC_KEY,
                secret_key=settings.LANGFUSE_SECRET_KEY,
                host=settings.LANGFUSE_HOST
            )
            callbacks.append(handler)
            logger.info("Langfuse callback registered successfully.")
        except Exception as e:
            logger.error(f"Error loading Langfuse CallbackHandler: {e}")
            
    try:
        # Run graph
        final_state = compiled_graph.invoke(initial_state, config={"callbacks": callbacks})
        
        # Save output records
        candidate["raw_text"] = raw_text
        candidate["profile"] = normalize_candidate_profile(final_state.get("profile"))
        candidate["match_result"] = final_state.get("match_result")
        candidate["scores"] = final_state.get("scores")
        candidate["warnings"] = final_state.get("warnings") or []
        candidate["skill_gap"] = final_state.get("skill_gap")
        candidate["interview_studio"] = final_state.get("interview_studio")
        candidate["feedback_report"] = final_state.get("feedback_report")
        candidate["status"] = "completed"
        candidate["last_updated"] = datetime.now().isoformat()
        
        db.save_candidate(candidate)
        logger.info(f"Successfully completed screening for candidate {candidate_id}")
        
    except Exception as e:
        logger.exception(f"Screening workflow failed for candidate {candidate_id}: {e}")
        candidate["status"] = "failed"
        candidate["warnings"] = [f"Workflow crash: {str(e)}"]
        candidate["last_updated"] = datetime.now().isoformat()
        db.save_candidate(candidate)
