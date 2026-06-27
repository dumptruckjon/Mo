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
    const fireworks = createFireworks(document.getElementById("fireworks"));
    // Isolate each feature: if one throws, the others still work.
    const features = [
      initDailyNote,
      initFoodBackground,
      () => initCountdown(fireworks),
      initFortuneCookie,
      initGarden,
      initEnvelopes,
      () => initMemory(fireworks),
      initScratch,
    ];
    for (const init of features) {
      try { init(); } catch (e) { console.error("Mo: a feature failed to start:", e); }
    }
  });

  // Register the service worker (PWA / offline). Best-effort; never blocks the UI.
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch((e) =>
        console.warn("Mo: service worker registration failed:", e)
      );
    });
  }

  // ---------- Daily love note (date-seeded: same all day, changes each day) ----------
  function initDailyNote() {
    const el = document.getElementById("daily-note");
    if (!el || !C.DAILY_NOTES || !C.DAILY_NOTES.length) return;
    const dayNumber = Math.floor(Date.now() / 86400000); // whole days since epoch
    el.textContent = C.DAILY_NOTES[dayNumber % C.DAILY_NOTES.length];
  }

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

  // ---------- Lucky red envelopes ----------
  function initEnvelopes() {
    const row = document.getElementById("envelopes");
    const text = document.getElementById("envelope-text");
    if (!row || !text || !C.COUPONS) return;
    let last = -1;

    row.querySelectorAll(".envelope").forEach((env) => {
      env.addEventListener("click", () => {
        env.classList.remove("open");
        void env.offsetWidth; // restart the animation
        env.classList.add("open");
        last = pickIndex(C.COUPONS.length, last);
        text.textContent = C.COUPONS[last];
      });
    });
  }

  // ---------- Sweet memory match ----------
  function initMemory(fireworks) {
    const grid = document.getElementById("memory-grid");
    const status = document.getElementById("memory-status");
    const newBtn = document.getElementById("memory-new");
    if (!grid || !status || !C.MEMORY) return;

    const pairs = C.MEMORY.length;
    let first = null;      // the first flipped card awaiting a match
    let lock = false;      // ignore taps during the flip-back delay
    let flipBackTimer = null;
    let matched = 0;
    let moves = 0;

    function shuffle(arr) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }

    function newGame() {
      clearTimeout(flipBackTimer); // cancel any pending flip-back from the old board
      first = null;
      lock = false;
      matched = 0;
      moves = 0;
      status.textContent = "Find all the pairs!";
      grid.innerHTML = "";
      const deck = shuffle([...C.MEMORY, ...C.MEMORY]);
      deck.forEach((emoji) => {
        const card = document.createElement("button");
        card.type = "button";
        card.className = "card-tile";
        card.dataset.emoji = emoji;
        card.setAttribute("aria-label", "memory card");
        card.textContent = "";
        card.addEventListener("click", () => flip(card));
        grid.appendChild(card);
      });
    }

    function flip(card) {
      if (lock) return;
      if (card.classList.contains("flipped") || card.classList.contains("matched")) return;

      card.classList.add("flipped");
      card.textContent = card.dataset.emoji;

      if (!first) {
        first = card;
        return;
      }

      moves += 1;
      if (first.dataset.emoji === card.dataset.emoji) {
        // Match!
        first.classList.add("matched");
        card.classList.add("matched");
        first = null;
        matched += 1;
        if (matched === pairs) {
          status.textContent = `You did it in ${moves} moves! 💖`;
          if (fireworks) fireworks.celebrate();
        } else {
          status.textContent = `Nice! ${matched}/${pairs} pairs`;
        }
      } else {
        // No match — flip both back shortly.
        lock = true;
        const a = first;
        first = null;
        flipBackTimer = setTimeout(() => {
          a.classList.remove("flipped");
          a.textContent = "";
          card.classList.remove("flipped");
          card.textContent = "";
          lock = false;
        }, 800);
      }
    }

    if (newBtn) newBtn.addEventListener("click", newGame);
    newGame();
  }

  // ---------- Scratch-off card ----------
  function initScratch() {
    const wrap = document.getElementById("scratch");
    const canvas = document.getElementById("scratch-canvas");
    const textEl = document.getElementById("scratch-text");
    const newBtn = document.getElementById("scratch-new");
    const ctx = canvas && canvas.getContext && canvas.getContext("2d");
    if (!wrap || !canvas || !textEl || !ctx || !C.SCRATCH) return;

    let scratching = false;
    let revealed = false;
    let lastPrize = -1;

    function sizeCanvas() {
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(rect.width));
      canvas.height = Math.max(1, Math.round(rect.height));
    }

    function drawFoil() {
      sizeCanvas();
      const g = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      g.addColorStop(0, "#f5c542");
      g.addColorStop(0.5, "#e0a92e");
      g.addColorStop(1, "#f5c542");
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "rgba(120, 70, 0, 0.8)";
      ctx.font = "bold 18px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Scratch here! 🪙", canvas.width / 2, canvas.height / 2);
    }

    function newCard() {
      revealed = false;
      wrap.classList.remove("revealed");
      lastPrize = pickIndex(C.SCRATCH.length, lastPrize);
      textEl.textContent = C.SCRATCH[lastPrize];
      canvas.style.display = "";
      drawFoil();
    }

    function pointPos(e) {
      const rect = canvas.getBoundingClientRect();
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
      const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
      return { x, y };
    }

    function eraseAt(x, y) {
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(x, y, 20, 0, Math.PI * 2);
      ctx.fill();
    }

    function scratchedFraction() {
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let clear = 0;
      // sample every 4th pixel for speed
      for (let i = 3; i < data.length; i += 16) {
        if (data[i] === 0) clear++;
      }
      return clear / (data.length / 16);
    }

    function maybeReveal() {
      if (revealed) return;
      if (scratchedFraction() > 0.5) {
        revealed = true;
        wrap.classList.add("revealed");
        canvas.style.display = "none";
      }
    }

    function onDown(e) { scratching = true; const p = pointPos(e); eraseAt(p.x, p.y); e.preventDefault(); }
    function onMove(e) {
      if (!scratching) return;
      const p = pointPos(e);
      eraseAt(p.x, p.y);
      e.preventDefault();
    }
    function onUp() { if (!scratching) return; scratching = false; maybeReveal(); }

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    // Fallbacks for browsers without Pointer Events.
    canvas.addEventListener("mousedown", onDown);
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("touchstart", onDown, { passive: false });
    canvas.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp);
    window.addEventListener("resize", () => { if (!revealed) drawFoil(); });

    if (newBtn) newBtn.addEventListener("click", newCard);
    newCard();
  }

  // ---------- Fireworks + candy (canvas particle system) ----------
  function createFireworks(canvas) {
    // No-op if the canvas is missing or 2D isn't supported, so a fireworks
    // problem can never take down the rest of the page.
    const ctx = canvas && canvas.getContext && canvas.getContext("2d");
    if (!ctx) return { celebrate() {} };
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
      ctx.font = "20px serif"; // set once per frame, not per emoji particle

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
      // Not on taps, clicks, or scrolling. Skipped for reduced-motion users.
      celebrate() {
        if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          return;
        }
        celebrating = 300; // ~5 seconds of auto-fireworks
        launch(canvas.width * 0.3, canvas.height * 0.35);
        launch(canvas.width * 0.7, canvas.height * 0.3);
        launch(canvas.width * 0.5, canvas.height * 0.45);
        ensureRunning();
      },
    };
  }
})();
