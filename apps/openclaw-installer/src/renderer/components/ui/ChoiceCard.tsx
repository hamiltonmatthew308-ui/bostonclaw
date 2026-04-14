import type { ReactNode } from 'react';
import { Check } from 'lucide-react';

interface ChoiceCardProps {
  title: string;
  subtitle: string;
  detail: string;
  selected?: boolean;
  badges?: readonly string[];
  icon: ReactNode;
  onClick?: () => void;
}

export function ChoiceCard(props: ChoiceCardProps) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      aria-pressed={Boolean(props.selected)}
      data-selected={props.selected ? 'true' : 'false'}
      className="lobster-choice-card lobster-control"
      style={{
        width: '100%',
        textAlign: 'left',
        border: props.selected ? '3px solid #0F0F0E' : '2px solid #DDDDD8',
        background: props.selected ? '#FDFCF9' : '#F4F1EC',
        padding: 20,
        cursor: 'pointer',
        color: '#0F0F0E',
        boxShadow: props.selected ? '5px 5px 0 #0F0F0E' : '3px 3px 0 #DDDDD8',
        transform: props.selected ? 'translate(-2px, -2px)' : 'none',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <div
              style={{
                width: 40,
                height: 40,
                display: 'grid',
                placeItems: 'center',
                background: props.selected ? '#D4401A' : '#DDDDD8',
                color: props.selected ? '#fff' : '#666666',
                flexShrink: 0,
              }}
            >
              {props.icon}
            </div>
            <div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  fontFamily: "'Instrument Sans', sans-serif",
                  color: '#0F0F0E',
                  letterSpacing: '-0.01em',
                }}
              >
                {props.title}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: '#999999',
                  marginTop: 2,
                  fontFamily: "'IBM Plex Mono', monospace",
                  letterSpacing: '0.02em',
                }}
              >
                {props.subtitle}
              </div>
            </div>
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.8, color: '#666666' }}>{props.detail}</div>
        </div>
        {props.selected ? (
          <div
            style={{
              width: 28,
              height: 28,
              display: 'grid',
              placeItems: 'center',
              background: '#D4401A',
              color: '#fff',
              flexShrink: 0,
            }}
          >
            <Check size={14} />
          </div>
        ) : null}
      </div>

      {props.badges && props.badges.length > 0 ? (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 14 }}>
          {props.badges.map((badge) => (
            <span
              key={badge}
              style={{
                padding: '4px 10px',
                border: '1.5px solid #DDDDD8',
                background: 'transparent',
                color: '#666666',
                fontSize: 11,
                fontFamily: "'IBM Plex Mono', monospace",
              }}
            >
              {badge}
            </span>
          ))}
        </div>
      ) : null}
    </button>
  );
}
