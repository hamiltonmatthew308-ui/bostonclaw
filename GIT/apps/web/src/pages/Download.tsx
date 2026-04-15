import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { VENDOR_REGISTRY } from '@lobster/shared'
import { initSectionReveals } from '../animations'

const GITHUB_RELEASES = 'https://github.com/hamiltonmatthew308-ui/bostonclaw/releases/latest'

const LOBSTER_DOWNLOADS = [
  { platform: 'Windows', arch: 'x64', format: 'exe', size: '~70 MB', note: 'NSIS 安装包，无需管理员权限' },
  { platform: 'macOS', arch: 'x64', format: 'dmg', size: '~65 MB', note: 'Intel Mac' },
  { platform: 'macOS', arch: 'arm64', format: 'dmg', size: '~65 MB', note: 'Apple Silicon' },
]

const OTHER_VERSIONS = [
  {
    name: 'FreeClaw',
    description: '完全离线运行，不需要互联网连接。内置 Ollama，支持本地大模型。仅支持 Windows。',
    url: 'https://github.com/nicepkg/freeclaw',
  },
  {
    name: 'Hermes Agent',
    description: '开源免费模型，支持本地部署。需要 Python 环境。',
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
            <span className="rail-label">Download</span>
          </div>

          <h1 className="section-title reveal-card">
            下载 Lobster 安装器
          </h1>
          <p className="section-intro reveal-card">
            Windows 用户推荐下载 .exe，macOS 用户下载 .dmg。
          </p>

          <div className="hero-metrics" style={{ marginTop: '48px' }}>
            <a href={GITHUB_RELEASES} className="metric-card reveal-card" style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer', display: 'block' }}>
              <p className="metric-label">Windows</p>
              <p className="metric-value" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>.exe</p>
              <p className="metric-caption">~70 MB · 推荐</p>
            </a>
            <a href={GITHUB_RELEASES} className="metric-card reveal-card" style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer', display: 'block' }}>
              <p className="metric-label">macOS</p>
              <p className="metric-value" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>.dmg</p>
              <p className="metric-caption">~65 MB · Intel + Apple Silicon</p>
            </a>
          </div>

          <div className="section-heading" style={{ marginTop: '72px' }}>
            <p className="section-kicker">完整版本列表</p>
          </div>

          <div className="editorial-rail reveal-card" style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-soft)' }}>
            <span>平台</span>
            <span>架构</span>
            <span>格式</span>
            <span>大小</span>
            <span>说明</span>
            <span>下载</span>
          </div>
          {LOBSTER_DOWNLOADS.map((d) => (
            <div key={`${d.platform}-${d.arch}`} className="editorial-rail reveal-card" style={{ alignItems: 'center' }}>
              <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '13px' }}>{d.platform}</span>
              <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '13px' }}>{d.arch}</span>
              <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '13px' }}>{d.format}</span>
              <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '13px' }}>{d.size}</span>
              <span style={{ fontSize: '13px', color: 'var(--ink-soft)' }}>{d.note}</span>
              <a href={GITHUB_RELEASES} className="secondary-link" style={{ padding: '4px 12px', fontSize: '11px' }}>下载</a>
            </div>
          ))}
        </div>
      </section>

      <section className="editorial-section" style={{ background: 'var(--paper-soft)' }}>
        <div className="content-frame">
          <div className="section-heading">
            <p className="section-kicker">大厂封装版</p>
            <h2 className="section-title reveal-card">如果你已经在用某个大厂 AI 产品</h2>
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
            <p className="section-kicker">其他版本</p>
            <h2 className="section-title reveal-card">FreeClaw · Hermes Agent</h2>
          </div>

          <div className="step-manual">
            {OTHER_VERSIONS.map((ov) => (
              <article key={ov.name} className="manual-card reveal-card">
                <h3>{ov.name}</h3>
                <p>{ov.description}</p>
                <div className="template-footer" style={{ marginTop: '16px' }}>
                  <a href={ov.url} className="secondary-link" style={{ padding: '4px 12px', fontSize: '11px' }}>
                    {ov.name === 'FreeClaw' ? '下载 FreeClaw' : '查看 GitHub'}
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
