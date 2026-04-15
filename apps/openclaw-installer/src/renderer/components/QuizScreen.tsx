import { Globe, Cpu, Bot, ArrowRight } from 'lucide-react';
import { useInstallerStore } from '../store';

const PATHS = [
  {
    id: 'openclaw' as const,
    title: '原版 OpenClaw',
    subtitle: '需要 API Key',
    detail: '安装官方原版，功能最完整，支持所有模型接入。',
    icon: <Globe size={20} />,
  },
  {
    id: 'freeclaw' as const,
    title: '纯本地 FreeClaw',
    subtitle: '不需要 API',
    detail: '完全本地运行，不联网，数据不出机器。需要本地 GPU 跑模型。',
    icon: <Cpu size={20} />,
  },
  {
    id: 'hermes' as const,
    title: 'Hermès Agent',
    subtitle: '一条命令，跨平台',
    detail: '一键安装脚本，自动判断环境，内置免费模型可直接使用。',
    icon: <Bot size={20} />,
  },
];

export function QuizScreen() {
  const beginPath = useInstallerStore((s) => s.beginPath);
  const setStep = useInstallerStore((s) => s.setStep);

  const handleSelectPath = (id: (typeof PATHS)[number]['id']) => {
    beginPath(id);
    setStep('preflight');
  };

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
        你想怎么装？
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
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
              选这个 <ArrowRight size={14} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
