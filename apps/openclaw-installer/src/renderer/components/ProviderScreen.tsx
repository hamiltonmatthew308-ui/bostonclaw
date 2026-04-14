import { useState } from 'react';
import { Zap, Cloud, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useInstallerStore } from '../store';

const PROVIDERS = [
  {
    id: 'zhipu',
    name: '智谱 AI',
    subtitle: 'BigModel / ChatGLM',
    icon: <Zap size={20} />,
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4/',
    defaultModel: 'glm-4',
  },
  {
    id: 'siliconflow',
    name: 'SiliconFlow',
    subtitle: '高性价比模型聚合平台',
    icon: <Cloud size={20} />,
    baseUrl: 'https://api.siliconflow.cn/v1/',
    defaultModel: 'deepseek-ai/DeepSeek-V2.5',
  },
];

export function ProviderScreen() {
  const setStep = useInstallerStore((s) => s.setStep);
  const setProvider = useInstallerStore((s) => s.setProvider);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [validating, setValidating] = useState<Record<string, boolean>>({});
  const [validationResults, setValidationResults] = useState<
    Record<string, { valid: boolean; error?: string }>
  >({});

  const handleValidate = async (providerId: string, apiKey: string) => {
    if (!apiKey.trim()) return;
    setValidating((v) => ({ ...v, [providerId]: true }));
    try {
      const result = (await window.electron.ipcRenderer.invoke(
        'provider:validate',
        providerId,
        apiKey,
      )) as { valid: boolean; models?: string[]; error?: string };
      setValidationResults((v) => ({
        ...v,
        [providerId]: { valid: result.valid, error: result.error },
      }));
      if (result.valid) {
        const p = PROVIDERS.find((x) => x.id === providerId)!;
        setProvider({
          id: p.id,
          name: p.name,
          apiKey,
          baseUrl: p.baseUrl,
          defaultModel: p.defaultModel,
        });
        setStep('execute');
      }
    } finally {
      setValidating((v) => ({ ...v, [providerId]: false }));
    }
  };

  const handleSkip = () => {
    setProvider(null);
    setStep('execute');
  };

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {PROVIDERS.map((p) => {
          const isSelected = selectedId === p.id;
          const isValid = validationResults[p.id]?.valid;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedId(p.id)}
              className="lobster-choice-card lobster-control"
              style={{
                textAlign: 'left',
                border: isSelected ? '3px solid #0F0F0E' : '2px solid #DDDDD8',
                background: isSelected ? '#FDFCF9' : '#F4F1EC',
                padding: 20,
                cursor: 'pointer',
                color: '#0F0F0E',
                boxShadow: isSelected ? '5px 5px 0 #0F0F0E' : '3px 3px 0 #DDDDD8',
                transform: isSelected ? 'translate(-2px, -2px)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    display: 'grid',
                    placeItems: 'center',
                    background: isSelected ? '#D4401A' : '#DDDDD8',
                    color: isSelected ? '#fff' : '#666666',
                  }}
                >
                  {p.icon}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      fontFamily: "'Instrument Sans', sans-serif",
                      color: '#0F0F0E',
                    }}
                  >
                    {p.name}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: '#999999',
                      fontFamily: "'IBM Plex Mono', monospace",
                    }}
                  >
                    {p.subtitle}
                  </div>
                </div>
              </div>

              {isSelected && (
                <div style={{ marginTop: 10 }} onClick={(e) => e.stopPropagation()}>
                  <input
                    type="password"
                    placeholder="输入 API Key"
                    value={apiKeys[p.id] || ''}
                    onChange={(e) => setApiKeys((k) => ({ ...k, [p.id]: e.target.value }))}
                    onBlur={() => handleValidate(p.id, apiKeys[p.id] || '')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleValidate(p.id, apiKeys[p.id] || '');
                      }
                    }}
                    className="lobster-field"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '2px solid #DDDDD8',
                      background: '#fff',
                      fontSize: 13,
                      fontFamily: "'IBM Plex Mono', monospace",
                    }}
                  />
                  {validating[p.id] && (
                    <div style={{ marginTop: 6, fontSize: 11, color: '#6F655B' }}>验证中...</div>
                  )}
                  {!validating[p.id] && isValid && (
                    <div
                      style={{
                        marginTop: 6,
                        fontSize: 11,
                        color: '#1A7A4A',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <CheckCircle2 size={12} /> 验证通过
                    </div>
                  )}
                  {!validating[p.id] && validationResults[p.id]?.error && (
                    <div style={{ marginTop: 6, fontSize: 11, color: '#D4401A' }}>
                      {validationResults[p.id].error}
                    </div>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          type="button"
          onClick={handleSkip}
          className="lobster-control"
          style={{
            padding: '10px 16px',
            border: 'none',
            background: 'transparent',
            color: '#6F655B',
            fontSize: 13,
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          跳过，稍后配置
        </button>

        <button
          type="button"
          onClick={() => setStep('execute')}
          disabled={!validationResults[selectedId ?? '']?.valid}
          className="lobster-control"
          style={{
            minWidth: 160,
            padding: '12px 22px',
            border: 'none',
            background: validationResults[selectedId ?? '']?.valid ? '#D4401A' : '#DDDDD8',
            color: validationResults[selectedId ?? '']?.valid ? '#fff' : '#999999',
            cursor: validationResults[selectedId ?? '']?.valid ? 'pointer' : 'not-allowed',
            fontSize: 13,
            fontWeight: 800,
            fontFamily: "'Archivo Black', sans-serif",
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            boxShadow: validationResults[selectedId ?? '']?.valid ? '4px 4px 0 #0F0F0E' : 'none',
          }}
        >
          下一步
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}
