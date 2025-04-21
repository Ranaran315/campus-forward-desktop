import { Routes, Route, Link } from 'react-router-dom'
import './App.css'
import LoginPage from './views/Login'
import CustomHeader from '@/components/CustomHeader/CustomHeader'

function HomePage() {
  return <h2>Home Page (Dashboard)</h2>
}

function NotificationsPage() {
  return <h2>Notifications Page</h2>
}

function NotFoundPage() {
  return <h2>404 - Page Not Found</h2>
}

function App() {
  return (
    <>
      <CustomHeader title="飞书" />
      <nav>
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/login">Login</Link>
          </li>
          <li>
            <Link to="/notifications">Notifications</Link>
          </li>
        </ul>
      </nav>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  )
}

export default App
