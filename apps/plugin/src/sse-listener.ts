import type { Message } from '../../../packages/shared/src/types.js';

type MessageHandler = (msg: Message) => void;

export class SSEListener {
  private url: string;
  private onMessage: MessageHandler;
  private onLog: (msg: string) => void;
  private abortController: AbortController | null = null;
  private reconnectDelay = 1000;
  private maxReconnectDelay = 30_000;
  private stopped = false;

  constructor(url: string, onMessage: MessageHandler, onLog: (msg: string) => void) {
    this.url = url;
    this.onMessage = onMessage;
    this.onLog = onLog;
  }

  start() {
    this.stopped = false;
    this.connect();
  }

  stop() {
    this.stopped = true;
    this.abortController?.abort();
  }

  private async connect() {
    if (this.stopped) return;

    this.abortController = new AbortController();

    try {
      const res = await fetch(this.url, {
        signal: this.abortController.signal,
        headers: { Accept: 'text/event-stream' },
      });

      if (!res.ok || !res.body) throw new Error(`SSE 连接失败: ${res.status}`);

      this.reconnectDelay = 1000; // 重置重连延迟
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        let event = '';
        let data = '';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            event = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            data = line.slice(6).trim();
          } else if (line === '') {
            if (event === 'message' && data) {
              try {
                const msg = JSON.parse(data) as Message;
                this.onMessage(msg);
              } catch { /* 忽略解析错误 */ }
            }
            event = '';
            data = '';
          }
        }
      }
    } catch (err) {
      if (this.stopped) return;
      this.onLog(`SSE 断线，${this.reconnectDelay / 1000}s 后重连...`);
    }

    if (!this.stopped) {
      setTimeout(() => this.connect(), this.reconnectDelay);
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
    }
  }
}
