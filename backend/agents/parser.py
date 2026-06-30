import re
from backend.config import logger
from backend.prompts.templates import PARSER_PROMPT
from backend.agents.helper import call_llm, parse_json_safely, is_groq_configured
from backend.state.graph_state import AgentState

KNOWN_SKILLS = [
    "Python", "C++", "Java", "SQL", "JavaScript", "TypeScript", "React", "Node.js",
    "NextJS", "Next.js", "Supabase", "ShadcnUI", "Tailwind CSS", "TailwindCSS", "SocketIO",
    "Redis", "Aptos", "Move", "Lucia", "Uploadthing", "Tiptap", "TanStack Query",
    "React Hook Form", "Prisma ORM", "Vercel", "Payload", "Drizzle", "NeonDB", "Xata",
    "BS4", "BeautifulSoup", "Reddit API", "i18next", "Flask", "Django", "REST APIs",
    "Docker", "Kubernetes", "Git", "Linux", "HTML5", "CSS3",
    "PyTorch", "TensorFlow", "Keras", "Scikit-learn", "NumPy", "Pandas", "Matplotlib",
    "OpenCV", "NLP", "CNN", "Transformers", "LangChain", "LangGraph", "LlamaIndex",
    "LlamaParse", "HuggingFace", "Groq", "RAGAS", "Tavily", "MLflow",
    "Streamlit", "Prometheus", "Grafana", "MySQL", "PostgreSQL", "MongoDB", "Pinecone",
    "FAISS", "ChromaDB", "Qdrant", "Neo4j", "Machine Learning", "Deep Learning",
    "Data Structures", "Algorithms", "DBMS"
]

SECTION_HEADERS = {
    "education", "technical skills", "skills", "projects", "experience", "work experience",
    "certifications", "achievements", "relevant coursework", "programming skills",
    "frameworks/libraries", "technologies", "technologies used", "languages"
}

SKILL_LINE_HEADERS = {
    "languages", "frameworks/libraries", "technologies", "technologies used",
    "ai / ml", "llm & rag", "mlops & backend", "databases"
}

def _extract_name(lines: list[str]) -> str:
    for line in lines[:8]:
        clean = line.strip()
        if not clean or clean.lower() in SECTION_HEADERS:
            continue
        first_part = re.split(r"[,|]", clean, maxsplit=1)[0].strip()
        if first_part and not re.search(r"\d|@|linkedin|github|portfolio|http", first_part, re.IGNORECASE):
            return first_part.title() if first_part.isupper() else first_part
        if "@" in clean or "|" in clean:
            continue
        if re.search(r"\d|linkedin|github|portfolio|http", clean, re.IGNORECASE):
            continue
        return clean.title() if clean.isupper() else clean
    return "Unknown Candidate"

def _extract_email(raw_text: str) -> str:
    match = re.search(r"[\w.+-]+@[\w-]+\.[\w.-]+", raw_text)
    return match.group(0) if match else "candidate@example.com"

def _extract_phone(raw_text: str) -> str:
    for match in re.finditer(r"(?:\+\d{1,3}[-.\s]?)?(?:\d[-.\s]?){10,}", raw_text):
        phone = match.group(0).strip()
        digits = re.sub(r"\D", "", phone)
        if 10 <= len(digits) <= 13:
            return phone
    return ""

