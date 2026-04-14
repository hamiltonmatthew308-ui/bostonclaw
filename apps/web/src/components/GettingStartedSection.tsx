const steps = [
  {
    index: '01',
    title: '先判断使用场景',
    body: '不是先问技术，而是先判断员工要在本地桌面、共享服务，还是 IM 里使用 AI 同事。',
  },
  {
    index: '02',
    title: '再导入 AI 同事模板',
    body: '从角色模板起步，自动推断 runtime 和部署路径，把“会不会 prompt”变成“要不要这个角色”。',
  },
  {
    index: '03',
    title: '最后完成安装与配置',
    body: '把 provider、技能和本地目录一次落地，最终交付给员工一个可直接开工的 AI 同事。',
  },
]

export function GettingStartedSection() {
  return (
    <section id="learning" className="editorial-section reveal-card">
      <div className="content-frame">
        <div className="section-heading">
          <p className="section-kicker">Guided Setup</p>
          <h2 className="section-title">先把一条可复制的上手路径跑通。</h2>
          <p className="section-intro">
            Lobster 不是让员工自己查文档、装 Node、敲命令，而是把复杂判断收成一条可执行的安装流程。先跑通一个人，再做团队推广。
          </p>
        </div>

        <div className="editorial-rail reveal-card">
          <div className="rail-label">Adoption Flow</div>
          <div className="rail-tags">
            <span>Scenario First</span>
            <span>Template Driven</span>
            <span>Provider Ready</span>
            <span>Cross-Platform</span>
          </div>
        </div>

        <div className="step-manual">
          {steps.map((step) => (
            <article key={step.index} className="manual-card reveal-card">
              <p className="manual-index">{step.index}</p>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
