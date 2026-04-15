import { useCallback, useEffect, useMemo, useState } from 'react'
import { LOBSTER_TEMPLATE_PACKAGES, type LobsterTemplatePackage } from '@lobster/shared'
import type { Agent, FeedItem } from '../types'

const HUB_BASE_URL = (import.meta.env.VITE_HUB_URL as string | undefined) ?? 'http://localhost:3888'

export function useHubData() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [feed, setFeed] = useState<FeedItem[]>([])
  const [healthy, setHealthy] = useState(false)
  const [activeCategory, setActiveCategory] = useState('')
  const [copiedInstallCode, setCopiedInstallCode] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const [healthRes, agentsRes, feedRes] = await Promise.all([
        fetch(`${HUB_BASE_URL}/health`),
        fetch(`${HUB_BASE_URL}/api/agents?online=true`),
        fetch(`${HUB_BASE_URL}/api/feed?limit=40`),
      ])

      setHealthy(healthRes.ok)

      if (agentsRes.ok) {
        const data = (await agentsRes.json()) as { agents: Agent[] }
        setAgents(data.agents)
      }

      if (feedRes.ok) {
        const data = (await feedRes.json()) as { feed: FeedItem[] }
        setFeed(data.feed)
      }
    } catch (error) {
      console.error(error)
      setHealthy(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
    const timer = window.setInterval(() => void refresh(), 10000)
    return () => window.clearInterval(timer)
  }, [refresh])

  const categories = useMemo(
    () => Array.from(new Set(LOBSTER_TEMPLATE_PACKAGES.map((item) => item.categoryLabel))),
    [],
  )

  const filteredTemplates = useMemo(() => {
    if (!activeCategory) return LOBSTER_TEMPLATE_PACKAGES.slice(0, 8)
    return LOBSTER_TEMPLATE_PACKAGES.filter((item) => item.categoryLabel === activeCategory)
  }, [activeCategory])

  const agentsById = useMemo(() => new Map(agents.map((item) => [item.id, item])), [agents])

  const departmentStats = useMemo(() => {
    const map = new Map<string, number>()
    for (const agent of agents) {
      map.set(agent.department, (map.get(agent.department) ?? 0) + 1)
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1])
  }, [agents])

  const radarMetrics = useMemo(() => {
    const now = Date.now()
    const dayMs = 24 * 60 * 60 * 1000
    const recentFeed = feed.filter((item) => now - new Date(item.timestamp).getTime() <= dayMs)
    return {
      onlineAgents: agents.length,
      activeDepartments: departmentStats.length,
      recentEvents: recentFeed.length,
      askedCount: recentFeed.filter((item) => item.type === 'question-asked').length,
      answeredCount: recentFeed.filter((item) => item.type === 'question-answered').length,
      collaborationCount: recentFeed.filter((item) => item.type === 'agent-collaboration').length,
      installedSkillCount: recentFeed.filter((item) => item.type === 'skill-installed').length,
    }
  }, [agents.length, departmentStats.length, feed])

  const copyInstallCode = useCallback(async (template: LobsterTemplatePackage) => {
    try {
      await navigator.clipboard.writeText(template.installCode)
      setCopiedInstallCode(template.id)
      window.setTimeout(() => {
        setCopiedInstallCode((current) => (current === template.id ? null : current))
      }, 2000)
    } catch (error) {
      console.error(error)
      setCopiedInstallCode(null)
    }
  }, [])

  return {
    agents,
    feed,
    healthy,
    activeCategory,
    setActiveCategory,
    copiedInstallCode,
    categories,
    filteredTemplates,
    agentsById,
    departmentStats,
    radarMetrics,
    copyInstallCode,
  }
}
