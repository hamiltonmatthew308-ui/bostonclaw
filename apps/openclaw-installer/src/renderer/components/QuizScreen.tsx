import { useState } from 'react';
import { Building2, Globe, Cpu, Bot, ArrowRight } from 'lucide-react';
import { useInstallerStore } from '../store';
import { VendorList } from './VendorList';

const PATHS = [
  {
    id: 'vendor' as const,
    title: '大厂封装版',
    subtitle: 'Path A',
    detail: '选择已封装好的企业级发行版，开箱即用，含专属技术支持。',
    icon: <Building2 size={20} />,
  },
  {
    id: 'openclaw' as const,
    title: '原版 OpenClaw',
    subtitle: 'Path B',
    detail: '安装官方原版，获取最完整的社区功能与最新更新。',
    icon: <Globe size={20} />,
  },
  {
    id: 'freeclaw' as const,
    title: '纯本地 FreeClaw',
    subtitle: 'Path C',
    detail: '完全本地运行，不依赖云端，适合对数据安全要求极高的环境。',
    icon: <Cpu size={20} />,
  },
  {
    id: 'hermes' as const,
    title: 'Hermès Agent',
    subtitle: 'Path D',
    detail: '轻量 Agent 模式，作为后台服务运行，与其他系统集成。',
    icon: <Bot size={20} />,
  },
];

export function QuizScreen() {
  const [showVendors, setShowVendors] = useState(false);
  const beginPath = useInstallerStore((s) => s.beginPath);
  const setVendorId = useInstallerStore((s) => s.setVendorId);
  const setRunResult = useInstallerStore((s) => s.setRunResult);
  const setStep = useInstallerStore((s) => s.setStep);

  const handleSelectPath = (id: (typeof PATHS)[number]['id']) => {
    beginPath(id);
    if (id === 'vendor') {
      setShowVendors(true);
    } else if (id === 'hermes') {
      const isWin = window.electron.platform === 'win32';
      setRunResult({
        success: true,
        message: isWin
          ? 'Hermes Agent 原生 Windows 暂不支持，建议使用 WSL2 或参考安装指南。'
          : 'Hermes Agent 可通过源码安装，请查看官方指南。',
        nextAction: 'show-guide',
        nextUrl: 'https://github.com/NousResearch/hermes-agent#quick-install',
      });
      setStep('complete');
    } else if (id === 'freeclaw') {
      setRunResult({
        success: true,
        message:
          'FreeClaw 路径属于“本地模型 + 本地 Agent”方案，通常需要安装 Ollama 并下载模型（耗时且对硬件有要求）。当前版本先提供 FreeClaw 安装指南。',
        nextAction: 'show-guide',
        nextUrl: 'https://github.com/wangdali-dev/FreeClaw',
      });
      setStep('complete');
    } else {
      setStep('preflight');
    }
  };

  const handleVendorSelect = (vendorId: string) => {
    setVendorId(vendorId);
    setRunResult({
      success: true,
      message: `已跳转 ${vendorId} 下载页面。请在外部浏览器中完成下载和安装。`,
      nextAction: 'show-guide',
      nextUrl: 'https://lobster.community/download',
    });
    setStep('complete');
  };

  if (showVendors) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setShowVendors(false)}
          className="lobster-control"
          style={{
            marginBottom: 20,
            padding: '8px 14px',
            border: '2px solid #2A241E',
            background: '#FDFCF9',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          ← 返回
        </button>
        <VendorList onSelect={handleVendorSelect} />
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div
        style={{
          fontFamily: "'DM Serif Display', Georgia, serif",
          fontSize: 22,
          color: '#1B1712',
          marginBottom: 4,
        }}
      >
        请选择你的安装路径
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {PATHS.map((path) => (
          <button
            key={path.id}
            type="button"
            onClick={() => handleSelectPath(path.id)}
            className="lobster-choice-card lobster-control"
            style={{
              textAlign: 'left',
              border: '2px solid #DDDDD8',
              background: '#F4F1EC',
              padding: 22,
              cursor: 'pointer',
              color: '#0F0F0E',
              boxShadow: '3px 3px 0 #DDDDD8',
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                display: 'grid',
                placeItems: 'center',
                background: '#DDDDD8',
                color: '#666666',
                marginBottom: 14,
              }}
            >
              {path.icon}
            </div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                fontFamily: "'Instrument Sans', sans-serif",
                color: '#0F0F0E',
                letterSpacing: '-0.01em',
                marginBottom: 4,
              }}
            >
              {path.title}
            </div>
            <div
              style={{
                fontSize: 11,
                color: '#999999',
                marginBottom: 10,
                fontFamily: "'IBM Plex Mono', monospace",
                letterSpacing: '0.02em',
              }}
            >
              {path.subtitle}
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.7, color: '#666666' }}>{path.detail}</div>

            <div
              style={{
                marginTop: 16,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                fontWeight: 700,
                color: '#D4401A',
              }}
            >
              选择此路径 <ArrowRight size={14} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
