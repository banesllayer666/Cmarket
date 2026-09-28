import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Search, 
  Flame, 
  Compass, 
  ShieldAlert, 
  Layers, 
  Award,
  HelpCircle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export default function PatternLabModal({ onClose, initialSkin = 'AK-47 | Case Hardened', initialSeed = 661 }) {
  const [skinName, setSkinName] = useState(initialSkin);
  const [seed, setSeed] = useState(initialSeed);
  const [result, setResult] = useState(null);
  const [presets, setPresets] = useState([]);
  const [activeGuideTab, setActiveGuideTab] = useState('case_hardened');

  // Load presets on mount
  useEffect(() => {
    const loadPresets = async () => {
      try {
        if (window.electronAPI.getPatternPresets) {
          const p = await window.electronAPI.getPatternPresets();
          if (p) setPresets(p);
        }
      } catch (err) {
        console.warn('Error loading presets:', err);
      }
    };
    loadPresets();
  }, []);

  // Evaluate seed whenever skin or seed changes
  useEffect(() => {
    const evaluate = async () => {
      try {
        if (window.electronAPI.evaluateSeed) {
          const res = await window.electronAPI.evaluateSeed({
            skinName,
            seedNumber: seed
          });
          setResult(res);
        }
      } catch (err) {
        console.warn('Evaluation error:', err);
      }
    };
    evaluate();
  }, [skinName, seed]);

  const handleApplyPreset = (preset) => {
    setSkinName(preset.name);
    setSeed(preset.seed);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ maxWidth: '920px', maxHeight: '92vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header" style={{ borderBottom: '2px solid var(--accent-primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Sparkles size={18} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: '#fff', margin: 0 }}>
                CS2 Rare Pattern & Seed Valuation Engine
              </h2>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Inspect paint seeds (1–1000) for Blue Gems, Fire & Ice, Doppler Gems, and Fade tiers
              </span>
            </div>
          </div>
          <button className="btn btn-secondary" style={{ padding: '6px 10px' }} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Preset Quick-Picks */}
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>
              Famous Legendary Seeds (Click to inspect):
            </span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {presets.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleApplyPreset(p)}
                  style={{
                    background: (skinName === p.name && seed === p.seed) ? `${p.color}26` : 'var(--bg-surface)',
                    border: (skinName === p.name && seed === p.seed) ? `1px solid ${p.color}` : '1px solid var(--border-subtle)',
                    color: (skinName === p.name && seed === p.seed) ? p.color : 'var(--text-secondary)',
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: p.color }} />
                  {p.title}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Calculator Controls */}
          <div style={{
            background: 'var(--bg-glass)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr',
            gap: '16px',
            alignItems: 'center'
          }}>
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                Select Weapon Skin Finish:
              </label>
              <select
                className="select-input"
                style={{ width: '100%' }}
                value={skinName}
                onChange={(e) => setSkinName(e.target.value)}
              >
                <optgroup label="Case Hardened (Blue Gems)">
                  <option value="AK-47 | Case Hardened">AK-47 | Case Hardened</option>
                  <option value="★ Karambit | Case Hardened">★ Karambit | Case Hardened</option>
                  <option value="Five-SeveN | Case Hardened">Five-SeveN | Case Hardened</option>
                  <option value="★ M9 Bayonet | Case Hardened">★ M9 Bayonet | Case Hardened</option>
                  <option value="★ Talon Knife | Case Hardened">★ Talon Knife | Case Hardened</option>
                  <option value="★ Skeleton Knife | Case Hardened">★ Skeleton Knife | Case Hardened</option>
                </optgroup>
                <optgroup label="Marble Fade (Fire & Ice)">
                  <option value="★ Karambit | Marble Fade">★ Karambit | Marble Fade</option>
                  <option value="★ Bayonet | Marble Fade">★ Bayonet | Marble Fade</option>
                  <option value="★ Flip Knife | Marble Fade">★ Flip Knife | Marble Fade</option>
                </optgroup>
                <optgroup label="Fade Gradients (100% Full Fade)">
                  <option value="★ Butterfly Knife | Fade">★ Butterfly Knife | Fade</option>
                  <option value="★ Karambit | Fade">★ Karambit | Fade (90/10)</option>
                  <option value="Glock-18 | Fade">Glock-18 | Fade</option>
                </optgroup>
                <optgroup label="Doppler Gemstones">
                  <option value="★ Karambit | Doppler">★ Karambit | Doppler (Phases & Gems)</option>
                  <option value="★ M9 Bayonet | Gamma Doppler">★ M9 Bayonet | Gamma Doppler (Emerald)</option>
                </optgroup>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                Paint Seed / Pattern Template (1–1000):
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  className="search-input"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 700 }}
                  value={seed}
                  onChange={(e) => setSeed(Math.min(1000, Math.max(1, parseInt(e.target.value, 10) || 1)))}
                />
                <button 
                  className="btn btn-secondary" 
                  style={{ padding: '8px 12px', fontSize: '0.78rem', whiteSpace: 'nowrap' }}
                  onClick={() => setSeed(Math.floor(Math.random() * 1000) + 1)}
                >
                  🎲 Random
                </button>
              </div>
            </div>
          </div>

          {/* Valuation Result Card */}
          {result && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01)), var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: `1px solid ${result.badgeColor || 'var(--border-subtle)'}`,
              padding: '20px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                height: '4px',
                width: '100%',
                backgroundColor: result.badgeColor || 'var(--accent-primary)'
              }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span 
                      className="badge" 
                      style={{ 
                        background: `${result.badgeColor}22`, 
                        color: result.badgeColor, 
                        border: `1px solid ${result.badgeColor}66`,
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        padding: '4px 12px'
                      }}
                    >
                      {result.rarityBadge}
                    </span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
                      {result.tier}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Evaluated Pattern Seed: <strong style={{ color: '#fff', fontFamily: 'var(--font-mono)' }}>#{seed}</strong> on {skinName}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                    Estimated Collector Premium
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.3rem', fontWeight: 800, color: result.tierRank <= 2 ? 'var(--signal-buy)' : '#fff' }}>
                    {result.estimatedOverpay}
                  </div>
                </div>
              </div>

              {result.bluePercentage && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Playside Blue Ratio:</span>
                    <strong style={{ color: result.badgeColor }}>{result.bluePercentage}</strong>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: result.tierRank === 0 ? '98%' : result.tierRank === 1 ? '88%' : result.tierRank === 2 ? '72%' : result.tierRank === 3 ? '55%' : '20%',
                      backgroundColor: result.badgeColor
                    }} />
                  </div>
                </div>
              )}

              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                {result.description}
              </p>
            </div>
          )}

          {/* Reference Knowledge Guide & Tier Tables */}
          <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award size={16} color="var(--accent-primary)" />
                Pattern Tier Reference Tables & Guidelines
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  className={`btn ${activeGuideTab === 'case_hardened' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                  onClick={() => setActiveGuideTab('case_hardened')}
                >
                  Blue Gems (CH)
                </button>
                <button
                  className={`btn ${activeGuideTab === 'fire_ice' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                  onClick={() => setActiveGuideTab('fire_ice')}
                >
                  Fire & Ice (MF)
                </button>
                <button
                  className={`btn ${activeGuideTab === 'doppler' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                  onClick={() => setActiveGuideTab('doppler')}
                >
                  Doppler & Fades
                </button>
              </div>
            </div>

            {activeGuideTab === 'case_hardened' && (
              <div style={{ fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ background: 'var(--bg-surface-elevated)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontWeight: 700, color: '#38bdf8', marginBottom: '6px' }}>AK-47 Case Hardened Tiers</div>
                    <div><strong>Tier 0 (#1):</strong> #661 (The Scar Pattern)</div>
                    <div><strong>Tier 1:</strong> #151, #179, #321, #387, #670 (Reverse Scar), #955</div>
                    <div><strong>Tier 2:</strong> #103, #168, #344, #463, #555, #592, #605, #708, #828, #887, #892</div>
                  </div>
                  <div style={{ background: 'var(--bg-surface-elevated)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontWeight: 700, color: '#38bdf8', marginBottom: '6px' }}>Karambit Case Hardened Tiers</div>
                    <div><strong>Tier 0 (#1):</strong> #387 (100% Solid Blue Playside)</div>
                    <div><strong>Tier 1:</strong> #73, #269, #442, #463, #470, #776, #809, #853, #868, #888, #902, #905</div>
                    <div><strong>Tier 2:</strong> #139, #282, #414, #426, #453, #468, #509, #601, #643, #670</div>
                  </div>
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                  *Note: In CS2, blue coverage on the <strong>playside</strong> (facing you in inspection/holding) generates 95%+ of overpay. Backside blue carries much smaller premiums.
                </div>
              </div>
            )}

            {activeGuideTab === 'fire_ice' && (
              <div style={{ fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ background: 'var(--bg-surface-elevated)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontWeight: 700, color: '#ef4444', marginBottom: '6px' }}>Marble Fade: True Fire & Ice Ranking</div>
                  <div><strong>1st Max (Universal #1):</strong> Seed #412 (Pure red and blue, 0% yellow)</div>
                  <div><strong>2nd Max:</strong> Seeds #16, #146, #241, #359, #393, #541, #602, #649, #688, #701</div>
                  <div><strong>3rd Max:</strong> Seeds #152, #281, #292, #344, #628, #673, #743, #777, #792, #994</div>
                  <div><strong>Fake Fire & Ice (FFI):</strong> Visible sliver of yellow on blade tip or spine (e.g. #87, #93, #130)</div>
                </div>
              </div>
            )}

            {activeGuideTab === 'doppler' && (
              <div style={{ fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ background: 'var(--bg-surface-elevated)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontWeight: 700, color: '#06b6d4', marginBottom: '6px' }}>Doppler Phases & Gemstones</div>
                  <div><strong>Ruby:</strong> 100% Solid vibrant red blade (Massive collector multiple)</div>
                  <div><strong>Sapphire:</strong> 100% Deep ocean blue blade (Highest gemstone tier)</div>
                  <div><strong>Emerald:</strong> 100% Bright neon green (Gamma Doppler exclusive)</div>
                  <div><strong>Black Pearl:</strong> Rare iridescent deep violet/black pearlescent sheen</div>
                  <div><strong>Phase 2 ("Pink Galaxy"):</strong> Dominant vibrant magenta/pink, highest value standard phase</div>
                  <div><strong>Phase 4 ("Max Blue"):</strong> Dominant cyan/blue playside</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            💡 In-Game Check: In CS2 inspect window, hover the "i" info icon to find your item's <strong>Pattern Template</strong>.
          </div>
          <button className="btn btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
