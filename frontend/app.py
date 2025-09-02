import streamlit as st
import requests
from typing import Dict, Any, Optional

# Page Config
st.set_page_config(
    page_title="Career Gap Analyzer — Team Cypher29",
    page_icon="🧭",
    layout="wide",
)

# LIGHT THEME CSS (forces light look)
st.markdown("""
<style>
/* Hide Streamlit chrome */
#MainMenu{visibility:hidden;}
header{visibility:hidden;}
footer{visibility:hidden;}

/* Force light palette even if dark theme is active */
:root, [data-base-theme="dark"], [data-theme="dark"] {
  --cga-bg: #f8fafc;           /* page bg */
  --cga-card: #ffffff;         /* card bg */
  --cga-border: #e2e8f0;       /* borders */
  --cga-text: #1e293b;         /* main text */
  --cga-muted: #64748b;        /* muted text */
  --cga-primary: #2563eb;      /* blue */
  --cga-primary-dark: #1e40af; /* blue hover */
  --cga-skill-match-bg: #bbf7d0;
  --cga-skill-match-fg: #166534;
  --cga-skill-miss-bg: #fecaca;
  --cga-skill-miss-fg: #991b1b;
}

/* Page container */
[data-testid="stAppViewContainer"]{
  background: var(--cga-bg) !important;
  color: var(--cga-text) !important;
}
[data-testid="stHeader"] { background: transparent !important; }

/* Header (no white bar below) */
.big-header{ text-align:center; margin: 0 0 1.25rem 0; }
.big-header h1{
  margin: 0 0 .25rem 0; font-weight: 800; font-size: 2rem; color: var(--cga-primary);
}
.big-header p{ margin:0; color: var(--cga-muted); }

/* Cards */
.card{
  background: var(--cga-card);
  border: 1px solid var(--cga-border);
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 2px 6px rgba(0,0,0,0.05);
  margin-bottom: 1.25rem;
}

/* Metrics */
.metric-box{
  background: var(--cga-card);
  border: 1px solid var(--cga-border);
  border-radius: 12px; padding: 1rem; text-align:center;
}
.metric-value{ font-size:1.5rem; font-weight:700; color: var(--cga-text); }
.metric-label{ font-size:.9rem; color: var(--cga-muted); }

/* Buttons */
.stButton>button{
  background: var(--cga-primary) !important;
  color:#fff !important; border:none; border-radius:8px;
  padding:.75rem 1.5rem; font-weight:600;
}
.stButton>button:hover{ background: var(--cga-primary-dark) !important; }

/* Skill pills */
.skill-badge{
  display:inline-block; padding:6px 12px; border-radius:999px;
  font-size:.85rem; margin:4px; font-weight:600;
}
.skill-matched{ background: var(--cga-skill-match-bg); color: var(--cga-skill-match-fg); }
.skill-missing{ background: var(--cga-skill-miss-bg);  color: var(--cga-skill-miss-fg); }

/* Recommendation cards */
.resource-card{
  background: var(--cga-card);
  border: 1px solid var(--cga-border);
  border-radius: 12px; padding: 1rem; margin-bottom: 1rem;
}
.resource-card em{ color: var(--cga-muted); font-size:.9rem; }
</style>
""", unsafe_allow_html=True)

# Backend helper
def call_backend(api_base: str, resume_file, jd_text: str, jd_url: str) -> Dict[str, Any]:
    url = api_base.rstrip("/") + "/analyze"
    files = {"resume": (resume_file.name, resume_file.getvalue())}
    data = {}
    if jd_text.strip():
        data["jd_text"] = jd_text
    elif jd_url.strip():
        data["jd_url"] = jd_url
    resp = requests.post(url, files=files, data=data, timeout=60)
    resp.raise_for_status()
    return resp.json()

def mock_analyze() -> Dict[str, Any]:
    return {
        "overall_match": 21,
        "matched_skills": ["Python", "SQL", "Docker", "FastAPI"],
        "missing_skills": [
            "Azure","Kubernetes","AWS","Linux","JavaScript","React","NodeJS",
            "MongoDB","Pandas","ML","Data Science","DevOps","Git","REST API"
        ],
        "recommendations": [
            {
                "title": "Microsoft Azure Fundamentals AZ-900",
                "type": "Certification",
                "why": "Build foundational knowledge of cloud services and Azure basics",
                "link": "https://learn.microsoft.com/azure/certifications/azure-fundamentals/"
            },
            {
                "title": "Docker Complete Guide",
                "type": "Course",
                "why": "Master containerization and Docker fundamentals",
                "link": "https://docs.docker.com/get-started/"
            },
            {
                "title": "FastAPI Tutorial",
                "type": "Tutorial",
                "why": "Learn modern, fast Python web framework development",
                "link": "https://fastapi.tiangolo.com/"
            }
        ]
    }

