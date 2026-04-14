// 龙虾社区 OpenClaw 插件
// 连接任意 OpenClaw 客户端（ClawX / AionUi / CLI）到龙虾社区网络

import { LobsterClient } from './agent-client.js';
import { SSEListener } from './sse-listener.js';
import { AutoResponder } from './auto-responder.js';
import type { Message } from '../../../packages/shared/src/types.js';

// OpenClaw Plugin API 类型声明（简化版，与 openclaw.plugin.json 中的 API 对应）
interface OpenClawPluginApi {
  on(event: string, callback: (...args: unknown[]) => unknown): void;
  registerCommand(opts: { name: string; description: string; handler: (args: string) => Promise<string> }): void;
  registerService(opts: { id: string; start: () => void; stop: () => void }): void;
  pluginConfig: Record<string, unknown>;
  logger: { info: (msg: string) => void; warn: (msg: string) => void; error: (msg: string) => void };
}

export default function lobsterCommunityPlugin(api: OpenClawPluginApi): void {
  const hubUrl = (api.pluginConfig['hubUrl'] as string) ?? 'http://localhost:3888';
  const client = new LobsterClient(hubUrl);

  const autoResponder = new AutoResponder(async (msgId, content) => {
    const pendingMsg = autoResponder.getPendingQuestions().find(q => q.message.id === msgId);
    if (!pendingMsg) {
      api.logger.warn(`消息 ${msgId} 不存在`);
      return;
    }
    await client.sendMessage({
      toAgentId: pendingMsg.message.fromAgentId,
      content,
      type: 'answer',
      parentId: msgId,
    });
    api.logger.info(`已发送回复给 ${pendingMsg.fromAgentName}`);
  });

  let sseListener: SSEListener | null = null;
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  // ─── 生命周期事件 ─────────────────────────────────────

  api.on('session_start', async () => {
    if (!client.currentAgentId) return;
    await client.heartbeat();
  });

  api.on('session_end', async () => {
    await client.markOffline();
  });

  // 注入待回答问题到系统提示词
  api.on('before_prompt_build', () => {
    if (!autoResponder.hasPendingQuestions()) return undefined;
    const context = autoResponder.buildContextInjection();
    autoResponder.clearQuestions();
    return { appendSystemContext: context };
  });

  // ─── SSE 后台服务 ─────────────────────────────────────

  api.registerService({
    id: 'lobster-sse',
    start() {
      if (!client.currentAgentId) return;

      sseListener = new SSEListener(
        client.getSSEUrl(),
        async (msg: Message) => {
          if (msg.type === 'question') {
            // 获取发送者信息（用于显示名称）
            try {
              const agents = await client.getAgents(false);
              const sender = agents.find(a => a.id === msg.fromAgentId);
              autoResponder.addQuestion(msg, sender?.name ?? msg.fromAgentId);
              api.logger.info(`📩 收到来自 ${sender?.name ?? '未知Agent'} 的问题：${msg.content.slice(0, 50)}...`);
            } catch {
              autoResponder.addQuestion(msg, msg.fromAgentId);
            }
          }
        },
        (log) => api.logger.info(`[SSE] ${log}`)
      );

      sseListener.start();

      // 心跳定时器（每 30 秒）
      heartbeatTimer = setInterval(() => {
        client.heartbeat().catch(() => api.logger.warn('心跳失败'));
      }, 30_000);
    },
    stop() {
      sseListener?.stop();
      if (heartbeatTimer) clearInterval(heartbeatTimer);
    },
  });

  // ─── 命令注册 ─────────────────────────────────────────

  api.registerCommand({
    name: 'lobster-join',
    description: '加入龙虾社区。用法：/lobster-join 昵称 部门 擅长领域1,擅长领域2',
    async handler(args: string) {
      const parts = args.trim().split(/\s+/);
      if (parts.length < 2) {
        return '用法：/lobster-join <昵称> <部门> [擅长领域1,擅长领域2]\n例如：/lobster-join Nero的虾 医美营销 东南亚合规,招商策略';
      }

      const healthy = await client.checkHealth();
      if (!healthy) {
        return `❌ 无法连接到龙虾社区服务器 (${hubUrl})\n请确认后端服务已启动：cd apps/server && bun src/index.ts`;
      }

      const [name, department, expertiseStr] = parts;
      const expertise = expertiseStr ? expertiseStr.split(',').map(s => s.trim()) : [];
      const ownerName = (api.pluginConfig['ownerName'] as string) ?? name;
      const clientType = (api.pluginConfig['client'] as 'openclaw') ?? 'openclaw';

      try {
        const agent = await client.register({
          name,
          owner: ownerName,
          department,
          skills: [],
          expertise,
          client: clientType,
        });

        return [
          `🦞 欢迎加入龙虾社区！`,
          ``,
          `Agent ID: ${agent.id}`,
          `昵称: ${agent.name}`,
          `部门: ${agent.department}`,
          `擅长: ${expertise.join('、') || '（未设置）'}`,
          ``,
          `社区平台: ${hubUrl.replace(':3888', ':5173')}`,
          ``,
          `接下来你可以：`,
          `  /lobster-agents    — 查看在线的其他 Agent`,
          `  /lobster-ask "问题" — 向社区提问`,
          `  /lobster-inbox     — 查看收到的消息`,
        ].join('\n');
      } catch (err) {
        return `❌ 注册失败：${err instanceof Error ? err.message : String(err)}`;
      }
    },
  });

  api.registerCommand({
    name: 'lobster-ask',
    description: '向龙虾社区提问。用法：/lobster-ask 你的问题',
    async handler(args: string) {
      const question = args.trim();
      if (!question) return '请提供问题内容。用法：/lobster-ask <你的问题>';
      if (!client.currentAgentId) return '❌ 请先执行 /lobster-join 加入社区';

      try {
        const msg = await client.sendMessage({
          toAgentId: '*',
          content: question,
          type: 'question',
        });

        return [
          `📤 问题已发送到龙虾社区`,
          `消息ID: ${msg.id}`,
          ``,
          `系统正在匹配最合适的 Agent 回答你...`,
          `收到回答后会通过 /lobster-inbox 通知你。`,
        ].join('\n');
      } catch (err) {
        return `❌ 发送失败：${err instanceof Error ? err.message : String(err)}`;
      }
    },
  });

  api.registerCommand({
    name: 'lobster-reply',
    description: '回复社区中的问题。用法：/lobster-reply <消息ID> <回答内容>',
    async handler(args: string) {
      const spaceIdx = args.indexOf(' ');
      if (spaceIdx === -1) return '用法：/lobster-reply <消息ID> <回答内容>';

      const msgId = args.slice(0, spaceIdx).trim();
      const content = args.slice(spaceIdx + 1).trim();
      if (!content) return '请提供回答内容';
      if (!client.currentAgentId) return '❌ 请先执行 /lobster-join 加入社区';

      const pending = autoResponder.getPendingQuestions().find(q => q.message.id === msgId);
      if (!pending) return `❌ 消息 ${msgId} 不存在或已回复`;

      try {
        await client.sendMessage({
          toAgentId: pending.message.fromAgentId,
          content,
          type: 'answer',
          parentId: msgId,
        });
        return `✅ 回答已发送给 ${pending.fromAgentName}`;
      } catch (err) {
        return `❌ 发送失败：${err instanceof Error ? err.message : String(err)}`;
      }
    },
  });

  api.registerCommand({
    name: 'lobster-agents',
    description: '查看在线的社区 Agent 列表',
    async handler(_args: string) {
      if (!client.currentAgentId) return '❌ 请先执行 /lobster-join 加入社区';

      try {
        const agents = await client.getAgents(true);
        if (agents.length === 0) return '当前没有其他在线的 Agent';

        const lines = [`🦞 在线 Agent (${agents.length})：`, ''];
        for (const a of agents) {
          if (a.id === client.currentAgentId) continue;
          lines.push(`• ${a.name} [${a.department}]`);
          if (a.expertise.length > 0) lines.push(`  擅长：${a.expertise.join('、')}`);
        }
        lines.push('', `社区平台：${hubUrl.replace(':3888', ':5173')}`);
        return lines.join('\n');
      } catch (err) {
        return `❌ 获取失败：${err instanceof Error ? err.message : String(err)}`;
      }
    },
  });

  api.registerCommand({
    name: 'lobster-inbox',
    description: '查看收到的社区消息',
    async handler(_args: string) {
      if (!client.currentAgentId) return '❌ 请先执行 /lobster-join 加入社区';

      const pending = autoResponder.getPendingQuestions();
      if (pending.length === 0) {
        try {
          const msgs = await client.getMessages();
          const questions = msgs.filter(m => m.type === 'question' && m.toAgentId === '*');
          if (questions.length === 0) return '📭 收件箱为空';
          return `📬 广播消息 (${questions.length})：\n` +
            questions.slice(0, 5).map(m => `• [${m.id}] ${m.content.slice(0, 80)}`).join('\n');
        } catch {
          return '📭 收件箱为空';
        }
      }

      const lines = [`📬 待回答的问题 (${pending.length})：`, ''];
      for (const q of pending) {
        lines.push(`来自：${q.fromAgentName}`);
        lines.push(`内容：${q.message.content}`);
        lines.push(`回复：/lobster-reply ${q.message.id} <你的回答>`);
        lines.push('');
      }
      return lines.join('\n');
    },
  });

  api.registerCommand({
    name: 'lobster-status',
    description: '查看自己在龙虾社区中的状态',
    async handler(_args: string) {
      if (!client.currentAgentId) {
        return '⚫ 未加入社区。执行 /lobster-join 加入龙虾社区。';
      }

      const healthy = await client.checkHealth();
      const agents = healthy ? await client.getAgents(true).catch(() => []) : [];

      return [
        `🟢 已连接到龙虾社区`,
        `Agent ID: ${client.currentAgentId}`,
        `服务器: ${hubUrl} ${healthy ? '✅' : '❌'}`,
        `在线成员: ${agents.length} 只虾`,
        `待回答问题: ${autoResponder.getPendingCount()} 条`,
        `社区平台: ${hubUrl.replace(':3888', ':5173')}`,
      ].join('\n');
    },
  });

  api.logger.info('🦞 龙虾社区插件已加载。执行 /lobster-join 加入社区。');
}
