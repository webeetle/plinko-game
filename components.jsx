// components.jsx — logo, attract + win screens, shared chrome.
const { useState, useEffect, useRef } = React;

const GREEN = '#359652';
const GREEN_BRIGHT = '#46cf72';

// ---- weBeetle wordmark (inlined, recolorable via currentColor) ----
function Logo({ height = 70, color = '#fff' }) {
  return (
    <svg viewBox="0 0 37.48 9.34" height={height} style={{ display: 'block', color }} aria-label="weBeetle">
      <g fill="currentColor">
        <path d="M16.89,4.22c.57-.69.91-1.64.91-2.44,0-.87-.41-1.57-1.43-1.57-.31,0-1.52.64-2.86,1.46,0-.39.03-.81.04-1.26,0-.12-.07-.18-.2-.18-.14-.01-1.04.08-1.19.11-.17.04-.23.12-.23.21v2.11c-.48.32-.93.64-1.33.92-.08.06-.13.13-.15.2-.17-.23-.44-.37-.79-.37-1.77,0-2.62,1.74-2.62,3.33,0,.12,0,.23.02.35-.02.02-.03.04-.05.07-.13.19-.27.26-.4.26s-.27-.08-.4-.2c.08-.38.12-.8.12-1.19,0-1.18-.38-2.25-1.14-2.25-.41,0-.57.33-.57.79,0,1.03.32,2.03.79,2.67-.22.31-.53.58-.87.58-.27,0-.57-.17-.88-.63.07-.07.24-.78.24-1.22s-.26-1.02-.64-1.02c-.42,0-.61.59-.63,1.19-.02.67.18,1.12.18,1.12-.11.24-.58.54-.81.54-.34,0-.57-.38-.57-1.36,0-.77.09-1.69.09-1.94,0-.17-.14-.2-.42-.2-.18,0-.4.01-.69.01s-.29.33-.29.33c0,.3-.11,1.01-.11,1.92s.1,2.62,1.47,2.62c.8,0,1.43-.86,1.5-1,.02-.04.05-.05.08-.05.23,0,.45,1.02,1.48,1.02.71,0,1.2-.57,1.49-1.35.15.08.3.13.47.13.23,0,.45-.09.67-.29.27.91.94,1.61,1.81,1.61.91,0,1.99-1.08,2.53-1.97.02-.03.02-.07.02-.12,0-.17-.07-.41-.17-.41-.02,0-.03,0-.05.02-.15.2-.65,1.13-1.6,1.13-.61,0-1.01-.5-1.19-1.13,1.26-.78,2.13-1.68,2.13-2.34,0-.07,0-.14-.02-.2.01,0,.02,0,.04,0,.11,0,.23-.08.23-.08l1.05-.73v3.63c0,.63,0,1.46-.01,2.06.02.21.19.21.19.21,0,0,.77.01,1.29.01.15,0,.15-.24.15-.24-.01-2.27-.05-3.76-.05-5.42v-1.29c.82-.52,1.5-.9,1.8-.9.6,0,1.08.49,1.08,1.21,0,.36-.12.78-.39,1.21-.22-.04-.42-.06-.62-.06-.91,0-1.28.33-1.28.67s.38.71.96.71c.39,0,.76-.12,1.1-.34.52.45.73,1.22.73,1.98,0,1.03-.43,1.69-.82,1.69-.47-.01-.83-.74-.92-.92,0-.01-.01-.02-.01-.02-.07-.16-.18-.32-.39-.34-.24,0-.85.35-.85.69,0,.58,1.18,1.36,2.02,1.36,1.41,0,2.72-.9,2.72-2.61,0-1.22-.8-2.06-1.72-2.5M8.42,6.2c0-.09,0-.2,0-.3,0-.87.33-1.68.97-1.68.05,0,.26.02.26.34,0,.51-.77,1.38-1.22,1.64"></path>
        <path d="M37.31,6.76s-.03,0-.05.02c-.15.2-.65,1.13-1.6,1.13-.61,0-1.01-.5-1.19-1.13,1.27-.78,2.13-1.68,2.13-2.34,0-.61-.38-1.01-.98-1.01-1.77,0-2.62,1.74-2.62,3.33,0,.11,0,.22.02.33-.31.43-.73.9-1.03.9-.33,0-.5-.39-.5-2,1.44-2.06,1.51-3.48,1.51-4.3,0-.53-.24-1.67-.81-1.67-.5,0-2.11,1.3-2.13,2.14,0,.34,0,.81-.01,1.33-.02-.03-.06-.04-.1-.04-.05,0-.11.02-.11.02,0,0-.63.23-1.3.46.06-1.25.13-2.29.13-2.32,0-.1-.05-.21-.2-.21-.08,0-.77.22-1.07.36-.17.12-.27,1.38-.32,2.69-.04.02-.07.03-.08.03-.12.05-.1.14-.11.15,0,0-.02.44-.02.57,0,.07.02.09.05.09,0,0,.04-.01.12-.04-.02.76-.03,1.46-.03,1.88-.26.34-.71.82-1.38.82-.61,0-1.01-.5-1.19-1.13,1.27-.78,2.13-1.68,2.13-2.34,0-.61-.38-1.01-.99-1.01-1.77,0-2.62,1.74-2.62,3.33,0,.11,0,.22.02.32-.25.35-.71.84-1.4.84-.61,0-1.01-.5-1.19-1.13,1.27-.78,2.13-1.68,2.13-2.34,0-.61-.38-1.01-.98-1.01-1.77,0-2.62,1.74-2.62,3.33,0,1.32.8,2.52,1.94,2.52.78,0,1.68-.78,2.26-1.57.28.89.94,1.57,1.8,1.57.73,0,1.56-.69,2.14-1.42.1,1.03.48,1.41.96,1.41.64,0,1.48-.7,2.1-1.47.15.86.65,1.42,1.28,1.42.48,0,1.32-.98,1.75-1.54.27.91.94,1.6,1.8,1.6.91,0,1.99-1.08,2.53-1.97.02-.03.02-.07.02-.13,0-.17-.07-.41-.17-.41M20.27,5.9c0-.87.33-1.68.97-1.68.05,0,.26.02.26.34,0,.51-.77,1.38-1.22,1.64-.01-.09-.01-.2-.01-.3M24.32,5.9c0-.87.33-1.68.97-1.68.05,0,.26.02.26.34,0,.51-.77,1.38-1.22,1.64-.01-.09-.01-.2-.01-.3M28.96,7.81c-.31,0-.53-.22-.53-.64,0-.64.02-1.54.06-2.44l1.3-.43c.24-.07.24-.21.24-.21,0,0,0-.05.01-.12,0,.36,0,.73,0,1.08,0,.86,0,1.64,0,2.04-.36.48-.77.71-1.09.71M31.35,5.06s-.02,0-.02-.05c0,0,0-2.3,0-2.9,0-.09,0-1.04.38-1.04.19,0,.45.38.45,1.06s-.42,2.47-.75,2.88c0,0-.03.05-.05.05M34.36,5.9c0-.87.33-1.68.97-1.68.05,0,.26.02.26.34,0,.51-.77,1.38-1.22,1.64,0-.09,0-.2,0-.3"></path>
      </g>
    </svg>
  );
}

