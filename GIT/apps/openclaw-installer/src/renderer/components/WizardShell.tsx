import type { ReactNode } from 'react';
import { Check, Sparkles } from 'lucide-react';

interface WizardStepItem {
  id: number;
  label: string;
  subtitle: string;
}

interface WizardShellProps {
  steps: WizardStepItem[];
  currentStep: number;
  stepIcons: Record<number, typeof Sparkles>;
  onStepClick?: (stepId: number) => void;
  sidebarSupplement?: ReactNode;
  headerKicker?: string;
  children: ReactNode;
}

export function WizardShell({
  steps,
  currentStep,
  stepIcons,
  onStepClick,
  sidebarSupplement,
  headerKicker,
  children,
}: WizardShellProps) {
  const currentIndex = steps.findIndex((step) => step.id === currentStep);
  const resolvedIndex = currentIndex >= 0 ? currentIndex : 0;

  return (
    <div
      style={{
        display: 'flex',
        height: '760px',
        width: '100%',
        maxWidth: '1240px',
        background: '#FDFCF9',
        border: '2px solid #2A241E',
        boxShadow: '10px 10px 0 rgba(42, 36, 30, 0.16)',
        overflow: 'hidden',
      }}
    >
      <aside
        style={{
          width: '304px',
          flexShrink: 0,
          borderRight: '2px solid #2A241E',
          background: 'linear-gradient(180deg, #F5EEE4 0%, #EFE6DA 100%)',
          padding: '26px 0 22px 0',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: '0 22px 22px 22px',
            borderBottom: '2px solid rgba(42, 36, 30, 0.16)',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              background: '#D4401A',
              display: 'grid',
              placeItems: 'center',
              color: '#fff',
              flexShrink: 0,
            }}
          >
            <Sparkles style={{ width: 20, height: 20 }} />
          </div>
          <div>
            <h1
              style={{
                fontFamily: "'Archivo Black', sans-serif",
                fontWeight: 900,
                fontSize: 17,
                color: '#0F0F0E',
                margin: 0,
                letterSpacing: '-0.01em',
              }}
            >
              LOBSTER
            </h1>
            <p
              style={{
                fontSize: 10,
                color: '#8A7B6B',
                margin: '2px 0 0 0',
                fontFamily: "'IBM Plex Mono', monospace",
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              安装桥 / 模板中心
            </p>
          </div>
        </div>

        <div style={{ padding: '18px 22px 18px 22px', borderBottom: '1px solid rgba(42, 36, 30, 0.12)' }}>
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#D4401A',
              marginBottom: 10,
            }}
          >
            Install Concierge
          </div>
          <div
            style={{
              fontFamily: "'DM Serif Display', Georgia, serif",
              fontSize: 18,
              fontWeight: 400,
              color: '#1B1712',
              lineHeight: 1.35,
            }}
          >
            帮你做复杂判断，
            <br />
            帮你把安装落下来。
          </div>
          <div style={{ color: '#6F655B', fontSize: 12, lineHeight: 1.75, marginTop: 8 }}>
            先理解使用场景，再推荐模板、接入方式和落地路径。
          </div>
        </div>

        <div style={{ padding: '16px 22px 14px 22px', borderBottom: '1px solid rgba(42, 36, 30, 0.12)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#6F655B',
              }}
            >
              进度
            </span>
            <span
              style={{
                fontFamily: "'Archivo Black', sans-serif",
                fontSize: 14,
                fontWeight: 900,
                color: '#D4401A',
              }}
            >
              {resolvedIndex + 1}/{steps.length}
            </span>
          </div>
          <div style={{ height: 5, background: '#D8CEC1', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                background: '#D4401A',
                width: `${((resolvedIndex + 1) / steps.length) * 100}%`,
                transition: 'width 0.35s cubic-bezier(0.16,1,0.3,1)',
              }}
            />
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '14px 14px 0 14px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {steps.map((step, index) => {
              const isActive = index === resolvedIndex;
              const isCompleted = index < resolvedIndex;
              const isClickable = index <= resolvedIndex + 1 && onStepClick;
              const Icon = stepIcons[step.id] || Sparkles;

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => isClickable && onStepClick?.(step.id)}
                  disabled={!isClickable}
                  aria-current={isActive ? 'step' : undefined}
                  className="lobster-step-button lobster-control"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 12px',
                    border: 'none',
                    borderLeft: `3px solid ${isActive ? '#D4401A' : isCompleted ? '#1A7A4A' : 'transparent'}`,
                    background: isActive ? 'rgba(212,64,26,0.06)' : 'transparent',
                    cursor: isClickable ? 'pointer' : 'default',
                    opacity: isClickable ? 1 : 0.48,
                    textAlign: 'left',
                    width: '100%',
                  }}
                >
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      display: 'grid',
                      placeItems: 'center',
                      background: isActive ? '#D4401A' : isCompleted ? 'rgba(26,122,74,0.12)' : '#D8CEC1',
                      color: isActive ? '#fff' : isCompleted ? '#1A7A4A' : '#806F5E',
                      flexShrink: 0,
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {isCompleted ? <Check size={14} /> : <Icon size={14} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        fontFamily: "'Instrument Sans', sans-serif",
                        color: isActive ? '#1B1712' : isCompleted ? '#2A241E' : '#8A7B6B',
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {step.label}
                    </div>
                    {isActive ? (
                      <div
                        style={{
                          fontSize: 10.5,
                          color: '#6F655B',
                          marginTop: 2,
                          lineHeight: 1.4,
                          fontFamily: "'IBM Plex Mono', monospace",
                        }}
                      >
                        {step.subtitle}
                      </div>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ padding: '14px 14px 0 14px' }}>{sidebarSupplement}</div>
      </aside>

      <section style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div
          style={{
            padding: '22px 32px 18px 32px',
            borderBottom: '2px solid rgba(42, 36, 30, 0.16)',
            background: '#FDFCF9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 18,
            flexShrink: 0,
          }}
        >
          <div style={{ minWidth: 0 }}>
            {headerKicker ? (
              <div
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: '#D4401A',
                  marginBottom: 6,
                }}
              >
                {headerKicker}
              </div>
            ) : null}
            <h2
              style={{
                fontFamily: "'DM Serif Display', Georgia, serif",
                fontSize: 30,
                fontWeight: 400,
                color: '#1B1712',
                margin: 0,
                lineHeight: 1.08,
                letterSpacing: '-0.02em',
              }}
            >
              {steps[resolvedIndex]?.label}
            </h2>
            <p
              style={{
                fontSize: 13,
                color: '#6F655B',
                margin: '6px 0 0 0',
                maxWidth: 620,
                lineHeight: 1.7,
              }}
            >
              {steps[resolvedIndex]?.subtitle}
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '7px 14px',
              border: '2px solid #2A241E',
              background: '#2A241E',
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11,
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            <span style={{ color: '#C0B2A4' }}>STEP</span>
            <span style={{ color: '#fff', marginLeft: 4 }}>{resolvedIndex + 1}</span>
            <span style={{ color: '#C0B2A4' }}>/</span>
            <span style={{ color: '#C0B2A4' }}>{steps.length}</span>
          </div>
        </div>

        <div
          style={{
            flex: 1,
            overflow: 'auto',
            padding: '28px 32px 32px 32px',
            background: '#FDFCF9',
          }}
        >
          {children}
        </div>
      </section>
    </div>
  );
}
