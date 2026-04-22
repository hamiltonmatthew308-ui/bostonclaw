import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { initSectionReveals } from '../animations'
import { LOBSTER_TEMPLATE_PACKAGES } from '@lobster/shared'

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
  painSteps: [
    '安装 Node.js 22+（版本不对？重来）',
    '配置 npm 全局路径',
    'npm install -g openclaw（网络超时？重来）',
    '手动编辑 openclaw.json（JSON 格式错了？不报错，静默失败）',
    '配置 API Key（填哪个字段？文档在哪？）',
    'openclaw onboard（交互式问答，6 个问题）',
    'openclaw gateway run（端口冲突？权限不够？）',
    '找技能、找模板（去哪找？装不上？）',
  ],
  easySteps: [
    '下载安装器，双击打开',
    '选一个 AI 模型提供商，粘贴 API Key',
    '点安装，自动完成',
  ],
  techHighlights: [
    {
      title: '离线打包',
      desc: 'Node.js、OpenClaw、Python 运行时全部预打包。企业内网、防火墙后面也能装，零网络依赖。',
    },
    {
      title: '多 Provider 自适应',
      desc: '9 家主流 AI 供应商（Anthropic、OpenAI、DeepSeek、智谱、MiniMax、Moonshot、SiliconFlow、OpenRouter、自定义）自动适配 API 格式和配置。',
    },
    {
      title: '配置格式对齐',
      desc: '直接调用 openclaw onboard --non-interactive，避免手写配置导致的静默失败（config 字段名、gateway mode、model 引用三重校验）。',
    },
    {
      title: 'Gateway 生命周期',
      desc: '托盘图标管理 Gateway 进程——启动、停止、健康检查、崩溃恢复，用户无需接触命令行。',
    },
    {
      title: '四路径智能分发',
      desc: '大厂封装版 / OpenClaw 原版 / FreeClaw 纯本地 / Hermes Agent，根据用户环境和偏好自动路由。',
    },
    {
      title: '安全加固',
      desc: 'PowerShell 命令注入防护、plist XML 转义、windowsHide 防闪窗、PATH 注册去重。',
    },
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
      <Link to="/" className="back-link">← 返回首页</Link>
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
              <p>预封装 AI 同事模板，一键安装到本地。{LOBSTER_TEMPLATE_PACKAGES.length} 个模板覆盖会议、销售、代码、法务等高频场景。</p>
            </article>
            <article className="manual-card reveal-card">
              <p className="manual-index">03</p>
              <h3>社区网站</h3>
              <p>模板市场 + 使用统计 + 运营入口。统一入口承接老板推动，也降低员工冷启动成本。</p>
            </article>
          </div>
        </div>
      </section>

      {/* Pain point comparison */}
      <section className="editorial-section" style={{ background: 'var(--paper-soft)' }}>
        <div className="content-frame">
          <div className="section-heading">
            <p className="section-kicker">痛点</p>
            <h2 className="section-title reveal-card">装一个 AI Agent 有多难？</h2>
            <p className="section-intro reveal-card">
              以前想让同事用上 OpenClaw，IT 得手把手教——每人 30 分钟起步，还经常失败。现在 3 步搞定。
            </p>
          </div>

          <div style={{ marginTop: '36px', display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '20px' }}>
            <article className="dashboard-panel reveal-card" style={{ borderColor: '#B8A898' }}>
              <div className="panel-head">
                <h3 style={{ color: '#8A7B6B' }}>传统方式</h3>
                <span className="mono-caption" style={{ color: '#8A7B6B' }}>~30 分钟</span>
              </div>
              <ol style={{
                margin: 0,
                paddingLeft: '18px',
                display: 'grid',
                gap: '8px',
                fontSize: '13px',
                lineHeight: '1.6',
                color: '#8A7B6B',
              }}>
                {REPORT_DATA.painSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </article>

            <article className="dashboard-panel reveal-card" style={{ borderColor: 'var(--copper)', background: 'rgba(212, 64, 26, 0.03)' }}>
              <div className="panel-head">
                <h3 style={{ color: 'var(--copper)' }}>Bostonclaw</h3>
                <span className="mono-caption" style={{ color: 'var(--copper)' }}>~3 分钟</span>
              </div>
              <ol style={{
                margin: 0,
                paddingLeft: '18px',
                display: 'grid',
                gap: '12px',
                fontSize: '14px',
                lineHeight: '1.6',
                color: 'var(--ink)',
              }}>
                {REPORT_DATA.easySteps.map((step) => (
                  <li key={step} style={{ fontWeight: 500 }}>{step}</li>
                ))}
              </ol>
            </article>
          </div>
        </div>
      </section>

      {/* Economic value */}
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

      {/* Real scenarios */}
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

      {/* Tech highlights */}
      <section className="editorial-section" style={{ background: 'var(--paper-soft)' }}>
        <div className="content-frame">
          <div className="section-heading">
            <p className="section-kicker">技术架构</p>
            <h2 className="section-title reveal-card">不是套壳，是基础设施</h2>
            <p className="section-intro reveal-card">
              从安装到运行时管理，每一步都做了工程化处理。
            </p>
          </div>

          <div className="template-grid" style={{ marginTop: '36px' }}>
            {REPORT_DATA.techHighlights.map((t) => (
              <article key={t.title} className="template-card reveal-card">
                <div className="template-header">
                  <h3>{t.title}</h3>
                </div>
                <p style={{ fontSize: '14px', color: 'var(--ink-soft)', lineHeight: '1.7' }}>{t.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="editorial-section" style={{ background: 'var(--paper-soft)' }}>
        <div className="content-frame">
          <div className="section-heading">
            <p className="section-kicker">团队</p>
            <h2 className="section-title reveal-card">Bostonclaw 团队</h2>
          </div>
          <div className="status-note reveal-card" style={{ maxWidth: '480px' }}>
            <p className="status-note-title">产品 · 设计 · 开发 · 部署</p>
            <p className="metric-caption">Boston Aesthetics</p>
          </div>
        </div>
      </section>
    </div>
  )
}
