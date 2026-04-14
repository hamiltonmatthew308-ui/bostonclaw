import { useEffect } from 'react'
import { initSectionReveals } from '../animations'

const REPORT_DATA = {
  tagline: '企业 AI Agent 的统一安装桥',
  valueProposition:
    '让企业从"尝试 AI"到"真正用上 AI"，把安装、模板与采用收敛成一条可执行路径。',
  metrics: {
    totalEmployees: 1200,
    knowledgeWorkers: 600,
    adoptionRate: 50,
    hoursSavedPerDay: 2,
    hourlyRate: 100,
    workDaysPerMonth: 22,
  },
  scenarios: [
    { department: '行政部', template: '会议纪要员', action: '整理会议内容，输出结构化纪要和待办', frequency: '每天 3-5 次' },
    { department: '销售部', template: '销售情报员', action: '客户信息整理、机会优先级、跟进建议', frequency: '每天 10+ 次' },
    { department: '研发部', template: '代码审查员', action: '变更风险扫描、测试缺口识别', frequency: '每次 PR' },
    { department: '法务部', template: '合同审查员', action: '风险条款扫描、合规审查', frequency: '每周 5-10 份' },
  ],
}

export function Report() {
  useEffect(() => {
    initSectionReveals()
  }, [])

  const m = REPORT_DATA.metrics
  const activeUsers = Math.round(m.knowledgeWorkers * m.adoptionRate / 100)
  const monthlyHours = activeUsers * m.hoursSavedPerDay * m.workDaysPerMonth
  const monthlySavings = monthlyHours * m.hourlyRate
  const yearlySavings = monthlySavings * 12

  return (
    <div className="page-shell">
      <div className="paper-noise" />
      <section className="editorial-section">
        <div className="content-frame">
          <div className="editorial-rail reveal-card">
            <span className="rail-label">AI 大赛汇报</span>
          </div>

          <h1 className="section-title reveal-card">
            {REPORT_DATA.tagline}
          </h1>
          <p className="section-intro reveal-card">
            {REPORT_DATA.valueProposition}
          </p>

          <div className="step-manual" style={{ marginTop: '48px' }}>
            <article className="manual-card reveal-card">
              <p className="manual-index">01</p>
              <h3>安装器</h3>
              <p>智能分发路由器，根据场景导向最优路径。大厂封装版 / 原版 OpenClaw / 纯本地 FreeClaw / Hermes Agent 四条路径。</p>
            </article>
            <article className="manual-card reveal-card">
              <p className="manual-index">02</p>
              <h3>模板中心</h3>
              <p>预封装 AI 同事模板，一键安装到本地。10 个模板覆盖会议、销售、代码、法务等高频场景。</p>
            </article>
            <article className="manual-card reveal-card">
              <p className="manual-index">03</p>
              <h3>社区网站</h3>
              <p>模板市场 + 使用统计 + 运营入口。统一入口承接老板推动，也降低员工冷启动成本。</p>
            </article>
          </div>
        </div>
      </section>

      <section className="editorial-section" style={{ background: 'var(--paper-soft)' }}>
        <div className="content-frame">
          <div className="section-heading">
            <p className="section-kicker">经济价值</p>
            <h2 className="section-title reveal-card">省下多少人的时间？</h2>
          </div>

          <div className="dashboard-grid">
            <div className="dashboard-panel reveal-card" style={{ gridColumn: 'span 4' }}>
              <p className="metric-label">全员人数</p>
              <p className="metric-value" style={{ color: 'var(--copper)' }}>{m.totalEmployees}</p>
              <p className="metric-caption">公司总人数</p>
            </div>
            <div className="dashboard-panel reveal-card" style={{ gridColumn: 'span 4' }}>
              <p className="metric-label">知识工作者</p>
              <p className="metric-value">{m.knowledgeWorkers}</p>
              <p className="metric-caption">日常与文档/数据打交道</p>
            </div>
            <div className="dashboard-panel reveal-card" style={{ gridColumn: 'span 4' }}>
              <p className="metric-label">月均节省工时</p>
              <p className="metric-value">{monthlyHours.toLocaleString()}h</p>
              <p className="metric-caption">{activeUsers} 人 × {m.hoursSavedPerDay}h/天 × {m.workDaysPerMonth} 天</p>
            </div>
          </div>

          <div className="dashboard-grid" style={{ marginTop: '18px' }}>
            <div className="dashboard-panel reveal-card" style={{ gridColumn: 'span 6', background: 'rgba(212, 64, 26, 0.06)', borderColor: 'var(--copper)' }}>
              <p className="metric-label">月度节省（人力成本）</p>
              <p className="metric-value" style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', color: 'var(--copper)' }}>
                ¥{monthlySavings.toLocaleString()}
              </p>
              <p className="metric-caption">按 ¥{m.hourlyRate}/小时 计算</p>
            </div>
            <div className="dashboard-panel reveal-card" style={{ gridColumn: 'span 6', background: 'rgba(212, 64, 26, 0.10)', borderColor: 'var(--copper)' }}>
              <p className="metric-label">年度节省（预估）</p>
              <p className="metric-value" style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', color: 'var(--copper)' }}>
                ¥{yearlySavings.toLocaleString()}
              </p>
              <p className="metric-caption">× 12 个月</p>
            </div>
          </div>

          <div className="editorial-rail reveal-card" style={{ marginTop: '18px', fontSize: '13px', color: 'var(--ink-soft)' }}>
            测算逻辑：{m.knowledgeWorkers} 名知识工作者 × {m.adoptionRate}% 活跃使用 × 每天节省 {m.hoursSavedPerDay}h × {m.workDaysPerMonth} 天/月 × ¥{m.hourlyRate}/h
          </div>
        </div>
      </section>

      <section className="editorial-section">
        <div className="content-frame">
          <div className="section-heading">
            <p className="section-kicker">落地场景</p>
            <h2 className="section-title reveal-card">已在使用的部门</h2>
          </div>

          <div className="template-grid">
            {REPORT_DATA.scenarios.map((s) => (
              <article key={s.template} className="template-card reveal-card">
                <div className="template-header">
                  <h3>{s.template}</h3>
                  <span className="mono-caption">{s.department}</span>
                </div>
                <p>{s.action}</p>
                <div className="template-footer">
                  <span className="template-badge">{s.frequency}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="editorial-section" style={{ background: 'var(--paper-soft)' }}>
        <div className="content-frame">
          <div className="section-heading">
            <p className="section-kicker">团队</p>
            <h2 className="section-title reveal-card">Ludviq</h2>
          </div>
          <div className="status-note reveal-card" style={{ maxWidth: '480px' }}>
            <p className="status-note-title">产品负责人 + 开发</p>
            <p className="metric-caption">激光/光电医美设备制造商 · 市场战略部</p>
          </div>
        </div>
      </section>
    </div>
  )
}
