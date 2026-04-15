import type { ReactNode } from 'react';

interface InfoPanelProps {
  title: string;
  children: ReactNode;
}

export function InfoPanel(props: InfoPanelProps) {
  return (
    <div
      style={{
        border: '2px solid #0F0F0E',
        background: '#F4F1EC',
        padding: 16,
      }}
    >
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
        {props.title}
      </div>
      <div style={{ color: '#2A2A2A', fontSize: 13, lineHeight: 1.8 }}>{props.children}</div>
    </div>
  );
}
