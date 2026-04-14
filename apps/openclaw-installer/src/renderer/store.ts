import { create } from 'zustand';
import type {
  InstallPath,
  EnvReport,
  InstallPlan,
  ProviderConfig,
  InstallProgress,
  RunResult,
} from '../shared/types/installer';

export type WizardStep = 'quiz' | 'preflight' | 'provider' | 'execute' | 'complete';

interface InstallerStore {
  currentStep: WizardStep;
  selectedPath: InstallPath | null;
  vendorId: string | null;
  envReport: EnvReport | null;
  plan: InstallPlan | null;
  provider: ProviderConfig | null;
  progress: InstallProgress | null;
  runResult: RunResult | null;
  isExecuting: boolean;
  winExperimentalNative: boolean;

  setStep: (step: WizardStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  selectPath: (path: InstallPath) => void;
  setVendorId: (id: string | null) => void;
  setEnvReport: (report: EnvReport | null) => void;
  setPlan: (plan: InstallPlan | null) => void;
  setProvider: (provider: ProviderConfig | null) => void;
  setProgress: (progress: InstallProgress | null) => void;
  setRunResult: (result: RunResult | null) => void;
  setExecuting: (executing: boolean) => void;
  setWinExperimentalNative: (v: boolean) => void;
  reset: () => void;
}

const STEP_ORDER: WizardStep[] = ['quiz', 'preflight', 'provider', 'execute', 'complete'];

const initialState = {
  currentStep: 'quiz' as WizardStep,
  selectedPath: null as InstallPath | null,
  vendorId: null as string | null,
  envReport: null as EnvReport | null,
  plan: null as InstallPlan | null,
  provider: null as ProviderConfig | null,
  progress: null as InstallProgress | null,
  runResult: null as RunResult | null,
  isExecuting: false,
  winExperimentalNative: false,
};

export const useInstallerStore = create<InstallerStore>((set) => ({
  ...initialState,
  setStep: (step) => set({ currentStep: step }),
  nextStep: () =>
    set((state) => {
      const idx = STEP_ORDER.indexOf(state.currentStep);
      return { currentStep: STEP_ORDER[Math.min(idx + 1, STEP_ORDER.length - 1)] };
    }),
  prevStep: () =>
    set((state) => {
      const idx = STEP_ORDER.indexOf(state.currentStep);
      return { currentStep: STEP_ORDER[Math.max(idx - 1, 0)] };
    }),
  selectPath: (path) => set({ selectedPath: path }),
  setVendorId: (id) => set({ vendorId: id }),
  setEnvReport: (report) => set({ envReport: report }),
  setPlan: (plan) => set({ plan }),
  setProvider: (provider) => set({ provider }),
  setProgress: (progress) => set({ progress }),
  setRunResult: (result) => set({ runResult: result }),
  setExecuting: (executing) => set({ isExecuting: executing }),
  setWinExperimentalNative: (v) => set({ winExperimentalNative: v }),
  reset: () => set(initialState),
}));
