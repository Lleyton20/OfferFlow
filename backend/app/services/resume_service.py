import io
import os
import re
import uuid
from pathlib import Path

from pypdf import PdfReader
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.resume import Resume

UPLOAD_DIR = Path(os.getenv("RESUME_UPLOAD_DIR", "uploads/resumes"))
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
ALLOWED_CONTENT_TYPES = {"application/pdf", "text/plain"}

_STOPWORDS = {
    "the", "a", "an", "and", "or", "to", "of", "in", "on", "for", "with", "is",
    "are", "as", "by", "at", "from", "this", "that", "be", "will", "have", "has",
    "you", "your", "we", "our", "job", "role",
}


def extract_text(content: bytes, content_type: str) -> str:
    if content_type == "application/pdf":
        reader = PdfReader(io.BytesIO(content))
        return "\n".join(page.extract_text() or "" for page in reader.pages)
    return content.decode("utf-8", errors="ignore")


def _keywords(text: str) -> set[str]:
    words = re.findall(r"[a-zA-Z][a-zA-Z+.#]{1,}", text.lower())
    words = (w.rstrip(".") for w in words)
    return {w for w in words if w not in _STOPWORDS and len(w) > 2}


def score_resume(resume_text: str, job_description: str | None) -> tuple[int, list[dict], list[str], list[str]]:
    resume_keywords = _keywords(resume_text)
    checks: list[dict] = []
    score = 0
    max_score = 0

    max_score += 15
    has_email = bool(re.search(r"[\w.+-]+@[\w-]+\.[\w.-]+", resume_text))
    if has_email:
        score += 15
        checks.append({"check": "Contact info", "passed": True, "detail": "Email address found."})
    else:
        checks.append(
            {"check": "Contact info", "passed": False, "detail": "No email address detected."}
        )

    max_score += 20
    has_metrics = bool(re.search(r"\d+%|\$\d+|\b\d{2,}\b", resume_text))
    if has_metrics:
        score += 20
        checks.append(
            {
                "check": "Quantifiable achievements",
                "passed": True,
                "detail": "Found numbers/metrics that suggest quantified impact.",
            }
        )
    else:
        checks.append(
            {
                "check": "Quantifiable achievements",
                "passed": False,
                "detail": 'No numbers or metrics found — consider quantifying impact (e.g. "improved performance by 30%").',
            }
        )

    max_score += 15
    word_count = len(resume_text.split())
    length_ok = 150 <= word_count <= 1200
    if length_ok:
        score += 15
        checks.append(
            {"check": "Length", "passed": True, "detail": f"{word_count} words — a reasonable length."}
        )
    else:
        checks.append(
            {
                "check": "Length",
                "passed": False,
                "detail": f"{word_count} words — resumes are usually most effective between 150 and 1200 words.",
            }
        )

    max_score += 10
    sections_found = [
        s for s in ["experience", "education", "skills", "projects"] if s in resume_text.lower()
    ]
    if len(sections_found) >= 2:
        score += 10
        checks.append(
            {
                "check": "Standard sections",
                "passed": True,
                "detail": f"Found sections: {', '.join(sections_found)}.",
            }
        )
    else:
        checks.append(
            {
                "check": "Standard sections",
                "passed": False,
                "detail": "Couldn't detect standard resume sections (Experience, Education, Skills, Projects).",
            }
        )

    matched_keywords: list[str] = []
    missing_keywords: list[str] = []
    if job_description:
        jd_keywords = _keywords(job_description)
        candidate_keywords = sorted(jd_keywords, key=len, reverse=True)[:30]
        matched_keywords = sorted(k for k in candidate_keywords if k in resume_keywords)
        missing_keywords = sorted(k for k in candidate_keywords if k not in resume_keywords)
        max_score += 40
        if candidate_keywords:
            match_ratio = len(matched_keywords) / len(candidate_keywords)
            score += round(match_ratio * 40)
            checks.append(
                {
                    "check": "Keyword match",
                    "passed": match_ratio >= 0.5,
                    "detail": f"Matched {len(matched_keywords)} of {len(candidate_keywords)} keywords from the job description.",
                }
            )

    final_score = round((score / max_score) * 100) if max_score else 0
    return final_score, checks, matched_keywords, missing_keywords


def save_upload(user_id: int, filename: str, content: bytes) -> str:
    user_dir = UPLOAD_DIR / str(user_id)
    user_dir.mkdir(parents=True, exist_ok=True)
    ext = Path(filename).suffix
    stored_name = f"{uuid.uuid4().hex}{ext}"
    path = user_dir / stored_name
    path.write_bytes(content)
    return str(path)


def delete_file(storage_path: str) -> None:
    Path(storage_path).unlink(missing_ok=True)


def list_resumes(db: Session, user_id: int) -> list[Resume]:
    return list(
        db.scalars(
            select(Resume).where(Resume.user_id == user_id).order_by(Resume.created_at.desc())
        )
    )


def get_resume(db: Session, user_id: int, resume_id: int) -> Resume | None:
    return db.scalar(select(Resume).where(Resume.id == resume_id, Resume.user_id == user_id))


def create_resume(
    db: Session,
    user_id: int,
    filename: str,
    content_type: str,
    storage_path: str,
    extracted_text: str,
    job_description: str | None,
    ats_score: int,
    ats_checks: list[dict],
    matched_keywords: list[str],
    missing_keywords: list[str],
    ai_feedback: dict | None,
    ai_feedback_status: str,
) -> Resume:
    resume = Resume(
        user_id=user_id,
        filename=filename,
        content_type=content_type,
        storage_path=storage_path,
        extracted_text=extracted_text,
        job_description=job_description,
        ats_score=ats_score,
        ats_checks=ats_checks,
        matched_keywords=matched_keywords,
        missing_keywords=missing_keywords,
        ai_feedback=ai_feedback,
        ai_feedback_status=ai_feedback_status,
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)
    return resume


def delete_resume(db: Session, resume: Resume) -> None:
    delete_file(resume.storage_path)
    db.delete(resume)
    db.commit()
