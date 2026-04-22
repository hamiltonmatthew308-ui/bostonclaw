import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useInstallerStore } from '../store';
import type { ProviderConfig } from '../../shared/types/installer';

interface ProviderPreset {
  id: string;
  name: string;
  subtitle: string;
  authChoice: string;
  api?: string;
  baseUrl?: string;
  defaultModelRef: string;
  envKey?: string;       // displayed as hint in input placeholder
}

const PROVIDERS: ProviderPreset[] = [
  {
    id: 'anthropic',
    name: 'Anthropic',
    subtitle: 'Claude 系列',
    authChoice: 'anthropic-api-key',
    defaultModelRef: 'anthropic/claude-sonnet-4-6',
    envKey: 'ANTHROPIC_API_KEY',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    subtitle: 'GPT 系列',
    authChoice: 'openai-api-key',
    defaultModelRef: 'openai/gpt-5.4',
    envKey: 'OPENAI_API_KEY',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    subtitle: 'DeepSeek V3.2',
    authChoice: 'deepseek-api-key',
    defaultModelRef: 'deepseek/deepseek-chat',
    envKey: 'DEEPSEEK_API_KEY',
  },
  {
    id: 'moonshot',
    name: 'Moonshot',
    subtitle: 'Kimi K2 系列',
    authChoice: 'moonshot-api-key',
    api: 'openai-completions',
    baseUrl: 'https://api.moonshot.ai/v1',
    defaultModelRef: 'moonshot/kimi-k2.5',
    envKey: 'MOONSHOT_API_KEY',
  },
  {
    id: 'minimax',
    name: 'MiniMax',
    subtitle: 'M2.7 系列',
    authChoice: 'minimax-api-key',
    api: 'openai-completions',
    baseUrl: 'https://api.minimaxi.com/v1',
    defaultModelRef: 'minimax/MiniMax-M2.7',
    envKey: 'MINIMAX_API_KEY',
  },
  {
    id: 'zhipu',
    name: '智谱 GLM',
    subtitle: 'Z.AI / ChatGLM',
    authChoice: 'zai-api-key',
    defaultModelRef: 'zai/glm-5.1',
    envKey: 'ZAI_API_KEY',
  },
  {
    id: 'siliconflow',
    name: 'SiliconFlow',
    subtitle: '模型聚合平台',
    authChoice: 'custom-api-key',
    api: 'openai-completions',
    baseUrl: 'https://api.siliconflow.cn/v1',
    defaultModelRef: 'siliconflow/deepseek-ai/DeepSeek-V2.5',
    envKey: 'SILICONFLOW_API_KEY',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    subtitle: '多模型路由',
    authChoice: 'openrouter-api-key',
    defaultModelRef: 'openrouter/anthropic/claude-sonnet-4-6',
    envKey: 'OPENROUTER_API_KEY',
  },
  {
    id: 'custom',
    name: '自定义 Provider',
    subtitle: 'OpenAI 兼容接口',
    authChoice: 'custom-api-key',
    api: 'openai-completions',
    defaultModelRef: '',
  },
];

