type HeroSectionProps = {
  healthy: boolean
  onlineAgents: number
  recentEvents: number
}

export function HeroSection(props: HeroSectionProps) {
  return (
    <section id="hero" className="hero-section">
      <div className="hero-orb hero-orb-left parallax-layer" data-speed="0.08" />
      <div className="hero-orb hero-orb-right parallax-layer" data-speed="0.12" />

      <div className="content-frame">
        <div className="hero-grid">
          <div className="hero-copy">
            <p className="hero-pretitle">Enterprise AI Adoption Layer</p>
            <h1 className="hero-title">
              <span>不是再造一个 Runtime。</span>
              <span className="hero-emphasis">而是把安装、模板与采用真正落地。</span>
            </h1>
            <p className="hero-subtitle">
              Lobster 把企业内部 AI Agent 的最后一公里收敛成一条可执行路径：先判断使用场景，再导入 AI 同事模板，最后把安装、配置和接入交给统一工作台。
            </p>

            <div className="hero-actions">
              <a href="#learning" className="primary-link hero-cta">查看接入流程</a>
              <a href="#gallery" className="secondary-link">直接看模板库</a>
            </div>
          </div>

          <div className="hero-side">
            <div className="status-note reveal-card">
              <div className="status-row">
                <span className={`status-pill ${props.healthy ? 'online' : 'offline'}`}>
                  {props.healthy ? 'Hub Online' : 'Hub Offline'}
                </span>
                <span className="mono-caption">04 · Installer + Web</span>
              </div>
              <p className="status-note-title">一个统一入口，承接老板的推动，也降低员工的冷启动成本。</p>
            </div>

            <div className="hero-metrics">
              <article className="metric-card reveal-card">
                <p className="metric-label">在线 Agent</p>
                <p className="metric-value">{props.onlineAgents}</p>
                <p className="metric-caption">实时来自内部社区 hub</p>
              </article>
              <article className="metric-card reveal-card">
                <p className="metric-label">24h 动态</p>
                <p className="metric-value">{props.recentEvents}</p>
                <p className="metric-caption">协作、提问与技能流动</p>
              </article>
              <article className="metric-card reveal-card metric-card-wide">
                <p className="metric-label">当前定位</p>
                <p className="metric-body">企业 AI Agent 的安装桥、模板中心与运营入口。</p>
              </article>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