# Sidebar (Settings)
with st.sidebar:
    st.title("⚙️ Settings")
    api_base = st.text_input("FastAPI Base URL", value="http://localhost:8000")
    use_mock = st.toggle("Use Mock Analyzer", value=True)
    show_debug = st.toggle("Debug Mode", value=False)

# Header
st.markdown("""
<div class='big-header'>
  <h1>Career Gap Analyzer</h1>
  <p>Upload your resume and paste a job description to instantly see how well you match the role.<br>
  Get personalized recommendations to bridge any skill gaps.</p>
</div>
""", unsafe_allow_html=True)

# Inputs
st.markdown("<div class='card'>", unsafe_allow_html=True)
c1, c2 = st.columns(2)
with c1:
    st.subheader("📄 Upload Resume")
    resume_file = st.file_uploader("Choose PDF/DOCX", type=["pdf","docx"])
with c2:
    st.subheader("📝 Job Description")
    jd_mode = st.radio("Provide JD as:", ["Text", "Link"], horizontal=True)
    jd_text, jd_url = "", ""
    if jd_mode == "Text":
        jd_text = st.text_area("Paste JD text here", height=200)
    else:
        jd_url = st.text_input("Paste JD URL here")
st.markdown("</div>", unsafe_allow_html=True)

# Analyze button
if st.button("🔍 Analyze Resume vs JD", use_container_width=True):
    if not resume_file:
        st.error("Please upload a resume.")
    elif not jd_text.strip() and not jd_url.strip():
        st.error("Please provide JD text or link.")
    else:
        with st.spinner("Analyzing..."):
            try:
                result = mock_analyze() if use_mock else call_backend(api_base, resume_file, jd_text, jd_url)
                st.session_state["result"] = result
            except Exception as e:
                st.error(f"Error: {e}")

# Results
result: Optional[Dict[str, Any]] = st.session_state.get("result")
if result:
    st.markdown("<div class='card'>", unsafe_allow_html=True)
    st.subheader("📊 Results")

    m1, m2, m3 = st.columns(3)
    with m1:
        st.markdown(
            f"<div class='metric-box'><div class='metric-value'>{result['overall_match']}%</div>"
            f"<div class='metric-label'>Overall Match</div></div>",
            unsafe_allow_html=True
        )
        st.progress(min(max(result["overall_match"], 0), 100) / 100)
    with m2:
        st.markdown(
            f"<div class='metric-box'><div class='metric-value'>{len(result['matched_skills'])}</div>"
            f"<div class='metric-label'>Matched Skills</div></div>",
            unsafe_allow_html=True
        )
    with m3:
        st.markdown(
            f"<div class='metric-box'><div class='metric-value'>{len(result['missing_skills'])}</div>"
            f"<div class='metric-label'>Missing Skills</div></div>",
            unsafe_allow_html=True
        )

    st.markdown("### ✅ Matched Skills")
    if result["matched_skills"]:
        for s in result["matched_skills"]:
            st.markdown(f"<span class='skill-badge skill-matched'>{s}</span>", unsafe_allow_html=True)
    else:
        st.caption("No matches found.")

    st.markdown("### ❌ Missing Skills")
    if result["missing_skills"]:
        for s in result["missing_skills"]:
            st.markdown(f"<span class='skill-badge skill-missing'>{s}</span>", unsafe_allow_html=True)
    else:
        st.caption("No gaps detected.")

    st.markdown("### 📚 Personalized Learning Path")
    for rec in result["recommendations"]:
        st.markdown(
            f"<div class='resource-card'><strong>{rec['title']}</strong><br>"
            f"<span style='font-size:0.85rem;color:#475569;'>{rec['type']}</span><br>"
            f"<em>{rec['why']}</em><br>"
            f"<a href='{rec['link']}' target='_blank'>🔗 Open Resource</a></div>",
            unsafe_allow_html=True
        )

    if show_debug:
        st.json(result)

    st.markdown("</div>", unsafe_allow_html=True)

# =============================
# Footer
# =============================
st.markdown(
    "<p style='text-align:center;color:#94a3b8;font-size:0.85rem;margin-top:2rem;'>"
    "Built with ❤️ by Team Cypher29</p>",
    unsafe_allow_html=True
)
