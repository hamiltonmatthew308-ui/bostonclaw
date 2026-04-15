// 大厂封装版供应商
export interface VendorInfo {
  id: string;
  name: string;
  vendor: string;
  logoUrl?: string;
  downloadUrl: string;
  description: string;
  features: string[];
  requiresPlan: boolean;
  planInfo?: string;
  platforms: Array<'mac' | 'win' | 'linux'>;
}

// 社区中注册的 Agent
export interface Agent {
  id: string;
  name: string;           // Agent 昵称，如"Nero的虾"
  owner: string;          // 所有者姓名
  department: string;     // 部门
  avatar?: string;        // 头像 URL（可选，默认生成）
  skills: string[];       // 已安装技能 slugs
  expertise: string[];    // 擅长领域标签
  client: 'openclaw';
  isOnline: boolean;
  lastSeen: string;       // ISO timestamp
  registeredAt: string;
  messageCount: number;   // 发出/回答的消息数（活跃度）
}

// Agent 间的消息
export interface Message {
  id: string;
  fromAgentId: string;
  toAgentId: string | '*';  // '*' = 广播给所有人
  content: string;
  type: 'question' | 'answer' | 'broadcast' | 'skill-share';
  status: 'pending' | 'delivered' | 'answered';
  parentId?: string;        // 回复某条消息
  timestamp: string;
}

// 社区动态 Feed 条目
export interface FeedItem {
  id: string;
  type:
    | 'agent-online'
    | 'agent-offline'
    | 'skill-installed'
    | 'question-asked'
    | 'question-answered'
    | 'agent-collaboration';
  agentId: string;
  data: Record<string, unknown>;
  timestamp: string;
}

// 技能（从 OpenClaw 生态同步）
export interface CommunitySkill {
  slug: string;
  name: string;
  description: string;
  author: string;
  installedBy: string[];  // 社区中哪些 Agent 装了此技能（agent IDs）
  sharedCount: number;    // 被推荐/分享次数
}

// Agent 注册请求体
export interface RegisterAgentRequest {
  name: string;
  owner: string;
  department: string;
  skills: string[];
  expertise: string[];
  client: Agent['client'];
}

// 发送消息请求体
export interface SendMessageRequest {
  fromAgentId: string;
  toAgentId: string | '*';
  content: string;
  type: Message['type'];
  parentId?: string;
}

// SSE 事件类型
export type SSEEvent =
  | { event: 'agent-online'; data: Agent }
  | { event: 'agent-offline'; data: { agentId: string } }
  | { event: 'message'; data: Message }
  | { event: 'feed'; data: FeedItem };

// Agent 匹配评分（用于智能路由）
export interface AgentMatch {
  agent: Agent;
  score: number;  // 0-1，匹配度
  reason: string; // 为什么匹配（用于 Feed 展示）
}
