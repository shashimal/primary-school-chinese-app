from typing import Optional, List, Dict
from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text

import models
import schemas
import crud
from database import engine, get_db

models.Base.metadata.create_all(bind=engine)

# Add grade column to existing deployments that predate this field
with engine.connect() as _conn:
    try:
        _conn.execute(text("ALTER TABLE chapters ADD COLUMN IF NOT EXISTS grade INTEGER NOT NULL DEFAULT 4"))
        _conn.commit()
    except Exception:
        pass

app = FastAPI(title="Savean 学中文 - Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/grades", response_model=List[schemas.GradeSummary])
def read_grade_summary(db: Session = Depends(get_db)):
    try:
        return crud.get_grade_summary(db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/chapters", response_model=List[schemas.ChapterResponse])
def read_chapters(grade: Optional[int] = Query(None), db: Session = Depends(get_db)):
    try:
        return crud.get_chapters(db, grade=grade)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.post("/api/chapters", status_code=status.HTTP_201_CREATED)
def create_chapter(chapter: schemas.ChapterUpload, db: Session = Depends(get_db)):
    try:
        crud.upsert_chapter(db, chapter)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload chapter: {str(e)}")

@app.post("/api/mastery", response_model=schemas.MasteryResponse)
def update_mastery(toggle: schemas.MasteryToggle, db: Session = Depends(get_db)):
    try:
        return crud.toggle_mastery(db, toggle)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update mastery: {str(e)}")

@app.post("/api/mistakes", response_model=schemas.MistakeResponse)
def record_mistake(record: schemas.MistakeRecord, db: Session = Depends(get_db)):
    try:
        return crud.record_mistake(db, record)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to record mistake: {str(e)}")

@app.get("/api/mistakes", response_model=Dict[str, int])
def read_mistakes(db: Session = Depends(get_db)):
    try:
        return crud.get_mistakes(db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve mistakes: {str(e)}")

@app.post("/api/reset")
def reset_progress(db: Session = Depends(get_db)):
    try:
        crud.reset_all_progress(db)
        return {"status": "success", "message": "All progress reset successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to reset progress: {str(e)}")

@app.post("/api/chapters/clear")
def clear_chapters(grade: Optional[int] = Query(None), db: Session = Depends(get_db)):
    try:
        crud.clear_chapters(db, grade=grade)
        msg = f"Primary {grade} chapters cleared." if grade else "All chapters cleared."
        return {"status": "success", "message": msg}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear chapters: {str(e)}")

@app.post("/api/chapters/generate", response_model=schemas.ChapterResponse)
def generate_chapter(req: schemas.GenerateRequest, db: Session = Depends(get_db)):
    import urllib.request
    import json
    import os

    api_key = req.api_key or os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=400, detail="Gemini API Key is required.")

    max_id = db.query(models.Chapter.id).order_by(models.Chapter.id.desc()).first()
    new_id = (max_id[0] + 1) if max_id else 1

    grade_labels = {1: "Primary 1", 2: "Primary 2", 3: "Primary 3",
                    4: "Primary 4", 5: "Primary 5", 6: "Primary 6"}
    grade_label = grade_labels.get(req.grade, f"Primary {req.grade}")

    prompt = f"""
    Generate a {grade_label} Chinese study chapter in JSON format for the topic "{req.topic}".
    Vocabulary difficulty should match the {grade_label} level.
    The JSON must follow this exact structure:
    {{
      "id": {new_id},
      "title": "Topic Name in Chinese & English (e.g. Fruits (水果))",
      "readingTitle": "A simple story topic related to the theme",
      "vocab": [
        {{ "char": "苹果", "pinyin": "píngguǒ", "meaning": "apple", "emoji": "🍎" }}
      ],
      "readingText": [
        {{ "text": "我喜欢吃红色的苹果。", "audio": "" }}
      ]
    }}

    Requirements:
    1. Generate 5 to 8 vocabulary words appropriate for {grade_label} beginners. Include character(s), pinyin, English meaning, and a matching emoji.
    2. Write 2 to 3 simple reading sentences in Chinese using the vocabulary. Keep audio as "".
    3. The response must be ONLY the raw JSON block with no markdown code fences or preamble.
    """

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    payload = {"contents": [{"parts": [{"text": prompt}]}]}

    try:
        req_data = json.dumps(payload).encode("utf-8")
        request = urllib.request.Request(url, data=req_data,
                                         headers={"Content-Type": "application/json"}, method="POST")
        with urllib.request.urlopen(request, timeout=20) as response:
            res_json = json.loads(response.read().decode("utf-8"))
            raw_text = res_json['candidates'][0]['content']['parts'][0]['text'].strip()

            if raw_text.startswith("```"):
                lines = raw_text.splitlines()
                lines = lines[1:] if lines[0].startswith("```") else lines
                lines = lines[:-1] if lines[-1].startswith("```") else lines
                raw_text = "\n".join(lines).strip()

            chapter_data = json.loads(raw_text)
            chapter_data["id"] = new_id
            chapter_data["grade"] = req.grade

            validated = schemas.ChapterUpload(**chapter_data)
            crud.upsert_chapter(db, validated)

            for ch in crud.get_chapters(db):
                if ch.id == new_id:
                    return ch

            raise HTTPException(status_code=500, detail="Chapter created but could not be retrieved.")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate chapter: {str(e)}")
