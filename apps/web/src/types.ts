export type Agent = {
  id: string
  name: string
  owner: string
  department: string
  skills: string[]
  expertise: string[]
  client: 'openclaw'
  isOnline: boolean
  lastSeen: string
  registeredAt: string
  messageCount: number
}

export type FeedItem = {
  id: string
  type:
    | 'agent-online'
    | 'agent-offline'
    | 'skill-installed'
    | 'question-asked'
    | 'question-answered'
    | 'agent-collaboration'
  agentId: string
  data: Record<string, unknown>
  timestamp: string
}