def _extract_skills(raw_text: str) -> list[str]:
    found = []
    for skill in KNOWN_SKILLS:
        pattern = r"(?<![\w+#.-])" + re.escape(skill) + r"(?![\w+#.-])"
        if re.search(pattern, raw_text, re.IGNORECASE):
            found.append(skill)

    for line in raw_text.splitlines():
        clean = line.strip()
        if not clean:
            continue

        header = ""
        value = clean
        if ":" in clean:
            possible_header, value = clean.split(":", 1)
            header = possible_header.strip().lower()
        elif re.fullmatch(r"[A-Z /&]+", clean):
            continue

        previous_was_header = header in SKILL_LINE_HEADERS
        looks_like_skill_list = previous_was_header or bool(re.search(r"\s[-•]\s| · | \| ", value))
        if not looks_like_skill_list:
            continue

        for item in re.split(r"\s*[-•·|,]\s*", value):
            skill = item.strip(" .;")
            if not skill or len(skill) > 40:
                continue
            if re.search(r"\b(description|contribution|links|preview|github|repository|experienced|intermediate)\b", skill, re.IGNORECASE):
                continue
            if re.search(r"[A-Za-z][A-Za-z0-9+#. ]{1,}", skill):
                found.append(skill)

    normalized = {}
    aliases = {
        "nextjs": "NextJS",
        "next.js": "NextJS",
        "tailwindcss": "Tailwind CSS",
        "tailwind css": "Tailwind CSS",
        "socketio": "SocketIO",
        "shadcnui": "ShadcnUI",
        "postgresql": "PostgreSQL",
        "mongodb": "MongoDB",
        "mysql": "MySQL",
        "typescript": "TypeScript",
        "javascript": "JavaScript",
        "reactjs": "React",
        "react": "React",
    }
    for skill in found:
        collapsed = re.sub(r"\s+", " ", skill).strip()
        if re.search(r"@|\d{2,}|gpa|india|present|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec", collapsed, re.IGNORECASE):
            continue
        key = collapsed.lower().replace(" ", "")
        canonical = aliases.get(collapsed.lower(), aliases.get(key, collapsed))
        normalized[canonical.lower()] = canonical

    return list(normalized.values())

def _extract_education(lines: list[str]) -> list[dict]:
    for idx, line in enumerate(lines):
        if not re.search(r"\b(b\.?tech|m\.?tech|bachelor|master|phd|degree)\b", line, re.IGNORECASE):
            continue

        nearby_lines = lines[max(0, idx - 3): idx + 3]
        nearby = " ".join(nearby_lines)
        year_match = re.search(r"(20\d{2})(?:\s*[-–]\s*(20\d{2}|present))?", nearby, re.IGNORECASE)
        cgpa_match = re.search(r"CGPA\s*:\s*([\d.]+\s*/\s*[\d.]+)", nearby, re.IGNORECASE)
        institution = next(
            (
                item for item in nearby_lines
                if re.search(r"\b(university|institute|college)\b", item, re.IGNORECASE)
            ),
            ""
        )
        return [{
            "degree": line.strip(),
            "institution": institution,
            "year": year_match.group(0) if year_match else None,
            "major": cgpa_match.group(0) if cgpa_match else None
        }]

    return []

def _is_major_section(line: str) -> bool:
    return line.strip().lower() in {
        "education", "links", "coursework", "programming skills", "skills",
        "experience", "projects", "honors and awards", "certifications",
        "achievements"
    }

def _split_company_role(line: str) -> tuple[str, str]:
    parts = [part.strip() for part in line.split("|", 1)]
    if len(parts) == 2:
        return parts[0], parts[1]
    return "", line.strip()

def _looks_like_duration(line: str) -> bool:
    return bool(re.search(r"\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec|20\d{2}|present)\b", line, re.IGNORECASE))

