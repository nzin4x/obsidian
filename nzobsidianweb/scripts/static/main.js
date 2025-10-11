// 노트 목록과 현재 노트 상태 관리
let currentNoteId = null;
const notes = {};

// DOM이 로드되면 초기화
document.addEventListener('DOMContentLoaded', () => {
    // 노트 데이터 로드
    fetch('/notes.json')
        .then(response => response.json())
        .then(data => {
            Object.assign(notes, data);
            initializeNavigation();
            handleInitialRoute();
        })
        .catch(console.error);
});

// 초기 라우트 처리
function handleInitialRoute() {
    const path = window.location.pathname;
    const noteId = path.replace(/^\/notes\//, '').replace(/\.html$/, '');
    
    if (noteId && notes[noteId]) {
        showNote(noteId);
    } else if (Object.keys(notes).length > 0) {
        // 기본적으로 첫 번째 노트 표시
        const firstNoteId = Object.keys(notes)[0];
        navigateToNote(firstNoteId);
    }
}

// 노트 네비게이션 초기화
function initializeNavigation() {
    // 노트 목록 렌더링
    renderNotesList();

    // 브라우저 뒤로/앞으로 버튼 처리
    window.addEventListener('popstate', (event) => {
        if (event.state && event.state.noteId) {
            showNote(event.state.noteId);
        }
    });
}

// 노트 목록 렌더링
function renderNotesList() {
    const notesList = document.querySelector('.notes-list');
    if (!notesList) return;

    const sortedNotes = Object.entries(notes)
        .sort(([, a], [, b]) => new Date(b.date) - new Date(a.date));

    notesList.innerHTML = sortedNotes.map(([id, note]) => `
        <div class="note-item" data-note-id="${id}">
            <h3>${note.title}</h3>
            <time datetime="${note.date}">${formatDate(note.date)}</time>
        </div>
    `).join('');

    // 노트 아이템 클릭 이벤트 처리
    notesList.addEventListener('click', (e) => {
        const noteItem = e.target.closest('.note-item');
        if (noteItem) {
            const noteId = noteItem.dataset.noteId;
            navigateToNote(noteId);
        }
    });
}

// 노트 표시
function showNote(noteId) {
    if (currentNoteId === noteId) return;
    currentNoteId = noteId;

    // 활성 노트 스타일 업데이트
    document.querySelectorAll('.note-item').forEach(item => {
        item.classList.toggle('active', item.dataset.noteId === noteId);
    });

    // 노트 컨텐츠 업데이트
    const noteContent = document.querySelector('.note-content');
    if (noteContent) {
        fetch(`/notes/${noteId}.html`)
            .then(response => response.text())
            .then(html => {
                noteContent.innerHTML = html;
                updateNoteHeader(noteId);
            })
            .catch(console.error);
    }
}

// 노트 헤더 업데이트
function updateNoteHeader(noteId) {
    const note = notes[noteId];
    if (!note) return;

    const header = document.querySelector('.note-header');
    if (header) {
        header.innerHTML = `
            <h1>${note.title}</h1>
            <time datetime="${note.date}">${formatDate(note.date)}</time>
            ${note.tags ? renderTags(note.tags) : ''}
        `;
    }
}

// 태그 렌더링
function renderTags(tags) {
    if (!tags || !tags.length) return '';
    
    return `
        <div class="tags">
            ${tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
        </div>
    `;
}

// 노트로 이동
function navigateToNote(noteId) {
    const url = `/notes/${noteId}.html`;
    history.pushState({ noteId }, '', url);
    showNote(noteId);
}

// 날짜 포맷팅
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}