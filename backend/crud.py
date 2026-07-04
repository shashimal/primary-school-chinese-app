from sqlalchemy.orm import Session
import models
import schemas

def get_chapters(db: Session):
    # Fetch all chapters, order by ID
    chapters = db.query(models.Chapter).order_by(models.Chapter.id).all()
    
    # Fetch all mastered characters
    mastered_chars = {
        m.char for m in db.query(models.Mastery).filter(models.Mastery.is_known == True).all()
    }
    
    response_list = []
    for ch in chapters:
        # Formulate vocabulary list
        vocab_list = [
            schemas.VocabularyBase(
                char=v.char,
                pinyin=v.pinyin,
                meaning=v.meaning,
                emoji=v.emoji
            ) for v in ch.vocab
        ]
        
        # Calculate indices of mastered words
        known_indices = []
        for idx, item in enumerate(ch.vocab):
            if item.char in mastered_chars:
                known_indices.append(idx)
        
        # Formulate reading text, ordered by sequence
        sorted_sentences = sorted(ch.reading_sentences, key=lambda s: s.sequence)
        reading_text = [
            schemas.ReadingSentenceBase(
                text=s.text,
                audio=s.audio
            ) for s in sorted_sentences
        ]
        
        response_list.append(
            schemas.ChapterResponse(
                id=ch.id,
                title=ch.title,
                reading_title=ch.reading_title,
                vocab=vocab_list,
                readingText=reading_text,
                knownIndices=known_indices
            )
        )
        
    return response_list

def upsert_chapter(db: Session, upload_data: schemas.ChapterUpload):
    # Check if chapter exists. If so, delete it to do a clean overwrite (cascade delete vocab and reading sentences)
    existing_chapter = db.query(models.Chapter).filter(models.Chapter.id == upload_data.id).first()
    if existing_chapter:
        db.delete(existing_chapter)
        db.commit()
    
    # Create the new chapter
    db_chapter = models.Chapter(
        id=upload_data.id,
        title=upload_data.title,
        reading_title=upload_data.readingTitle
    )
    db.add(db_chapter)
    db.flush() # Gets database handle configured for FKs
    
    # Add vocabulary items
    for item in upload_data.vocab:
        db_vocab = models.Vocabulary(
            chapter_id=db_chapter.id,
            char=item.char,
            pinyin=item.pinyin,
            meaning=item.meaning,
            emoji=item.emoji
        )
        db.add(db_vocab)
        
    # Add reading sentences with sequence ordering
    for seq, text_item in enumerate(upload_data.readingText):
        db_sentence = models.ReadingSentence(
            chapter_id=db_chapter.id,
            text=text_item.text,
            audio=text_item.audio,
            sequence=seq
        )
        db.add(db_sentence)
        
    db.commit()
    return db_chapter

def toggle_mastery(db: Session, toggle: schemas.MasteryToggle):
    db_mastery = db.query(models.Mastery).filter(models.Mastery.char == toggle.char).first()
    if db_mastery:
        db_mastery.is_known = toggle.is_known
    else:
        db_mastery = models.Mastery(
            char=toggle.char,
            is_known=toggle.is_known
        )
        db.add(db_mastery)
    db.commit()
    db.refresh(db_mastery)
    return db_mastery

def record_mistake(db: Session, record: schemas.MistakeRecord):
    db_mistake = db.query(models.Mistake).filter(models.Mistake.char == record.char).first()
    if db_mistake:
        db_mistake.missed_count += 1
    else:
        db_mistake = models.Mistake(
            char=record.char,
            missed_count=1
        )
        db.add(db_mistake)
    db.commit()
    db.refresh(db_mistake)
    return db_mistake

def get_mistakes(db: Session):
    mistakes = db.query(models.Mistake).all()
    # Return as {char: count}
    return {m.char: m.missed_count for m in mistakes}

def reset_all_progress(db: Session):
    db.query(models.Mastery).delete()
    db.query(models.Mistake).delete()
    db.commit()
    return True
