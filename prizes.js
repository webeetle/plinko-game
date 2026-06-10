// prizes.js — prize catalog, slot order, tiers, and weighted draw.
// Exposed on window for the React app + tweaks panel.
(function () {
  // Slot order, left -> right. Arranged as a bell curve: the common prizes sit
  // in the center (where a Plinko disc naturally tends to land) and the rare
  // prizes at the edges — believable AND it keeps the disc's path natural.
  const PRIZES = [
    { id: 'telo',     emoji: '🏖️', name: 'Telo Mare',     weight: 1.0,  tier: 'epic'   },
    { id: 'bag',      emoji: '🛍️', name: 'Shopping Bag',  weight: 12.2, tier: 'normal' },
    { id: 'matita',   emoji: '✏️', name: 'Matita',        weight: 60.8, tier: 'normal' },
    { id: 'block',    emoji: '📓', name: 'Block Notes',   weight: 21.9, tier: 'normal' },
    { id: 'tshirt',   emoji: '👕', name: 'T-Shirt',       weight: 3.6,  tier: 'rare'   },
    { id: 'felpa',    emoji: '🧥', name: 'Felpa',         weight: 0.5,  tier: 'epic'   },
  ];

  // Weighted random index. Optional `weights` array overrides defaults (tweaks).
  function pickPrizeIndex(weights) {
    const w = weights && weights.length === PRIZES.length
      ? weights
      : PRIZES.map((p) => p.weight);
    const total = w.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < w.length; i++) {
      if (r < w[i]) return i;
      r -= w[i];
    }
    return w.length - 1;
  }

  window.PRIZES = PRIZES;
  window.pickPrizeIndex = pickPrizeIndex;
})();
