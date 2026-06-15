import { BrowserRouter, Navigate, Outlet, Routes, Route, useLocation } from 'react-router-dom'
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
import AddressSearchTest from './pages/AddressSearchTest'
import { getAccessToken } from './lib/api'
import BottomNav from './components/BottomNav'

function RequireAuth({ children }) {
  return getAccessToken() ? children : <Navigate to="/" replace />
}

function AppWithNav() {
  const { pathname } = useLocation()
  const hideBottomNav = ['/step1', '/step2', '/loading', '/results'].includes(pathname)

  return (
    <RequireAuth>
      <Outlet />
      {!hideBottomNav && <BottomNav />}
    </RequireAuth>
  )
}

function Layout() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route element={<AppWithNav />}>
        <Route path="/step1" element={<Step1 />} />
        <Route path="/step2" element={<Step2 />} />
        <Route path="/loading" element={<Loading />} />
        <Route path="/results" element={<Results />} />
        <Route path="/detail" element={<Detail />} />
        <Route path="/map" element={<StoreMap />} />
        <Route path="/store-detail" element={<StoreDetail />} />
        <Route path="/grant-status" element={<GrantStatus />} />
        <Route path="/home" element={<Home />} />
        <Route path="/tutorial" element={<Home tutorial />} />
        <Route path="/alarm" element={<Alarm />} />
        <Route path="/checklist" element={<Checklist />} />
        <Route path="/store-search" element={<StoreSearch />} />
        <Route path="/basic-info" element={<BasicInfo />} />
      </Route>
      <Route path="/dev/address-search-test" element={<AddressSearchTest />} />
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
