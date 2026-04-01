import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import MainPage from './routes/MainPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<MainPage />} />
      </Route>
    </Routes>
  )
}