export function ProviderScreen() {
  const setStep = useInstallerStore((s) => s.setStep);
  const setProvider = useInstallerStore((s) => s.setProvider);
  const plan = useInstallerStore((s) => s.plan);
  const setPlan = useInstallerStore((s) => s.setPlan);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [customBaseUrl, setCustomBaseUrl] = useState('');
  const [customModel, setCustomModel] = useState('');
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = PROVIDERS.find((p) => p.id === selectedId);
  const isCustom = selectedId === 'custom';

  const canSubmit = selected && apiKey.trim().length >= 8
    && (!isCustom || customBaseUrl.trim());

  const handleSubmit = async () => {
    if (!selected || !canSubmit) return;
    setValidating(true);
    setError(null);

    try {
      const result = (await window.electron.ipcRenderer.invoke(
        'provider:validate',
        selected.id,
        apiKey,
      )) as { valid: boolean; error?: string };

      if (result.valid) {
        const cfg: ProviderConfig = {
          id: selected.id,
          name: selected.name,
          authChoice: selected.authChoice,
          api: selected.api,
          apiKey,
          baseUrl: isCustom ? customBaseUrl.trim() : selected.baseUrl,
          defaultModelRef: isCustom
            ? `custom/${customModel.trim() || 'default'}`
            : selected.defaultModelRef,
        };
        setProvider(cfg);
        if (plan) setPlan({ ...plan, provider: cfg });
        setStep('execute');
      } else {
        setError(result.error || '验证失败');
      }
    } catch {
      setError('验证出错，请检查 API Key');
    } finally {
      setValidating(false);
    }
  };

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      {/* Provider selector */}
      <select
        value={selectedId ?? ''}
        onChange={(e) => {
          setSelectedId(e.target.value || null);
          setApiKey('');
          setError(null);
        }}
        className="lobster-field"
        style={{
          width: '100%',
          padding: '12px 14px',
          border: '2px solid #DDDDD8',
          background: '#fff',
          fontSize: 14,
          fontFamily: "'Instrument Sans', sans-serif",
          color: selectedId ? '#0F0F0E' : '#999999',
          cursor: 'pointer',
        }}
      >
        <option value="" disabled>选择 AI 模型提供商</option>
        {PROVIDERS.map((p) => (
          <option key={p.id} value={p.id}>{p.name} — {p.subtitle}</option>
        ))}
      </select>

      {/* API Key input */}
      {selected && (
        <div style={{ display: 'grid', gap: 12 }}>
          <input
            type="password"
            placeholder={selected.envKey ? `粘贴 ${selected.envKey}` : '粘贴 API Key'}
            value={apiKey}
            onChange={(e) => { setApiKey(e.target.value); setError(null); }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
            className="lobster-field"
            style={{
              width: '100%',
              padding: '12px 14px',
              border: '2px solid #DDDDD8',
              background: '#fff',
              fontSize: 13,
              fontFamily: "'IBM Plex Mono', monospace",
            }}
          />

          {/* Custom provider fields */}
          {isCustom && (
            <>
              <input
                type="text"
                placeholder="Base URL，如 https://api.example.com/v1"
                value={customBaseUrl}
                onChange={(e) => setCustomBaseUrl(e.target.value)}
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
              <input
                type="text"
                placeholder="默认模型 ID（可选）"
                value={customModel}
                onChange={(e) => setCustomModel(e.target.value)}
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
            </>
          )}

          {/* Info hint */}
          <div style={{ fontSize: 11, color: '#6F655B', fontFamily: "'IBM Plex Mono', monospace" }}>
            {selected.authChoice === 'custom-api-key'
              ? `将使用 ${selected.api || 'openai-completions'} 兼容模式`
              : `将通过 openclaw onboard --auth-choice ${selected.authChoice} 配置`}
          </div>

          {/* Validation feedback */}
          {validating && <div style={{ fontSize: 11, color: '#6F655B' }}>验证中...</div>}
          {error && <div style={{ fontSize: 11, color: '#D4401A' }}>{error}</div>}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          type="button"
          onClick={() => { setProvider(null); setStep('execute'); }}
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
          onClick={handleSubmit}
          disabled={!canSubmit || validating}
          className="lobster-control"
          style={{
            minWidth: 160,
            padding: '12px 22px',
            border: 'none',
            background: canSubmit && !validating ? '#D4401A' : '#DDDDD8',
            color: canSubmit && !validating ? '#fff' : '#999999',
            cursor: canSubmit && !validating ? 'pointer' : 'not-allowed',
            fontSize: 13,
            fontWeight: 800,
            fontFamily: "'Archivo Black', sans-serif",
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            boxShadow: canSubmit && !validating ? '4px 4px 0 #0F0F0E' : 'none',
          }}
        >
          下一步
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}
