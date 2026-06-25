// Mo's little festival — vanilla JS, no dependencies, no build step.
// Content (jokes, fortunes, flowers, foods, candy) comes from scripts/content.js.

(function () {
  const C = (typeof window !== "undefined" && window.MoContent) || {};

  // Pick a random index in [0, len), avoiding `current` when possible.
  function pickIndex(len, current) {
    if (len <= 1) return 0;
    let next = current;
    while (next === current) next = Math.floor(Math.random() * len);
    return next;
  }
  const randItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

  document.addEventListener("DOMContentLoaded", () => {
    initFoodBackground();
    const fireworks = createFireworks(document.getElementById("fireworks"));
    initCountdown(fireworks);
    initFortuneCookie();
    initGarden();
    initMusic();
  });

  // ---------- Floating Chinese food ----------
  function initFoodBackground() {
    const layer = document.getElementById("food-bg");
    if (!layer || !C.FOODS) return;
    const COUNT = 14;
    for (let i = 0; i < COUNT; i++) {
      const span = document.createElement("span");
      span.className = "food";
      span.textContent = C.FOODS[i % C.FOODS.length];
      span.style.left = Math.random() * 100 + "%";
      span.style.fontSize = 1.5 + Math.random() * 2 + "rem";
      span.style.animationDuration = 12 + Math.random() * 16 + "s";
      span.style.animationDelay = -Math.random() * 20 + "s";
      layer.appendChild(span);
    }
  }

  // ---------- Countdown + joke ----------
  function initCountdown(fireworks) {
    const countdownEl = document.getElementById("countdown");
    const jokeEl = document.getElementById("joke");
    const restartBtn = document.getElementById("restart");
    const jokeZh = document.getElementById("joke-zh");
    const jokePunch = document.getElementById("joke-punch");
    const jokePinyin = document.getElementById("joke-pinyin");
    const jokeEn = document.getElementById("joke-en");

    const START = C.COUNTDOWN_START || 5;
    let timerId = null;
    let lastJoke = -1;

    function start() {
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
        } else {
          clearInterval(timerId);
          reachZero();
        }
      }, 1000);
    }

    function reachZero() {
      lastJoke = pickIndex(C.JOKES.length, lastJoke);
      const joke = C.JOKES[lastJoke];
      jokeZh.textContent = joke.zh;
      jokePunch.textContent = joke.punch;
      jokePinyin.textContent = joke.pinyin;
      jokeEn.textContent = joke.en;

      countdownEl.hidden = true;
      jokeEl.hidden = false;
      restartBtn.hidden = false;
      fireworks.celebrate();
    }

    restartBtn.addEventListener("click", start);
    start();
  }

  // ---------- Fortune cookie ----------
  function initFortuneCookie() {
    const cookie = document.getElementById("fortune-cookie");
    const text = document.getElementById("fortune-text");
    if (!cookie || !text || !C.FORTUNES) return;
    let last = -1;

    cookie.addEventListener("click", () => {
      cookie.classList.remove("crack");
      void cookie.offsetWidth; // restart the animation
      cookie.classList.add("crack");
      last = pickIndex(C.FORTUNES.length, last);
      text.textContent = C.FORTUNES[last];
    });
  }

  // ---------- Garden ----------
  function initGarden() {
    const soil = document.getElementById("garden");
    const countEl = document.getElementById("flower-count");
    if (!soil || !countEl || !C.FLOWERS) return;

    const KEY = "mo-flower-count";
    let count = Number(localStorage.getItem(KEY)) || 0;
    countEl.textContent = count;

    function plant(xPercent) {
      const flower = document.createElement("span");
      flower.className = "flower";
      flower.textContent = randItem(C.FLOWERS);
      flower.style.left = xPercent + "%";
      soil.appendChild(flower);
      // Keep the DOM from growing forever; the counter still tracks the true total.
      while (soil.children.length > 80) soil.removeChild(soil.firstChild);

      count += 1;
      countEl.textContent = count;
      localStorage.setItem(KEY, String(count));
    }

    soil.addEventListener("click", (e) => {
      const rect = soil.getBoundingClientRect();
      plant(((e.clientX - rect.left) / rect.width) * 100);
    });
    soil.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        plant(10 + Math.random() * 80);
      }
    });
  }

  // ---------- Soft music (Web Audio, synthesized — no asset, no autoplay) ----------
  function initMusic() {
    const toggle = document.getElementById("music-toggle");
    if (!toggle) return;

    let ctx = null;
    let schedulerId = null;
    let step = 0;
    // A gentle pentatonic scale (C D E G A across two octaves).
    const SCALE = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25];

    function playNote(freq) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = freq;
      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.04); // soft attack
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.1); // gentle decay
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 1.2);
    }

    function startMusic() {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === "suspended") ctx.resume();
      step = 0;
      schedulerId = setInterval(() => {
        // A wandering, pleasant melody.
        const idx = Math.floor(Math.random() * SCALE.length);
        playNote(SCALE[idx]);
        step += 1;
      }, 620);
    }

    function stopMusic() {
      clearInterval(schedulerId);
      schedulerId = null;
      if (ctx && ctx.state === "running") ctx.suspend();
    }

    toggle.addEventListener("click", () => {
      const on = toggle.getAttribute("aria-pressed") === "true";
      if (on) {
        stopMusic();
        toggle.setAttribute("aria-pressed", "false");
        toggle.textContent = "🔇";
      } else {
        startMusic();
        toggle.setAttribute("aria-pressed", "true");
        toggle.textContent = "🎵";
      }
    });
  }

  // ---------- Fireworks + candy (canvas particle system) ----------
  function createFireworks(canvas) {
    const ctx = canvas.getContext("2d");
    const particles = [];
    let rafRunning = false;
    let celebrating = 0;
    const COLORS = ["#ffd24d", "#ff5e3a", "#ff2d55", "#ffffff", "#ff9500", "#ff3b30", "#ffe66d"];
    const CANDY = C.CANDY || ["🍬", "🍭", "🍡"];

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
        // Roughly 1 in 7 particles is a falling sweet.
        const isCandy = Math.random() < 0.14;
        particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          emoji: isCandy ? CANDY[Math.floor(Math.random() * CANDY.length)] : null,
          color: Math.random() < 0.5 ? color : COLORS[Math.floor(Math.random() * COLORS.length)],
        });
      }
    }

    function frame() {
      if (celebrating > 0) {
        celebrating -= 1;
        if (celebrating % 18 === 0) {
          launch(canvas.width * (0.2 + Math.random() * 0.6), canvas.height * (0.2 + Math.random() * 0.4));
        }
      }

      // Nothing left to show → wipe the canvas clean and idle the loop.
      // (Keeps the background calm; no flashing while just scrolling around.)
      if (celebrating <= 0 && particles.length === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        rafRunning = false;
        return;
      }

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
        if (p.emoji) {
          ctx.font = "20px serif";
          ctx.fillText(p.emoji, p.x, p.y);
        } else {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(frame);
    }

    function ensureRunning() {
      if (rafRunning) return;
      rafRunning = true;
      requestAnimationFrame(frame);
    }

    return {
      // Fireworks fire ONLY here — when the countdown reaches zero (or "Again").
      // Not on taps, clicks, or scrolling.
      celebrate() {
        celebrating = 300; // ~5 seconds of auto-fireworks
        launch(canvas.width * 0.3, canvas.height * 0.35);
        launch(canvas.width * 0.7, canvas.height * 0.3);
        launch(canvas.width * 0.5, canvas.height * 0.45);
        ensureRunning();
      },
    };
  }
})();
