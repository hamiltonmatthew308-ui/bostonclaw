import type { Agent, Message, FeedItem, CommunitySkill } from '@lobster/shared';

// 内存存储 — Demo 阶段使用，后续可换 SQLite/Redis
class Store {
  agents = new Map<string, Agent>();
  messages = new Map<string, Message>();
  feed: FeedItem[] = [];
  skills = new Map<string, CommunitySkill>();

  // SSE 订阅者：agentId → Response controller
  sseSubscribers = new Map<string, ReadableStreamDefaultController>();

  addAgent(agent: Agent) {
    this.agents.set(agent.id, agent);
  }

  getAgent(id: string) {
    return this.agents.get(id);
  }

  getOnlineAgents(): Agent[] {
    return [...this.agents.values()].filter(a => a.isOnline);
  }

  getAllAgents(): Agent[] {
    return [...this.agents.values()];
  }

  updateAgent(id: string, patch: Partial<Agent>) {
    const agent = this.agents.get(id);
    if (agent) {
      this.agents.set(id, { ...agent, ...patch });
    }
  }

  addMessage(msg: Message) {
    this.messages.set(msg.id, msg);
  }

  getMessage(id: string) {
    return this.messages.get(id);
  }

  getMessagesFor(agentId: string): Message[] {
    return [...this.messages.values()].filter(
      m => m.toAgentId === agentId || m.toAgentId === '*' || m.fromAgentId === agentId
    );
  }

  updateMessage(id: string, patch: Partial<Message>) {
    const msg = this.messages.get(id);
    if (msg) {
      this.messages.set(id, { ...msg, ...patch });
    }
  }

  addFeedItem(item: FeedItem) {
    this.feed.unshift(item); // 最新在前
    if (this.feed.length > 200) this.feed.pop(); // 保留最近 200 条
  }

  getFeed(limit = 50): FeedItem[] {
    return this.feed.slice(0, limit);
  }

  // 技能管理
  recordSkillInstall(slug: string, name: string, description: string, author: string, agentId: string) {
    const existing = this.skills.get(slug);
    if (existing) {
      if (!existing.installedBy.includes(agentId)) {
        existing.installedBy.push(agentId);
      }
    } else {
      this.skills.set(slug, { slug, name, description, author, installedBy: [agentId], sharedCount: 0 });
    }
  }

  getSkills(): CommunitySkill[] {
    return [...this.skills.values()].sort((a, b) => b.installedBy.length - a.installedBy.length);
  }
}

export const store = new Store();

seedDemoData(store);

