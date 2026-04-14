import { useEffect } from 'react'
import { initHeroEntrance, initParallax, initSectionReveals } from '../animations'
import { useHubData } from '../hooks/useHubData'
import { SiteNav } from '../components/SiteNav'
import { HeroSection } from '../components/HeroSection'
import { GettingStartedSection } from '../components/GettingStartedSection'
import { TemplateLibrarySection } from '../components/TemplateLibrarySection'
import { CommunityRadarSection } from '../components/CommunityRadarSection'

export function Home() {
  const hub = useHubData()

  useEffect(() => {
    const timer = window.setTimeout(() => {
      initHeroEntrance()
      initParallax()
      initSectionReveals()
    }, 100)

    return () => window.clearTimeout(timer)
  }, [])

  return (
    <div className="page-shell">
      <div className="paper-noise" />
      <SiteNav />
      <HeroSection healthy={hub.healthy} onlineAgents={hub.radarMetrics.onlineAgents} recentEvents={hub.radarMetrics.recentEvents} />
      <GettingStartedSection />
      <TemplateLibrarySection
        copiedInstallCode={hub.copiedInstallCode}
        activeCategory={hub.activeCategory}
        categories={hub.categories}
        filteredTemplates={hub.filteredTemplates}
        onCategoryChange={hub.setActiveCategory}
        onCopyInstallCode={hub.copyInstallCode}
      />
      <CommunityRadarSection
        healthy={hub.healthy}
        agents={hub.agents}
        departmentStats={hub.departmentStats}
        feed={hub.feed}
        agentsById={hub.agentsById}
        radarMetrics={hub.radarMetrics}
      />
    </div>
  )
}
