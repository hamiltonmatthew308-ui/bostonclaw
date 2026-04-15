import { useInstaller } from '../hooks/useInstaller';

const VENDORS = [
  { id: 'qclaw', name: 'QClaw', subtitle: '企业级全栈方案', url: 'https://example.com/qclaw' },
  { id: 'arkclaw', name: 'ArkClaw', subtitle: '方舟生态深度集成', url: 'https://example.com/arkclaw' },
  { id: 'autoclaw', name: 'AutoClaw', subtitle: '自动化优先', url: 'https://example.com/autoclaw' },
  { id: 'kimiclaw', name: 'KimiClaw', subtitle: 'Kimi 原生支持', url: 'https://example.com/kimiclaw' },
  { id: 'copaw', name: 'CoPaw', subtitle: '协作办公增强', url: 'https://example.com/copaw' },
  { id: 'duclaw', name: 'DuClaw', subtitle: '多云部署专家', url: 'https://example.com/duclaw' },
  { id: 'maxclaw', name: 'MaxClaw', subtitle: '性能最大化版本', url: 'https://example.com/maxclaw' },
];

interface VendorListProps {
  onSelect: (vendorId: string) => void;
}

export function VendorList({ onSelect }: VendorListProps) {
  const { openExternal } = useInstaller();

  const handleClick = async (vendor: (typeof VENDORS)[number]) => {
    await openExternal(vendor.url);
    onSelect(vendor.id);
  };

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div
        style={{
          fontFamily: "'DM Serif Display', Georgia, serif",
          fontSize: 20,
          color: '#1B1712',
          marginBottom: 4,
        }}
      >
        选择厂商版本
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        {VENDORS.map((vendor) => (
          <button
            key={vendor.id}
            type="button"
            onClick={() => handleClick(vendor)}
            className="lobster-control"
            style={{
              textAlign: 'left',
              border: '2px solid #DDDDD8',
              background: '#F4F1EC',
              padding: 16,
              cursor: 'pointer',
              color: '#0F0F0E',
              boxShadow: '3px 3px 0 #DDDDD8',
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                fontFamily: "'Instrument Sans', sans-serif",
                color: '#0F0F0E',
                marginBottom: 4,
              }}
            >
              {vendor.name}
            </div>
            <div style={{ fontSize: 11, color: '#666666' }}>{vendor.subtitle}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
