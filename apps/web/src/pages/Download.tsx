import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { VENDOR_REGISTRY } from '@lobster/shared'
import { initSectionReveals } from '../animations'

const GITHUB_RELEASES = 'https://github.com/hamiltonmatthew308-ui/bostonclaw/releases/latest'

const OTHER_VERSIONS = [
  {
    name: 'FreeClaw',
    description: '完全离线运行，不需要互联网。适合保密要求高的场景。仅 Windows。',
    url: 'https://github.com/nicepkg/freeclaw',
  },
  {
    name: 'Hermes Agent',
    description: '开源免费，支持本地部署。需要 Python 环境。',
    url: 'https://github.com/nicepkg/hermes-agent',
  },
]

export function Download() {
  useEffect(() => {
    initSectionReveals()
  }, [])

  return (
    <div className="page-shell">
      <div className="paper-noise" />
      <Link to="/" className="back-link">← 返回首页</Link>

      <section className="editorial-section">
        <div className="content-frame">
          <div className="editorial-rail reveal-card">
            <span className="rail-label">下载</span>
          </div>

          <h1 className="section-title reveal-card">
            下载安装器
          </h1>
          <p className="section-intro reveal-card">
            选你的系统，点一下就行。不需要管理员权限，装完打开就能用。
          </p>

          <div className="hero-metrics" style={{ marginTop: '48px' }}>
            <a href={GITHUB_RELEASES} className="metric-card reveal-card" style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer', display: 'block' }}>
              <p className="metric-label">Windows</p>
              <p className="metric-value" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>.exe</p>
              <p className="metric-caption">~70 MB · 双击安装</p>
            </a>
            <a href={GITHUB_RELEASES} className="metric-card reveal-card" style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer', display: 'block' }}>
              <p className="metric-label">macOS</p>
              <p className="metric-value" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>.dmg</p>
              <p className="metric-caption">~65 MB · Intel + Apple Silicon</p>
            </a>
          </div>

          <p style={{ marginTop: '24px', fontSize: '13px', color: 'var(--ink-muted)', fontFamily: "'IBM Plex Mono', monospace" }}>
            下载遇到问题？试试上面的「大厂封装版」，直接用腾讯/字节/阿里等大厂的 AI 产品也行。
          </p>
        </div>
      </section>

      <section className="editorial-section" style={{ background: 'var(--paper-soft)' }}>
        <div className="content-frame">
          <div className="section-heading">
            <p className="section-kicker">大厂 AI 产品</p>
            <h2 className="section-title reveal-card">不想装？直接用大厂的也行</h2>
            <p className="section-intro">如果你公司已经在用下面这些产品，直接访问他们的官网就行。</p>
          </div>

          <div className="template-grid">
            {VENDOR_REGISTRY.map((v) => (
              <article key={v.id} className="template-card reveal-card">
                <div className="template-header">
                  <h3>{v.name}</h3>
                  <span className="mono-caption">{v.vendor}</span>
                </div>
                <p style={{ fontSize: '14px', color: 'var(--ink-soft)', lineHeight: '1.7' }}>{v.description}</p>
                <div className="template-footer">
                  {v.requiresPlan ? (
                    <span className="soft-tag" style={{ background: 'rgba(212, 64, 26, 0.12)' }}>需要订阅</span>
                  ) : (
                    <span className="template-badge">有免费额度</span>
                  )}
                  <a
                    href={v.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="secondary-link"
                    style={{ padding: '4px 12px', fontSize: '11px' }}
                  >
                    访问官网
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="editorial-section">
        <div className="content-frame">
          <div className="section-heading">
            <p className="section-kicker">其他选项</p>
            <h2 className="section-title reveal-card">离线版 · 开源版</h2>
          </div>

          <div className="step-manual">
            {OTHER_VERSIONS.map((ov) => (
              <article key={ov.name} className="manual-card reveal-card">
                <h3>{ov.name}</h3>
                <p>{ov.description}</p>
                <div className="template-footer" style={{ marginTop: '16px' }}>
                  <a href={ov.url} className="secondary-link" style={{ padding: '4px 12px', fontSize: '11px' }}>
                    {ov.name === 'FreeClaw' ? '了解 FreeClaw' : '查看 GitHub'}
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
