import { useState } from 'react';
import { useUserStore } from '../stores/userStore';

interface ShopItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  price: number;
  category: 'theme' | 'avatar' | 'sound' | 'effect';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  owned: boolean;
}

const RARITY_CONFIG = {
  common: { color: '#888', bg: 'rgba(136,136,136,0.1)', border: 'rgba(136,136,136,0.3)', label: 'COMMON' },
  rare: { color: '#4a90d9', bg: 'rgba(74,144,217,0.1)', border: 'rgba(74,144,217,0.3)', label: 'RARE' },
  epic: { color: '#9b59b6', bg: 'rgba(155,89,182,0.1)', border: 'rgba(155,89,182,0.3)', label: 'EPIC' },
  legendary: { color: '#f39c12', bg: 'rgba(243,156,18,0.15)', border: 'rgba(243,156,18,0.4)', label: 'LEGENDARY' },
};

const INITIAL_ITEMS: ShopItem[] = [
  {
    id: 'theme-cyan',
    name: 'Cyan Neon Theme',
    description: 'Unlock cyan neon color scheme for UI elements',
    icon: '🎨',
    price: 1000,
    category: 'theme',
    rarity: 'rare',
    owned: false,
  },
  {
    id: 'theme-purple',
    name: 'Purple Galaxy Theme',
    description: 'Deep space purple gradient theme with stars effect',
    icon: '🌌',
    price: 1500,
    category: 'theme',
    rarity: 'epic',
    owned: false,
  },
  {
    id: 'theme-golden',
    name: 'Golden Royale Theme',
    description: 'Luxurious gold and black premium theme',
    icon: '👑',
    price: 3000,
    category: 'theme',
    rarity: 'legendary',
    owned: false,
  },
  {
    id: 'frame-crown',
    name: 'Royal Crown Frame',
    description: 'Golden crown avatar frame showing your status',
    icon: '👑',
    price: 2000,
    category: 'avatar',
    rarity: 'epic',
    owned: false,
  },
  {
    id: 'frame-dragon',
    name: 'Dragon Fire Frame',
    description: 'Animated dragon fire surrounding your avatar',
    icon: '🐉',
    price: 2500,
    category: 'avatar',
    rarity: 'legendary',
    owned: false,
  },
  {
    id: 'frame-rainbow',
    name: 'Rainbow Aura Frame',
    description: 'Colorful rainbow glow around your profile picture',
    icon: '🌈',
    price: 1800,
    category: 'avatar',
    rarity: 'epic',
    owned: false,
  },
  {
    id: 'sound-chime',
    name: 'Zen Chime Sound',
    description: 'Peaceful chime sound for notifications',
    icon: '🔔',
    price: 500,
    category: 'sound',
    rarity: 'common',
    owned: false,
  },
  {
    id: 'sound-fantasy',
    name: 'Fantasy Magic Sound',
    description: 'Magical sparkle sound effects',
    icon: '✨',
    price: 800,
    category: 'sound',
    rarity: 'rare',
    owned: false,
  },
  {
    id: 'sound-epic',
    name: 'Epic Victory Fanfare',
    description: 'Triumphant orchestral victory music',
    icon: '🎺',
    price: 1200,
    category: 'sound',
    rarity: 'epic',
    owned: false,
  },
  {
    id: 'effect-confetti',
    name: 'Confetti Explosion',
    description: 'Colorful confetti burst on every achievement',
    icon: '🎊',
    price: 600,
    category: 'effect',
    rarity: 'rare',
    owned: false,
  },
  {
    id: 'effect-particles',
    name: 'Particle Trail Effect',
    description: 'Glowing particles follow your cursor movement',
    icon: '✨',
    price: 1500,
    category: 'effect',
    rarity: 'epic',
    owned: false,
  },
  {
    id: 'effect-matrix',
    name: 'Matrix Rain Background',
    description: 'Classic green matrix code rain animation',
    icon: '💚',
    price: 2000,
    category: 'effect',
    rarity: 'legendary',
    owned: false,
  },
];

