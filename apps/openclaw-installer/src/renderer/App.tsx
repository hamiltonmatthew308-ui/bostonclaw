import { useEffect } from 'react';
import { Sparkles, Cpu, KeyRound, Rocket, CheckCircle2 } from 'lucide-react';
import { useInstallerStore, type WizardStep } from './store';
import { WizardShell } from './components/WizardShell';
import { QuizScreen } from './components/QuizScreen';
import { PreflightScreen } from './components/PreflightScreen';
import { ProviderScreen } from './components/ProviderScreen';
import { ProgressScreen } from './components/ProgressScreen';
import { CompleteScreen } from './components/CompleteScreen';
import { InfoPanel } from './components/ui/InfoPanel';

const STEPS = [
  { id: 0, label: '选择路径', subtitle: '根据使用场景选择最适合的安装方式' },
  { id: 1, label: '环境检测', subtitle: '检查系统环境是否满足要求' },
  { id: 2, label: '模型接入', subtitle: '配置 AI Provider API Key' },
  { id: 3, label: '安装执行', subtitle: '下载并安装运行时' },
  { id: 4, label: '完成', subtitle: '安装完成，开始使用' },
] as const;

const STEP_ICONS = {
  0: Sparkles,
  1: Cpu,
  2: KeyRound,
  3: Rocket,
  4: CheckCircle2,
} as const;

const STEP_MAP: Record<WizardStep, number> = {
  quiz: 0,
  preflight: 1,
  provider: 2,
  execute: 3,
  complete: 4,
};

function App() {
  const currentStep = useInstallerStore((s) => s.currentStep);
  const selectedPath = useInstallerStore((s) => s.selectedPath);
  const envReport = useInstallerStore((s) => s.envReport);
  const setStep = useInstallerStore((s) => s.setStep);
  const isExecuting = useInstallerStore((s) => s.isExecuting);
  const beginPath = useInstallerStore((s) => s.beginPath);
  const setAutoStart = useInstallerStore((s) => s.setAutoStart);

  // Auto-start: launch directly into installation, no manual choices needed
  useEffect(() => {
    if (selectedPath || isExecuting) return; // already started or running

    // Hermes is the default: fully automatic, no API key needed
    beginPath('hermes');
    setAutoStart(true);
    setStep('preflight');
  }, [beginPath, setStep, setAutoStart, selectedPath, isExecuting]);

  // Deep link 监听：网页一键唤起时自动选择路径
  useEffect(() => {
    const validPaths = ['openclaw', 'freeclaw', 'hermes'];
    const unsubscribe = window.electron.ipcRenderer.on('deep-link:trigger', (data: unknown) => {
      const { path, auto } = data as { path: string; auto: boolean };
      if (!validPaths.includes(path)) return;
      if (isExecuting) return; // 安装进行中，不干扰

      beginPath(path as any);
      if (auto) setAutoStart(true);
      setStep('preflight');
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
      else window.electron.ipcRenderer.off('deep-link:trigger');
    };
  }, [beginPath, setStep, setAutoStart, isExecuting]);


  const sidebarSupplement = (
    <div style={{ display: 'grid', gap: 12, paddingBottom: 14 }}>
      <InfoPanel title="当前路径">
        <div style={{ fontSize: 13, color: '#2A241E' }}>
          {selectedPath ? (
            <span style={{ fontWeight: 700, textTransform: 'uppercase' }}>{selectedPath}</span>
          ) : (
            '尚未选择'
          )}
        </div>
      </InfoPanel>

      <InfoPanel title="平台信息">
        <div style={{ fontSize: 13, color: '#2A241E' }}>
          {window.electron.platform === 'darwin'
            ? 'macOS'
            : window.electron.platform === 'win32'
              ? 'Windows'
              : window.electron.platform === 'linux'
                ? 'Linux'
                : '未知平台'}
        </div>
      </InfoPanel>

      {envReport && (
        <InfoPanel title="环境摘要">
          <div style={{ display: 'grid', gap: 6, fontSize: 12, color: '#6F655B' }}>
            <div>Node: {envReport.nodejs.installed ? '✓' : '✗'}</div>
            <div>Python: {envReport.python.installed ? '✓' : '✗'}</div>
            <div>磁盘: {envReport.diskFreeGB.toFixed(1)} GB</div>
          </div>
        </InfoPanel>
      )}
    </div>
  );

  const renderScreen = () => {
    switch (currentStep) {
      case 'quiz':
        return <QuizScreen />;
      case 'preflight':
        return <PreflightScreen />;
      case 'provider':
        return <ProviderScreen />;
      case 'execute':
        return <ProgressScreen />;
      case 'complete':
        return <CompleteScreen />;
      default:
        return <QuizScreen />;
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        padding: 24,
        background:
          'radial-gradient(circle at top left, rgba(212, 64, 26, 0.08), transparent 24%), linear-gradient(180deg, #f7f1e8 0%, #f3ede4 100%)',
        display: 'grid',
        placeItems: 'center',
      }}
    >
      <WizardShell
        steps={STEPS.map((step) => ({ ...step }))}
        currentStep={STEP_MAP[currentStep]}
        stepIcons={STEP_ICONS}
        sidebarSupplement={sidebarSupplement}
        headerKicker="Bostonclaw Installer"
        onBack={
          currentStep === 'quiz'
            ? undefined
            : () => {
                if (currentStep === 'execute' && isExecuting) return;
                if (currentStep === 'provider') return setStep('preflight');
                if (currentStep === 'execute') {
                  // openclaw 经过 provider；freeclaw/hermes 跳过 provider
                  return setStep(selectedPath === 'openclaw' ? 'provider' : 'preflight');
                }
                // preflight/complete -> back to start
                return setStep('quiz');
              }
        }
        backDisabled={currentStep === 'execute' && isExecuting}
        backLabel={currentStep === 'complete' ? '← 返回起点' : '← 返回'}
      >
        {renderScreen()}
      </WizardShell>
    </div>
  );
}

export default App;
