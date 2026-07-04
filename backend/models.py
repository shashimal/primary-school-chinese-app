from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class Chapter(Base):
    __tablename__ = "chapters"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    reading_title = Column(String, nullable=True)

    vocab = relationship("Vocabulary", back_populates="chapter", cascade="all, delete-orphan")
    reading_sentences = relationship("ReadingSentence", back_populates="chapter", cascade="all, delete-orphan")

class Vocabulary(Base):
    __tablename__ = "vocabulary"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    chapter_id = Column(Integer, ForeignKey("chapters.id", ondelete="CASCADE"), nullable=False)
    char = Column(String, nullable=False)
    pinyin = Column(String, nullable=False)
    meaning = Column(String, nullable=False)
    emoji = Column(String, nullable=True)

    chapter = relationship("Chapter", back_populates="vocab")

class ReadingSentence(Base):
    __tablename__ = "reading_sentences"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    chapter_id = Column(Integer, ForeignKey("chapters.id", ondelete="CASCADE"), nullable=False)
    text = Column(String, nullable=False)
    audio = Column(String, nullable=False)
    sequence = Column(Integer, nullable=False)

    chapter = relationship("Chapter", back_populates="reading_sentences")

class Mastery(Base):
    __tablename__ = "mastery"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    char = Column(String, unique=True, index=True, nullable=False)
    is_known = Column(Boolean, default=False, nullable=False)

class Mistake(Base):
    __tablename__ = "mistakes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    char = Column(String, unique=True, index=True, nullable=False)
    missed_count = Column(Integer, default=0, nullable=False)
