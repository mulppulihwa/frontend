import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Step1 from './pages/Step1'
import Step2 from './pages/Step2'
import Loading from './pages/Loading'
import Results from './pages/Results'
import Detail from './pages/Detail'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/step1" element={<Step1 />} />
        <Route path="/step2" element={<Step2 />} />
        <Route path="/loading" element={<Loading />} />
        <Route path="/results" element={<Results />} />
        <Route path="/detail" element={<Detail />} />
      </Routes>
    </BrowserRouter>
  )
}
