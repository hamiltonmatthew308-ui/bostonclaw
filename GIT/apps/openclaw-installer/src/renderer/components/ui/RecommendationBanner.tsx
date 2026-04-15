interface RecommendationBannerProps {
  title: string;
  detail: string;
}

export function RecommendationBanner(props: RecommendationBannerProps) {
  return (
    <div
      style={{
        marginBottom: 20,
        padding: '14px 18px',
        borderLeft: '4px solid #D4401A',
        background: 'rgba(212,64,26,0.04)',
        borderTop: '2px solid #0F0F0E',
        borderRight: '2px solid #0F0F0E',
        borderBottom: '2px solid #0F0F0E',
      }}
    >
      <div
        style={{
          fontFamily: "'Archivo Black', sans-serif",
          fontWeight: 900,
          fontSize: 13,
          color: '#0F0F0E',
          letterSpacing: '-0.01em',
          marginBottom: 4,
        }}
      >
        {props.title}
      </div>
      <div style={{ color: '#666666', fontSize: 13, lineHeight: 1.7 }}>{props.detail}</div>
    </div>
  );
}