export function RewardsShop() {
  const { currentUser } = useUserStore();
  const [items, setItems] = useState<ShopItem[]>(INITIAL_ITEMS);
  const [filter, setFilter] = useState<'all' | ShopItem['category']>('all');
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);

  const userPoints = currentUser?.points || 0;

  const filteredItems = items.filter(item => 
    filter === 'all' || item.category === filter
  );

  const handlePurchase = () => {
    if (!selectedItem || userPoints < selectedItem.price) return;

    setItems(prev => prev.map(item =>
      item.id === selectedItem.id ? { ...item, owned: true } : item
    ));

    setPurchaseSuccess(selectedItem.id);
    setShowPurchaseModal(false);

    setTimeout(() => setPurchaseSuccess(null), 3000);
  };

  const categories = [
    { key: 'all' as const, label: 'All Items', icon: '🛒' },
    { key: 'theme' as const, label: 'Themes', icon: '🎨' },
    { key: 'avatar' as const, label: 'Frames', icon: '🖼️' },
    { key: 'sound' as const, label: 'Sounds', icon: '🔔' },
    { key: 'effect' as const, label: 'Effects', icon: '✨' },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px', fontFamily: "'Courier New', monospace" }}>
          🛒 REWARDS SHOP
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', fontFamily: "'Courier New', monospace" }}>
          Spend your points on exclusive items & customizations
        </p>
      </div>

      <div style={{
        background: 'linear-gradient(135deg, var(--accent-dim), rgba(0,255,136,0.05))',
        borderRadius: '12px',
        padding: '16px 24px',
        marginBottom: '24px',
        border: '1px solid var(--matrix-green-dim)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{ fontSize: '28px' }}>💰</span>
          <div>
            <div style={{ fontSize: '14px', color: 'var(--text-muted)', fontFamily: "'Courier New', monospace" }}>YOUR BALANCE</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--matrix-green)', fontFamily: "'Courier New', monospace" }}>
              {userPoints.toLocaleString()} pts
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: "'Courier New', monospace" }}>INVENTORY</div>
          <div style={{ fontSize: '18px', color: 'var(--text-primary)' }}>
            {items.filter(i => i.owned).length} / {items.length} items
          </div>
        </div>
      </div>

      {purchaseSuccess && (
        <div style={{
          background: 'var(--accent-dim)',
          border: '1px solid var(--matrix-green)',
          borderRadius: '8px',
          padding: '12px 20px',
          marginBottom: '20px',
          textAlign: 'center',
          color: 'var(--matrix-green)',
          fontSize: '14px',
          fontWeight: '600',
          fontFamily: "'Courier New', monospace",
          animation: 'fadeIn 0.3s ease',
        }}>
          ✓ PURCHASE SUCCESSFUL! Item added to your inventory.
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {categories.map(cat => (
          <button
            key={cat.key}
            onClick={() => setFilter(cat.key)}
            style={{
              padding: '10px 18px',
              borderRadius: '6px',
              border: `1px solid ${filter === cat.key ? 'var(--matrix-green)' : 'var(--border-medium)'}`,
              background: filter === cat.key ? 'var(--matrix-green-dim)' : 'transparent',
              color: filter === cat.key ? 'var(--matrix-green)' : 'var(--text-secondary)',
              fontSize: '13px',
              cursor: 'pointer',
              fontFamily: "'Courier New', monospace",
              transition: 'all 0.15s',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '16px',
      }}>
        {filteredItems.map(item => {
          const rarity = RARITY_CONFIG[item.rarity];
          const canAfford = userPoints >= item.price;

          return (
            <div
              key={item.id}
              onClick={() => !item.owned && setSelectedItem(item)}
              style={{
                background: item.owned 
                  ? 'var(--bg-tertiary)' 
                  : rarity.bg,
                borderRadius: '8px',
                padding: '20px',
                border: `1px solid ${item.owned ? 'var(--border-light)' : rarity.border}`,
                cursor: item.owned ? 'default' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: item.owned ? 0.7 : 1,
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={e => {
                if (!item.owned) {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = `0 8px 25px rgba(0,0,0,0.3), 0 0 20px ${rarity.color}30`;
                }
              }}
              onMouseLeave={e => {
                if (!item.owned) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              {item.owned && (
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: 'var(--matrix-green)',
                  color: '#000',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  padding: '4px 10px',
                  borderRadius: '10px',
                  fontFamily: "'Courier New', monospace",
                }}>
                  OWNED
                </div>
              )}

              <div style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                fontSize: '10px',
                color: rarity.color,
                fontWeight: 'bold',
                letterSpacing: '1px',
                fontFamily: "'Courier New', monospace",
              }}>
                {rarity.label}
              </div>

              <div style={{
                textAlign: 'center',
                marginTop: '20px',
                marginBottom: '12px',
              }}>
                <div style={{ fontSize: '48px', marginBottom: '8px' }}>{item.icon}</div>
                <div style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: '4px',
                }}>
                  {item.name}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  lineHeight: '1.4',
                }}>
                  {item.description}
                </div>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '12px',
                borderTop: '1px solid var(--border-light)',
              }}>
                <div style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: canAfford ? 'var(--matrix-green)' : '#ff3333',
                  fontFamily: "'Courier New', monospace",
                }}>
                  {item.price} pts
                </div>
                {!item.owned && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedItem(item);
                      setShowPurchaseModal(true);
                    }}
                    disabled={!canAfford}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '6px',
                      border: `1px solid ${canAfford ? 'var(--matrix-green)' : 'var(--border-medium)'}`,
                      background: canAfford ? 'var(--matrix-green-dim)' : 'transparent',
                      color: canAfford ? 'var(--matrix-green)' : 'var(--text-muted)',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: canAfford ? 'pointer' : 'not-allowed',
                      fontFamily: "'Courier New', monospace",
                      transition: 'all 0.15s',
                    }}
                  >
                    BUY
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showPurchaseModal && selectedItem && (
        <div
          onClick={() => setShowPurchaseModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)',
              borderRadius: '12px',
              padding: '32px',
              maxWidth: '400px',
              width: '90%',
              border: '1px solid var(--border-accent)',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ fontSize: '64px', marginBottom: '12px' }}>{selectedItem.icon}</div>
              <h3 style={{ fontSize: '22px', color: 'var(--text-primary)', marginBottom: '8px', fontFamily: "'Courier New', monospace" }}>
                {selectedItem.name}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                {selectedItem.description}
              </p>
            </div>

            <div style={{
              background: 'var(--accent-dim)',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '24px',
              textAlign: 'center',
              border: '1px solid var(--matrix-green-dim)',
            }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', fontFamily: "'Courier New', monospace" }}>
                COST
              </div>
              <div style={{ fontSize: '36px', fontWeight: 'bold', color: 'var(--matrix-green)', fontFamily: "'Courier New', monospace" }}>
                {selectedItem.price} pts
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                Your balance: <span style={{ color: userPoints >= selectedItem.price ? 'var(--matrix-green)' : '#ff3333' }}>{userPoints}</span> pts
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowPurchaseModal(false)}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-medium)',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontFamily: "'Courier New', monospace",
                }}
              >
                CANCEL
              </button>
              <button
                onClick={handlePurchase}
                disabled={userPoints < selectedItem.price}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: '6px',
                  border: 'none',
                  background: userPoints >= selectedItem.price 
                    ? 'linear-gradient(135deg, var(--matrix-green), #00ff88)' 
                    : 'var(--bg-tertiary)',
                  color: userPoints >= selectedItem.price ? '#000' : 'var(--text-muted)',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: userPoints >= selectedItem.price ? 'pointer' : 'not-allowed',
                  fontFamily: "'Courier New', monospace",
                  boxShadow: userPoints >= selectedItem.price ? 'var(--shadow-glow)' : 'none',
                }}
              >
                CONFIRM PURCHASE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RewardsShop;
