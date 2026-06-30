import os
import uuid
import shutil
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks, status
from fastapi.responses import FileResponse

from backend.config import settings, logger
from backend.database.local_db import db
from backend.models.schemas import Candidate, UserResponse
from backend.api.auth import get_current_user, check_role
from backend.services.graph_service import (
    normalize_candidate_profile,
    parse_candidate_resume,
    screen_candidate_workflow,
)
from backend.agents.skill_gap import compute_fallback_skill_gap, is_legacy_mock_skill_gap
from backend.agents.parser import _extract_certifications


router = APIRouter(prefix="/candidates", tags=["Candidates & Resumes"])

def backfill_candidate_certifications(candidate: dict) -> bool:
    profile = candidate.get("profile") or {}
    if profile.get("certifications"):
        return False

    raw_text = candidate.get("raw_text") or ""
    certifications = _extract_certifications([
        line.strip() for line in raw_text.splitlines() if line.strip()
    ])
    if not certifications:
        return False

    profile["certifications"] = certifications
    candidate["profile"] = profile

    scores = candidate.get("scores") or {}
    if scores:
        previous_cert_score = scores.get("certifications", 45) or 45
        new_cert_score = min(90, 45 + len(certifications) * 15)
        scores["certifications"] = new_cert_score
        scores["weaknesses"] = [
            weakness for weakness in scores.get("weaknesses", [])
            if weakness != "No certifications were parsed from the resume."
        ]
        if scores.get("final_score") is not None:
            scores["final_score"] = min(100, int(scores["final_score"] + (new_cert_score - previous_cert_score) * 0.08))
        candidate["scores"] = scores

    report = candidate.get("feedback_report") or {}
    if report.get("weaknesses_summary"):
        report["weaknesses_summary"] = report["weaknesses_summary"].replace(
            "No certifications were parsed from the resume.", ""
        ).strip()
        candidate["feedback_report"] = report

    return True

def ensure_candidate_profile(candidate: dict) -> dict:
    raw_text = candidate.get("raw_text") or ""
    has_placeholder_text = raw_text == f"[Uploaded File: {candidate['filename']}]" or not raw_text.strip()
    if candidate.get("profile"):
        normalized_profile = normalize_candidate_profile(candidate["profile"])
        if normalized_profile != candidate["profile"]:
            candidate["profile"] = normalized_profile
            candidate["last_updated"] = datetime.now().isoformat()
            db.save_candidate(candidate)
        if backfill_candidate_certifications(candidate):
            candidate["last_updated"] = datetime.now().isoformat()
            db.save_candidate(candidate)
        if is_legacy_mock_skill_gap(candidate.get("skill_gap")) and candidate.get("active_job_id"):
            job = db.get_jd(candidate["active_job_id"])
            if job:
                candidate["skill_gap"] = compute_fallback_skill_gap(
                    candidate["profile"],
                    job.get("raw_text", "")
                )
                candidate["last_updated"] = datetime.now().isoformat()
                db.save_candidate(candidate)
        return candidate

    if not has_placeholder_text:
        return candidate

    safe_filename = f"{candidate['id']}_{candidate['filename']}"
    file_path = os.path.join(settings.UPLOAD_DIR, safe_filename)
    if not os.path.exists(file_path):
        return candidate

    parse_result = parse_candidate_resume(candidate)
    candidate["raw_text"] = parse_result["raw_text"]
    candidate["profile"] = parse_result["profile"]
    candidate["warnings"] = parse_result["warnings"]
    candidate["last_updated"] = datetime.now().isoformat()
    db.save_candidate(candidate)
    return candidate

