from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import io, os, json, requests
from bs4 import BeautifulSoup
from pypdf import PdfReader
from docx import Document as DocxDocument

# =========================
# FastAPI App Setup
# =========================
app = FastAPI(title="Career Gap Analyzer API", version="1.0.0")

# CORS (for safety if frontend ever runs separately)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# Models
# =========================
class Recommendation(BaseModel):
    title: str
    type: str
    link: Optional[str] = None
    why: Optional[str] = None

class AnalyzeResult(BaseModel):
    overall_match: int
    matched_skills: List[str]
    missing_skills: List[str]
    recommendations: List[Recommendation]
    debug: Optional[Dict[str, Any]] = None

# =========================
# Skills + Resources
# =========================
SKILL_SEED = [
    "python", "java", "c++", "sql", "azure", "aws", "gcp",
    "docker", "kubernetes", "fastapi", "flask", "pandas",
    "scikit-learn", "numpy", "tensorflow", "pytorch",
    "machine learning", "nlp", "llm", "streamlit",
    "git", "github", "linux", "rest", "microservices",
    "openai", "react", "javascript", "dsa", "oop"
]

RESOURCES_PATH = os.path.join(os.path.dirname(__file__), "skills_resources.json")
if os.path.exists(RESOURCES_PATH):
    with open(RESOURCES_PATH, "r", encoding="utf-8") as f:
        SKILL_RESOURCES = json.load(f)
else:
    SKILL_RESOURCES = {}

# =========================
# Helper Functions
# =========================
def read_resume_text(file: UploadFile) -> str:
    """Extract text from PDF/DOCX."""
    name = (file.filename or "").lower()
    data = file.file.read()

    try:
        if name.endswith(".pdf"):
            reader = PdfReader(io.BytesIO(data))
            return "\n".join([pg.extract_text() or "" for pg in reader.pages])
        elif name.endswith(".docx"):
            doc = DocxDocument(io.BytesIO(data))
            return "\n".join([p.text for p in doc.paragraphs])
        else:
            return data.decode("utf-8", errors="ignore")
    except Exception:
        raise HTTPException(status_code=400, detail="Could not parse resume. Use PDF/DOCX.")

def fetch_jd_from_url(url: str) -> str:
    """Fetch JD text from webpage."""
    try:
        resp = requests.get(url, timeout=15, headers={"User-Agent": "Mozilla/5.0"})
        resp.raise_for_status()
    except Exception:
        raise HTTPException(status_code=400, detail="Unable to fetch JD URL.")

    soup = BeautifulSoup(resp.text, "lxml")
    for tag in soup(["script", "style", "nav", "footer", "header", "noscript"]):
        tag.decompose()
    text = " ".join(soup.get_text(" ").split())
    return text[:20000]

def extract_skills(text: str) -> List[str]:
    """Simple substring-based skill detection."""
    text_l = text.lower()
    found = []
    for s in SKILL_SEED:
        if s in text_l:
            found.append(s)
    return sorted(set(found))

def jaccard(a: List[str], b: List[str]) -> float:
    A, B = set(a), set(b)
    if not (A or B):
        return 0.0
    return len(A & B) / len(A | B)

def build_recommendations(missing: List[str]) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    for ms in missing:
        items = SKILL_RESOURCES.get(ms, [])
        if not items:
            items = [{
                "title": f"Learn {ms.title()}",
                "type": "Course",
                "link": "https://www.coursera.org/",
                "why": "Essential skill listed in the JD."
            }]
        out.extend(items[:1])
    return out[:6]

# =========================
# Routes
# =========================
@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/analyze", response_model=AnalyzeResult)
async def analyze(
    resume: UploadFile = File(...),
    jd_text: Optional[str] = Form(None),
    jd_url: Optional[str] = Form(None)
):
    rtext = read_resume_text(resume)

    if jd_text and jd_text.strip():
        jtext = jd_text.strip()
    elif jd_url and jd_url.strip():
        jtext = fetch_jd_from_url(jd_url.strip())
    else:
        raise HTTPException(status_code=400, detail="Provide JD text or JD URL.")

    rskills = extract_skills(rtext)
    jskills = extract_skills(jtext)

    matched = sorted(set(rskills) & set(jskills))
    missing = sorted(set(jskills) - set(rskills))

    score = round(100 * jaccard(rskills, jskills))
    recs = build_recommendations(missing)

    return AnalyzeResult(
        overall_match=score,
        matched_skills=matched,
        missing_skills=missing,
        recommendations=[Recommendation(**x) for x in recs],
        debug={"resume_skills": rskills, "jd_skills": jskills}
    )

# =========================
# Serve Frontend
# =========================
frontend_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(frontend_dir):
    app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")