def _extract_experience(lines: list[str]) -> list[dict]:
    try:
        start = next(idx for idx, line in enumerate(lines) if line.strip().lower() in {"experience", "work experience"})
    except StopIteration:
        return []

    end = len(lines)
    for idx in range(start + 1, len(lines)):
        if lines[idx].strip().lower() in {"projects", "education", "certifications", "achievements", "honors and awards"}:
            end = idx
            break

    section = lines[start + 1:end]
    jobs = []
    idx = 0
    while idx < len(section):
        line = section[idx].strip()
        lower = line.lower()
        if not line or lower in {"contribution", "technologies used", "links"} or line.startswith("•"):
            idx += 1
            continue
        if "|" not in line or _is_major_section(line):
            idx += 1
            continue

        company, role = _split_company_role(line)
        duration = ""
        if idx + 1 < len(section) and _looks_like_duration(section[idx + 1]):
            duration = section[idx + 1].strip()
            idx += 1

        jobs.append({
            "role": role.title() if role.isupper() else role,
            "company": company.title() if company.isupper() else company,
            "duration": duration,
            "responsibilities": []
        })
        idx += 1

    contribution_blocks = []
    technology_blocks = []
    current = None
    current_kind = None

    for line in section:
        clean = line.strip()
        lower = clean.lower()
        if lower == "contribution":
            if current:
                (contribution_blocks if current_kind == "contribution" else technology_blocks).append(current)
            current = []
            current_kind = "contribution"
            continue
        if lower == "technologies used":
            if current:
                (contribution_blocks if current_kind == "contribution" else technology_blocks).append(current)
            current = []
            current_kind = "technology"
            continue
        if lower == "links":
            if current:
                (contribution_blocks if current_kind == "contribution" else technology_blocks).append(current)
            current = None
            current_kind = None
            continue
        if current is None:
            continue
        if "|" in clean and not clean.startswith("•"):
            continue
        if clean:
            is_bullet = clean.startswith(("•", "-"))
            text = clean.lstrip("•- ").strip()
            if current_kind == "contribution" and current and not is_bullet:
                current[-1] = f"{current[-1]} {text}"
            else:
                current.append(text)

    if current:
        (contribution_blocks if current_kind == "contribution" else technology_blocks).append(current)

    for job_idx, job in enumerate(jobs):
        if job_idx < len(contribution_blocks):
            job["responsibilities"].extend(contribution_blocks[job_idx])
        if job_idx < len(technology_blocks):
            technologies = " ".join(technology_blocks[job_idx]).strip()
            if technologies:
                job["responsibilities"].append(f"Technologies used: {technologies}")

    return jobs

def _extract_projects(lines: list[str]) -> list[dict]:
    projects = []
    in_projects = False
    for line in lines:
        clean = line.strip()
        lower = clean.lower()
        if lower == "projects":
            in_projects = True
            continue
        if in_projects and lower in {"experience", "certifications", "achievements", "education"}:
            break
        if in_projects and clean and " - " in clean and len(projects) < 4:
            title, description = clean.split(" - ", 1)
            projects.append({
                "title": title.strip(),
                "description": description.strip(),
                "technologies": []
            })
    return projects

def _extract_certifications(lines: list[str]) -> list[dict]:
    certifications = []
    in_certifications = False

    for line in lines:
        clean = line.strip()
        lower = clean.lower()

        if lower in {"certifications", "certificates", "credentials"}:
            in_certifications = True
            continue
        if in_certifications and lower in {
            "experience", "projects", "education", "technical skills", "skills",
            "achievements", "honors and awards", "relevant coursework"
        }:
            break
        if not in_certifications or not clean:
            continue

        cert_text = clean.lstrip("-â€¢ ").strip()
        if not cert_text or re.search(r"\b(github|linkedin|portfolio)\b", cert_text, re.IGNORECASE):
            continue

        parts = [part.strip() for part in cert_text.split("|")]
        name_and_issuer = parts[0]
        year = parts[1] if len(parts) > 1 else None
        issuer = None
        name = name_and_issuer

        if " - " in name_and_issuer:
            name, issuer = [part.strip() for part in name_and_issuer.rsplit(" - ", 1)]

        certifications.append({
            "name": name,
            "issuer": issuer,
            "year": year,
        })

    return certifications

def run_parser_agent(state: AgentState) -> dict:
    logger.info("Executing Parser Agent Node...")
    raw_text = state.get("raw_text") or ""
    lines = [line.strip() for line in raw_text.splitlines() if line.strip()]
    
    if is_groq_configured():
        prompt = PARSER_PROMPT.format(resume_text=raw_text)
        res_str = call_llm(prompt)
        profile = parse_json_safely(res_str)
        if profile:
            if not profile.get("certifications"):
                profile["certifications"] = _extract_certifications(lines)
            logger.info("Successfully parsed resume using Groq.")
            return {"profile": profile}
            
    logger.info("Running heuristic parser fallback...")

    skills = _extract_skills(raw_text)

    profile = {
        "name": _extract_name(lines),
        "email": _extract_email(raw_text),
        "phone": _extract_phone(raw_text),
        "education": _extract_education(lines),
        "experience": _extract_experience(lines),
        "skills": skills,
        "projects": _extract_projects(lines),
        "certifications": _extract_certifications(lines),
        "achievements": []
    }
    
    return {"profile": profile}
