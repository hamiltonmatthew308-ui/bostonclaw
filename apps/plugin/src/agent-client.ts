import type { Agent, Message, FeedItem, RegisterAgentRequest, SendMessageRequest } from '../../../packages/shared/src/types.js';

export class LobsterClient {
  private baseUrl: string;
  private agentId: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  get currentAgentId() { return this.agentId; }

  async register(req: RegisterAgentRequest): Promise<Agent> {
    const res = await fetch(`${this.baseUrl}/api/agents/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    if (!res.ok) throw new Error(`注册失败: ${await res.text()}`);
    const data = await res.json() as { agent: Agent };
    this.agentId = data.agent.id;
    return data.agent;
  }

  async heartbeat(): Promise<boolean> {
    if (!this.agentId) return false;
    try {
      const res = await fetch(`${this.baseUrl}/api/agents/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: this.agentId }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async markOffline(): Promise<void> {
    if (!this.agentId) return;
    try {
      await fetch(`${this.baseUrl}/api/agents/offline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: this.agentId }),
      });
    } catch { /* 静默失败 */ }
  }

  async getAgents(onlineOnly = true): Promise<Agent[]> {
    const res = await fetch(`${this.baseUrl}/api/agents?online=${onlineOnly}`);
    if (!res.ok) throw new Error('获取 Agent 列表失败');
    const data = await res.json() as { agents: Agent[] };
    return data.agents;
  }

  async sendMessage(req: Omit<SendMessageRequest, 'fromAgentId'>): Promise<Message> {
    if (!this.agentId) throw new Error('尚未注册，请先执行 /lobster-join');
    const res = await fetch(`${this.baseUrl}/api/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...req, fromAgentId: this.agentId }),
    });
    if (!res.ok) throw new Error(`发送消息失败: ${await res.text()}`);
    const data = await res.json() as { message: Message };
    return data.message;
  }

  async getMessages(): Promise<Message[]> {
    if (!this.agentId) return [];
    const res = await fetch(`${this.baseUrl}/api/messages/${this.agentId}`);
    if (!res.ok) return [];
    const data = await res.json() as { messages: Message[] };
    return data.messages;
  }

  async getFeed(limit = 20): Promise<FeedItem[]> {
    const res = await fetch(`${this.baseUrl}/api/feed?limit=${limit}`);
    if (!res.ok) return [];
    const data = await res.json() as { feed: FeedItem[] };
    return data.feed;
  }

  getSSEUrl(): string {
    return `${this.baseUrl}/api/stream/${this.agentId}`;
  }

  async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/health`, { signal: AbortSignal.timeout(3000) });
      return res.ok;
    } catch {
      return false;
    }
  }
}
