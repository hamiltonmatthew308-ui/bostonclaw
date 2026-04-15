import { useState } from 'react'
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
  const [showUploadGuide, setShowUploadGuide] = useState(false)

  return (
    <section id="gallery" className="library-section reveal-card">
      <div className="content-frame">
        <div className="section-heading">
          <p className="section-kicker">AI 同事库</p>
          <h2 className="section-title">挑一个 AI 同事，装上就能干活。</h2>
          <p className="section-intro">
            每个模板都是一个现成的 AI 助手——会写会议纪要、会跟进客户、会查合同。点「一键安装」，复制安装码到安装器就行。
          </p>
        </div>

        <div className="library-layout">
          <aside className="library-sidebar">
            <div className="sidebar-card">
              <p className="sidebar-title">分类</p>
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

            <div className="sidebar-card" style={{ marginTop: '16px' }}>
              <button
                type="button"
                className="upload-entry"
                onClick={() => setShowUploadGuide(!showUploadGuide)}
              >
                <span className="sidebar-title" style={{ color: 'var(--copper)', cursor: 'pointer' }}>+ 上传你的虾</span>
              </button>
              {showUploadGuide && (
                <div className="upload-guide">
                  <p style={{ margin: '12px 0 8px', fontSize: '13px', lineHeight: '1.7', color: 'var(--ink-soft)' }}>
                    做了一个好用的 AI 同事模板？分享给全公司！
                  </p>
                  <ol style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', lineHeight: '2', color: 'var(--ink-soft)' }}>
                    <li>在 OpenClaw 里把你的模板导出为 <code style={{ background: 'var(--copper-light)', padding: '1px 4px', borderRadius: '2px', fontSize: '12px' }}>.json</code> 文件</li>
                    <li>点击下方的「上传模板」按钮，选择你的 .json 文件</li>
                    <li>填写模板名称和简介，提交后全公司都能看到</li>
                  </ol>
                  <button type="button" className="primary-link" style={{ marginTop: '12px', fontSize: '11px', width: '100%' }}>
                    选择文件上传
                  </button>
                  <p style={{ margin: '8px 0 0', fontSize: '11px', color: 'var(--ink-muted)', fontFamily: "'IBM Plex Mono', monospace" }}>
                    暂不支持上传，即将开放
                  </p>
                </div>
              )}
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

                {template.exampleScenarios && template.exampleScenarios.length > 0 && (
                  <details className="template-examples">
                    <summary className="examples-toggle">我能做什么</summary>
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
                              <span className="example-label">AI 同事回复</span>
                              <p>{scenario.agentOutput}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                )}

                <div className="template-footer">
                  <span className="mono-caption" style={{ fontSize: '10px' }}>{template.clones} 人已安装</span>
                  <button
                    type="button"
                    className="copy-button"
                    onClick={() => void props.onCopyInstallCode(template)}
                  >
                    {props.copiedInstallCode === template.id ? '已复制' : '一键安装'}
                  </button>
                </div>
              </article>
            ))}
          </main>
        </div>
      </div>
    </section>
  )
}
