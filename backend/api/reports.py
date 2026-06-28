import io
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

from backend.database.local_db import db
from backend.api.auth import get_current_user
from backend.models.schemas import UserResponse

router = APIRouter(prefix="/reports", tags=["Reports Export"])

@router.get("/csv")
async def export_candidates_csv(current_user: UserResponse = Depends(get_current_user)):
    candidates = db.get_all_candidates()
    
    rows = []
    for c in candidates:
        profile = c.get("profile") or {}
        scores = c.get("scores") or {}
        match = c.get("match_result") or {}
        
        rows.append({
            "Candidate ID": c.get("id"),
            "Filename": c.get("filename"),
            "Name": profile.get("name", "Unknown"),
            "Email": profile.get("email", "N/A"),
            "Phone": profile.get("phone", "N/A"),
            "Status": c.get("status"),
            "Overall Match Score": match.get("overall_match_score", 0),
            "Technical Score": scores.get("technical_skills", 0),
            "Experience Score": scores.get("experience", 0),
            "Education Score": scores.get("education", 0),
            "Soft Skills Score": scores.get("soft_skills", 0),
            "Final Score": scores.get("final_score", 0),
            "Fit Status": c.get("feedback_report", {}).get("fit_status", "Review Required") if c.get("feedback_report") else "Review Required",
            "Last Screened": c.get("last_updated")
        })
        
    df = pd.DataFrame(rows)
    stream = io.StringIO()
    df.to_csv(stream, index=False)
    
    response = StreamingResponse(
        iter([stream.getvalue()]),
        media_type="text/csv"
    )
    response.headers["Content-Disposition"] = "attachment; filename=candidates_report.csv"
    return response

@router.get("/excel")
async def export_candidates_excel(current_user: UserResponse = Depends(get_current_user)):
    candidates = db.get_all_candidates()
    
    rows = []
    for c in candidates:
        profile = c.get("profile") or {}
        scores = c.get("scores") or {}
        match = c.get("match_result") or {}
        
        rows.append({
            "Candidate ID": c.get("id"),
            "Filename": c.get("filename"),
            "Name": profile.get("name", "Unknown"),
            "Email": profile.get("email", "N/A"),
            "Phone": profile.get("phone", "N/A"),
            "Status": c.get("status"),
            "Overall Match Score": match.get("overall_match_score", 0),
            "Technical Score": scores.get("technical_skills", 0),
            "Experience Score": scores.get("experience", 0),
            "Education Score": scores.get("education", 0),
            "Final Score": scores.get("final_score", 0),
            "Fit Status": c.get("feedback_report", {}).get("fit_status", "Review Required") if c.get("feedback_report") else "Review Required"
        })
        
    df = pd.DataFrame(rows)
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Candidates")
        
    output.seek(0)
    response = StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    response.headers["Content-Disposition"] = "attachment; filename=candidates_report.xlsx"
    return response

