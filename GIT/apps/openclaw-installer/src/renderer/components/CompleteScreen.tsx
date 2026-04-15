import { CheckCircle2, XCircle, ArrowRight, Globe } from 'lucide-react';
import { useInstallerStore } from '../store';
import { useInstaller } from '../hooks/useInstaller';

export function CompleteScreen() {
  const runResult = useInstallerStore((s) => s.runResult);
  const setStep = useInstallerStore((s) => s.setStep);
  const reset = useInstallerStore((s) => s.reset);
  const { openExternal } = useInstaller();

  const handlePrimaryAction = () => {
    if (!runResult) return;
    if (runResult.nextUrl) {
      openExternal(runResult.nextUrl);
    }
  };

  const getButtonLabel = () => {
    if (!runResult?.success) return '重试';
    switch (runResult.nextAction) {
      case 'open-browser':
        return '打开控制台';
      case 'open-app':
        return '打开应用';
      case 'show-guide':
        return '查看指南';
      default:
        return '完成';
    }
  };

  if (!runResult) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: 16, color: '#6F655B' }}>暂无安装结果</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        {runResult.success ? (
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'rgba(26,122,74,0.12)',
              color: '#1A7A4A',
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 16px',
            }}
          >
            <CheckCircle2 size={32} />
          </div>
        ) : (
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'rgba(212,64,26,0.12)',
              color: '#D4401A',
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 16px',
            }}
          >
            <XCircle size={32} />
          </div>
        )}
        <div
          style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: 26,
            color: '#1B1712',
            marginBottom: 8,
          }}
        >
          {runResult.success ? '安装完成' : '安装失败'}
        </div>
        <div style={{ fontSize: 14, color: '#6F655B', lineHeight: 1.7 }}>{runResult.message}</div>
      </div>

      {!runResult.success && runResult.logs && runResult.logs.length > 0 && (
        <div
          style={{
            background: '#0F0F0E',
            color: '#E5E5E5',
            padding: 14,
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 11,
            lineHeight: 1.6,
            maxHeight: 160,
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
          }}
        >
          {runResult.logs.join('\n')}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
        <button
          type="button"
          onClick={() => openExternal('https://lobster.community')}
          className="lobster-control"
          style={{
            padding: '12px 20px',
            border: '2px solid #2A241E',
            background: '#FDFCF9',
            color: '#2A241E',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Globe size={15} />
          访问社区网站
        </button>

        <button
          type="button"
          onClick={
            runResult.success
              ? handlePrimaryAction
              : () => {
                  reset();
                  setStep('quiz');
                }
          }
          className="lobster-control"
          style={{
            padding: '12px 24px',
            border: 'none',
            background: runResult.success ? '#1A7A4A' : '#D4401A',
            color: '#fff',
            fontSize: 13,
            fontWeight: 800,
            fontFamily: "'Archivo Black', sans-serif",
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            boxShadow: '4px 4px 0 #0F0F0E',
          }}
        >
          {getButtonLabel()}
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}