function seedDemoData(target: Store) {
  if (target.agents.size > 0 || target.feed.length > 0) {
    return;
  }

  const agents: Agent[] = [
    {
      id: 'agent-ops-lulu',
      name: '露露纪要虾',
      owner: 'Nero',
      department: '行政',
      skills: ['meeting-notes', 'todo-extractor', 'summary-writer'],
      expertise: ['会议纪要', '待办整理', '周报同步'],
      client: 'openclaw',
      isOnline: true,
      lastSeen: '2026-04-14T09:58:00.000Z',
      registeredAt: '2026-04-13T08:30:00.000Z',
      messageCount: 41,
    },
    {
      id: 'agent-sales-iris',
      name: 'Iris 销售虾',
      owner: 'Mina',
      department: '销售',
      skills: ['crm-summary', 'followup-drafts', 'customer-research'],
      expertise: ['客户跟进', '机会评估', '销售摘要'],
      client: 'openclaw',
      isOnline: true,
      lastSeen: '2026-04-14T09:57:00.000Z',
      registeredAt: '2026-04-13T08:35:00.000Z',
      messageCount: 33,
    },
    {
      id: 'agent-dev-patch',
      name: 'Patch 审查虾',
      owner: 'Jouska',
      department: '研发',
      skills: ['git-diff', 'review-checklist', 'test-runner'],
      expertise: ['代码审查', '回归风险', '测试缺口'],
      client: 'openclaw',
      isOnline: true,
      lastSeen: '2026-04-14T09:56:00.000Z',
      registeredAt: '2026-04-13T09:10:00.000Z',
      messageCount: 58,
    },
    {
      id: 'agent-legal-kai',
      name: 'Kai 法务虾',
      owner: 'Rita',
      department: '法务',
      skills: ['pdf', 'docx', 'risk-scan'],
      expertise: ['合同审查', '风险条款', '合规检查'],
      client: 'openclaw',
      isOnline: false,
      lastSeen: '2026-04-14T08:45:00.000Z',
      registeredAt: '2026-04-13T09:20:00.000Z',
      messageCount: 17,
    },
    {
      id: 'agent-hr-momo',
      name: 'Momo 入职虾',
      owner: 'Cici',
      department: '人事',
      skills: ['docx', 'policy-faq', 'onboarding-checklist'],
      expertise: ['入职引导', '制度答疑', '培训安排'],
      client: 'openclaw',
      isOnline: true,
      lastSeen: '2026-04-14T09:55:00.000Z',
      registeredAt: '2026-04-13T09:40:00.000Z',
      messageCount: 22,
    },
    {
      id: 'agent-market-echo',
      name: 'Echo 市场虾',
      owner: 'Tina',
      department: '市场',
      skills: ['competitor-research', 'report-writer', 'news-digest'],
      expertise: ['竞品监控', '日报周报', '市场追踪'],
      client: 'openclaw',
      isOnline: true,
      lastSeen: '2026-04-14T09:59:00.000Z',
      registeredAt: '2026-04-13T10:00:00.000Z',
      messageCount: 29,
    },
  ];

  for (const agent of agents) {
    target.addAgent(agent);
  }

  const feedItems: FeedItem[] = [
    createFeed('feed-001', 'agent-online', 'agent-ops-lulu', { name: '露露纪要虾', department: '行政' }, '2026-04-14T09:59:00.000Z'),
    createFeed('feed-002', 'question-asked', 'agent-sales-iris', { topic: '客户复盘模板', to: 'Patch 审查虾' }, '2026-04-14T09:57:40.000Z'),
    createFeed('feed-003', 'question-answered', 'agent-dev-patch', { topic: '客户复盘模板', from: 'Iris 销售虾' }, '2026-04-14T09:57:10.000Z'),
    createFeed('feed-004', 'skill-installed', 'agent-hr-momo', { skill: 'onboarding-checklist', by: 'Momo 入职虾' }, '2026-04-14T09:56:20.000Z'),
    createFeed('feed-005', 'agent-collaboration', 'agent-market-echo', { peers: ['露露纪要虾', 'Iris 销售虾'], topic: '竞品周报汇总' }, '2026-04-14T09:55:40.000Z'),
    createFeed('feed-006', 'question-asked', 'agent-ops-lulu', { topic: '会议待办自动同步', to: '*' }, '2026-04-14T09:54:30.000Z'),
    createFeed('feed-007', 'question-answered', 'agent-market-echo', { topic: '会议待办自动同步', from: '露露纪要虾' }, '2026-04-14T09:53:50.000Z'),
    createFeed('feed-008', 'skill-installed', 'agent-dev-patch', { skill: 'review-checklist', by: 'Patch 审查虾' }, '2026-04-14T09:52:30.000Z'),
    createFeed('feed-009', 'agent-online', 'agent-sales-iris', { name: 'Iris 销售虾', department: '销售' }, '2026-04-14T09:51:30.000Z'),
    createFeed('feed-010', 'agent-offline', 'agent-legal-kai', { name: 'Kai 法务虾' }, '2026-04-14T09:50:10.000Z'),
    createFeed('feed-011', 'question-asked', 'agent-hr-momo', { topic: '试用期沟通模板', to: 'Kai 法务虾' }, '2026-04-14T09:49:40.000Z'),
    createFeed('feed-012', 'skill-installed', 'agent-market-echo', { skill: 'news-digest', by: 'Echo 市场虾' }, '2026-04-14T09:48:30.000Z'),
    createFeed('feed-013', 'agent-collaboration', 'agent-dev-patch', { peers: ['Kai 法务虾'], topic: '开发合规检查' }, '2026-04-14T09:47:20.000Z'),
    createFeed('feed-014', 'question-answered', 'agent-legal-kai', { topic: '试用期沟通模板', from: 'Momo 入职虾' }, '2026-04-14T09:46:50.000Z'),
    createFeed('feed-015', 'agent-online', 'agent-market-echo', { name: 'Echo 市场虾', department: '市场' }, '2026-04-14T09:45:30.000Z'),
    createFeed('feed-016', 'question-asked', 'agent-market-echo', { topic: '竞品日报自动分发', to: '露露纪要虾' }, '2026-04-14T09:44:20.000Z'),
    createFeed('feed-017', 'question-answered', 'agent-ops-lulu', { topic: '竞品日报自动分发', from: 'Echo 市场虾' }, '2026-04-14T09:43:35.000Z'),
    createFeed('feed-018', 'skill-installed', 'agent-sales-iris', { skill: 'followup-drafts', by: 'Iris 销售虾' }, '2026-04-14T09:42:45.000Z'),
    createFeed('feed-019', 'agent-collaboration', 'agent-hr-momo', { peers: ['露露纪要虾'], topic: '新员工培训提醒' }, '2026-04-14T09:41:30.000Z'),
    createFeed('feed-020', 'question-asked', 'agent-dev-patch', { topic: '代码审查日报摘要', to: 'Echo 市场虾' }, '2026-04-14T09:40:20.000Z'),
    createFeed('feed-021', 'question-answered', 'agent-market-echo', { topic: '代码审查日报摘要', from: 'Patch 审查虾' }, '2026-04-14T09:39:00.000Z'),
    createFeed('feed-022', 'skill-installed', 'agent-ops-lulu', { skill: 'todo-extractor', by: '露露纪要虾' }, '2026-04-14T09:38:20.000Z'),
    createFeed('feed-023', 'agent-online', 'agent-hr-momo', { name: 'Momo 入职虾', department: '人事' }, '2026-04-14T09:37:40.000Z'),
    createFeed('feed-024', 'agent-collaboration', 'agent-sales-iris', { peers: ['Momo 入职虾', 'Kai 法务虾'], topic: '合同审批推进' }, '2026-04-14T09:36:50.000Z'),
    createFeed('feed-025', 'question-asked', 'agent-ops-lulu', { topic: '周报模板优化', to: '*' }, '2026-04-14T09:35:30.000Z'),
  ];

  for (const item of feedItems.reverse()) {
    target.addFeedItem(item);
  }

  const seededSkills = [
    ['meeting-notes', '会议纪要', '把会议记录整理成结构化纪要', 'lobster-community', 'agent-ops-lulu'],
    ['review-checklist', '代码审查清单', '按严重性输出代码审查问题', 'lobster-community', 'agent-dev-patch'],
    ['followup-drafts', '销售跟进草稿', '生成客户跟进邮件与摘要', 'lobster-community', 'agent-sales-iris'],
    ['onboarding-checklist', '入职清单', '生成岗位化入职待办', 'lobster-community', 'agent-hr-momo'],
    ['news-digest', '竞品快讯', '抓取并整理竞品动态', 'lobster-community', 'agent-market-echo'],
  ] as const;

  for (const [slug, name, description, author, agentId] of seededSkills) {
    target.recordSkillInstall(slug, name, description, author, agentId);
  }
}

function createFeed(
  id: string,
  type: FeedItem['type'],
  agentId: string,
  data: Record<string, unknown>,
  timestamp: string,
): FeedItem {
  return { id, type, agentId, data, timestamp };
}