// ---- mute toggle ----
function MuteButton({ muted, onToggle }) {
  return (
    <button onClick={onToggle} aria-label={muted ? 'Unmute' : 'Mute'}
      style={{
        width: 84, height: 84, borderRadius: 22, cursor: 'pointer',
        background: 'rgba(255,255,255,0.06)', border: '2px solid rgba(255,255,255,0.16)',
        color: '#fff', display: 'grid', placeItems: 'center', backdropFilter: 'blur(4px)',
      }}>
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" stroke="none"></polygon>
        {muted ? (
          <g><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></g>
        ) : (
          <g><path d="M15.5 8.5a5 5 0 0 1 0 7"></path><path d="M18.5 6a8 8 0 0 1 0 12"></path></g>
        )}
      </svg>
    </button>
  );
}

// ---- floating prize emojis (attract background) ----
function FloatingPrizes() {
  const items = React.useMemo(() => {
    const e = ['✏️', '📓', '🛍️', '👕', '🏖️', '🧥'];
    return Array.from({ length: 14 }, (_, i) => ({
      key: i,
      emoji: e[i % e.length],
      left: Math.random() * 100,
      size: 44 + Math.random() * 60,
      dur: 9 + Math.random() * 8,
      delay: -Math.random() * 16,
      drift: (Math.random() * 2 - 1) * 60,
    }));
  }, []);
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 1 }}>
      {items.map((it) => (
        <span key={it.key} style={{
          position: 'absolute', left: it.left + '%', bottom: -120,
          fontSize: it.size, opacity: 0.5,
          filter: 'drop-shadow(0 0 14px rgba(70,207,114,0.35))',
          animation: `floatUp ${it.dur}s linear ${it.delay}s infinite`,
          '--drift': it.drift + 'px',
        }}>{it.emoji}</span>
      ))}
    </div>
  );
}

