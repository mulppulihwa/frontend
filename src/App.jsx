import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Login from './pages/Login'
import Step1 from './pages/Step1'
import Step2 from './pages/Step2'
import Loading from './pages/Loading'
import Results from './pages/Results'
import Detail from './pages/Detail'
import StoreMap from './pages/StoreMap'
import StoreDetail from './pages/StoreDetail'
import MyPage from './pages/MyPage'
import GrantStatus from './pages/GrantStatus'
import Home from './pages/Home'
import Alarm from './pages/Alarm'
import Checklist from './pages/Checklist'
import BottomNav from './components/BottomNav'

const NO_NAV = ['/', '/loading']

function Layout() {
  const { pathname } = useLocation()
  const showNav = !NO_NAV.includes(pathname)

  return (
    <>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/step1" element={<Step1 />} />
        <Route path="/step2" element={<Step2 />} />
        <Route path="/loading" element={<Loading />} />
        <Route path="/results" element={<Results />} />
        <Route path="/detail" element={<Detail />} />
        <Route path="/map" element={<StoreMap />} />
        <Route path="/store-detail" element={<StoreDetail />} />
        <Route path="/mypage" element={<MyPage />} />
        <Route path="/grant-status" element={<GrantStatus />} />
        <Route path="/home" element={<Home />} />
        <Route path="/alarm" element={<Alarm />} />
        <Route path="/checklist" element={<Checklist />} />
      </Routes>
      {showNav && <BottomNav />}
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Layout />
    </BrowserRouter>
  )
}