@router.get("/{cid}/pdf")
async def export_candidate_pdf(cid: str, current_user: UserResponse = Depends(get_current_user)):
    c = db.get_candidate(cid)
    if not c:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found"
        )
        
    profile = c.get("profile") or {}
    scores = c.get("scores") or {}
    match = c.get("match_result") or {}
    report = c.get("feedback_report") or {}
    gap = c.get("skill_gap") or {}
    studio = c.get("interview_studio") or {}
    
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, 
        pagesize=letter,
        rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40
    )
    
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        textColor=colors.HexColor("#1A365D"),
        spaceAfter=15
    )
    
    section_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=14,
        textColor=colors.HexColor("#2B6CB0"),
        spaceBefore=12,
        spaceAfter=6
    )
    
    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['BodyText'],
        fontName='Helvetica',
        fontSize=10,
        textColor=colors.HexColor("#2D3748"),
        spaceAfter=6
    )
    
    bullet_style = ParagraphStyle(
        'BulletPoint',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        textColor=colors.HexColor("#2D3748"),
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=4
    )

    elements = []
    
    # Header block
    elements.append(Paragraph(f"AI Candidate Assessment: {profile.get('name', 'Unknown Candidate')}", title_style))
    elements.append(Paragraph(f"<b>Email:</b> {profile.get('email', 'N/A')} | <b>Phone:</b> {profile.get('phone', 'N/A')}", body_style))
    elements.append(Paragraph(f"<b>File:</b> {c.get('filename')} | <b>Status:</b> {c.get('status').upper()}", body_style))
    elements.append(Spacer(1, 15))
    
    # Scores Grid Table
    data = [
        ["Evaluation Attribute", "Score / 100"],
        ["Overall Match Score", f"{match.get('overall_match_score', 0)}%"],
        ["Technical Skills Score", f"{scores.get('technical_skills', 0)}/100"],
        ["Experience Fit Score", f"{scores.get('experience', 0)}/100"],
        ["Education Match Score", f"{scores.get('education', 0)}/100"],
        ["Soft Skills Score", f"{scores.get('soft_skills', 0)}/100"],
        ["Final Screen Score", f"{scores.get('final_score', 0)}/100"],
        ["Fit Status Recommendation", report.get("fit_status", "Review Required")]
    ]
    t = Table(data, colWidths=[250, 200])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (1,0), colors.HexColor("#1A365D")),
        ('TEXTCOLOR', (0,0), (1,0), colors.white),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('FONTNAME', (0,0), (1,0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor("#F7FAFC"), colors.white]),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 15))
    
    # Summary
    elements.append(Paragraph("Candidate Summary & Assessment", section_style))
    elements.append(Paragraph(report.get("summary", "No summary assessment compiled."), body_style))
    elements.append(Spacer(1, 10))
    
    # Strengths & Weaknesses
    elements.append(Paragraph("Strengths & Weaknesses", section_style))
    elements.append(Paragraph("<b>Key Strengths:</b>", body_style))
    for str_item in scores.get("strengths", []):
        elements.append(Paragraph(f"• {str_item}", bullet_style))
        
    elements.append(Spacer(1, 5))
    elements.append(Paragraph("<b>Weaknesses/Gaps Identified:</b>", body_style))
    for wk_item in scores.get("weaknesses", []):
        elements.append(Paragraph(f"• {wk_item}", bullet_style))
    elements.append(Spacer(1, 10))
    
    # Skill Gaps
    elements.append(Paragraph("Upskilling & Skill Gap Analysis", section_style))
    elements.append(Paragraph(f"<b>Missing Skills:</b> {', '.join(gap.get('missing_skills', [])) or 'None'}", body_style))
    elements.append(Paragraph("<b>Learning Roadmap:</b>", body_style))
    for road in gap.get("learning_roadmap", []):
        elements.append(Paragraph(f"• {road}", bullet_style))
    elements.append(Spacer(1, 10))
    
    # Interview Studio
    elements.append(Paragraph("Tailored Interview Questions", section_style))
    questions_list = studio.get("questions", [])
    if not questions_list:
        elements.append(Paragraph("No questions generated.", body_style))
    else:
        for idx, q in enumerate(questions_list):
            q_text = f"<b>Q{idx+1} [{q.get('category')} - {q.get('difficulty')}]:</b> {q.get('question')}"
            elements.append(Paragraph(q_text, body_style))
            ans_points = q.get('expected_answer_points', [])
            if ans_points:
                elements.append(Paragraph(f"<i>Look for:</i> {', '.join(ans_points)}", bullet_style))
            elements.append(Spacer(1, 4))
            
    doc.build(elements)
    buffer.seek(0)
    
    response = StreamingResponse(buffer, media_type="application/pdf")
    response.headers["Content-Disposition"] = f"attachment; filename=Candidate_{cid}_Report.pdf"
    return response
