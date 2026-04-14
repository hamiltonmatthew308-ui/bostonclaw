import { store } from '../store.js';
import type { Agent, AgentMatch, RegisterAgentRequest } from '@lobster/shared';
import { nanoid } from '../utils.js';

const HEARTBEAT_TIMEOUT_MS = 90_000; // 90 秒无心跳视为离线

export function registerAgent(req: RegisterAgentRequest): Agent {
  // 检查同名同主人的 Agent 是否已存在（重连场景）
  const existing = [...store.agents.values()].find(
    a => a.owner === req.owner && a.name === req.name
  );

  const agent: Agent = {
    id: existing?.id ?? nanoid(),
    name: req.name,
    owner: req.owner,
    department: req.department,
    skills: req.skills,
    expertise: req.expertise,
    client: req.client,
    isOnline: true,
    lastSeen: new Date().toISOString(),
    registeredAt: existing?.registeredAt ?? new Date().toISOString(),
    messageCount: existing?.messageCount ?? 0,
  };

  store.addAgent(agent);
  return agent;
}

export function heartbeat(agentId: string): boolean {
  const agent = store.getAgent(agentId);
  if (!agent) return false;
  store.updateAgent(agentId, { lastSeen: new Date().toISOString(), isOnline: true });
  return true;
}

export function markOffline(agentId: string) {
  store.updateAgent(agentId, { isOnline: false, lastSeen: new Date().toISOString() });
}

// 清理超时的 Agent（每分钟运行一次）
export function startHeartbeatWatcher() {
  setInterval(() => {
    const now = Date.now();
    for (const agent of store.getAllAgents()) {
      if (!agent.isOnline) continue;
      const lastSeen = new Date(agent.lastSeen).getTime();
      if (now - lastSeen > HEARTBEAT_TIMEOUT_MS) {
        markOffline(agent.id);
      }
    }
  }, 30_000);
}

// 根据问题内容匹配最合适的 Agent
export function matchAgents(question: string, excludeAgentId: string): AgentMatch[] {
  const keywords = question.toLowerCase().split(/\s+/);
  const results: AgentMatch[] = [];

  for (const agent of store.getOnlineAgents()) {
    if (agent.id === excludeAgentId) continue;

    let score = 0;
    const reasons: string[] = [];

    // 匹配 expertise 标签
    for (const exp of agent.expertise) {
      const expLower = exp.toLowerCase();
      for (const kw of keywords) {
        if (expLower.includes(kw) || kw.includes(expLower)) {
          score += 0.4;
          reasons.push(`擅长 "${exp}"`);
        }
      }
    }

    // 匹配技能 slug
    for (const skill of agent.skills) {
      const skillLower = skill.toLowerCase();
      for (const kw of keywords) {
        if (skillLower.includes(kw) || kw.includes(skillLower)) {
          score += 0.3;
          reasons.push(`已安装 "${skill}"`);
        }
      }
    }

    // 活跃度加成（有过回答记录的 Agent 优先）
    if (agent.messageCount > 0) score += 0.1;

    if (score > 0) {
      results.push({
        agent,
        score: Math.min(score, 1),
        reason: [...new Set(reasons)].slice(0, 2).join('，') || '在线可回答',
      });
    }
  }

  // 按匹配度排序
  return results.sort((a, b) => b.score - a.score);
}
