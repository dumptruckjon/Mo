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
      initIntro,
      initLoveLetter,
      initMascot,
      initLantern,
      initWheel,
      initSlot,
      initLoveNoteDraw,
      initWhack,
      initNoodleCatch,
      initTeaCeremony,
      initStack,
      initTeller,
      initConstellation,
      initIdle,
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
      // A few crumbs scatter on the crack (idea 12).
      if (!prefersReduce()) {
        const rect = cookie.getBoundingClientRect();
        for (let i = 0; i < 6; i++) {
          const crumb = document.createElement("span");
          crumb.className = "crumb";
          crumb.textContent = "🍪";
          crumb.style.left = (rect.left + rect.width / 2 + (Math.random() - 0.5) * 50) + "px";
          crumb.style.top = (rect.top + rect.height / 2) + "px";
          document.body.appendChild(crumb);
          setTimeout(() => crumb.remove(), 800);
        }
      }
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
          if (window.MoEffects) window.MoEffects.confetti();
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
        if (window.MoEffects) window.MoEffects.petals();
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

  function prefersReduce() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  // ---------- Cinematic intro overlay (idea 3) ----------
  function initIntro() {
    const el = document.getElementById("intro");
    if (!el) return;
    let from = false;
    try {
      from = sessionStorage.getItem("mo-fromQuiz") === "1";
      sessionStorage.removeItem("mo-fromQuiz");
    } catch (e) { /* ignore */ }
    if (!from || prefersReduce()) return;
    el.classList.add("show");
    setTimeout(() => el.classList.remove("show"), 1200);
  }

  // ---------- Love-letter typewriter (idea 5) ----------
  function initLoveLetter() {
    const el = document.getElementById("love-letter");
    if (!el || !C.LETTER || !C.LETTER.length) return;
    const text = randItem(C.LETTER);
    if (prefersReduce()) { el.textContent = text; el.classList.add("done"); return; }
    let i = 0;
    (function type() {
      el.textContent = text.slice(0, i);
      i += 1;
      if (i <= text.length) setTimeout(type, 45);
      else el.classList.add("done");
    })();
  }

  // ---------- Mascot (idea 6) ----------
  function initMascot() {
    const m = document.getElementById("mascot");
    const bubble = document.getElementById("mascot-bubble");
    if (!m || !bubble || !C.MASCOT_REACTIONS) return;
    let t = null;
    m.addEventListener("click", () => {
      bubble.textContent = randItem(C.MASCOT_REACTIONS);
      bubble.hidden = false;
      clearTimeout(t);
      t = setTimeout(() => { bubble.hidden = true; }, 2500);
    });
  }

  // ---------- Wish lantern release (idea 1) ----------
  function initLantern() {
    const btn = document.getElementById("lantern-release");
    const layer = document.getElementById("lantern-layer");
    const wishEl = document.getElementById("lantern-wish");
    if (!btn || !layer || !C.WISHES) return;
    let last = -1;
    btn.addEventListener("click", () => {
      last = pickIndex(C.WISHES.length, last);
      if (wishEl) wishEl.textContent = C.WISHES[last];
      const lan = document.createElement("span");
      lan.className = "sky-lantern";
      lan.textContent = "🏮";
      lan.style.left = (10 + Math.random() * 80) + "%";
      layer.appendChild(lan);
      setTimeout(() => lan.remove(), 7200);
    });
  }

  // ---------- Spin the wheel (idea 8) ----------
  function initWheel() {
    const wheel = document.getElementById("wheel");
    const spin = document.getElementById("wheel-spin");
    const result = document.getElementById("wheel-result");
    if (!wheel || !spin || !C.WHEEL || !C.WHEEL.length) return;
    let rotation = 0;
    let spinning = false;
    spin.addEventListener("click", () => {
      if (spinning) return;
      spinning = true;
      if (result) result.textContent = "";
      const n = C.WHEEL.length;
      const idx = Math.floor(Math.random() * n);
      rotation += 4 * 360 + (360 - idx * (360 / n));
      wheel.style.transform = `rotate(${rotation}deg)`;
      setTimeout(() => {
        if (result) result.textContent = "→ " + C.WHEEL[idx];
        spinning = false;
      }, prefersReduce() ? 50 : 2700);
    });
  }

  // ---------- Lucky slot machine (idea 9) ----------
  function initSlot() {
    const spin = document.getElementById("slot-spin");
    const result = document.getElementById("slot-result");
    const reels = [0, 1, 2].map((i) => document.getElementById("reel" + i));
    if (!spin || reels.some((r) => !r) || !C.SLOT) return;
    let spinning = false;
    spin.addEventListener("click", () => {
      if (spinning) return;
      spinning = true;
      if (result) result.textContent = "";
      reels.forEach((r) => r.classList.add("spinning"));
      const cyc = setInterval(() => {
        reels.forEach((r) => {
          if (r.classList.contains("spinning")) r.textContent = randItem(C.SLOT);
        });
      }, 100);
      const finals = reels.map(() => randItem(C.SLOT));
      reels.forEach((r, i) => {
        setTimeout(() => {
          r.classList.remove("spinning");
          r.textContent = finals[i];
          if (i === reels.length - 1) {
            clearInterval(cyc);
            const won = finals[0] === finals[1] && finals[1] === finals[2];
            if (result) result.textContent = won ? randItem(C.SLOT_PRIZES) : "So close — pull again! 🎰";
            if (won && window.MoEffects) window.MoEffects.confetti();
            spinning = false;
          }
        }, 500 + i * 450);
      });
    });
  }

  // ---------- Endless love-note draw (idea 10) ----------
  function initLoveNoteDraw() {
    const note = document.getElementById("draw-note");
    const btn = document.getElementById("draw-btn");
    if (!note || !btn || !C.LOVE_NOTES) return;
    let last = -1;
    btn.addEventListener("click", () => {
      last = pickIndex(C.LOVE_NOTES.length, last);
      note.textContent = C.LOVE_NOTES[last];
    });
  }

  // ---------- Whack-a-dumpling (idea 14) ----------
  function initWhack() {
    const grid = document.getElementById("whack-grid");
    const status = document.getElementById("whack-status");
    const startBtn = document.getElementById("whack-start");
    if (!grid || !status || !startBtn) return;
    const N = 9;
    const KEY = "mo-whack-best";
    const cells = [];
    let running = false, score = 0, timeLeft = 0, popTimer = null, tickTimer = null;

    function best() { try { return Number(localStorage.getItem(KEY)) || 0; } catch (e) { return 0; } }
    function updateStatus() {
      status.textContent = running
        ? `Score: ${score} · ⏱️ ${timeLeft}s`
        : `Game over! Score ${score} · Best ${best()}`;
    }
    for (let i = 0; i < N; i++) {
      const c = document.createElement("button");
      c.type = "button";
      c.className = "whack-cell";
      c.setAttribute("aria-label", "dumpling hole");
      c.addEventListener("click", () => {
        if (running && c.classList.contains("up")) {
          c.classList.remove("up");
          c.classList.add("bonk");
          c.textContent = "";
          setTimeout(() => c.classList.remove("bonk"), 300);
          score += 1;
          updateStatus();
        }
      });
      grid.appendChild(c);
      cells.push(c);
    }
    function clearAll() { cells.forEach((c) => { c.classList.remove("up"); c.textContent = ""; }); }
    function pop() {
      if (!running) return;
      clearAll();
      const c = cells[Math.floor(Math.random() * N)];
      c.classList.add("up");
      c.textContent = "🥟";
      popTimer = setTimeout(() => {
        c.classList.remove("up");
        c.textContent = "";
        if (running) pop();
      }, 700 + Math.random() * 300);
    }
    function endGame() {
      running = false;
      clearTimeout(popTimer);
      clearInterval(tickTimer);
      clearAll();
      try { if (score > best()) localStorage.setItem(KEY, String(score)); } catch (e) { /* ignore */ }
      updateStatus();
    }
    function startGame() {
      if (running) return;
      running = true; score = 0; timeLeft = 20;
      updateStatus();
      pop();
      tickTimer = setInterval(() => {
        timeLeft -= 1;
        updateStatus();
        if (timeLeft <= 0) endGame();
      }, 1000);
    }
    startBtn.addEventListener("click", startGame);
  }

  // ---------- Noodle catch: drag the bowl, catch falling treats ----------
  function initNoodleCatch() {
    const stage = document.getElementById("catch-stage");
    const bowl = document.getElementById("catch-bowl");
    const status = document.getElementById("catch-status");
    const startBtn = document.getElementById("catch-start");
    if (!stage || !bowl || !status || !startBtn || !C.CATCH_ITEMS || !C.CATCH_ITEMS.length) return;
    const KEY = "mo-catch-best";
    let running = false, score = 0, timeLeft = 0;
    let raf = null, spawnTimer = null, tickTimer = null, last = 0;
    let items = []; // { el, x, y, v } — y is distance fallen from above the stage
    let bowlX = 0;

    function best() { try { return Number(localStorage.getItem(KEY)) || 0; } catch (e) { return 0; } }
    function setBowl(x) {
      bowlX = Math.max(24, Math.min(stage.clientWidth - 24, x));
      bowl.style.left = bowlX + "px";
    }
    function onPoint(e) {
      if (!running) return;
      setBowl(e.clientX - stage.getBoundingClientRect().left);
    }
    stage.addEventListener("pointermove", onPoint);
    stage.addEventListener("pointerdown", onPoint);

    function spawn() {
      if (!running) return;
      const el = document.createElement("span");
      el.className = "catch-item";
      el.textContent = randItem(C.CATCH_ITEMS);
      const x = 20 + Math.random() * Math.max(1, stage.clientWidth - 40);
      el.style.left = x + "px";
      stage.appendChild(el);
      items.push({ el, x, y: -30, v: 80 + Math.random() * 70 });
      spawnTimer = setTimeout(spawn, 500 + Math.random() * 350);
    }
    function updateStatus() {
      status.textContent = `⏱️ ${timeLeft}s · Caught: ${score}`;
    }
    function loop(ts) {
      if (!running) return;
      const dt = last ? Math.min(50, ts - last) / 1000 : 0;
      last = ts;
      const catchY = stage.clientHeight - 28; // the bowl's rim band
      items = items.filter((it) => {
        it.y += it.v * dt;
        it.el.style.transform = `translateY(${it.y + 30}px)`;
        if (it.y >= catchY && Math.abs(it.x - bowlX) < 44) {
          score += 1;
          it.el.remove();
          updateStatus();
          return false;
        }
        if (it.y > stage.clientHeight + 20) { it.el.remove(); return false; }
        return true;
      });
      raf = requestAnimationFrame(loop);
    }
    function endGame() {
      running = false;
      clearTimeout(spawnTimer);
      clearInterval(tickTimer);
      cancelAnimationFrame(raf);
      items.forEach((it) => it.el.remove());
      items = [];
      stage.classList.remove("playing");
      startBtn.hidden = false;
      const isBest = score > best();
      try { if (isBest) localStorage.setItem(KEY, String(score)); } catch (e) { /* ignore */ }
      status.textContent =
        `${isBest && score > 0 ? "New best! " : ""}${randItem(C.CATCH_MSGS || [""])} Caught ${score} · Best ${best()}`;
      if (isBest && score > 0 && window.MoEffects) window.MoEffects.confetti();
    }
    function startGame() {
      if (running) return;
      running = true; score = 0; last = 0;
      timeLeft = Math.round((window.MO_CATCH_MS || 20000) / 1000);
      stage.classList.add("playing");
      startBtn.hidden = true;
      setBowl(stage.clientWidth / 2);
      updateStatus();
      spawn();
      raf = requestAnimationFrame(loop);
      tickTimer = setInterval(() => {
        timeLeft -= 1;
        if (timeLeft <= 0) endGame(); else updateStatus();
      }, 1000);
    }
    startBtn.addEventListener("click", startGame);
  }

  // ---------- Tea ceremony: a watch-and-repeat sequence game ----------
  function initTeaCeremony() {
    const grid = document.getElementById("tea-grid");
    const status = document.getElementById("tea-status");
    const startBtn = document.getElementById("tea-start");
    if (!grid || !status || !startBtn || !C.TEA_CUPS || C.TEA_CUPS.length < 4) return;
    const KEY = "mo-tea-best";
    const step = () => window.MO_TEA_STEP_MS || 460;
    const cups = [];
    let seq = [], pos = 0, accepting = false, playing = false;

    function best() { try { return Number(localStorage.getItem(KEY)) || 0; } catch (e) { return 0; } }
    C.TEA_CUPS.slice(0, 4).forEach((emoji, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "tea-cup";
      b.textContent = emoji;
      b.setAttribute("aria-label", "cup " + (i + 1));
      b.addEventListener("click", () => tap(i));
      grid.appendChild(b);
      cups.push(b);
    });
    function glow(i, ms) {
      cups[i].classList.add("glow");
      setTimeout(() => cups[i].classList.remove("glow"), ms);
    }
    function playback() {
      accepting = false;
      status.textContent = `Round ${seq.length} — watch… 👀`;
      grid.dataset.seq = seq.join("");
      seq.forEach((cup, k) => setTimeout(() => glow(cup, step() * 0.6), step() * (k + 1)));
      setTimeout(() => {
        pos = 0;
        accepting = true;
        status.textContent = `Round ${seq.length} — your turn! 🍵`;
      }, step() * (seq.length + 1));
    }
    function nextRound() {
      seq.push(Math.floor(Math.random() * cups.length));
      playback();
    }
    function tap(i) {
      if (!playing || !accepting) return;
      glow(i, 200);
      if (i === seq[pos]) {
        pos += 1;
        if (pos === seq.length) {
          accepting = false;
          setTimeout(nextRound, 650);
        }
      } else {
        endGame();
      }
    }
    function endGame() {
      playing = false;
      accepting = false;
      const rounds = Math.max(0, seq.length - 1); // the last round wasn't completed
      const isBest = rounds > best();
      try { if (isBest) localStorage.setItem(KEY, String(rounds)); } catch (e) { /* ignore */ }
      status.textContent =
        `${randItem(C.TEA_MSGS || [""])} ${rounds} round${rounds === 1 ? "" : "s"} · Best ${best()}`;
      startBtn.hidden = false;
      if (isBest && rounds > 0 && window.MoEffects) window.MoEffects.confetti();
    }
    startBtn.addEventListener("click", () => {
      if (playing) return;
      playing = true;
      seq = [];
      startBtn.hidden = true;
      nextRound();
    });
  }

  // ---------- Dumpling stack: tap to drop the swinging dumpling ----------
  function initStack() {
    const stage = document.getElementById("stack-stage");
    const status = document.getElementById("stack-status");
    const startBtn = document.getElementById("stack-start");
    if (!stage || !status || !startBtn) return;
    const KEY = "mo-stack-best";
    let running = false, raf = null, t = 0, last = 0, speed = 1.6;
    let mover = null, moverX = 0, level = 0, topX = 0;
    let placed = [];

    function best() { try { return Number(localStorage.getItem(KEY)) || 0; } catch (e) { return 0; } }
    function rowBottom(row) { return 10 + Math.min(row, 4) * 30; } // show at most 5 rows
    function loop(ts) {
      if (!running) return;
      const dt = last ? Math.min(50, ts - last) / 1000 : 0;
      last = ts;
      t += dt * speed;
      const w = stage.clientWidth;
      moverX = w / 2 + Math.sin(t) * (w / 2 - 30);
      mover.style.left = moverX + "px";
      raf = requestAnimationFrame(loop);
    }
    function drop() {
      if (!running || !mover) return;
      const target = level === 0 ? stage.clientWidth / 2 : topX;
      const tolerance = level === 0 ? 60 : Math.max(16, 34 - level * 2);
      if (Math.abs(moverX - target) <= tolerance) {
        const d = document.createElement("span");
        d.className = "stack-dumpling";
        d.textContent = "🥟";
        d.style.left = moverX + "px";
        d.style.bottom = rowBottom(level) + "px";
        stage.appendChild(d);
        placed.push(d);
        if (level >= 4) {
          // Slide the tower down a row so it stays in view.
          placed.forEach((el) => {
            el.style.bottom = (parseFloat(el.style.bottom) - 30) + "px";
            if (parseFloat(el.style.bottom) < 0) el.remove();
          });
          placed = placed.filter((el) => el.isConnected);
        }
        topX = moverX;
        level += 1;
        speed = Math.min(4.2, speed * 1.09);
        status.textContent = `Height: ${level} 🥟 — tap to drop!`;
      } else {
        mover.classList.add("stack-miss");
        endGame();
      }
    }
    function endGame() {
      running = false;
      cancelAnimationFrame(raf);
      const isBest = level > best();
      try { if (isBest) localStorage.setItem(KEY, String(level)); } catch (e) { /* ignore */ }
      status.textContent =
        `${isBest && level > 0 ? "New best! " : ""}${randItem(C.STACK_MSGS || [""])} Stacked ${level} · Best ${best()}`;
      startBtn.hidden = false;
      if (isBest && level > 0 && window.MoEffects) window.MoEffects.confetti();
    }
    function startGame() {
      if (running) return;
      stage.querySelectorAll(".stack-dumpling, .stack-mover").forEach((el) => el.remove());
      placed = [];
      running = true; level = 0; t = 0; last = 0; speed = 1.6;
      topX = stage.clientWidth / 2;
      moverX = topX; // matches the CSS 50% start — a tap before the first frame must not read a stale 0
      mover = document.createElement("span");
      mover.className = "stack-mover";
      mover.textContent = "🥟";
      stage.appendChild(mover);
      startBtn.hidden = true;
      status.textContent = "Height: 0 🥟 — tap to drop!";
      raf = requestAnimationFrame(loop);
    }
    stage.addEventListener("click", drop);
    stage.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); drop(); }
    });
    startBtn.addEventListener("click", startGame);
  }

  // ---------- Paper fortune teller (idea 16) ----------
  function initTeller() {
    const step = document.getElementById("teller-step");
    const opts = document.getElementById("teller-options");
    const result = document.getElementById("teller-result");
    const reset = document.getElementById("teller-reset");
    if (!step || !opts || !C.TELLER) return;
    const COLORS = ["Red ❤️", "Gold 💛", "Pink 💗", "Green 💚"];
    function makeOpts(items, onPick) {
      opts.innerHTML = "";
      items.forEach((it) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "teller__opt";
        b.textContent = it;
        b.addEventListener("click", () => onPick(it));
        opts.appendChild(b);
      });
    }
    function startFlow() {
      if (result) result.textContent = "";
      if (reset) reset.hidden = true;
      step.textContent = "Pick a color:";
      makeOpts(COLORS, () => {
        step.textContent = "Now pick a number:";
        makeOpts(["1", "2", "3", "4"], () => {
          step.textContent = "Your fortune:";
          opts.innerHTML = "";
          if (result) result.textContent = randItem(C.TELLER);
          if (reset) reset.hidden = false;
        });
      });
    }
    if (reset) reset.addEventListener("click", startFlow);
    startFlow();
  }

  // ---------- Connect-the-stars heart (idea 7) ----------
  // Hand-placed so stars never overlap; order traces a heart outline (close 10→1
  // completes the top dip).
  function heartPoints() {
    // Hand-placed so the 44px star tap targets never collide. Even in the
    // narrowest (236px) container on a 320px phone, every neighbouring tap box
    // keeps ≥10px of clear space (and zero overlap). Paired with the 300px-tall
    // .constellation box; don't tweak either without re-checking spacing at 320px.
    return [
      { px: 50, py: 22 }, { px: 71, py: 8 }, { px: 88, py: 24 }, { px: 80, py: 46 },
      { px: 64, py: 69 }, { px: 50, py: 87 }, { px: 36, py: 69 }, { px: 20, py: 46 },
      { px: 12, py: 24 }, { px: 29, py: 8 },
    ];
  }
  function initConstellation() {
    const box = document.getElementById("constellation");
    const msg = document.getElementById("constellation-msg");
    if (!box) return;
    const pts = heartPoints();
    const N = pts.length;
    box.innerHTML = "";
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", "0 0 100 100");
    svg.setAttribute("preserveAspectRatio", "none");
    const poly = document.createElementNS(svgNS, "polyline");
    poly.setAttribute("fill", "none");
    poly.setAttribute("stroke", "#ffd24d");
    poly.setAttribute("stroke-width", "1.4");
    svg.appendChild(poly);
    box.appendChild(svg);
    const stars = [];
    let next = 0;
    function pointsStr(k, close) {
      let s = pts.slice(0, k).map((p) => p.px + "," + p.py).join(" ");
      if (close) s += " " + pts[0].px + "," + pts[0].py;
      return s;
    }
    pts.forEach((p, i) => {
      const s = document.createElement("button");
      s.type = "button";
      s.className = "star";
      s.style.left = p.px + "%";
      s.style.top = p.py + "%";
      s.textContent = String(i + 1);
      s.setAttribute("aria-label", "star " + (i + 1));
      s.dataset.index = String(i);
      s.addEventListener("click", () => {
        if (i === next) {
          s.classList.add("lit");
          next += 1;
          poly.setAttribute("points", pointsStr(next, next === N));
          if (next === N) {
            box.classList.add("done");
            if (msg) msg.textContent = "A heart, just for you 💛";
            if (window.MoEffects) window.MoEffects.petals();
          }
        } else {
          next = 0;
          stars.forEach((st) => st.classList.remove("lit"));
          box.classList.remove("done");
          poly.setAttribute("points", "");
          if (msg) msg.textContent = "Oops — start at 1 ✨";
        }
      });
      box.appendChild(s);
      stars.push(s);
    });
  }

  // ---------- Idle butterfly (idea 18) ----------
  function initIdle() {
    const IDLE_MS = window.MO_IDLE_MS || 15000;
    let timer = null;
    let active = false;
    function spawn() {
      if (active || prefersReduce()) return;
      active = true;
      const b = document.createElement("div");
      b.className = "butterfly";
      b.textContent = "🦋";
      document.body.appendChild(b);
      setTimeout(() => { b.remove(); active = false; }, 9000);
    }
    function reset() { clearTimeout(timer); timer = setTimeout(spawn, IDLE_MS); }
    ["pointerdown", "keydown", "scroll", "touchstart"].forEach((ev) =>
      window.addEventListener(ev, reset, { passive: true }));
    reset();
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
