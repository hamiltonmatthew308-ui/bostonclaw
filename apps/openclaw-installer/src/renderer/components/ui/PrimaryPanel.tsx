import type { ReactNode } from 'react';

interface PrimaryPanelProps {
  title?: string;
  description?: string;
  children: ReactNode;
}

export function PrimaryPanel(props: PrimaryPanelProps) {
  return (
    <div
      style={{
        border: '2px solid #0F0F0E',
        background: '#FDFCF9',
        padding: 22,
        boxShadow: '5px 5px 0 #0F0F0E',
      }}
    >
      {props.title ? (
        <div
          style={{
            fontFamily: "'Archivo Black', sans-serif",
            fontWeight: 900,
            fontSize: 14,
            color: '#0F0F0E',
            letterSpacing: '-0.01em',
            marginBottom: 6,
          }}
        >
          {props.title}
        </div>
      ) : null}
      {props.description ? (
        <div style={{ color: '#666666', fontSize: 13, lineHeight: 1.7, marginBottom: 16 }}>{props.description}</div>
      ) : null}
      {props.children}
    </div>
  );
}
