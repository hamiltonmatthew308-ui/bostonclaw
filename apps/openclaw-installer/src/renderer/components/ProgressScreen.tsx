import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, CheckCircle2, XCircle, ClipboardCopy, ListChecks } from 'lucide-react';
import { useInstallerStore } from '../store';
import { useInstaller } from '../hooks/useInstaller';

export function ProgressScreen() {
  const selectedPath = useInstallerStore((s) => s.selectedPath);
  const plan = useInstallerStore((s) => s.plan);
  const progress = useInstallerStore((s) => s.progress);
  const isExecuting = useInstallerStore((s) => s.isExecuting);
  const runResult = useInstallerStore((s) => s.runResult);
  const setProgress = useInstallerStore((s) => s.setProgress);
  const setExecuting = useInstallerStore((s) => s.setExecuting);
  const setRunResult = useInstallerStore((s) => s.setRunResult);
  const setStep = useInstallerStore((s) => s.setStep);
  const logsRef = useRef<HTMLDivElement>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const { run } = useInstaller();

  const stepLabels = useMemo(() => plan?.steps?.map((s) => s.label) ?? [], [plan?.steps]);

  useEffect(() => {
    if (progress?.log) {
      setLogs((prev) => [...prev, progress.log]);
    }
  }, [progress?.log]);

  useEffect(() => {
    let cancelled = false;
    if (!selectedPath || !plan) return;
    if (isExecuting || runResult) return;

    setExecuting(true);
    setRunResult(null);
    setProgress({ step: '开始执行', percent: 0, log: '启动安装流程...' });

    run(selectedPath, plan, (p) => {
      if (!cancelled) setProgress(p);
    })
      .then((result) => {
        if (cancelled) return;
        setRunResult(result);
        setStep('complete');
      })
      .catch((err) => {
        if (cancelled) return;
        setRunResult({
          success: false,
          message: err instanceof Error ? err.message : String(err),
          nextAction: 'none',
        });
        setStep('complete');
      })
      .finally(() => {
        if (!cancelled) setExecuting(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    selectedPath,
    plan,
    isExecuting,
    runResult,
    run,
    setExecuting,
    setProgress,
    setRunResult,
    setStep,
  ]);

  useEffect(() => {
    if (logsRef.current) {
      logsRef.current.scrollTop = logsRef.current.scrollHeight;
    }
  }, [logs]);

  const handleCopyLogs = async () => {
    try {
      await navigator.clipboard.writeText(logs.join('\n'));
    } catch {
      // ignore
    }
  };

  return (
    <div style={{ display: 'grid', gap: 20, height: '100%' }}>
      <div>
        <div
          style={{
            height: 10,
            background: '#D8CEC1',
            overflow: 'hidden',
            marginBottom: 12,
          }}
        >
          <div
            style={{
              height: '100%',
              background: '#D4401A',
              width: `${progress?.percent ?? 0}%`,
              transition: 'width 0.3s cubic-bezier(0.16,1,0.3,1)',
            }}
          />
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 13,
            color: '#6F655B',
          }}
        >
          <span>{progress?.step || '准备中...'}</span>
          <span>{progress?.percent ?? 0}%</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16, flex: 1, minHeight: 0 }}>
        <div
          style={{
            border: '1px solid #DDDDD8',
            background: '#F4F1EC',
            padding: 14,
            minHeight: 0,
            overflow: 'auto',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 12,
              fontWeight: 800,
              color: '#2A241E',
              marginBottom: 10,
              fontFamily: "'IBM Plex Mono', monospace",
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            <ListChecks size={14} />
            Steps
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            {stepLabels.length > 0 ? (
              stepLabels.map((label, idx) => (
                <div
                  key={`${label}-${idx}`}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    fontSize: 13,
                    lineHeight: 1.5,
                    color: '#1B1712',
                  }}
                >
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      marginTop: 1,
                      display: 'grid',
                      placeItems: 'center',
                      border: '2px solid #2A241E',
                      background:
                        (progress?.percent ?? 0) >= 100
                          ? 'rgba(26,122,74,0.12)'
                          : idx === 0
                            ? 'rgba(212,64,26,0.10)'
                            : '#FDFCF9',
                      color: (progress?.percent ?? 0) >= 100 ? '#1A7A4A' : '#D4401A',
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 11,
                      fontWeight: 800,
                    }}
                  >
                    {idx + 1}
                  </div>
                  <div>{label}</div>
                </div>
              ))
            ) : (
              <div style={{ fontSize: 12, color: '#6F655B' }}>没有步骤信息</div>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr', minHeight: 0, gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 12, color: '#6F655B' }}>
              {selectedPath ? `PATH: ${selectedPath}` : 'PATH: -'}
            </div>
            <button
              type="button"
              onClick={handleCopyLogs}
              className="lobster-control"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                border: '2px solid #2A241E',
                background: '#FDFCF9',
                fontSize: 12,
                fontWeight: 800,
                cursor: logs.length ? 'pointer' : 'not-allowed',
                opacity: logs.length ? 1 : 0.55,
              }}
              disabled={!logs.length}
            >
              <ClipboardCopy size={14} />
              复制日志
            </button>
          </div>

          <div
            ref={logsRef}
            style={{
              minHeight: 0,
              background: '#0F0F0E',
              color: '#E5E5E5',
              padding: 16,
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 12,
              lineHeight: 1.6,
              overflow: 'auto',
              whiteSpace: 'pre-wrap',
              border: '1px solid rgba(42, 36, 30, 0.18)',
              boxShadow: '6px 6px 0 rgba(42, 36, 30, 0.12)',
            }}
          >
            {logs.length > 0 ? logs.join('\n') : '等待脚本输出...'}
          </div>
        </div>
      </div>

      {isExecuting && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#D4401A' }}>
          <Loader2 size={18} className="animate-spin" />
          <span style={{ fontSize: 13, fontWeight: 600 }}>安装中...</span>
        </div>
      )}

      {runResult && (
        <div
          style={{
            padding: 16,
            background: runResult.success ? 'rgba(26,122,74,0.08)' : 'rgba(212,64,26,0.08)',
            border: `2px solid ${runResult.success ? '#1A7A4A' : '#D4401A'}`,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          {runResult.success ? (
            <CheckCircle2 size={22} color="#1A7A4A" />
          ) : (
            <XCircle size={22} color="#D4401A" />
          )}
          <div style={{ fontSize: 14, color: '#1B1712', fontWeight: 600 }}>
            {runResult.message}
          </div>
        </div>
      )}
    </div>
  );
}
