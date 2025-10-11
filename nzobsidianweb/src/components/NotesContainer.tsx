import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { PublishedNote } from '../types';
import { NoteView } from './NoteView';
import publishedNotes from '../publishedList.json';
import './Notes.css';

export function NotesContainer() {
  const [notes] = useState<PublishedNote[]>(() => publishedNotes as PublishedNote[]);
  const [selectedNote, setSelectedNote] = useState<PublishedNote | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // URL에서 노트 선택 처리
  useEffect(() => {
    const path = decodeURIComponent(location.pathname.replace(/^\/notes\//, ''));
    if (path) {
      const note = notes.find((n: PublishedNote) => n.path === path);
      if (note) {
        setSelectedNote(note);
      } else if (notes.length > 0) {
        // URL에 해당하는 노트를 찾지 못한 경우 첫 번째 노트로
        const firstNote = notes[0];
        setSelectedNote(firstNote);
        navigate(`/notes/${firstNote.path}`);
      }
    } else if (notes.length > 0) {
      // 기본값으로 첫 번째 노트 선택
      const firstNote = notes[0];
      setSelectedNote(firstNote);
      navigate(`/notes/${firstNote.path}`);
    }
  }, [notes, location.pathname, navigate]);

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
                // React Router를 사용하여 URL 업데이트
                navigate(`/notes/${encodeURIComponent(note.path)}`);
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