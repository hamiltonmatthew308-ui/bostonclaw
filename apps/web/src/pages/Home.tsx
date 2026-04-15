import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { initHeroEntrance, initSectionReveals } from '../animations'
import { HeroSection } from '../components/HeroSection'
import { GettingStartedSection } from '../components/GettingStartedSection'

export function Home() {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      initHeroEntrance()
      initSectionReveals()
    }, 100)

    return () => window.clearTimeout(timer)
  }, [])

  return (
    <div className="page-shell">
      <Link to="/" className="site-logo">
        <span className="logo-name">Bostonclaw</span>
        <span className="logo-sub">Boston Aesthetics</span>
      </Link>
      <div className="paper-noise" />
      <HeroSection />
      <GettingStartedSection />
    </div>
  )
}
