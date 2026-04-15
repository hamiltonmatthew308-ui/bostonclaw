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
  const setRunResult = useInstallerStore((s) => s.setRunResult);

  useEffect(() => {
    if (currentStep === 'preflight' && selectedPath === 'freeclaw') {
      const isWin = window.electron.platform === 'win32';
      if (!isWin) {
        setRunResult({
          success: false,
          message: 'FreeClaw 目前仅支持 Windows 平台。',
          nextAction: 'none',
        });
        setStep('complete');
      }
    }
  }, [currentStep, selectedPath, setRunResult, setStep]);

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
        headerKicker="Lobster Installer"
      >
        {renderScreen()}
      </WizardShell>
    </div>
  );
}

export default App;
