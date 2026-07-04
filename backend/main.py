from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Dict

import models
import schemas
import crud
from database import engine, get_db, SessionLocal

# Create tables if they don't exist
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Savean 学中文 - Backend")

# Setup CORS for React frontend (runs on 5173 by default in Vite)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins in local dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/chapters", response_model=List[schemas.ChapterResponse])
def read_chapters(db: Session = Depends(get_db)):
    try:
        return crud.get_chapters(db)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

@app.post("/api/chapters", status_code=status.HTTP_201_CREATED)
def create_chapter(chapter: schemas.ChapterUpload, db: Session = Depends(get_db)):
    try:
        crud.upsert_chapter(db, chapter)
        return {"status": "success", "message": f"Chapter {chapter.id} uploaded successfully."}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload chapter: {str(e)}"
        )

@app.post("/api/mastery", response_model=schemas.MasteryResponse)
def update_mastery(toggle: schemas.MasteryToggle, db: Session = Depends(get_db)):
    try:
        return crud.toggle_mastery(db, toggle)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update mastery: {str(e)}"
        )

@app.post("/api/mistakes", response_model=schemas.MistakeResponse)
def record_mistake(record: schemas.MistakeRecord, db: Session = Depends(get_db)):
    try:
        return crud.record_mistake(db, record)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to record mistake: {str(e)}"
        )

@app.get("/api/mistakes", response_model=Dict[str, int])
def read_mistakes(db: Session = Depends(get_db)):
    try:
        return crud.get_mistakes(db)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve mistake stats: {str(e)}"
        )

@app.post("/api/reset")
def reset_progress(db: Session = Depends(get_db)):
    try:
        crud.reset_all_progress(db)
        return {"status": "success", "message": "All progress and stats reset successfully."}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reset progress: {str(e)}"
        )

@app.post("/api/chapters/generate", response_model=schemas.ChapterResponse)
def generate_chapter(req: schemas.GenerateRequest, db: Session = Depends(get_db)):
    import urllib.request
    import json
    import os
    
    api_key = req.api_key or os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=400,
            detail="Gemini API Key is required. Please set the GEMINI_API_KEY environment variable or provide it in the form."
        )
    
    # Calculate next available chapter ID
    max_id = db.query(models.Chapter.id).order_by(models.Chapter.id.desc()).first()
    new_id = (max_id[0] + 1) if max_id else 1
    
    prompt = f"""
    Generate a beginner Chinese study chapter in JSON format for the topic "{req.topic}".
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
    1. Generate 5 to 8 relevant vocabulary words for beginners. Include the character(s), pinyin, English meaning, and a matching emoji.
    2. Write 2 to 3 simple reading practice sentences in Chinese, using the vocabulary words where possible. Keep them very simple. Keep audio as "".
    3. The response must be ONLY the raw JSON block. Do not include markdown code block syntax (like ```json), do not include any preamble or extra text.
    """
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    headers = {"Content-Type": "application/json"}
    payload = {
        "contents": [{"parts": [{"text": prompt}]}]
    }
    
    try:
        req_data = json.dumps(payload).encode("utf-8")
        request = urllib.request.Request(url, data=req_data, headers=headers, method="POST")
        with urllib.request.urlopen(request, timeout=20) as response:
            res_body = response.read().decode("utf-8")
            res_json = json.loads(res_body)
            
            # Extract text from Gemini response
            raw_text = res_json['candidates'][0]['content']['parts'][0]['text'].strip()
            
            # Clean up potential markdown wrappers
            if raw_text.startswith("```"):
                lines = raw_text.splitlines()
                if lines[0].startswith("```"):
                    lines = lines[1:]
                if lines[-1].startswith("```"):
                    lines = lines[:-1]
                raw_text = "\n".join(lines).strip()
            
            chapter_data = json.loads(raw_text)
            
            # Force the correct ID
            chapter_data["id"] = new_id
            
            # Validate schema
            validated_upload = schemas.ChapterUpload(**chapter_data)
            
            # Upsert into database
            crud.upsert_chapter(db, validated_upload)
            
            # Retrieve and return ChapterResponse
            chapters = crud.get_chapters(db)
            for ch in chapters:
                if ch.id == new_id:
                    return ch
            raise HTTPException(status_code=500, detail="Chapter created but could not be retrieved.")
            
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate chapter: {str(e)}"
        )

@app.post("/api/chapters/clear")
def clear_all_chapters(db: Session = Depends(get_db)):
    try:
        db.query(models.Chapter).delete()
        db.query(models.Mastery).delete()
        db.query(models.Mistake).delete()
        db.commit()
        return {"status": "success", "message": "All chapters and progress cleared successfully."}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to clear chapters: {str(e)}"
        )
