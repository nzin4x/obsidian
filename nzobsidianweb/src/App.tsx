import './App.css'
import { NotesContainer } from './components/NotesContainer'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/notes/*" element={<NotesContainer />} />
          <Route path="/" element={<Navigate to="/notes" replace />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
