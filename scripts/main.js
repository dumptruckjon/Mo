// Mo's festive countdown — vanilla JS, no dependencies, no build step.

document.addEventListener("DOMContentLoaded", () => {
  const countdownEl = document.getElementById("countdown");
  const jokeEl = document.getElementById("joke");
  const restartBtn = document.getElementById("restart");

  const START = 10;
  let timerId = null;

  // ---------- Countdown ----------
  function startCountdown() {
    let n = START;
    jokeEl.hidden = true;
    restartBtn.hidden = true;
    countdownEl.hidden = false;
    countdownEl.textContent = n;

    clearInterval(timerId);
    timerId = setInterval(() => {
      n -= 1;
      if (n > 0) {
        countdownEl.textContent = n;
        // restart the pop animation each tick
        countdownEl.classList.remove("tick");
        void countdownEl.offsetWidth; // force reflow
        countdownEl.classList.add("tick");
        void countdownEl.offsetWidth;
        countdownEl.classList.remove("tick");
      } else {
        clearInterval(timerId);
        reachZero();
      }
    }, 1000);
  }

  function reachZero() {
    countdownEl.hidden = true;
    jokeEl.hidden = false;
    restartBtn.hidden = false;
    fireworks.celebrate();
  }

  restartBtn.addEventListener("click", startCountdown);

  // ---------- Fireworks (canvas particle system) ----------
  const fireworks = createFireworks(document.getElementById("fireworks"));
  fireworks.start();

  startCountdown();
});

function createFireworks(canvas) {
  const ctx = canvas.getContext("2d");
  const particles = [];
  let running = false;
  let celebrating = 0; // remaining "auto-launch" frames after reaching zero
  const COLORS = [
    "#ffd24d", "#ff5e3a", "#ff2d55", "#ffffff",
    "#ff9500", "#ff3b30", "#ffe66d",
  ];

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resize);
  resize();

  function launch(x, y) {
    const count = 60 + Math.floor(Math.random() * 40);
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = 2 + Math.random() * 4;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        color: Math.random() < 0.5 ? color : COLORS[Math.floor(Math.random() * COLORS.length)],
      });
    }
  }

  function frame() {
    if (!running) return;

    // Auto-launch a burst now and then while celebrating.
    if (celebrating > 0) {
      celebrating -= 1;
      if (celebrating % 18 === 0) {
        launch(
          canvas.width * (0.2 + Math.random() * 0.6),
          canvas.height * (0.2 + Math.random() * 0.4)
        );
      }
    }

    // Fade trails instead of full clear.
    ctx.fillStyle = "rgba(0, 0, 0, 0.18)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05; // gravity
      p.vx *= 0.99;
      p.vy *= 0.99;
      p.life -= 0.012;
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      ctx.globalAlpha = Math.max(p.life, 0);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    requestAnimationFrame(frame);
  }

  // A celebratory tap anywhere launches a firework too.
  window.addEventListener("click", (e) => {
    if (running) launch(e.clientX, e.clientY);
  });

  return {
    start() {
      if (running) return;
      running = true;
      requestAnimationFrame(frame);
    },
    celebrate() {
      celebrating = 300; // ~5 seconds of auto-fireworks
      // Immediate opening volley.
      launch(canvas.width * 0.3, canvas.height * 0.35);
      launch(canvas.width * 0.7, canvas.height * 0.3);
      launch(canvas.width * 0.5, canvas.height * 0.45);
    },
  };
}
