/* Canvas confetti — pastki burchaklardan butun ekranga (bayram uslubi) */
(function () {
  const COLORS = ["#e6821e", "#2e8a4f", "#2f86d6", "#f2a93b", "#d94f7a", "#9e5bd6", "#ffd76b", "#ffffff", "#ff6b6b", "#7bed9f"];

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function spawnCannon(particles, x, y, angleMin, angleMax, count, speedMin, speedMax) {
    for (let i = 0; i < count; i++) {
      const angle = rand(angleMin, angleMax);
      const speed = rand(speedMin, speedMax);
      const isRibbon = Math.random() < 0.22;
      particles.push({
        x: x + rand(-24, 24),
        y: y + rand(-10, 6),
        w: isRibbon ? rand(10, 18) : rand(7, 14),
        h: isRibbon ? rand(4, 7) : rand(5, 10),
        round: !isRibbon && Math.random() > 0.45,
        ribbon: isRibbon,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        rot: Math.random() * Math.PI * 2,
        spin: rand(-0.35, 0.35),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        wobble: rand(0.8, 2.2),
        wobblePhase: Math.random() * Math.PI * 2,
        drag: rand(0.988, 0.996),
        opacity: rand(0.88, 1),
        decay: rand(0.00018, 0.00028),
      });
    }
  }

  function fireBurst(particles, w, h, perSide) {
    const y = h - 8;

    /* Chap pastki burchak → yuqori va o'ngga */
    spawnCannon(particles, 0, y, -Math.PI / 2, -Math.PI / 8, perSide, 20, 36);
    /* O'ng pastki burchak → yuqori va chapga */
    spawnCannon(particles, w, y, (-Math.PI * 7) / 8, -Math.PI / 2, perSide, 20, 36);
    /* Qo'shimcha kuchli oqimlar */
    spawnCannon(particles, w * 0.06, y, -Math.PI / 2, -Math.PI / 5, Math.floor(perSide * 0.4), 22, 40);
    spawnCannon(particles, w * 0.94, y, (-Math.PI * 4) / 5, -Math.PI / 2, Math.floor(perSide * 0.4), 22, 40);
    /* Markazdan yuqoriga */
    spawnCannon(particles, w * 0.5, y, -Math.PI * 0.62, -Math.PI * 0.38, Math.floor(perSide * 0.3), 18, 32);
  }

  function fireConfetti(opts = {}) {
    const duration = opts.duration ?? 6500;
    const perSide = opts.perSide ?? 110;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const canvas = document.createElement("canvas");
    canvas.className = "confetti-canvas";
    canvas.setAttribute("aria-hidden", "true");
    document.body.appendChild(canvas);
    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    const onResize = () => resize();
    window.addEventListener("resize", onResize);

    const particles = [];
    const burstTimes = [0, 90, 180, 300, 450, 620, 820, 1050];
    let burstIdx = 0;
    const start = performance.now();
    let raf = 0;

    const tick = (now) => {
      const elapsed = now - start;
      const w = canvas.width;
      const h = canvas.height;

      while (burstIdx < burstTimes.length && elapsed >= burstTimes[burstIdx]) {
        fireBurst(particles, w, h, perSide);
        burstIdx++;
      }

      ctx.clearRect(0, 0, w, h);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        const t = elapsed * 0.004 + p.wobblePhase;
        p.vx += Math.sin(t) * p.wobble * 0.06;
        p.vx *= p.drag;
        p.vy *= p.drag;
        p.vy += 0.28;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.spin;
        p.opacity -= p.decay;

        if (p.opacity <= 0 || p.y > h + 80 || p.x < -120 || p.x > w + 120) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.min(1, p.opacity);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;

        if (p.round) {
          ctx.beginPath();
          ctx.arc(0, 0, p.w * 0.42, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.ribbon) {
          ctx.fillRect(-p.w * 0.5, -p.h * 0.35, p.w, p.h);
          ctx.globalAlpha *= 0.55;
          ctx.fillRect(-p.w * 0.35, -p.h * 0.5, p.w * 0.7, p.h * 1.1);
        } else {
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        }
        ctx.restore();
      }

      if (elapsed < duration || particles.length > 0) {
        raf = requestAnimationFrame(tick);
      } else {
        cancelAnimationFrame(raf);
        window.removeEventListener("resize", onResize);
        canvas.remove();
      }
    };

    raf = requestAnimationFrame(tick);
  }

  window.fireConfetti = fireConfetti;
})();
