import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { initSectionReveals } from '../animations'
import { useHubData } from '../hooks/useHubData'

const MORPH_WORDS = [
  'oston', 'rilliant', 'eauty', 'andao', 'old',
  'rave', 'ridge', 'eyond', 'oundless', 'reakthrough',
]

function BBlockHero() {
  const [wordIdx, setWordIdx] = useState(0)
  const [transitioning, setTransitioning] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTransitioning(true)
      setTimeout(() => {
        setWordIdx((i) => (i + 1) % MORPH_WORDS.length)
        setTransitioning(false)
      }, 400)
    }, 2400)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  return (
    <div style={{
      textAlign: 'center',
      padding: '80px 24px 48px',
    }}>
      {/* Block B Logo */}
      <div style={{ width: 80, height: 80, margin: '0 auto 32px', color: '#D4401A' }}>
        <svg viewBox="0 0 100 100" fill="none" width="80" height="80">
          <rect x="8" y="8" width="84" height="84" rx="16" fill="currentColor" />
          <path d="M 30 24 L 30 76 M 30 24 L 56 24 C 68 24, 68 48, 56 48 L 30 48 M 30 48 L 54 48 C 68 48, 68 76, 54 76 L 30 76" fill="none" stroke="#FAFAF8" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Stacked wordmark */}
      <div style={{ display: 'inline-block' }}>
        {/* Line 1: B [morphing word] */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center' }}>
          <span style={{
            fontFamily: "'Archivo Black', sans-serif",
            fontSize: 'clamp(40px, 8vw, 64px)',
            fontWeight: 900,
            color: '#1B1712',
            letterSpacing: '-0.03em',
          }}>B</span>
          <span style={{
            display: 'inline-block',
            position: 'relative',
            width: 'clamp(120px, 20vw, 260px)',
            height: 'clamp(40px, 8vw, 64px)',
            overflow: 'hidden',
          }}>
            <span style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 'clamp(20px, 4vw, 32px)',
              fontWeight: 500,
              color: '#D4401A',
              letterSpacing: '0.02em',
              position: 'absolute',
              left: 0,
              bottom: 0,
              whiteSpace: 'nowrap',
              transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              transform: transitioning ? 'translateY(120%)' : 'translateY(0)',
              opacity: transitioning ? 0 : 1,
            }}>{MORPH_WORDS[wordIdx]}</span>
          </span>
        </div>

        {/* Line 2: — Block */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center' }}>
          <span style={{
            fontWeight: 200,
            color: '#8A7B6B',
            fontSize: 'clamp(20px, 4vw, 32px)',
            marginRight: 10,
          }}>—</span>
          <span style={{
            fontFamily: "'Archivo Black', sans-serif",
            fontSize: 'clamp(40px, 8vw, 64px)',
            fontWeight: 900,
            color: '#1B1712',
            letterSpacing: '-0.03em',
          }}>Block</span>
        </div>
      </div>

      <p style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 12,
        color: '#8A7B6B',
        letterSpacing: '0.06em',
        marginTop: 20,
      }}>
        AI Agent 安装器 &middot; 技能市场 &middot; 开发者社区
      </p>
    </div>
  )
}

