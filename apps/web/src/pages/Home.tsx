import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { initHeroEntrance, initSectionReveals } from '../animations'
import { useHubData } from '../hooks/useHubData'
import { HeroSection } from '../components/HeroSection'
import { GettingStartedSection } from '../components/GettingStartedSection'
import { TemplateLibrarySection } from '../components/TemplateLibrarySection'

export function Home() {
  const hub = useHubData()

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
      <TemplateLibrarySection
        copiedInstallCode={hub.copiedInstallCode}
        activeCategory={hub.activeCategory}
        categories={hub.categories}
        filteredTemplates={hub.filteredTemplates}
        onCategoryChange={hub.setActiveCategory}
        onCopyInstallCode={hub.copyInstallCode}
      />
    </div>
  )
}
