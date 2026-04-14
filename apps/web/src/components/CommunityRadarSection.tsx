import type { Agent, FeedItem } from '../types'

type RadarMetrics = {
  onlineAgents: number
  activeDepartments: number
  recentEvents: number
  askedCount: number
  answeredCount: number
  collaborationCount: number
  installedSkillCount: number
}

type CommunityRadarSectionProps = {
  healthy: boolean
  agents: Agent[]
  departmentStats: Array<[string, number]>
  feed: FeedItem[]
  agentsById: Map<string, Agent>
  radarMetrics: RadarMetrics
}

export function CommunityRadarSection(props: CommunityRadarSectionProps) {
  return (
    <section id="community" className="community-section parallax-layer" data-speed="-0.05">
      <div className="content-frame">
        <div className="section-heading">
          <p className="section-kicker">Operations Radar</p>
          <h2 className="section-title">让 AI 使用变成可见、可运营、可扩散的组织信号。</h2>
          <p className="section-intro">
            这部分不是社区装饰，而是给管理层看的采用面：谁在线、哪些部门开始用、最近发生了哪些协作动作。
          </p>
        </div>

        <div className="radar-strip reveal-card">
          <Metric label="在线 Agent" value={props.radarMetrics.onlineAgents} />
          <Metric label="活跃部门" value={props.radarMetrics.activeDepartments} />
          <Metric label="24h 动态" value={props.radarMetrics.recentEvents} />
          <Metric label="24h 请求" value={props.radarMetrics.askedCount} />
          <Metric label="24h 回答" value={props.radarMetrics.answeredCount} />
          <Metric label="24h 协作" value={props.radarMetrics.collaborationCount + props.radarMetrics.installedSkillCount} />
        </div>

        <div className="dashboard-grid">
          <article className="dashboard-panel panel-agents reveal-card">
            <div className="panel-head">
              <h3>在线 Agent</h3>
              <span className={`status-pill ${props.healthy ? 'online' : 'offline'}`}>
                {props.healthy ? `${props.agents.length} Online` : 'Hub Offline'}
              </span>
            </div>

            {props.agents.length === 0 ? (
              <div className="empty-state">当前没有在线 Agent。</div>
            ) : (
              <ul className="data-list">
                {props.agents.map((agent) => (
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
              <h3>部门阵列</h3>
              <span className="panel-mono">Top {props.departmentStats.length}</span>
            </div>

            {props.departmentStats.length === 0 ? (
              <div className="empty-state">暂无部门数据。</div>
            ) : (
              <ul className="data-list">
                {props.departmentStats.map(([name, count]) => (
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
              <h3>社区动态</h3>
              <span className="panel-mono">Live Feed</span>
            </div>

            {props.feed.length === 0 ? (
              <div className="empty-state">社区刚建立，等待第一条动态。</div>
            ) : (
              <ul className="data-list">
                {props.feed.map((item) => (
                  <li key={item.id} className="feed-row">
                    <span className="feed-type">{getFeedTypeLabel(item)}</span>
                    <p className="feed-copy">{getFeedText(item, props.agentsById)}</p>
                    <time className="feed-time">{formatDateTime(item.timestamp)}</time>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </div>
      </div>
    </section>
  )
}

function Metric(props: { label: string; value: number }) {
  return (
    <div className="radar-metric">
      <p>{props.label}</p>
      <strong>{props.value}</strong>
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

function getFeedText(item: FeedItem, agentsById: Map<string, Agent>) {
  const agentName = agentsById.get(item.agentId)?.name ?? item.agentId

  if (item.type === 'agent-online') return `${agentName} 已上线，加入协作网络`
  if (item.type === 'agent-offline') return `${agentName} 已离线`
  if (item.type === 'question-asked') return `${agentName} 发起了问题协作`
  if (item.type === 'question-answered') return `${agentName} 给出了一次有效回应`
  if (item.type === 'skill-installed') return `${agentName} 安装了新的技能包`
  return `${agentName} 触发了一次跨团队协作`
}

function getFeedTypeLabel(item: FeedItem) {
  if (item.type === 'agent-online') return '上线'
  if (item.type === 'agent-offline') return '离线'
  if (item.type === 'question-asked') return '提问'
  if (item.type === 'question-answered') return '回答'
  if (item.type === 'skill-installed') return '技能'
  return '协作'
}
