import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { LocalAuthGate } from './components/auth/LocalAuthGate'
import { DashboardLayout } from './components/layout/DashboardLayout'
import ChatPage from './pages/ChatPage'
import LibraryPage from './pages/LibraryPage'
import SettingsPage from './pages/SettingsPage'

function App() {
  return (
    <Router>
      <LocalAuthGate>
        <DashboardLayout>
          <Routes>
            <Route path="/" element={<ChatPage />} />
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </DashboardLayout>
      </LocalAuthGate>
    </Router>
  )
}

export default App
