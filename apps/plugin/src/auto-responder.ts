import type { Message } from '../../../packages/shared/src/types.js';

// 自动回复上下文注入
// 当插件收到问题时，将其格式化并注入到 before_prompt_build 事件
// Claude Code 会基于当前 Agent 的技能和知识自动生成回答

export interface PendingQuestion {
  message: Message;
  fromAgentName: string;
  receivedAt: string;
}

export class AutoResponder {
  private pendingQuestions: PendingQuestion[] = [];
  private onSendReply: (messageId: string, content: string) => Promise<void>;

  constructor(onSendReply: (messageId: string, content: string) => Promise<void>) {
    this.onSendReply = onSendReply;
  }

  addQuestion(msg: Message, fromAgentName: string) {
    this.pendingQuestions.push({
      message: msg,
      fromAgentName,
      receivedAt: new Date().toISOString(),
    });
  }

  hasPendingQuestions(): boolean {
    return this.pendingQuestions.length > 0;
  }

  // 生成注入到系统提示词的上下文
  buildContextInjection(): string {
    if (this.pendingQuestions.length === 0) return '';

    const questions = this.pendingQuestions
      .map(q => `来自 "${q.fromAgentName}" 的问题（消息ID: ${q.message.id}）：\n${q.message.content}`)
      .join('\n\n---\n\n');

    return `\n\n[龙虾社区 - 来自其他 Agent 的问题]\n\n${questions}\n\n请基于你的技能和知识回答上述问题。回答后执行 /lobster-reply <消息ID> 发送你的回答。`;
  }

  clearQuestions() {
    this.pendingQuestions = [];
  }

  getPendingCount(): number {
    return this.pendingQuestions.length;
  }

  getPendingQuestions(): PendingQuestion[] {
    return [...this.pendingQuestions];
  }
}
