interface SectionIntroProps {
  eyebrow: string;
  title: string;
  description: string;
}

export function SectionIntro(props: SectionIntroProps) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: '#D4401A',
          marginBottom: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <span style={{ display: 'inline-block', width: 20, height: 2, background: '#D4401A' }} />
        {props.eyebrow}
      </div>
      <h3
        style={{
          margin: 0,
          color: '#0F0F0E',
          fontSize: 34,
          lineHeight: 1.1,
          fontWeight: 400,
          maxWidth: 760,
          fontFamily: "'DM Serif Display', Georgia, serif",
          letterSpacing: '-0.025em',
        }}
      >
        {props.title}
      </h3>
      <p
        style={{
          margin: '14px 0 0 0',
          color: '#666666',
          fontSize: 14,
          lineHeight: 1.85,
          maxWidth: 760,
        }}
      >
        {props.description}
      </p>
    </div>
  );
}
