import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function initHeroEntrance() {
  const tl = gsap.timeline()

  tl.fromTo(
    '.hero-pretitle',
    { opacity: 0, y: 12 },
    { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', delay: 0.3 }
  )
    .fromTo(
      '.hero-title span',
      { opacity: 0, y: 24 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.08,
        ease: 'power3.out',
      },
      '-=0.3'
    )
    .fromTo(
      '.hero-subtitle',
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' },
      '-=0.4'
    )
    .fromTo(
      '.hero-cta',
      { opacity: 0, scale: 0.97 },
      { opacity: 1, scale: 1, duration: 0.5, ease: 'power2.out' },
      '-=0.3'
    )

  return tl
}

export function initParallax() {
  const layers = document.querySelectorAll('.parallax-layer')

  layers.forEach((layer) => {
    const speed = layer.getAttribute('data-speed') || '0.2'
    gsap.to(layer, {
      y: () => (window.innerHeight - layer.getBoundingClientRect().height) * parseFloat(speed),
      ease: 'none',
      scrollTrigger: {
        trigger: layer.closest('section') || layer,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    })
  })
}

export function initSectionReveals() {
  ScrollTrigger.getAll().forEach((t) => t.kill())

  const sections = document.querySelectorAll('section:not(.hero-section)')

  sections.forEach((section) => {
    const title = section.querySelector('.section-title')
    const cards = section.querySelectorAll('.reveal-card')

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top 88%',
      },
    })

    if (title) {
      tl.fromTo(
        title,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
      )
    }

    if (cards.length > 0) {
      tl.fromTo(
        cards,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.08, ease: 'power2.out' },
        '-=0.3'
      )
    }
  })
}
