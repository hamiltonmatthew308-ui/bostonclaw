import { useEffect } from 'react'
import { TemplateLibrarySection } from '../components/TemplateLibrarySection'
import { useHubData } from '../hooks/useHubData'
import { initSectionReveals } from '../animations'

export function Templates() {
  const hub = useHubData()

  useEffect(() => {
    initSectionReveals()
  }, [])

  return (
    <div className="page-shell">
      <div className="paper-noise" />
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
