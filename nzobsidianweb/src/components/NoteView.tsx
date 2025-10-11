import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { PublishedNote } from '../types';

interface NoteViewProps {
  note: PublishedNote;
}

export function NoteView({ note }: NoteViewProps) {
  // 날짜 포맷팅
  const formattedDate = useMemo(() => {
    if (!note.frontmatter.date) return '';
    try {
      return new Date(note.frontmatter.date).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return note.frontmatter.date;
    }
  }, [note.frontmatter.date]);

  return (
    <article className="note">
      {/* 노트 헤더 */}
      <header className="note-header">
        <h1>{note.frontmatter.title || note.path}</h1>
        {formattedDate && (
          <time dateTime={note.frontmatter.date}>{formattedDate}</time>
        )}
        {note.frontmatter.tags?.length > 0 && (
          <div className="tags">
            {note.frontmatter.tags.map((tag: string) => (
              <span key={tag} className="tag">#{tag}</span>
            ))}
          </div>
        )}
      </header>

      {/* 노트 내용 */}
      <div className="note-content">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            // 이미지 처리
            img: ({ src, alt, ...props }) => {
              if (!src) return null;
              
              // /assets/로 시작하는 이미지는 public 폴더에서 로드
              if (src.startsWith('/assets/')) {
                return (
                  <img
                    {...props}
                    src={src}
                    alt={alt || ''}
                    loading="lazy"
                    onError={(e) => {
                      const img = e.currentTarget;
                      img.style.border = '1px solid #ff0000';
                      img.title = '이미지를 찾을 수 없습니다';
                    }}
                  />
                );
              }

              // 외부 이미지는 그대로 표시
              return <img {...props} src={src} alt={alt || ''} loading="lazy" />;
            },

            // 링크 처리
            a: ({ href, children }) => {
              if (!href) return <>{children}</>;

              // 외부 링크는 새 탭에서 열기
              if (href.startsWith('http')) {
                return (
                  <a href={href} target="_blank" rel="noopener noreferrer">
                    {children} ↗
                  </a>
                );
              }

              // 내부 링크
              return <a href={href}>{children}</a>;
            }
          }}
        >
          {note.content}
        </ReactMarkdown>
      </div>
    </article>
  );
}