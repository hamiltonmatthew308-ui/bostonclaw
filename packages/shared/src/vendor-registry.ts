import type { VendorInfo } from './types.js';

export const VENDOR_REGISTRY: VendorInfo[] = [
  {
    id: 'qclaw',
    name: 'QClaw',
    vendor: '腾讯',
    downloadUrl: 'https://qclaw.ai/download',
    description: '腾讯出品，深度集成微信生态，适合需要企业微信协同的团队。',
    features: ['微信/企业微信原生集成', '腾讯混元模型', 'QQ频道接入', '腾讯云部署'],
    requiresPlan: true,
    planInfo: '基础功能免费，企业版需腾讯云订阅',
    platforms: ['mac', 'win', 'linux'],
  },
  {
    id: 'arkclaw',
    name: 'ArkClaw',
    vendor: '字节跳动',
    downloadUrl: 'https://arkclaw.com/download',
    description: '字节跳动出品，内置豆包大模型，飞书/Lark 深度集成。',
    features: ['豆包/火山引擎模型', '飞书/Lark原生集成', '抖音/头条数据接入', '多模态理解'],
    requiresPlan: true,
    planInfo: '需要火山引擎 API Key，有免费额度',
    platforms: ['mac', 'win', 'linux'],
  },
  {
    id: 'autoclaw',
    name: 'AutoClaw',
    vendor: '智谱AI',
    downloadUrl: 'https://autoclaw.cn/download',
    description: '智谱出品，内置 GLM 系列模型，中文能力最强，免费额度充足。',
    features: ['GLM-5 系列模型', '中文理解能力突出', '免费额度充足', '智谱清言集成'],
    requiresPlan: false,
    platforms: ['mac', 'win', 'linux'],
  },
  {
    id: 'kimi-claw',
    name: 'Kimi Claw',
    vendor: '月之暗面',
    downloadUrl: 'https://kimi.moonshot.cn/claw',
    description: '月之暗面出品，超长上下文处理，适合文档密集型工作。',
    features: ['Kimi K2 模型', '200万字超长上下文', '文档批量处理', '联网搜索'],
    requiresPlan: false,
    platforms: ['mac', 'win', 'linux'],
  },
  {
    id: 'copaw',
    name: 'CoPaw',
    vendor: '阿里云',
    downloadUrl: 'https://copaw.aliyun.com/download',
    description: '阿里云出品，通义千问驱动，钉钉深度集成。',
    features: ['通义千问模型', '钉钉原生集成', '阿里云全栈接入', '电商数据理解'],
    requiresPlan: true,
    planInfo: '需要阿里云百炼 API Key，新用户有免费额度',
    platforms: ['mac', 'win', 'linux'],
  },
  {
    id: 'duclaw',
    name: 'DuClaw',
    vendor: '百度',
    downloadUrl: 'https://duclaw.baidu.com/download',
    description: '百度出品，文心一言驱动，搜索增强能力突出。',
    features: ['文心一言模型', '百度搜索增强', '中文知识图谱', '百度智能云集成'],
    requiresPlan: true,
    planInfo: '需要百度千帆 API Key，有免费试用',
    platforms: ['mac', 'win', 'linux'],
  },
  {
    id: 'maxclaw',
    name: 'MaxClaw',
    vendor: 'MiniMax',
    downloadUrl: 'https://maxclaw.minimaxi.com/download',
    description: 'MiniMax 出品，语音交互能力突出，适合客服和语音场景。',
    features: ['MiniMax-01 模型', '语音合成/识别', '多模态理解', '海螺AI集成'],
    requiresPlan: false,
    platforms: ['mac', 'win', 'linux'],
  },
];

export function getVendorById(id: string): VendorInfo | undefined {
  return VENDOR_REGISTRY.find((v) => v.id === id);
}

export function getVendorsByPlatform(platform: 'mac' | 'win' | 'linux'): VendorInfo[] {
  return VENDOR_REGISTRY.filter((v) => v.platforms.includes(platform));
}