@router.post("/upload", response_model=List[Candidate])
async def upload_resumes(
    files: List[UploadFile] = File(...),
    current_user: UserResponse = Depends(check_role(["Admin", "HR"]))
):
    saved_candidates = []
    
    for file in files:
        if not file.filename.lower().endswith((".pdf", ".docx")):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file format for {file.filename}. Only PDF and DOCX are allowed."
            )
        
        cid = str(uuid.uuid4())
        # Safe filename
        safe_filename = f"{cid}_{file.filename}"
        dest_path = os.path.join(settings.UPLOAD_DIR, safe_filename)
        
        try:
            with open(dest_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            candidate_data = {
                "id": cid,
                "filename": file.filename,
                "raw_text": f"[Uploaded File: {file.filename}]",
                "status": "pending",
                "profile": None,
                "match_result": None,
                "scores": None,
                "skill_gap": None,
                "interview_studio": None,
                "feedback_report": None,
                "last_updated": datetime.now().isoformat(),
                "active_job_id": None,
                "warnings": []
            }

            parse_result = parse_candidate_resume(candidate_data)
            candidate_data["raw_text"] = parse_result["raw_text"]
            candidate_data["profile"] = parse_result["profile"]
            candidate_data["warnings"] = parse_result["warnings"]
            
            db.save_candidate(candidate_data)
            saved_candidates.append(Candidate(**candidate_data))
            logger.info(f"Successfully uploaded and saved candidate {cid} for {file.filename}")
            
        except Exception as e:
            logger.error(f"Error saving file {file.filename}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Could not save file {file.filename} due to internal error."
            )
            
    return saved_candidates

@router.get("", response_model=List[Candidate])
async def list_candidates(
    search: Optional[str] = None,
    status: Optional[str] = None,
    job_id: Optional[str] = None,
    min_score: Optional[int] = None,
    current_user: UserResponse = Depends(get_current_user)
):
    candidates = db.get_all_candidates()
    filtered = []
    
    for c in candidates:
        c = ensure_candidate_profile(c)

        # Search filter
        if search:
            search_lower = search.lower()
            name = c.get("profile", {}).get("name", "") if c.get("profile") else ""
            skills = c.get("profile", {}).get("skills", []) if c.get("profile") else []
            filename = c.get("filename", "")
            
            match_name = search_lower in name.lower()
            match_skills = any(search_lower in sk.lower() for sk in skills)
            match_file = search_lower in filename.lower()
            
            if not (match_name or match_skills or match_file):
                continue
                
        # Status filter
        if status and c.get("status") != status:
            continue
            
        # Job ID filter
        if job_id and c.get("active_job_id") != job_id:
            continue
            
        # Score filter
        if min_score is not None:
            score = c.get("scores", {}).get("final_score", 0) if c.get("scores") else 0
            if score < min_score:
                continue
                
        filtered.append(Candidate(**c))
        
    return filtered

@router.get("/{cid}", response_model=Candidate)
async def get_candidate_details(
    cid: str,
    current_user: UserResponse = Depends(get_current_user)
):
    c = db.get_candidate(cid)
    if not c:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Candidate with ID {cid} not found."
        )
    return Candidate(**ensure_candidate_profile(c))

@router.delete("/{cid}")
async def delete_candidate(
    cid: str,
    current_user: UserResponse = Depends(check_role(["Admin", "HR"]))
):
    candidate = db.get_candidate(cid)
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Candidate with ID {cid} not found."
        )
        
    # Remove physical file
    safe_filename = f"{cid}_{candidate['filename']}"
    file_path = os.path.join(settings.UPLOAD_DIR, safe_filename)
    if os.path.exists(file_path):
        os.remove(file_path)
        
    db.delete_candidate(cid)
    return {"message": f"Candidate {cid} deleted successfully."}

@router.get("/{cid}/file")
async def download_candidate_resume(
    cid: str,
    current_user: UserResponse = Depends(get_current_user)
):
    candidate = db.get_candidate(cid)
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Candidate with ID {cid} not found."
        )
    safe_filename = f"{cid}_{candidate['filename']}"
    file_path = os.path.join(settings.UPLOAD_DIR, safe_filename)
    if not os.path.exists(file_path):
         raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume file does not exist on disk."
        )
    return FileResponse(file_path, filename=candidate["filename"])

@router.post("/{cid}/screen", response_model=Candidate)
async def screen_candidate(
    cid: str,
    job_id: str,
    background_tasks: BackgroundTasks,
    current_user: UserResponse = Depends(check_role(["Admin", "HR"]))
):
    candidate = db.get_candidate(cid)
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Candidate with ID {cid} not found."
        )
    job = db.get_jd(job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job description with ID {job_id} not found."
        )
        
    # Trigger graph in background
    background_tasks.add_task(screen_candidate_workflow, cid, job_id)
    
    # Mark status as processing locally so frontend updates immediately
    candidate["status"] = "processing"
    candidate["active_job_id"] = job_id
    if candidate.get("profile"):
        candidate["profile"] = normalize_candidate_profile(candidate["profile"])
    db.save_candidate(candidate)
    
    return Candidate(**candidate)