// ---- ATTRACT SCREEN ----
function AttractScreen({ onStart }) {
  return (
    <div className="screen-attract" style={{
      position: 'absolute', inset: 0, zIndex: 20,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      background: 'linear-gradient(180deg, rgba(5,7,6,0.55) 0%, rgba(5,7,6,0.78) 45%, rgba(5,7,6,0.94) 100%)',
    }}>
      <FloatingPrizes />
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', height: '100%' }}>
        <div style={{ marginTop: 150, color: '#fff', filter: 'drop-shadow(0 0 26px rgba(70,207,114,0.5))' }}>
          <Logo height={120} color="#fff" />
        </div>
        <div style={{ marginTop: 18, fontSize: 30, letterSpacing: '0.42em', color: GREEN_BRIGHT, fontWeight: 600, paddingLeft: '0.42em' }}>
          PLINKO CHALLENGE
        </div>

        <div style={{ flex: 1 }}></div>

        <div className="display" style={{
          textAlign: 'center', lineHeight: 1.0, padding: '0 60px',
          fontSize: 150, color: '#fff',
          textShadow: '0 0 40px rgba(70,207,114,0.55)',
          animation: 'headlineGlow 2.6s ease-in-out infinite',
        }}>
          DROP THE<br />DISC<br /><span style={{ color: GREEN_BRIGHT }}>&amp; WIN!</span>
        </div>

        <div style={{ marginTop: 54, fontSize: 32, color: 'rgba(255,255,255,0.72)', letterSpacing: '0.06em' }}>
          Every drop is a winner — guaranteed.
        </div>

        <div style={{ flex: 1 }}></div>

        <button onClick={onStart} className="display" style={{
          marginBottom: 170, cursor: 'pointer',
          fontSize: 84, color: '#04130a', letterSpacing: '0.04em',
          padding: '38px 150px', borderRadius: 999, border: 'none',
          background: `linear-gradient(180deg, ${GREEN_BRIGHT}, ${GREEN})`,
          boxShadow: `0 0 0 8px rgba(70,207,114,0.18), 0 22px 60px rgba(53,150,82,0.55)`,
          animation: 'pulseBtn 1.7s ease-in-out infinite',
        }}>
          ▶ START
        </button>
      </div>
    </div>
  );
}

// ---- WIN SCREEN ----
function WinScreen({ prize, tier, onPlayAgain }) {
  const epic = tier === 'epic';
  const rare = tier === 'rare';
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 40,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: epic
        ? 'radial-gradient(80% 60% at 50% 42%, rgba(53,150,82,0.42), rgba(3,6,4,0.92) 70%)'
        : rare
          ? 'radial-gradient(70% 55% at 50% 45%, rgba(53,150,82,0.30), rgba(3,6,4,0.94) 72%)'
          : 'rgba(3,6,4,0.92)',
      overflow: 'hidden',
    }}>
      {epic && <div className="spotlight" />}
      {epic && <div className="flash" />}

      {epic && (
        <div className="display jackpot-banner" style={{
          fontSize: 184, color: 'var(--gold)', lineHeight: 0.9, marginBottom: 4,
          textShadow: '0 0 50px rgba(255,210,74,0.8)',
        }}>JACKPOT!</div>
      )}

      <div className="display" style={{
        fontSize: epic ? 76 : 104, color: epic ? '#fff' : GREEN_BRIGHT,
        textShadow: '0 0 36px rgba(70,207,114,0.6)', letterSpacing: '0.03em',
      }}>YOU WON!</div>

      <div style={{
        fontSize: 300, margin: '6px 0 0', lineHeight: 1,
        filter: `drop-shadow(0 0 ${rare || epic ? 60 : 26}px rgba(70,207,114,0.7))`,
        animation: 'popBounce 0.9s cubic-bezier(.2,1.3,.4,1) both',
      }}>{prize.emoji}</div>

      <div className="display" style={{
        fontSize: 112, color: '#fff', marginTop: 8, textAlign: 'center', lineHeight: 0.95,
        padding: '0 60px', letterSpacing: '0.02em', textShadow: '0 0 30px rgba(70,207,114,0.45)',
      }}>{prize.name.toUpperCase()}</div>

      <div style={{ height: 96 }}></div>

      <button onClick={onPlayAgain} className="display" style={{
        cursor: 'pointer', fontSize: 64, color: '#04130a', letterSpacing: '0.04em',
        padding: '30px 110px', borderRadius: 999, border: 'none',
        background: `linear-gradient(180deg, ${GREEN_BRIGHT}, ${GREEN})`,
        boxShadow: `0 0 0 7px rgba(70,207,114,0.18), 0 18px 50px rgba(53,150,82,0.5)`,
        animation: 'pulseBtn 1.7s ease-in-out infinite',
      }}>
        ↻ PLAY AGAIN
      </button>
    </div>
  );
}

