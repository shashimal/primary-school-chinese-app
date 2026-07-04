from pydantic import BaseModel, Field
from typing import List, Optional

class VocabularyBase(BaseModel):
    char: str
    pinyin: str
    meaning: str
    emoji: Optional[str] = None

class VocabularyCreate(VocabularyBase):
    pass

class Vocabulary(VocabularyBase):
    id: int
    chapter_id: int

    class Config:
        from_attributes = True

class ReadingSentenceBase(BaseModel):
    text: str
    audio: str

class ReadingSentenceCreate(ReadingSentenceBase):
    pass

class ReadingSentence(ReadingSentenceBase):
    id: int
    chapter_id: int
    sequence: int

    class Config:
        from_attributes = True

class ChapterResponse(BaseModel):
    id: int
    title: str
    grade: int = 4
    readingTitle: Optional[str] = Field(None, alias="reading_title")
    vocab: List[VocabularyBase] = []
    readingText: List[ReadingSentenceBase] = []
    knownIndices: List[int] = []

    class Config:
        from_attributes = True
        populate_by_name = True

class ChapterUpload(BaseModel):
    id: Optional[int] = None
    title: str
    grade: int = 4
    readingTitle: Optional[str] = None
    vocab: List[VocabularyCreate] = []
    readingText: List[ReadingSentenceCreate] = []

class MasteryToggle(BaseModel):
    char: str
    is_known: bool

class MasteryResponse(BaseModel):
    char: str
    is_known: bool

    class Config:
        from_attributes = True

class MistakeRecord(BaseModel):
    char: str

class MistakeResponse(BaseModel):
    char: str
    missed_count: int

    class Config:
        from_attributes = True

class GenerateRequest(BaseModel):
    topic: str
    api_key: Optional[str] = None
    grade: int = 4

class GradeSummary(BaseModel):
    grade: int
    chapter_count: int
    total_vocab: int
    mastered_vocab: int
