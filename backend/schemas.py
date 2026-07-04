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

class ChapterBase(BaseModel):
    id: int
    title: str
    reading_title: Optional[str] = None

class ChapterCreate(ChapterBase):
    pass

# Response schema matching the original app client structure
class ChapterResponse(BaseModel):
    id: int
    title: str
    readingTitle: Optional[str] = Field(None, alias="reading_title")
    vocab: List[VocabularyBase] = []
    readingText: List[ReadingSentenceBase] = []
    knownIndices: List[int] = [] # List of indices in the vocab array that are mastered

    class Config:
        from_attributes = True
        populate_by_name = True

# Upload payload schema matching raw JSON import format
class ChapterUpload(BaseModel):
    id: int
    title: str
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

