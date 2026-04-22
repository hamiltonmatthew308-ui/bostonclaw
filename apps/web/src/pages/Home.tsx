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
        <svg viewBox="0 0 100 100" fill="none" width="28" height="28" style={{ flexShrink: 0 }}>
          <rect x="8" y="8" width="84" height="84" rx="16" fill="#D4401A" />
          <path d="M 30 24 L 30 76 M 30 24 L 56 24 C 68 24, 68 48, 56 48 L 30 48 M 30 48 L 54 48 C 68 48, 68 76, 54 76 L 30 76" fill="none" stroke="#FAFAF8" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="logo-name">Bostonclaw</span>
      </Link>
      <div className="paper-noise" />
      <HeroSection />
      <GettingStartedSection />
    </div>
  )
}
