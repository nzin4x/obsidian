import { useState, useEffect } from 'react';
import type { PublishedNote } from '../types';
import { NoteView } from './NoteView';
import publishedNotes from '../publishedList.json';
import './Notes.css';

export function NotesContainer() {
  const [notes] = useState<PublishedNote[]>(() => publishedNotes as PublishedNote[]);
  const [selectedNote, setSelectedNote] = useState<PublishedNote | null>(null);

  // URL에서 노트 선택 처리
  useEffect(() => {
    const path = window.location.pathname.replace(/^\/notes\//, '');
    if (path) {
      const note = notes.find((n: PublishedNote) => n.path === path);
      if (note) setSelectedNote(note);
    } else if (notes.length > 0) {
      // 기본값으로 첫 번째 노트 선택
      setSelectedNote(notes[0]);
    }
  }, [notes]);

  // 빈 상태 처리
  if (notes.length === 0) {
    return (
      <div className="notes-empty">
        <h2>게시된 노트가 없습니다</h2>
        <p>publish 태그가 있는 노트를 추가해주세요.</p>
      </div>
    );
  }

  return (
    <div className="notes-container">
      {/* 사이드바: 노트 목록 */}
      <nav className="notes-sidebar">
        <h2 className="sidebar-title">노트 목록</h2>
        <ul className="notes-list">
          {notes.map((note: PublishedNote) => (
            <li
              key={note.path}
              className={`note-item ${selectedNote?.path === note.path ? 'selected' : ''}`}
              onClick={() => {
                setSelectedNote(note);
                // URL 업데이트
                window.history.pushState(null, '', `/notes/${note.path}`);
              }}
            >
              <div className="note-item-title">
                {note.frontmatter.title || note.path}
              </div>
              {note.frontmatter.date && (
                <div className="note-item-date">
                  {new Date(note.frontmatter.date).toLocaleDateString('ko-KR')}
                </div>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* 메인: 선택된 노트 표시 */}
      <main className="notes-main">
        {selectedNote ? (
          <NoteView note={selectedNote} />
        ) : (
          <div className="note-placeholder">
            <h2>노트를 선택해주세요</h2>
          </div>
        )}
      </main>
    </div>
  );
}