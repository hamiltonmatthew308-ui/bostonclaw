import { useCallback, useEffect, useMemo, useState } from 'react'
import { LOBSTER_TEMPLATE_PACKAGES, type LobsterTemplatePackage } from '@lobster/shared'
import type { Agent, FeedItem } from '../types'

const HUB_BASE_URL = (import.meta.env.VITE_HUB_URL as string | undefined) ?? 'http://localhost:3888'

const DEMO_AGENTS: Agent[] = [
  { id: 'a1', name: "Nero's Shrimp", owner: 'Ludviq', department: '市场战略部', expertise: ['展会策划', '竞品分析'], client: 'openclaw', isOnline: true, lastSeen: new Date().toISOString(), registeredAt: '2026-04-18T09:00:00Z', messageCount: 234, skills: ['meeting-minutes', 'competitor-radar'] },
  { id: 'a2', name: '法务小助手', owner: '王律师', department: '法务部', expertise: ['合同审查', '合规检查'], client: 'openclaw', isOnline: true, lastSeen: new Date().toISOString(), registeredAt: '2026-04-19T10:30:00Z', messageCount: 89, skills: ['contract-review'] },
  { id: 'a3', name: '销售雷达', owner: '陈经理', department: '销售部', expertise: ['客户跟进', '商机分析'], client: 'openclaw', isOnline: true, lastSeen: new Date().toISOString(), registeredAt: '2026-04-19T14:00:00Z', messageCount: 412, skills: ['sales-intel', 'crm-sync'] },
  { id: 'a4', name: '研发审查员', owner: '李工', department: '研发部', expertise: ['代码审查', '安全扫描'], client: 'openclaw', isOnline: false, lastSeen: '2026-04-21T18:00:00Z', registeredAt: '2026-04-20T08:00:00Z', messageCount: 167, skills: ['code-review'] },
  { id: 'a5', name: 'HR 小蜜', owner: '张姐', department: '人力资源部', expertise: ['招聘筛选', '员工问答'], client: 'openclaw', isOnline: true, lastSeen: new Date().toISOString(), registeredAt: '2026-04-20T11:00:00Z', messageCount: 56, skills: ['hr-faq'] },
]

function makeDemoFeed(): FeedItem[] {
  const now = Date.now()
  const h = 3600_000
  return [
    { id: 'f1', type: 'skill-installed', agentId: 'a3', data: { skill: 'sales-intel' }, timestamp: new Date(now - 0.5 * h).toISOString() },
    { id: 'f2', type: 'question-asked', agentId: 'a5', data: { question: '如何办理入职手续？' }, timestamp: new Date(now - 1 * h).toISOString() },
    { id: 'f3', type: 'question-answered', agentId: 'a1', data: {}, timestamp: new Date(now - 1.5 * h).toISOString() },
    { id: 'f4', type: 'agent-collaboration', agentId: 'a2', data: { with: 'a1' }, timestamp: new Date(now - 2 * h).toISOString() },
    { id: 'f5', type: 'agent-online', agentId: 'a3', data: {}, timestamp: new Date(now - 2.5 * h).toISOString() },
    { id: 'f6', type: 'skill-installed', agentId: 'a1', data: { skill: 'competitor-radar' }, timestamp: new Date(now - 3 * h).toISOString() },
    { id: 'f7', type: 'question-asked', agentId: 'a2', data: { question: 'NDA 模板有更新吗？' }, timestamp: new Date(now - 4 * h).toISOString() },
    { id: 'f8', type: 'agent-online', agentId: 'a5', data: {}, timestamp: new Date(now - 5 * h).toISOString() },
    { id: 'f9', type: 'question-answered', agentId: 'a4', data: {}, timestamp: new Date(now - 6 * h).toISOString() },
    { id: 'f10', type: 'agent-collaboration', agentId: 'a3', data: { with: 'a2' }, timestamp: new Date(now - 7 * h).toISOString() },
  ]
}

export function useHubData() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [feed, setFeed] = useState<FeedItem[]>([])
  const [healthy, setHealthy] = useState(false)
  const [activeCategory, setActiveCategory] = useState('')
  const [copiedInstallCode, setCopiedInstallCode] = useState<string | null>(null)
  const [triedOnce, setTriedOnce] = useState(false)

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
    } catch {
      setHealthy(false)
    } finally {
      setTriedOnce(true)
    }
  }, [])

  useEffect(() => {
    void refresh()
    const timer = window.setInterval(() => void refresh(), 10000)
    return () => window.clearInterval(timer)
  }, [refresh])

  // Fall back to demo data when hub is unreachable
  const displayAgents = agents.length > 0 ? agents : (triedOnce && !healthy ? DEMO_AGENTS : agents)
  const displayFeed = feed.length > 0 ? feed : (triedOnce && !healthy ? makeDemoFeed() : feed)

  const categories = useMemo(
    () => Array.from(new Set(LOBSTER_TEMPLATE_PACKAGES.map((item) => item.categoryLabel))),
    [],
  )

  const filteredTemplates = useMemo(() => {
    if (!activeCategory) return LOBSTER_TEMPLATE_PACKAGES
    return LOBSTER_TEMPLATE_PACKAGES.filter((item) => item.categoryLabel === activeCategory)
  }, [activeCategory])

  const agentsById = useMemo(() => new Map(displayAgents.map((item) => [item.id, item])), [displayAgents])

  const departmentStats = useMemo(() => {
    const map = new Map<string, number>()
    for (const agent of displayAgents) {
      map.set(agent.department, (map.get(agent.department) ?? 0) + 1)
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1])
  }, [displayAgents])

  const radarMetrics = useMemo(() => {
    const now = Date.now()
    const dayMs = 24 * 60 * 60 * 1000
    const recentFeed = displayFeed.filter((item) => now - new Date(item.timestamp).getTime() <= dayMs)
    return {
      onlineAgents: displayAgents.filter((a) => a.isOnline).length,
      activeDepartments: departmentStats.length,
      recentEvents: recentFeed.length,
      askedCount: recentFeed.filter((item) => item.type === 'question-asked').length,
      answeredCount: recentFeed.filter((item) => item.type === 'question-answered').length,
      collaborationCount: recentFeed.filter((item) => item.type === 'agent-collaboration').length,
      installedSkillCount: recentFeed.filter((item) => item.type === 'skill-installed').length,
    }
  }, [displayAgents, departmentStats.length, displayFeed])

  const copyInstallCode = useCallback(async (template: LobsterTemplatePackage) => {
    try {
      await navigator.clipboard.writeText(template.installCode)
      setCopiedInstallCode(template.id)
      window.setTimeout(() => {
        setCopiedInstallCode((current) => (current === template.id ? null : current))
      }, 2000)
    } catch {
      setCopiedInstallCode(null)
    }
  }, [])

  return {
    agents: displayAgents,
    feed: displayFeed,
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
