import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import MainPage from './routes/MainPage'
import LoginPage from './routes/LoginPage'
import AdminChatsPage from './routes/AdminChatsPage'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<MainPage />} />
      </Route>
      <Route
        path="/admin/chats"
        element={<ProtectedRoute><AdminChatsPage /></ProtectedRoute>}
      />
    </Routes>
  )
}
