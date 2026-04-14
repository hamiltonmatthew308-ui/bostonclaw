import type { LobsterTemplatePackage } from '@lobster/shared'

type TemplateLibrarySectionProps = {
  categories: string[]
  activeCategory: string
  filteredTemplates: LobsterTemplatePackage[]
  copiedInstallCode: string | null
  onCategoryChange: (category: string) => void
  onCopyInstallCode: (template: LobsterTemplatePackage) => void | Promise<void>
}

export function TemplateLibrarySection(props: TemplateLibrarySectionProps) {
  return (
    <section id="gallery" className="library-section reveal-card">
      <div className="content-frame">
        <div className="section-heading">
          <p className="section-kicker">Template Registry</p>
          <h2 className="section-title">从 AI 同事模板开始，而不是从空白输入框开始。</h2>
          <p className="section-intro">
            每个模板都带着安装码、角色定义、依赖技能和推荐路线。Web 负责发现，Installer 负责导入与落地。
          </p>
        </div>

        <div className="library-layout">
          <aside className="library-sidebar">
            <div className="sidebar-card">
              <p className="sidebar-title">模板分类</p>
              <ul className="category-list">
                {props.categories.map((category) => (
                  <li key={category}>
                    <button
                      type="button"
                      className={props.activeCategory === category ? 'category-button active' : 'category-button'}
                      onClick={() => props.onCategoryChange(category)}
                    >
                      <span>{category}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          <main className="template-grid">
            {props.filteredTemplates.map((template) => (
              <article key={template.id} className="template-card reveal-card">
                <div className="template-header">
                  <div className="template-meta-row">
                    <span className="template-badge">{template.categoryLabel}</span>
                    <span className="template-rating">★ {template.rating.toFixed(1)}</span>
                  </div>
                  <h3>{template.name}</h3>
                  <p>{template.description}</p>
                </div>

                <div className="template-details">
                  <div>推荐路径：{template.recommendedRuntimeId} / {template.recommendedDeploymentId}</div>
                  <div>技能：{template.dependencies.skills.slice(0, 3).join('、')}</div>
                  <div>安装码：{template.installCode}</div>
                </div>

                <div className="template-footer">
                  <div className="template-clones">{template.clones} clones</div>
                  <button
                    type="button"
                    className="copy-button"
                    onClick={() => void props.onCopyInstallCode(template)}
                  >
                    {props.copiedInstallCode === template.id ? '已复制安装码' : '复制安装码'}
                  </button>
                </div>

                {template.exampleScenarios && template.exampleScenarios.length > 0 && (
                  <details className="template-examples">
                    <summary className="examples-toggle">查看使用示例</summary>
                    <div className="examples-content">
                      {template.exampleScenarios.map((scenario, i) => (
                        <div key={i} className="example-scenario">
                          <p className="example-title">{scenario.title}</p>
                          <div className="example-flow">
                            <div className="example-step">
                              <span className="example-label">你说</span>
                              <p>{scenario.userInput}</p>
                            </div>
                            <span className="example-arrow">→</span>
                            <div className="example-step example-step-output">
                              <span className="example-label">Agent 回复</span>
                              <p>{scenario.agentOutput}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </article>
            ))}
          </main>
        </div>
      </div>
    </section>
  )
}
