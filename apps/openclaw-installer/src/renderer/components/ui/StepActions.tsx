import { ArrowRight } from 'lucide-react';

interface StepActionsProps {
  onPrev?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
}

export function StepActions(props: StepActionsProps) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: 28,
        gap: 12,
        paddingTop: 20,
        borderTop: '2px solid #DDDDD8',
      }}
    >
      <button
        type="button"
        onClick={props.onPrev}
        disabled={!props.onPrev}
        className="lobster-control"
        style={{
          minWidth: 130,
          padding: '12px 20px',
          border: props.onPrev ? '2px solid #0F0F0E' : '2px solid #DDDDD8',
          background: props.onPrev ? '#FDFCF9' : '#F4F1EC',
          color: props.onPrev ? '#0F0F0E' : '#999999',
          cursor: props.onPrev ? 'pointer' : 'not-allowed',
          fontSize: 13,
          fontWeight: 700,
          fontFamily: "'Instrument Sans', sans-serif",
          letterSpacing: '0.01em',
          boxShadow: props.onPrev ? '3px 3px 0 #0F0F0E' : 'none',
        }}
      >
        ← 上一步
      </button>

      <button
        type="button"
        onClick={props.onNext}
        disabled={props.nextDisabled}
        className="lobster-control"
        style={{
          minWidth: 188,
          padding: '12px 22px',
          border: 'none',
          background: props.nextDisabled ? '#DDDDD8' : '#D4401A',
          color: props.nextDisabled ? '#999999' : '#fff',
          cursor: props.nextDisabled ? 'not-allowed' : 'pointer',
          fontSize: 13,
          fontWeight: 800,
          fontFamily: "'Archivo Black', sans-serif",
          letterSpacing: '0.02em',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          boxShadow: props.nextDisabled ? 'none' : '4px 4px 0 #0F0F0E',
        }}
      >
        {props.nextLabel ?? '下一步'}
        <ArrowRight size={15} />
      </button>
    </div>
  );
}
