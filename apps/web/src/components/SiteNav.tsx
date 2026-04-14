import { Link, useLocation } from 'react-router-dom'

export function SiteNav() {
  const location = useLocation()

  return (
    <nav className="pill-nav">
      <Link to="/" className={location.pathname === '/' ? 'active' : ''}>首页</Link>
      <Link to="/templates" className={location.pathname === '/templates' ? 'active' : ''}>模板中心</Link>
      <Link to="/download" className={location.pathname === '/download' ? 'active' : ''}>下载</Link>
      <Link to="/report" className={location.pathname === '/report' ? 'active' : ''}>汇报</Link>
    </nav>
  )
}
