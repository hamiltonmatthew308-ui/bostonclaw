export function HeroSection() {
  return (
    <section id="hero" className="hero-section hero-full">
      <div className="content-frame">
        <p className="hero-pretitle">Boston Aesthetics 内部工具</p>
        <h1 className="hero-title hero-title-center">
          <span>欢迎，我们这里发龙虾…</span>
          <span className="hero-emphasis">还有爱马仕。</span>
        </h1>
        <p className="hero-subtitle hero-subtitle-center">
          还在为安装龙虾烦恼吗？这里一键搞定。不知道怎么用？我们手把手教你。挑一个 AI 同事模板，装上就能开工——不敲命令、不查文档。
        </p>
        <div className="hero-actions hero-actions-center">
          <a href="#how-to-start" className="primary-link hero-cta">第一次用？点这里</a>
          <a href="#gallery" className="secondary-link">看看有哪些 AI 同事</a>
        </div>
      </div>
    </section>
  )
}
