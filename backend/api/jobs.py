import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Body, Depends, HTTPException, status

from backend.config import settings, logger
from backend.database.local_db import db
from backend.models.schemas import JobDescription, UserResponse
from backend.api.auth import get_current_user, check_role

router = APIRouter(prefix="/jobs", tags=["Job Descriptions"])

@router.post("/", response_model=JobDescription)
async def create_job_description(
    title: str,
    raw_text: str = Body(..., media_type="text/plain"),
    department: Optional[str] = None,
    current_user: UserResponse = Depends(check_role(["Admin", "HR"]))
):
    jid = str(uuid.uuid4())
    
    # We will do some basic parsing of JD fields or let the LLM extract them in a separate workflow.
    # For initial foundation, we split by lines or seed default list values.
    # In a full flow we can parse this or run a JD parser agent.
    skills = []
    responsibilities = []
    keywords = []
    
    # Simple heuristic parser for initialization
    for line in raw_text.split("\n"):
        line_clean = line.strip().lower()
        if "skill" in line_clean or "experience" in line_clean:
            skills.append(line.strip())
        elif "responsibilit" in line_clean or "role" in line_clean:
            responsibilities.append(line.strip())
            
    jd_data = {
        "id": jid,
        "title": title,
        "department": department,
        "raw_text": raw_text,
        "skills": skills[:10],
        "experience_years": 3.0,
        "education_required": "Bachelor's Degree",
        "responsibilities": responsibilities[:5],
        "keywords": keywords[:10],
        "created_at": datetime.now().isoformat()
    }
    
    db.save_jd(jd_data)
    return JobDescription(**jd_data)

@router.get("", response_model=List[JobDescription])
async def list_job_descriptions(
    current_user: UserResponse = Depends(get_current_user)
):
    jds = db.get_all_jds()
    return [JobDescription(**jd) for jd in jds]

@router.get("/{jid}", response_model=JobDescription)
async def get_job_description(
    jid: str,
    current_user: UserResponse = Depends(get_current_user)
):
    jd = db.get_jd(jid)
    if not jd:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job description with ID {jid} not found."
        )
    return JobDescription(**jd)

@router.delete("/{jid}")
async def delete_job_description(
    jid: str,
    current_user: UserResponse = Depends(check_role(["Admin", "HR"]))
):
    jd = db.get_jd(jid)
    if not jd:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job description with ID {jid} not found."
        )
    db.delete_jd(jid)
    return {"message": f"Job Description {jid} deleted successfully."}
