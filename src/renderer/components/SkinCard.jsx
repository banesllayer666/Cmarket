import React from 'react';

export default function SkinCard({ skin, currency = 'EUR', onClick }) {
  const symbol = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : '£';
  const rarityColor = skin.rarity_color || '#b0c3d9';
  const price = skin.current_price || skin.lowest_price || 0;

  // Determine an initial quick badge if available
  let signal = 'WAIT';
  if (price > 0) {
    if (skin.rarity_name === 'Covert' || skin.rarity_name === 'Classified') {
      signal = 'BUY';
    }
  }

  // Wear color coding
  const getWearStyle = (wear) => {
    switch (wear) {
      case 'Factory New':
        return { background: 'rgba(16, 185, 129, 0.18)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.45)', fontWeight: 600 };
      case 'Minimal Wear':
        return { background: 'rgba(6, 182, 212, 0.18)', color: '#38bdf8', border: '1px solid rgba(6, 182, 212, 0.45)', fontWeight: 600 };
      case 'Field-Tested':
        return { background: 'rgba(245, 158, 11, 0.18)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.45)', fontWeight: 600 };
      case 'Well-Worn':
        return { background: 'rgba(249, 115, 22, 0.18)', color: '#fb923c', border: '1px solid rgba(249, 115, 22, 0.45)', fontWeight: 600 };
      case 'Battle-Scarred':
        return { background: 'rgba(239, 68, 68, 0.18)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.45)', fontWeight: 600 };
      default:
        return { background: 'rgba(255, 255, 255, 0.08)', color: 'var(--text-secondary)' };
    }
  };

  const displayName = skin.display_name || skin.name;

  return (
    <div 
      className="skin-card"
      style={{
        '--card-rarity-color': rarityColor,
        '--card-rarity-glow': `${rarityColor}33`
      }}
      onClick={() => onClick && onClick(skin)}
    >
      <div className="skin-card-glow-bar" />

      <div className="skin-image-container">
        <img 
          src={skin.image} 
          alt={displayName}
          className="skin-image"
          loading="lazy"
        />
      </div>

      <div className="skin-card-title" title={displayName}>
        {displayName}
      </div>

      <div className="skin-card-weapon">
        {skin.item_type === 'sticker' ? (skin.tournament || skin.collection || 'CS2 Sticker') : 
         skin.item_type === 'agent' ? (skin.collection || `${skin.team || 'Agent'}`) :
         `${skin.weapon} • ${skin.category}`}
      </div>

      <div className="skin-card-badges">
        <span className="badge badge-rarity" style={{ '--rarity-color': rarityColor }}>
          {skin.rarity_name}
        </span>

        {skin.item_type === 'sticker' ? (
          <span 
            className="badge" 
            style={{
              background: skin.effect === 'Holo' ? 'linear-gradient(135deg, rgba(236,72,153,0.3), rgba(6,182,212,0.3))' :
                          skin.effect === 'Gold' ? 'rgba(234, 179, 8, 0.25)' :
                          skin.effect === 'Foil' ? 'rgba(148, 163, 184, 0.25)' :
                          skin.effect === 'Glitter' ? 'rgba(168, 85, 247, 0.25)' : 'rgba(255,255,255,0.08)',
              color: skin.effect === 'Gold' ? '#fbbf24' : skin.effect === 'Holo' ? '#38bdf8' : skin.effect === 'Glitter' ? '#c084fc' : '#fff',
              border: skin.effect === 'Gold' ? '1px solid #fbbf24' : '1px solid rgba(255,255,255,0.2)',
              fontWeight: 700
            }}
          >
            {skin.effect || 'Paper'}
          </span>
        ) : skin.item_type === 'agent' ? (
          <span 
            className="badge" 
            style={{
              background: skin.team === 'Terrorist' ? 'rgba(234, 179, 8, 0.18)' : 'rgba(59, 130, 246, 0.18)',
              color: skin.team === 'Terrorist' ? '#fbbf24' : '#60a5fa',
              border: skin.team === 'Terrorist' ? '1px solid rgba(234, 179, 8, 0.4)' : '1px solid rgba(59, 130, 246, 0.4)',
              fontWeight: 700
            }}
          >
            {skin.team === 'Terrorist' ? 'T Side' : 'CT Side'}
          </span>
        ) : (
          <span className="badge" style={getWearStyle(skin.wear_name)}>
            {skin.wear_name || 'Standard'}
          </span>
        )}

        {skin.stattrak === 1 && (
          <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', border: '1px solid #f59e0b' }}>
            ST™
          </span>
        )}
      </div>

      <div className="skin-card-footer">
        <div className="skin-price">
          {price > 0 ? `${symbol}${price.toFixed(2)}` : <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>View Quote</span>}
        </div>
        <span className={`badge badge-signal ${signal.toLowerCase()}`}>
          {signal}
        </span>
      </div>
    </div>
  );
}
