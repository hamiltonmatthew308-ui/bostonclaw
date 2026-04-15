import { useEffect } from 'react'
import { Link } from 'react-router-dom'
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
      <Link to="/" className="back-link">← 返回首页</Link>
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
