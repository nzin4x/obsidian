import { useMemo, useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { PublishedNote } from '../types';
import { Tldraw, createTLStore } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';

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

  // Obsidian 이미지 문법을 변환하는 함수
  const processContent = useMemo(() => {
    // Obsidian 이미지 문법을 표준 마크다운으로 변환
    return note.content.replace(
      /!\[\[(.*?)\]\]/g,
      (_, filename) => {
        // 파일명을 정리하고 /assets/ 경로를 추가
        const cleanFilename = filename.trim();
        return `![${cleanFilename}](/assets/${encodeURIComponent(cleanFilename)})`;
      }
    );
  }, [note.content]);

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
      <div className="note-content markdown-body">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            // 이미지 처리
            img: ({ src, alt, ...props }) => {
              if (!src) return null;
              
              // src가 이미 /assets/로 시작하면 그대로 사용
              const imagePath = src.startsWith('/assets/') ? src : `/assets/${encodeURIComponent(src)}`;
              
              return (
                <img
                  {...props}
                  src={imagePath}
                  alt={alt || ''}
                  loading="lazy"
                  onError={(e) => {
                    const img = e.currentTarget;
                    img.style.border = '1px solid #ff0000';
                    img.title = '이미지를 찾을 수 없습니다';
                  }}
                />
              );
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
            },

            // 코드 블록 처리
            code: ({ className, children }) => {
              // handdrawn-ink 코드 블록 처리
              if (className === 'language-handdrawn-ink' && children) {
                try {
                  const config = JSON.parse(children.toString());
                  const width = config.width || 500;
                  const aspectRatio = config.aspectRatio || 1;

                  // drawing 파일 경로 구성
                  const drawingPath = `/assets/${config.filepath}`;
                  const [drawingData, setDrawingData] = useState<any>(null);

                  useEffect(() => {
                    fetch(drawingPath)
                      .then(response => response.json())
                      .then(data => {
                        console.log('Drawing data loaded:', data);
                        console.log('tldraw data structure:', JSON.stringify(data.tldraw, null, 2));
                        setDrawingData(data.tldraw);
                      })
                      .catch(error => {
                        console.error('Error loading drawing:', error);
                      });
                  }, [drawingPath]);

                  if (!drawingData) {
                    return <div>로딩 중...</div>;
                  }
                  
                  return (
                    <div style={{ width, height: width / aspectRatio, margin: '1rem 0', border: '1px solid #eee' }}>
                      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                        <Tldraw
                          snapshot={drawingData}
                        />
                      </div>
                    </div>
                  );
                } catch (e) {
                  console.error('Failed to parse handdrawn-ink config:', e);
                  return <pre>{children}</pre>;
                }
              }

              // 기본 코드 블록 처리
              return <pre><code className={className}>{children}</code></pre>;
            }
          }}
        >
          {processContent}
        </ReactMarkdown>
      </div>
    </article>
  );
}