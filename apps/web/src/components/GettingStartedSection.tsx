import { Link } from 'react-router-dom'

const steps = [
  {
    index: '01',
    title: '下载安装器',
    body: '像装微信一样简单。Windows 下载 .exe，Mac 下载 .dmg，双击安装，不需要管理员权限。',
    link: '/download',
    linkText: '去下载 →',
  },
  {
    index: '02',
    title: '选一个 AI 同事',
    body: '不知道选什么？先试试「会议纪要员」或「销售情报员」。点一下就能装到你的电脑上。',
    link: '/templates',
    linkText: '看看模板 →',
  },
  {
    index: '03',
    title: '直接用',
    body: '装完就能用。打开聊天窗口，像跟同事说话一样告诉它你要干什么就行。',
  },
]

export function GettingStartedSection() {
  return (
    <section id="how-to-start" className="editorial-section reveal-card">
      <div className="content-frame">
        <div className="section-heading">
          <p className="section-kicker">三步上手</p>
          <h2 className="section-title">不会用？看这里。</h2>
          <p className="section-intro">
            不需要懂代码，不需要装什么东西，不需要看教程。三步走，比你泡杯咖啡还快。
          </p>
        </div>

        <div className="editorial-rail reveal-card">
          <div className="rail-label">上手流程</div>
          <div className="rail-tags">
            <span>零代码</span>
            <span>一键安装</span>
            <span>即装即用</span>
            <span>跨平台</span>
          </div>
        </div>

        <div className="step-manual">
          {steps.map((step) => (
            <article key={step.index} className="manual-card reveal-card">
              <p className="manual-index">{step.index}</p>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
              {step.link && (
                <Link to={step.link} className="step-link">{step.linkText}</Link>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
