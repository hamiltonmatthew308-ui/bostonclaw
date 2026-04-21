/**
 * Shared types for Bostonclaw Installer
 */

export type InstallPath = 'vendor' | 'openclaw' | 'freeclaw' | 'hermes' | 'wechat';

export interface EnvReport {
  os: {
    platform: 'mac' | 'win' | 'linux';
    arch: string;
    version: string;
  };
  nodejs: {
    installed: boolean;
    version: string | null;
    path: string | null;
  };
  python: {
    installed: boolean;
    version: string | null;
  };
  ollama: {
    installed: boolean;
    version: string | null;
  };
  diskFreeGB: number;
  gpu?: {
    name: string;
    vramMB: number;
  };
  wsl2?: boolean;
}

export interface InstallPlan {
  steps: Array<{ id: string; label: string; estimate: string }>;
  totalEstimate: string;
  warnings: string[];
  experimentalWinNative?: boolean;
  provider?: ProviderConfig;
  registerStartup?: boolean;
}

export interface RunResult {
  success: boolean;
  message: string;
  nextAction: 'open-browser' | 'open-app' | 'show-guide' | 'none';
  nextUrl?: string;
  logs?: string[];
}

export interface InstallProgress {
  step: string;
  percent: number;
  log: string;
  runId?: string;
}

export interface ProviderConfig {
  id: string;
  name: string;
  apiKey: string;
  baseUrl: string;
  defaultModel: string;
}

export interface RouteDecision {
  path: InstallPath;
  vendorId?: string;
  provider?: ProviderConfig;
}
