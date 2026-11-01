// Hero background: a small particle system with a soft pairwise force and a
// neighbour cutoff, drawn as a graph. The pointer acts as an extra charge.
(() => {
  const canvas = document.getElementById("field");
  const ctx = canvas.getContext("2d");
  const hero = canvas.parentElement;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const dark = matchMedia("(prefers-color-scheme: dark)");

  const CUTOFF = 130;
  const REST = 78;
  const pointer = { x: 0, y: 0, active: false };
  let width = 0, height = 0, nodes = [], color = "", frame = 0, visible = true;

  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    width = hero.clientWidth;
    height = hero.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.min(70, Math.round((width * height) / 11000));
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
    }));
    color = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();
  }

  function step() {
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = b.x - a.x, dy = b.y - a.y;
        const d = Math.hypot(dx, dy) || 1;
        if (d > CUTOFF) continue;
        // Repulsive inside the rest distance, weakly attractive beyond it.
        const f = ((d - REST) / REST) * 0.006;
        const fx = (dx / d) * f, fy = (dy / d) * f;
        a.vx += fx; a.vy += fy;
        b.vx -= fx; b.vy -= fy;
      }
      if (pointer.active) {
        const dx = a.x - pointer.x, dy = a.y - pointer.y;
        const d = Math.hypot(dx, dy) || 1;
        if (d < 170) {
          const f = (1 - d / 170) * 0.14;
          a.vx += (dx / d) * f;
          a.vy += (dy / d) * f;
        }
      }
    }
    for (const n of nodes) {
      // Thermal noise keeps the system from settling, damping keeps it calm.
      n.vx = (n.vx + (Math.random() - 0.5) * 0.02) * 0.985;
      n.vy = (n.vy + (Math.random() - 0.5) * 0.02) * 0.985;
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < 0 || n.x > width) { n.vx *= -1; n.x = Math.max(0, Math.min(width, n.x)); }
      if (n.y < 0 || n.y > height) { n.vy *= -1; n.y = Math.max(0, Math.min(height, n.y)); }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = ctx.fillStyle = color;
    ctx.lineWidth = 1;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const d = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
        if (d > CUTOFF) continue;
        ctx.globalAlpha = (1 - d / CUTOFF) * 0.55;
        ctx.beginPath();
        ctx.moveTo(nodes[i].x, nodes[i].y);
        ctx.lineTo(nodes[j].x, nodes[j].y);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 0.9;
    for (const n of nodes) {
      ctx.beginPath();
      ctx.arc(n.x, n.y, 2.25, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function loop() {
    frame = 0;
    step();
    draw();
    schedule();
  }

  function schedule() {
    if (!frame && visible && !document.hidden && !reduced.matches) frame = requestAnimationFrame(loop);
  }

  function renderStill() {
    // Let the layout relax first so the still frame looks like the moving one.
    for (let i = 0; i < 200; i++) step();
    draw();
  }

  function restart() {
    resize();
    if (reduced.matches) renderStill(); else { draw(); schedule(); }
  }

  hero.addEventListener("pointermove", (e) => {
    const box = hero.getBoundingClientRect();
    pointer.x = e.clientX - box.left;
    pointer.y = e.clientY - box.top;
    pointer.active = true;
  });
  hero.addEventListener("pointerleave", () => { pointer.active = false; });

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    schedule();
  }).observe(hero);
  document.addEventListener("visibilitychange", schedule);
  dark.addEventListener("change", () => {
    color = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();
    if (reduced.matches) draw();
  });
  reduced.addEventListener("change", restart);

  let lastWidth = 0;
  new ResizeObserver(() => {
    // Mobile browsers resize on scroll as the URL bar hides; only react to width.
    if (hero.clientWidth === lastWidth) return;
    lastWidth = hero.clientWidth;
    restart();
  }).observe(hero);
})();
