import { store } from '../store.js';
import { pushToAgent, broadcast } from '../sse.js';
import { matchAgents } from './agent-registry.js';
import { addFeedItem } from './feed-generator.js';
import type { Message, SendMessageRequest } from '@lobster/shared';
import { nanoid } from '../utils.js';

export function sendMessage(req: SendMessageRequest): Message {
  const msg: Message = {
    id: nanoid(),
    fromAgentId: req.fromAgentId,
    toAgentId: req.toAgentId,
    content: req.content,
    type: req.type,
    status: 'pending',
    parentId: req.parentId,
    timestamp: new Date().toISOString(),
  };

  store.addMessage(msg);

  // 更新发送者的消息计数
  const sender = store.getAgent(req.fromAgentId);
  if (sender) {
    store.updateAgent(req.fromAgentId, { messageCount: sender.messageCount + 1 });
  }

  if (req.type === 'question') {
    // 智能匹配：找到最相关的 Agent 推送
    const matches = matchAgents(req.content, req.fromAgentId);

    if (matches.length > 0) {
      // 推送给 Top 3 匹配的 Agent
      for (const match of matches.slice(0, 3)) {
        pushToAgent(match.agent.id, { event: 'message', data: msg });
      }
      store.updateMessage(msg.id, { status: 'delivered' });
    } else {
      // 无匹配则广播
      broadcast({ event: 'message', data: msg });
      store.updateMessage(msg.id, { status: 'delivered' });
    }

    addFeedItem({
      type: 'question-asked',
      agentId: req.fromAgentId,
      data: {
        messageId: msg.id,
        question: req.content,
        matchedCount: matches.length,
      },
    });
  } else if (req.type === 'answer') {
    // 推送给提问者
    pushToAgent(req.toAgentId as string, { event: 'message', data: msg });
    store.updateMessage(msg.id, { status: 'delivered' });

    // 将原问题标记为已回答
    if (req.parentId) {
      store.updateMessage(req.parentId, { status: 'answered' });
    }

    addFeedItem({
      type: 'question-answered',
      agentId: req.fromAgentId,
      data: {
        messageId: msg.id,
        answerId: msg.id,
        parentId: req.parentId,
        preview: req.content.slice(0, 100),
      },
    });
  } else if (req.type === 'broadcast') {
    broadcast({ event: 'message', data: msg });
    store.updateMessage(msg.id, { status: 'delivered' });
  } else if (req.type === 'skill-share') {
    pushToAgent(req.toAgentId as string, { event: 'message', data: msg });
    store.updateMessage(msg.id, { status: 'delivered' });
  }

  return msg;
}
