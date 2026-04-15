import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { VENDOR_REGISTRY } from '@lobster/shared'
import { initSectionReveals } from '../animations'

const GITHUB_RELEASES = 'https://github.com/hamiltonmatthew308-ui/bostonclaw/releases/latest'
const HERMES_URL = 'https://hermes-agent.nousresearch.com/'

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
            下载遇到问题？试试下面的「大厂封装版」，直接用腾讯/字节/阿里等大厂的 AI 产品也行。
          </p>
        </div>
      </section>

      <section className="editorial-section">
        <div className="content-frame">
          <div className="section-heading">
            <p className="section-kicker">来领取你的爱马仕</p>
            <h2 className="section-title reveal-card"><span style={{ color: 'var(--copper)' }}>Hermes Agent</span> —<br/>会自我进化的 AI 同事</h2>
            <p className="section-intro">
              Hermes 不是普通的聊天机器人。它住在你的电脑里，记住你教它的东西，越用越聪明。
            </p>
          </div>

          <div className="template-grid" style={{ gridTemplateColumns: '1fr' }}>
            <article className="template-card reveal-card">
              <div className="template-header">
                <h3><span style={{ color: 'var(--copper)' }}>Hermes Agent</span></h3>
                <span className="mono-caption">开源 · MIT 协议 · 免费</span>
              </div>

              <div style={{ display: 'grid', gap: '16px', fontSize: '14px', color: 'var(--ink-soft)', lineHeight: '1.8' }}>
                <p>GitHub 40.4k Star，代号「爱马仕」。和龙虾（OpenClaw）不同，Hermes 主打「自进化」——不是每次都从零开始，而是用得越多越聪明。</p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  <div style={{ padding: '16px', background: 'var(--paper-soft)', border: '1px solid var(--line)', borderRadius: '3px' }}>
                    <p style={{ margin: '0 0 6px', color: 'var(--ink)', fontWeight: 600, fontSize: '13px' }}>自动学会新技能</p>
                    <p style={{ margin: 0, fontSize: '13px' }}>帮你做完一个复杂任务后，会把整个流程沉淀成 Skill 文件。下次遇到类似任务直接复用，还会自动优化流程。</p>
                  </div>
                  <div style={{ padding: '16px', background: 'var(--paper-soft)', border: '1px solid var(--line)', borderRadius: '3px' }}>
                    <p style={{ margin: '0 0 6px', color: 'var(--ink)', fontWeight: 600, fontSize: '13px' }}>记住你的习惯</p>
                    <p style={{ margin: 0, fontSize: '13px' }}>三层记忆系统，所有对话都存着。你教过它的格式偏好、常用操作，它不会忘。</p>
                  </div>
                  <div style={{ padding: '16px', background: 'var(--paper-soft)', border: '1px solid var(--line)', borderRadius: '3px' }}>
                    <p style={{ margin: '0 0 6px', color: 'var(--ink)', fontWeight: 600, fontSize: '13px' }}>到处都能用</p>
                    <p style={{ margin: 0, fontSize: '13px' }}>飞书、Telegram、Discord、Slack、微信——你在哪它就在哪，一个 Agent 多端操控。</p>
                  </div>
                  <div style={{ padding: '16px', background: 'var(--paper-soft)', border: '1px solid var(--line)', borderRadius: '3px' }}>
                    <p style={{ margin: '0 0 6px', color: 'var(--ink)', fontWeight: 600, fontSize: '13px' }}>自动干活</p>
                    <p style={{ margin: 0, fontSize: '13px' }}>「每天早上 9 点提醒我看邮件」「每周五提醒我写周报」——自然语言设定时任务，不用写 cron。</p>
                  </div>
                  <div style={{ padding: '16px', background: 'var(--paper-soft)', border: '1px solid var(--line)', borderRadius: '3px' }}>
                    <p style={{ margin: '0 0 6px', color: 'var(--ink)', fontWeight: 600, fontSize: '13px' }}>200+ 大模型</p>
                    <p style={{ margin: 0, fontSize: '13px' }}>无缝对接 OpenAI、Anthropic、智谱 GLM、DeepSeek 等主流模型。而且能用 Claude 的额度。</p>
                  </div>
                  <div style={{ padding: '16px', background: 'var(--paper-soft)', border: '1px solid var(--line)', borderRadius: '3px' }}>
                    <p style={{ margin: '0 0 6px', color: 'var(--ink)', fontWeight: 600, fontSize: '13px' }}>安全隔离</p>
                    <p style={{ margin: 0, fontSize: '13px' }}>框架层面做了用户授权、危险命令审批、容器隔离。就算用一般模型也够安全。</p>
                  </div>
                </div>

                <p>安装很简单，一行命令搞定：<code style={{ background: 'var(--copper-light)', padding: '2px 8px', borderRadius: '2px', fontSize: '12px', fontFamily: "'IBM Plex Mono', monospace" }}>curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash</code></p>
              </div>

              <div className="template-footer" style={{ marginTop: '20px' }}>
                <span className="template-badge">开源免费</span>
                <a
                  href={HERMES_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="primary-link"
                  style={{ padding: '6px 16px', fontSize: '11px' }}
                >
                  去领取 →
                </a>
              </div>
            </article>
          </div>
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
    </div>
  )
}
