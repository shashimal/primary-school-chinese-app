from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
import models
import schemas

def get_chapters(db: Session, grade: Optional[int] = None):
    query = db.query(models.Chapter).order_by(models.Chapter.id)
    if grade is not None:
        query = query.filter(models.Chapter.grade == grade)
    chapters = query.all()

    mastered_chars = {
        m.char for m in db.query(models.Mastery).filter(models.Mastery.is_known == True).all()
    }

    response_list = []
    for ch in chapters:
        vocab_list = [
            schemas.VocabularyBase(char=v.char, pinyin=v.pinyin, meaning=v.meaning, emoji=v.emoji)
            for v in ch.vocab
        ]

        known_indices = [idx for idx, v in enumerate(ch.vocab) if v.char in mastered_chars]

        sorted_sentences = sorted(ch.reading_sentences, key=lambda s: s.sequence)
        reading_text = [
            schemas.ReadingSentenceBase(text=s.text, audio=s.audio)
            for s in sorted_sentences
        ]

        response_list.append(schemas.ChapterResponse(
            id=ch.id,
            title=ch.title,
            grade=ch.grade,
            reading_title=ch.reading_title,
            vocab=vocab_list,
            readingText=reading_text,
            knownIndices=known_indices
        ))

    return response_list

def get_grade_summary(db: Session):
    mastered_chars = {
        m.char for m in db.query(models.Mastery).filter(models.Mastery.is_known == True).all()
    }

    summaries = []
    for grade in range(1, 7):
        chapters = db.query(models.Chapter).filter(models.Chapter.grade == grade).all()
        total_vocab = sum(len(ch.vocab) for ch in chapters)
        mastered_vocab = sum(
            1 for ch in chapters for v in ch.vocab if v.char in mastered_chars
        )
        summaries.append(schemas.GradeSummary(
            grade=grade,
            chapter_count=len(chapters),
            total_vocab=total_vocab,
            mastered_vocab=mastered_vocab
        ))
    return summaries

def upsert_chapter(db: Session, upload_data: schemas.ChapterUpload):
    if upload_data.id is None:
        max_id = db.query(func.max(models.Chapter.id)).scalar() or 0
        chapter_id = max_id + 1
    else:
        chapter_id = upload_data.id

    existing = db.query(models.Chapter).filter(models.Chapter.id == chapter_id).first()
    if existing:
        db.delete(existing)
        db.commit()

    db_chapter = models.Chapter(
        id=chapter_id,
        title=upload_data.title,
        reading_title=upload_data.readingTitle,
        grade=upload_data.grade
    )
    db.add(db_chapter)
    db.flush()

    for item in upload_data.vocab:
        db.add(models.Vocabulary(
            chapter_id=db_chapter.id,
            char=item.char,
            pinyin=item.pinyin,
            meaning=item.meaning,
            emoji=item.emoji
        ))

    for seq, item in enumerate(upload_data.readingText):
        db.add(models.ReadingSentence(
            chapter_id=db_chapter.id,
            text=item.text,
            audio=item.audio,
            sequence=seq
        ))

    db.commit()
    return db_chapter

def toggle_mastery(db: Session, toggle: schemas.MasteryToggle):
    db_mastery = db.query(models.Mastery).filter(models.Mastery.char == toggle.char).first()
    if db_mastery:
        db_mastery.is_known = toggle.is_known
    else:
        db_mastery = models.Mastery(char=toggle.char, is_known=toggle.is_known)
        db.add(db_mastery)
    db.commit()
    db.refresh(db_mastery)
    return db_mastery

def record_mistake(db: Session, record: schemas.MistakeRecord):
    db_mistake = db.query(models.Mistake).filter(models.Mistake.char == record.char).first()
    if db_mistake:
        db_mistake.missed_count += 1
    else:
        db_mistake = models.Mistake(char=record.char, missed_count=1)
        db.add(db_mistake)
    db.commit()
    db.refresh(db_mistake)
    return db_mistake

def get_mistakes(db: Session):
    return {m.char: m.missed_count for m in db.query(models.Mistake).all()}

def reset_all_progress(db: Session):
    db.query(models.Mastery).delete()
    db.query(models.Mistake).delete()

def record_reading_mistake(db: Session, record: schemas.ReadingMistakeRecord):
    db_m = db.query(models.ReadingMistake).filter(models.ReadingMistake.char == record.char).first()
    if db_m:
        db_m.missed_count += 1
        # Update vocab info if it was missing before
        if record.pinyin and not db_m.pinyin:
            db_m.pinyin = record.pinyin
        if record.meaning and not db_m.meaning:
            db_m.meaning = record.meaning
        if record.emoji and not db_m.emoji:
            db_m.emoji = record.emoji
    else:
        db_m = models.ReadingMistake(
            char=record.char,
            pinyin=record.pinyin,
            meaning=record.meaning,
            emoji=record.emoji,
            missed_count=1,
        )
        db.add(db_m)
    db.commit()
    db.refresh(db_m)
    return db_m

def get_reading_mistakes(db: Session):
    return (
        db.query(models.ReadingMistake)
        .order_by(models.ReadingMistake.missed_count.desc())
        .all()
    )

def reset_reading_mistakes(db: Session):
    db.query(models.ReadingMistake).delete()
    db.commit()
    db.commit()

def clear_chapters(db: Session, grade: Optional[int] = None):
    query = db.query(models.Chapter)
    if grade is not None:
        query = query.filter(models.Chapter.grade == grade)
    chapters = query.all()
    for ch in chapters:
        db.delete(ch)
    db.commit()
