import { useMemo, useState } from 'react'
import type { LobsterTemplatePackage } from '@lobster/shared'
import { LOBSTER_TEMPLATE_PACKAGES } from '@lobster/shared'

type TemplateLibrarySectionProps = {
  copiedInstallCode: string | null
  onCopyInstallCode: (template: LobsterTemplatePackage) => void | Promise<void>
}

const PINNED_CATEGORIES = ['明星虾']

function getCategoryOrder(): string[] {
  const seen = new Set<string>()
  const order: string[] = []
  for (const t of LOBSTER_TEMPLATE_PACKAGES) {
    if (!seen.has(t.categoryLabel)) {
      seen.add(t.categoryLabel)
      order.push(t.categoryLabel)
    }
  }
  // Pinned categories go first
  const pinned = PINNED_CATEGORIES.filter((c) => seen.has(c))
  const rest = order.filter((c) => !PINNED_CATEGORIES.includes(c))
  return [...pinned, ...rest]
}

const CATEGORY_ORDER = getCategoryOrder()

function TemplateCard({
  template,
  copiedInstallCode,
  onCopyInstallCode,
}: {
  template: LobsterTemplatePackage
  copiedInstallCode: string | null
  onCopyInstallCode: (template: LobsterTemplatePackage) => void | Promise<void>
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <article className="template-card reveal-card">
      <div className="template-header">
        <div className="template-meta-row">
          <span className="template-badge">{template.categoryLabel}</span>
          <span className="template-rating">★ {template.rating.toFixed(1)}</span>
        </div>
        <h3>{template.name}</h3>
        <p>{template.description}</p>
      </div>

      {template.shortcuts && template.shortcuts.length > 0 && (
        <div style={{ marginTop: '12px' }}>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '6px 0',
              fontSize: '13px',
              fontWeight: 700,
              color: 'var(--copper)',
              fontFamily: "'IBM Plex Mono', monospace",
              letterSpacing: '0.04em',
            }}
          >
            我能做什么 {expanded ? '▲' : '▼'}
          </button>

          {expanded && (
            <ol style={{
              margin: '10px 0 0',
              paddingLeft: '20px',
              display: 'grid',
              gap: '12px',
            }}>
              {template.shortcuts.map((shortcut, i) => (
                <li key={i} style={{ fontSize: '13px', lineHeight: '1.7', color: 'var(--ink-soft)' }}>
                  <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{shortcut.name}</span>
                  <br />
                  {shortcut.prompt}
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      <div className="template-footer" style={{ marginTop: '12px' }}>
        <span className="mono-caption" style={{ fontSize: '10px' }}>{template.clones} 人已安装</span>
        <button
          type="button"
          className="copy-button"
          onClick={() => void onCopyInstallCode(template)}
        >
          {copiedInstallCode === template.id ? '已复制' : '一键安装'}
        </button>
      </div>
    </article>
  )
}

export function TemplateLibrarySection(props: TemplateLibrarySectionProps) {
  const [showUploadGuide, setShowUploadGuide] = useState(false)
  const [search, setSearch] = useState('')

  const searchResults = useMemo(() => {
    if (!search.trim()) return null
    const q = search.trim().toLowerCase()
    return LOBSTER_TEMPLATE_PACKAGES.filter((t) => {
      const haystack = [
        t.name,
        t.description,
        t.categoryLabel,
        ...t.shortcuts.map((s) => `${s.name} ${s.prompt}`),
      ].join(' ').toLowerCase()
      return haystack.includes(q)
    })
  }, [search])

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

        <div style={{ marginTop: '24px', marginBottom: searchResults ? '32px' : '0' }}>
          <input
            type="text"
            placeholder="搜索 AI 同事：试试「会议」「合同」「小红书」..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              maxWidth: '560px',
              padding: '12px 16px',
              border: '2px solid var(--line)',
              background: 'var(--paper)',
              fontSize: '14px',
              fontFamily: "'IBM Plex Mono', monospace",
              color: 'var(--ink)',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => { e.target.style.borderColor = 'var(--copper)' }}
            onBlur={(e) => { e.target.style.borderColor = 'var(--line)' }}
          />
        </div>

        {searchResults !== null ? (
          <>
            <p style={{ fontSize: '13px', color: 'var(--ink-muted)', fontFamily: "'IBM Plex Mono', monospace", marginBottom: '20px' }}>
              找到 {searchResults.length} 位同事
            </p>
            <div className="template-grid">
              {searchResults.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  copiedInstallCode={props.copiedInstallCode}
                  onCopyInstallCode={props.onCopyInstallCode}
                />
              ))}
            </div>
          </>
        ) : (
          <>
            {CATEGORY_ORDER.map((categoryLabel) => {
              const templates = LOBSTER_TEMPLATE_PACKAGES.filter((t) => t.categoryLabel === categoryLabel)
              if (templates.length === 0) return null

              return (
                <div key={categoryLabel} style={{ marginTop: '48px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '12px',
                    marginBottom: '20px',
                    borderBottom: '2px solid var(--line)',
                    paddingBottom: '8px',
                  }}>
                    <h3 style={{
                      fontFamily: "'DM Serif Display', Georgia, serif",
                      fontSize: 'clamp(1.3rem, 2.5vw, 1.6rem)',
                      color: 'var(--ink)',
                      margin: 0,
                    }}>
                      {categoryLabel}
                    </h3>
                    <span style={{
                      fontSize: '12px',
                      color: 'var(--ink-muted)',
                      fontFamily: "'IBM Plex Mono', monospace",
                    }}>
                      {templates.length} 位同事
                    </span>
                  </div>

                  <div className="template-grid">
                    {templates.map((template) => (
                      <TemplateCard
                        key={template.id}
                        template={template}
                        copiedInstallCode={props.copiedInstallCode}
                        onCopyInstallCode={props.onCopyInstallCode}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </>
        )}

        <div style={{ marginTop: '48px', borderTop: '1px solid var(--line)', paddingTop: '24px' }}>
          <button
            type="button"
            onClick={() => setShowUploadGuide(!showUploadGuide)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              fontSize: '14px',
              fontWeight: 700,
              color: 'var(--copper)',
            }}
          >
            + 上传你的虾 {showUploadGuide ? '▲' : '▼'}
          </button>
          {showUploadGuide && (
            <div style={{ marginTop: '16px' }}>
              <p style={{ margin: '0 0 8px', fontSize: '13px', lineHeight: '1.7', color: 'var(--ink-soft)' }}>
                做了一个好用的 AI 同事模板？分享给全公司！
              </p>
              <ol style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', lineHeight: '2', color: 'var(--ink-soft)' }}>
                <li>在 OpenClaw 里把你的模板导出为 <code style={{ background: 'var(--copper-light)', padding: '1px 4px', borderRadius: '2px', fontSize: '12px' }}>.json</code> 文件</li>
                <li>点击下方的「上传模板」按钮，选择你的 .json 文件</li>
                <li>填写模板名称和简介，提交后全公司都能看到</li>
              </ol>
              <button type="button" className="primary-link" style={{ marginTop: '12px', fontSize: '11px', width: '200px' }}>
                选择文件上传
              </button>
              <p style={{ margin: '8px 0 0', fontSize: '11px', color: 'var(--ink-muted)', fontFamily: "'IBM Plex Mono', monospace" }}>
                暂不支持上传，即将开放
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
