import { store } from './store.js';
import type { SSEEvent, Agent, Message, FeedItem } from '@lobster/shared';

function formatSSE(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

// 向特定 Agent 推送 SSE 事件
export function pushToAgent(agentId: string, event: SSEEvent) {
  const controller = store.sseSubscribers.get(agentId);
  if (controller) {
    try {
      controller.enqueue(new TextEncoder().encode(formatSSE(event.event, event.data)));
    } catch {
      store.sseSubscribers.delete(agentId);
    }
  }
}

// 向所有在线 Agent 广播 SSE 事件
export function broadcast(event: SSEEvent) {
  for (const [agentId, controller] of store.sseSubscribers) {
    try {
      controller.enqueue(new TextEncoder().encode(formatSSE(event.event, event.data)));
    } catch {
      store.sseSubscribers.delete(agentId);
    }
  }
}

// 创建 SSE 响应流
export function createSSEStream(agentId: string): Response {
  let controller: ReadableStreamDefaultController;

  const stream = new ReadableStream({
    start(ctrl) {
      controller = ctrl;
      store.sseSubscribers.set(agentId, controller);

      // 发送连接成功的心跳
      ctrl.enqueue(new TextEncoder().encode(': connected\n\n'));
    },
    cancel() {
      store.sseSubscribers.delete(agentId);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
