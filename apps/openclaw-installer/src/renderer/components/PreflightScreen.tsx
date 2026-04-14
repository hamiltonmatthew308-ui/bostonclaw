import { useEffect, useState } from 'react';
import {
  Monitor,
  Hexagon,
  FileCode,
  HardDrive,
  Cpu,
  Terminal,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';
import { useInstallerStore } from '../store';
import { useInstaller } from '../hooks/useInstaller';
import { StepActions } from './ui/StepActions';

export function PreflightScreen() {
  const selectedPath = useInstallerStore((s) => s.selectedPath);
  const envReport = useInstallerStore((s) => s.envReport);
  const setEnvReport = useInstallerStore((s) => s.setEnvReport);
  const setPlan = useInstallerStore((s) => s.setPlan);
  const setStep = useInstallerStore((s) => s.setStep);
  const planObj = useInstallerStore((s) => s.plan);
  const planWarnings = planObj?.warnings ?? [];
  const winExperimentalNative = useInstallerStore((s) => s.winExperimentalNative);
  const setWinExperimentalNative = useInstallerStore((s) => s.setWinExperimentalNative);
  const { checkEnv, plan } = useInstaller();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!envReport && selectedPath) {
      setLoading(true);
      checkEnv(selectedPath)
        .then((report) => {
          setEnvReport(report);
          return plan(selectedPath, { experimentalWinNative: winExperimentalNative });
        })
        .then((p) => setPlan(p))
        .finally(() => setLoading(false));
    }
  }, [envReport, selectedPath, checkEnv, plan, setEnvReport, setPlan, winExperimentalNative]);

  const items = [
    {
      label: '操作系统',
      icon: <Monitor size={18} />,
      value: envReport
        ? `${envReport.os.platform} ${envReport.os.arch} (${envReport.os.version})`
        : '检测中...',
      ok: true,
    },
    {
      label: 'Node.js',
      icon: <Hexagon size={18} />,
      value: envReport
        ? envReport.nodejs.installed
          ? `已安装 ${envReport.nodejs.version}`
          : '未安装'
        : '检测中...',
      ok: envReport ? envReport.nodejs.installed : true,
    },
    {
      label: 'Python',
      icon: <FileCode size={18} />,
      value: envReport
        ? envReport.python.installed
          ? `已安装 ${envReport.python.version}`
          : '未安装'
        : '检测中...',
      ok: envReport ? envReport.python.installed : true,
    },
    {
      label: '可用磁盘',
      icon: <HardDrive size={18} />,
      value: envReport ? `${envReport.diskFreeGB.toFixed(1)} GB` : '检测中...',
      ok: true,
    },
    ...(envReport?.gpu
      ? [
          {
            label: 'GPU',
            icon: <Cpu size={18} />,
            value: `${envReport.gpu.name} (${envReport.gpu.vramMB} MB VRAM)`,
            ok: true,
          },
        ]
      : []),
    ...(envReport?.os.platform === 'win'
      ? [
          {
            label: 'WSL2',
            icon: <Terminal size={18} />,
            value: envReport.wsl2 ? '已启用' : '未启用',
            ok: envReport.wsl2 ?? true,
          },
        ]
      : []),
  ];

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#6F655B' }}>
          <Loader2 size={18} className="animate-spin" />
          正在检测环境...
        </div>
      )}

      <div style={{ display: 'grid', gap: 12 }}>
        {items.map((item) => (
          <div
            key={item.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '14px 16px',
              background: '#F4F1EC',
              border: '1px solid #DDDDD8',
            }}
          >
            <div style={{ color: '#6F655B' }}>{item.icon}</div>
            <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#1B1712' }}>
              {item.label}
            </div>
            <div style={{ fontSize: 13, color: '#2A241E' }}>{item.value}</div>
            <div style={{ color: item.ok ? '#1A7A4A' : '#D4401A' }}>
              {item.ok ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
            </div>
          </div>
        ))}
      </div>

      {planWarnings.length > 0 && (
        <div
          style={{
            padding: 14,
            background: 'rgba(234, 179, 8, 0.12)',
            border: '1.5px solid rgba(234, 179, 8, 0.35)',
            color: '#854d0e',
            fontSize: 13,
            lineHeight: 1.7,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <AlertTriangle size={16} />
            <span style={{ fontWeight: 700 }}>注意</span>
          </div>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {planWarnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {envReport?.os.platform === 'win' && !envReport.wsl2 && selectedPath === 'openclaw' && (
        <label
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            padding: 12,
            background: 'rgba(212,64,26,0.06)',
            border: '1.5px solid rgba(212,64,26,0.25)',
            borderRadius: 0,
            cursor: 'pointer',
            fontSize: 13,
            color: '#5c2412',
          }}
        >
          <input
            type="checkbox"
            checked={winExperimentalNative}
            onChange={(e) => {
              const checked = e.target.checked;
              setWinExperimentalNative(checked);
              // Re-plan so warnings/steps reflect the experimental switch.
              if (selectedPath) {
                setLoading(true);
                plan(selectedPath, { experimentalWinNative: checked })
                  .then((p) => setPlan(p))
                  .finally(() => setLoading(false));
              } else if (planObj) {
                setPlan({ ...planObj, experimentalWinNative: checked });
              }
            }}
            style={{ marginTop: 2 }}
          />
          <div>
            <div style={{ fontWeight: 700, marginBottom: 2 }}>启用实验性原生 Windows 安装</div>
            <div style={{ fontSize: 12, opacity: 0.9 }}>
              不经过 WSL2，直接在 Windows 上安装 Node 与 OpenClaw。此路径兼容性未知，仅供测试，遇到问题请改用 WSL2 或厂商封装版。
            </div>
          </div>
        </label>
      )}

      <StepActions
        onPrev={() => setStep('quiz')}
        onNext={() => setStep('provider')}
        nextLabel="开始安装"
        nextDisabled={loading || !envReport}
      />
    </div>
  );
}
