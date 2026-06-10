// app.jsx — state machine, board mount, gameplay chrome, tweaks, idle reset.
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "forceNextPrize": "random",
  "dropSpeed": 1,
  "pegRows": 10,
  "accent": "#359652",
  "confetti": 1
}/*EDITMODE-END*/;

const IDLE_MS = 20000;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [screen, setScreen] = useState('attract');   // attract | play | win
  const [dropping, setDropping] = useState(false);
  const [prize, setPrize] = useState(null);
  const [columns, setColumns] = useState([]);
  const [activeCol, setActiveCol] = useState(-1);
  const [muted, setMuted] = useState(() => localStorage.getItem('wb_muted') === '1');

  const canvasRef = useRef(null);
  const confettiRef = useRef(null);
  const boardRef = useRef(null);
  const confRef = useRef(null);
  const idleRef = useRef(null);
  const landHandler = useRef(null);
  const stateRef = useRef({});
  stateRef.current = { screen, dropping, t };

  // ---- mount board + confetti once ----
  useEffect(() => {
    const board = new window.PlinkoBoard(canvasRef.current, {
      accent: t.accent, gravityScale: t.dropSpeed, pegRows: t.pegRows,
    });
    boardRef.current = board;
    setColumns(board.getDropColumns(9));
    board.setOnLand((slot) => { landHandler.current && landHandler.current(slot); });
    confRef.current = new window.Confetti(confettiRef.current);
    board.setDemo(true);          // start in attract demo
    return () => board.stop();
  }, []);

  // ---- mute side effects ----
  useEffect(() => {
    window.PlinkoAudio.setMuted(muted);
    localStorage.setItem('wb_muted', muted ? '1' : '0');
  }, [muted]);

  // ---- live tweak application ----
  useEffect(() => { boardRef.current && boardRef.current.setGravityScale(t.dropSpeed); }, [t.dropSpeed]);
  useEffect(() => { boardRef.current && boardRef.current.setAccent(t.accent); }, [t.accent]);
  useEffect(() => {
    const b = boardRef.current;
    if (b && !stateRef.current.dropping) { b.setPegRows(t.pegRows); setColumns(b.getDropColumns(9)); }
  }, [t.pegRows]);

  // ---- idle -> attract ----
  const resetIdle = React.useCallback(() => {
    window.PlinkoAudio.unlock();
    if (idleRef.current) clearTimeout(idleRef.current);
    idleRef.current = setTimeout(() => {
      const s = stateRef.current;
      if (!s.dropping) goAttract();
    }, IDLE_MS);
  }, []);
  useEffect(() => {
    const h = () => resetIdle();
    window.addEventListener('pointerdown', h);
    return () => window.removeEventListener('pointerdown', h);
  }, [resetIdle]);

  // ---- transitions ----
  function goAttract() {
    setScreen('attract');
    setDropping(false);
    setPrize(null);
    setActiveCol(-1);
    const b = boardRef.current;
    if (b) { b.reset(); b.setDemo(true); }
    confRef.current && confRef.current.stop();
  }

  function startGame() {
    window.PlinkoAudio.unlock();
    const b = boardRef.current;
    if (b) { b.setDemo(false); b.reset(); }
    confRef.current && confRef.current.stop();
    setPrize(null);
    setActiveCol(-1);
    setDropping(false);
    setScreen('play');
    resetIdle();
  }

  function handleDrop(colIndex) {
    if (dropping || screen !== 'play') return;
    const b = boardRef.current;
    if (!b) return;
    setActiveCol(colIndex);
    window.PlinkoAudio.select();

    // determine the winning slot BEFORE the animation
    let slot;
    if (t.forceNextPrize !== 'random') {
      slot = window.PRIZES.findIndex((p) => p.id === t.forceNextPrize);
      if (slot < 0) slot = window.pickPrizeIndex();
    } else {
      slot = window.pickPrizeIndex();
    }
    setDropping(true);
    b.drop(columns[colIndex], slot);
  }

  // landing -> win
  landHandler.current = (slot) => {
    const won = window.PRIZES[slot];
    setPrize(won);
    setDropping(false);
    setScreen('win');
    fireCelebration(won.tier);
    resetIdle();
  };

  function fireCelebration(tier) {
    const conf = confRef.current;
    const amt = stateRef.current.t.confetti;
    if (!conf) return;
    if (tier === 'epic') {
      window.PlinkoAudio.jackpot();
      conf.jackpot(amt);
      setTimeout(() => conf.jackpot(amt * 0.8), 900);
    } else if (tier === 'rare') {
      window.PlinkoAudio.winRare();
      conf.celebrate(amt);
      conf.burst(540, 720, amt);
    } else {
      window.PlinkoAudio.winNormal();
      conf.burst(540, 720, amt);
    }
  }

  // ---- render ----
  const showChrome = screen !== 'attract';
  return (
    <React.Fragment>
      <GameStyles />

      {/* persistent top bar */}
      <div style={{
        position: 'absolute', top: 44, left: 48, right: 48, height: 90,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 50,
      }}>
        <div style={{ opacity: showChrome ? 1 : 0, transition: 'opacity .3s', color: '#fff' }}>
          <Logo height={64} color="#fff" />
        </div>
        <MuteButton muted={muted} onToggle={() => setMuted((m) => !m)} />
      </div>

      {/* board layer (always present) */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 5 }}>
        {/* instruction */}
        <div style={{
          position: 'absolute', top: 168, left: 0, right: 0, textAlign: 'center',
          opacity: screen === 'play' ? 1 : 0, transition: 'opacity .3s',
          pointerEvents: 'none',
        }}>
          <div style={{ fontSize: 30, letterSpacing: '0.42em', color: GREEN_BRIGHT, fontWeight: 600, paddingLeft: '0.42em' }}>
            {dropping ? 'GOOD LUCK!' : 'YOUR TURN'}
          </div>
          <div className="display" style={{ fontSize: 76, color: '#fff', lineHeight: 1.0, marginTop: 8, textShadow: '0 0 26px rgba(70,207,114,0.35)' }}>
            {dropping ? 'WATCH IT DROP…' : 'CHOOSE WHERE\u00A0TO DROP'}
          </div>
        </div>

        {/* the plinko canvas */}
        <canvas ref={canvasRef} style={{ position: 'absolute', top: 372, left: 0, width: 1080, height: 1320 }} />

        {/* drop column chevrons (over the top band of the canvas) */}
        <div style={{ position: 'absolute', top: 372, left: 0, width: 1080, height: 200,
          opacity: screen === 'play' && !dropping ? 1 : 0,
          pointerEvents: screen === 'play' && !dropping ? 'auto' : 'none',
          transition: 'opacity .25s' }}>
          {columns.map((cx, i) => (
            <button key={i} onClick={() => handleDrop(i)}
              style={{
                position: 'absolute', left: cx - 56, top: 18, width: 112, height: 150,
                background: 'transparent', border: 'none', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
              }}
              onPointerEnter={(e) => { e.currentTarget.style.opacity = 0.6; }}
              onPointerLeave={(e) => { e.currentTarget.style.opacity = 1; }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
                background: GREEN_BRIGHT, boxShadow: `0 0 18px ${GREEN_BRIGHT}`,
                animation: `chevBob 1.4s ease-in-out ${i * 0.08}s infinite`,
              }} />
              <svg width="48" height="40" viewBox="0 0 48 40" style={{ marginTop: 6, animation: `chevBob 1.4s ease-in-out ${i * 0.08 + 0.1}s infinite` }}>
                <path d="M6 8 L24 28 L42 8" fill="none" stroke={GREEN_BRIGHT} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
              </svg>
            </button>
          ))}
        </div>

        {/* footer tagline */}
        <div style={{
          position: 'absolute', bottom: 60, left: 0, right: 0, textAlign: 'center',
          opacity: showChrome ? 1 : 0, transition: 'opacity .3s',
        }}>
          <div style={{ fontSize: 26, letterSpacing: '0.4em', color: 'rgba(255,255,255,0.4)', paddingLeft: '0.4em' }}>
            weBeetle · PLINKO CHALLENGE · ALWAYS A WINNER
          </div>
        </div>
      </div>

      {/* attract overlay */}
      {screen === 'attract' && <AttractScreen onStart={startGame} />}

      {/* win overlay */}
      {screen === 'win' && prize && (
        <WinScreen prize={prize} tier={prize.tier} onPlayAgain={startGame} />
      )}

      {/* confetti (top-most) */}
      <canvas ref={confettiRef} width={1080} height={1920}
        style={{ position: 'absolute', inset: 0, width: 1080, height: 1920, pointerEvents: 'none', zIndex: 65 }} />

      {/* tweaks */}
      <TweaksPanel>
        <TweakSection label="Demo controls" />
        <TweakSelect label="Force next prize" value={t.forceNextPrize}
          options={[
            { value: 'random', label: 'Random (weighted)' },
            ...window.PRIZES.map((p) => ({ value: p.id, label: `${p.emoji} ${p.name}` })),
          ]}
          onChange={(v) => setTweak('forceNextPrize', v)} />
        <TweakSlider label="Drop speed" value={t.dropSpeed} min={0.7} max={1.5} step={0.05}
          onChange={(v) => setTweak('dropSpeed', v)} />
        <TweakSlider label="Peg rows" value={t.pegRows} min={7} max={13} step={1}
          onChange={(v) => setTweak('pegRows', v)} />
        <TweakSection label="Look & feel" />
        <TweakColor label="Accent" value={t.accent}
          options={['#359652', '#2a8fd8', '#d83a7a', '#f0962a', '#8b5cf6']}
          onChange={(v) => setTweak('accent', v)} />
        <TweakSlider label="Confetti amount" value={t.confetti} min={0.5} max={2} step={0.1}
          onChange={(v) => setTweak('confetti', v)} />
      </TweaksPanel>
    </React.Fragment>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
