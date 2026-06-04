import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Step1 from './pages/Step1'
import Step2 from './pages/Step2'
import Loading from './pages/Loading'
import Results from './pages/Results'
import Detail from './pages/Detail'
import StoreMap from './pages/StoreMap'
import StoreDetail from './pages/StoreDetail'
import GrantStatus from './pages/GrantStatus'
import Home from './pages/Home'
import Alarm from './pages/Alarm'
import Checklist from './pages/Checklist'
import StoreSearch from './pages/StoreSearch'
import BasicInfo from './pages/BasicInfo'
import { getAccessToken } from './lib/api'

function RequireAuth({ children }) {
  return getAccessToken() ? children : <Navigate to="/" replace />
}

function Layout() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/step1" element={<RequireAuth><Step1 /></RequireAuth>} />
      <Route path="/step2" element={<RequireAuth><Step2 /></RequireAuth>} />
      <Route path="/loading" element={<RequireAuth><Loading /></RequireAuth>} />
      <Route path="/results" element={<RequireAuth><Results /></RequireAuth>} />
      <Route path="/detail" element={<RequireAuth><Detail /></RequireAuth>} />
      <Route path="/map" element={<RequireAuth><StoreMap /></RequireAuth>} />
      <Route path="/store-detail" element={<RequireAuth><StoreDetail /></RequireAuth>} />
      <Route path="/grant-status" element={<RequireAuth><GrantStatus /></RequireAuth>} />
      <Route path="/home" element={<RequireAuth><Home /></RequireAuth>} />
      <Route path="/alarm" element={<RequireAuth><Alarm /></RequireAuth>} />
      <Route path="/checklist" element={<RequireAuth><Checklist /></RequireAuth>} />
      <Route path="/store-search" element={<RequireAuth><StoreSearch /></RequireAuth>} />
      <Route path="/basic-info" element={<RequireAuth><BasicInfo /></RequireAuth>} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <Layout />
    </BrowserRouter>
  )
}
