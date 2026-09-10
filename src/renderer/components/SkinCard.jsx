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
          alt={skin.name}
          className="skin-image"
          loading="lazy"
        />
      </div>

      <div className="skin-card-title" title={skin.name}>
        {skin.name}
      </div>

      <div className="skin-card-weapon">
        {skin.weapon} • {skin.category}
      </div>

      <div className="skin-card-badges">
        <span className="badge badge-rarity" style={{ '--rarity-color': rarityColor }}>
          {skin.rarity_name}
        </span>
        <span className="badge badge-wear">
          {skin.wear_name || 'Standard'}
        </span>
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