export function Community() {
  const hub = useHubData()

  useEffect(() => {
    initSectionReveals()
  }, [])

  return (
    <div className="page-shell">
      <div className="paper-noise" />
      <Link to="/" className="back-link">← 返回首页</Link>

      <BBlockHero />

      <section className="editorial-section">
        <div className="content-frame">
          <div className="editorial-rail reveal-card">
            <span className="rail-label">社区</span>
          </div>

          <h1 className="section-title reveal-card">看看大家都在怎么用</h1>
          <p className="section-intro reveal-card">
            AI 同事不是一个人在用。看看公司里谁在用、在干什么、谁刚装了新技能。
          </p>

          <div className="radar-strip reveal-card" style={{ marginTop: '48px' }}>
            <div className="radar-metric">
              <p>在岗 AI</p>
              <strong>{hub.radarMetrics.onlineAgents}</strong>
            </div>
            <div className="radar-metric">
              <p>活跃部门</p>
              <strong>{hub.radarMetrics.activeDepartments}</strong>
            </div>
            <div className="radar-metric">
              <p>今日动态</p>
              <strong>{hub.radarMetrics.recentEvents}</strong>
            </div>
            <div className="radar-metric">
              <p>今日提问</p>
              <strong>{hub.radarMetrics.askedCount}</strong>
            </div>
            <div className="radar-metric">
              <p>今日回答</p>
              <strong>{hub.radarMetrics.answeredCount}</strong>
            </div>
            <div className="radar-metric">
              <p>今日协作</p>
              <strong>{hub.radarMetrics.collaborationCount + hub.radarMetrics.installedSkillCount}</strong>
            </div>
          </div>

          <div className="dashboard-grid" style={{ marginTop: '24px' }}>
            <article className="dashboard-panel panel-agents reveal-card">
              <div className="panel-head">
                <h3>在岗 AI 同事</h3>
                <span className={`status-pill ${hub.healthy ? 'online' : 'offline'}`}>
                  {hub.healthy ? `${hub.agents.length} 在线` : '离线'}
                </span>
              </div>
              {hub.agents.length === 0 ? (
                <div className="empty-state">还没有 AI 同事上线，去模板中心装一个？</div>
              ) : (
                <ul className="data-list">
                  {hub.agents.map((agent) => (
                    <li key={agent.id} className="agent-row">
                      <div>
                        <p className="row-title">{agent.name}</p>
                        <p className="row-subtitle">{agent.department} · {agent.messageCount} 条消息</p>
                      </div>
                      <div className="tag-row">
                        {agent.expertise.slice(0, 2).map((item) => (
                          <span key={item} className="soft-tag">{item}</span>
                        ))}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </article>

            <article className="dashboard-panel panel-dept reveal-card">
              <div className="panel-head">
                <h3>部门使用情况</h3>
                <span className="panel-mono">Top {hub.departmentStats.length}</span>
              </div>
              {hub.departmentStats.length === 0 ? (
                <div className="empty-state">暂无部门数据。</div>
              ) : (
                <ul className="data-list">
                  {hub.departmentStats.map(([name, count]) => (
                    <li key={name} className="dept-row">
                      <span className="row-title">{name}</span>
                      <span className="panel-count">{count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </article>

            <article className="dashboard-panel panel-feed reveal-card">
              <div className="panel-head">
                <h3>最近动态</h3>
                <span className="panel-mono">实时</span>
              </div>
              {hub.feed.length === 0 ? (
                <div className="empty-state">社区刚建立，等待第一条动态。</div>
              ) : (
                <ul className="data-list">
                  {hub.feed.map((item) => (
                    <li key={item.id} className="feed-row">
                      <span className="feed-type">{getFeedTypeLabel(item.type)}</span>
                      <p className="feed-copy">{getFeedText(item, hub.agentsById)}</p>
                      <time className="feed-time">{formatDateTime(item.timestamp)}</time>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          </div>
        </div>
      </section>
    </div>
  )
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('zh-CN', {
    hour12: false,
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getFeedText(item: { type: string; agentId: string }, agentsById: Map<string, { name: string }>) {
  const name = agentsById.get(item.agentId)?.name ?? item.agentId
  if (item.type === 'agent-online') return `${name} 已上线`
  if (item.type === 'agent-offline') return `${name} 已离线`
  if (item.type === 'question-asked') return `${name} 发起了提问`
  if (item.type === 'question-answered') return `${name} 回答了一个问题`
  if (item.type === 'skill-installed') return `${name} 安装了新技能`
  return `${name} 完成了一次协作`
}

function getFeedTypeLabel(type: string) {
  if (type === 'agent-online') return '上线'
  if (type === 'agent-offline') return '离线'
  if (type === 'question-asked') return '提问'
  if (type === 'question-answered') return '回答'
  if (type === 'skill-installed') return '技能'
  return '协作'
}
