import { HashRouter, Routes, Route } from 'react-router-dom'
import './App.css'
import { SiteNav } from './components/SiteNav'
import { Home } from './pages/Home'
import { Templates } from './pages/Templates'
import { Community } from './pages/Community'
import { Download } from './pages/Download'
import { Report } from './pages/Report'

function App() {
  return (
    <HashRouter>
      <SiteNav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/templates" element={<Templates />} />
        <Route path="/community" element={<Community />} />
        <Route path="/download" element={<Download />} />
        <Route path="/report" element={<Report />} />
      </Routes>
    </HashRouter>
  )
}

export default App