// ---- keyframes / one-time styles ----
function GameStyles() {
  return (
    <style dangerouslySetInnerHTML={{ __html: `
      @keyframes floatUp {
        0%   { transform: translate(0,0) rotate(0deg); opacity: 0; }
        10%  { opacity: 0.6; }
        90%  { opacity: 0.6; }
        100% { transform: translate(var(--drift), -1240px) rotate(180deg); opacity: 0; }
      }
      @keyframes pulseBtn {
        0%,100% { transform: scale(1); }
        50%     { transform: scale(1.045); }
      }
      @keyframes headlineGlow {
        0%,100% { text-shadow: 0 0 30px rgba(70,207,114,0.4); }
        50%     { text-shadow: 0 0 64px rgba(70,207,114,0.75); }
      }
      @keyframes popBounce {
        0%   { transform: scale(0) rotate(-25deg); }
        60%  { transform: scale(1.18) rotate(6deg); }
        100% { transform: scale(1) rotate(0deg); }
      }
      @keyframes chevBob {
        0%,100% { transform: translateY(0); }
        50%     { transform: translateY(12px); }
      }
      @keyframes flashAnim {
        0% { opacity: 0; } 6% { opacity: 0.9; } 14% { opacity: 0; }
        22% { opacity: 0.7; } 30% { opacity: 0; } 100% { opacity: 0; }
      }
      .flash { position: absolute; inset: 0; background: #fff; z-index: 5;
        animation: flashAnim 1.2s ease-out 1 forwards; pointer-events: none; }
      @keyframes spotSpin { to { transform: rotate(360deg); } }
      .spotlight { position: absolute; left: 50%; top: 42%; width: 2600px; height: 2600px;
        transform-origin: center; pointer-events: none; z-index: 0; margin: -1300px 0 0 -1300px;
        background: conic-gradient(from 0deg,
          rgba(70,207,114,0.16) 0deg, transparent 18deg, transparent 42deg,
          rgba(70,207,114,0.16) 60deg, transparent 78deg, transparent 102deg,
          rgba(255,210,74,0.14) 120deg, transparent 138deg, transparent 162deg,
          rgba(70,207,114,0.16) 180deg, transparent 198deg, transparent 222deg,
          rgba(255,210,74,0.14) 240deg, transparent 258deg, transparent 282deg,
          rgba(70,207,114,0.16) 300deg, transparent 318deg, transparent 360deg);
        animation: spotSpin 14s linear infinite; }
      @keyframes bannerSlam {
        0% { transform: scale(2.4); opacity: 0; }
        55% { transform: scale(0.9); opacity: 1; }
        70% { transform: scale(1.08); }
        100% { transform: scale(1); opacity: 1; }
      }
      .jackpot-banner { animation: bannerSlam 0.7s cubic-bezier(.2,1,.3,1) both, headlineGlow 1.4s ease-in-out 0.7s infinite; }
      @keyframes screenIn { from { opacity: 0; } to { opacity: 1; } }
    `}} />
  );
}

Object.assign(window, { Logo, MuteButton, FloatingPrizes, AttractScreen, WinScreen, GameStyles, GREEN, GREEN_BRIGHT });
