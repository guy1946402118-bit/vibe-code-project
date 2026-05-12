interface TagItem {
  id: string;
  name: string;
  weight: number;
  normalizedWeight: number;
  category?: string;
}

interface Props {
  tags: TagItem[];
  loading: boolean;
  onTagClick: (tag: TagItem) => void;
  activeTag?: string;
}

export function TagCloud({ tags, loading, onTagClick, activeTag }: Props) {
  if (loading) {
    return (
      <div
        className="glass-card"
        style={{
          padding: '16px',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '13px',
        }}
      >
        ⏳ 加载标签...
      </div>
    );
  }

  if (tags.length === 0) {
    return (
      <div
        className="glass-card"
        style={{
          padding: '16px',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '13px',
        }}
      >
        暂无标签
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        padding: '4px 0',
      }}
    >
      {tags.map((tag) => {
        const minSize = 11;
        const maxSize = 20;
        const fontSize = minSize + tag.normalizedWeight * (maxSize - minSize);
        const isActive = activeTag === tag.name;

        return (
          <span
            key={tag.id}
            onClick={() => onTagClick(tag)}
            title={`${tag.name} (权重: ${tag.weight})`}
            style={{
              fontSize: `${fontSize}px`,
              padding: '4px 12px',
              borderRadius: '16px',
              background: isActive
                ? 'rgba(0, 240, 255, 0.2)'
                : `rgba(0, 240, 255, ${0.05 + tag.normalizedWeight * 0.12})`,
              color: isActive ? '#00f0ff' : `rgba(0, 240, 255, ${0.5 + tag.normalizedWeight * 0.5})`,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              border: isActive
                ? '1px solid rgba(0, 240, 255, 0.4)'
                : '1px solid transparent',
              fontWeight: tag.normalizedWeight > 0.5 ? 600 : 400,
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.background = 'rgba(0, 240, 255, 0.18)';
              (e.target as HTMLElement).style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.background = isActive
                ? 'rgba(0, 240, 255, 0.2)'
                : `rgba(0, 240, 255, ${0.05 + tag.normalizedWeight * 0.12})`;
              (e.target as HTMLElement).style.transform = 'scale(1)';
            }}
          >
            #{tag.name}
          </span>
        );
      })}
    </div>
  );
}