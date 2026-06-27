// Front-door quiz for Mo. Three random questions from the pool; answer all
// correctly to unlock the festival. Any wrong answer restarts at question 1.
// Vanilla JS, no dependencies.

(function () {
  const C = (typeof window !== "undefined" && window.MoContent) || {};

  // Register the service worker (PWA / offline). Best-effort.
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch((e) =>
        console.warn("Mo: service worker registration failed:", e)
      );
    });
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  const randItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const reduceMotion = () =>
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.addEventListener("DOMContentLoaded", () => {
    try { initFoodBackground(); } catch (e) { console.error(e); }
    try { initQuiz(); } catch (e) { console.error("Mo: quiz failed to start:", e); }
  });

  // Shared festive backdrop (same drifting food as the festival).
  function initFoodBackground() {
    const layer = document.getElementById("food-bg");
    if (!layer || !C.FOODS) return;
    for (let i = 0; i < 14; i++) {
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

  function initQuiz() {
    const pool = C.QUIZ;
    const dotsEl = document.getElementById("quiz-dots");
    const questionEl = document.getElementById("quiz-question");
    const optionsEl = document.getElementById("quiz-options");
    const feedbackEl = document.getElementById("quiz-feedback");
    const card = optionsEl && optionsEl.closest(".card");
    const prizeEl = document.getElementById("quiz-prize");
    const progressHeading = document.getElementById("quiz-h");
    if (!pool || !pool.length || !questionEl || !optionsEl) return;

    // Pick 3 random questions for this visit (a wrong answer keeps the same 3).
    const quiz = shuffle(pool).slice(0, Math.min(3, pool.length));
    let current = 0;
    let locked = false;

    function renderDots() {
      if (!dotsEl) return;
      dotsEl.innerHTML = "";
      quiz.forEach((_, i) => {
        const dot = document.createElement("span");
        dot.className = "quiz__dot" + (i < current ? " done" : i === current ? " active" : "");
        dotsEl.appendChild(dot);
      });
    }

    function render() {
      const item = quiz[current];
      if (progressHeading) progressHeading.textContent = `Question ${current + 1} of ${quiz.length}`;
      renderDots();
      questionEl.textContent = item.q;
      optionsEl.innerHTML = "";
      shuffle(item.options).forEach((opt) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "quiz__option";
        btn.textContent = opt;
        btn.addEventListener("click", () => choose(opt, btn));
        optionsEl.appendChild(btn);
      });
    }

    function choose(opt, btn) {
      if (locked) return;
      const item = quiz[current];
      if (opt === item.answer) {
        btn.classList.add("correct");
        current += 1;
        if (current >= quiz.length) {
          win();
        } else {
          feedbackEl.textContent = "Correct! 🎯";
          feedbackEl.className = "quiz__feedback good";
          locked = true;
          setTimeout(() => {
            locked = false;
            feedbackEl.textContent = "";
            feedbackEl.className = "quiz__feedback";
            render();
          }, 600);
        }
      } else {
        // Wrong → a cheeky message, a little buzz, and restart from question 1.
        btn.classList.add("wrong");
        if (navigator.vibrate) { try { navigator.vibrate(60); } catch (e) { /* ignore */ } }
        feedbackEl.textContent = (C.WRONG_REACTIONS && randItem(C.WRONG_REACTIONS)) ||
          "Not quite! Back to the start 💕";
        feedbackEl.className = "quiz__feedback bad";
        locked = true;
        setTimeout(() => {
          locked = false;
          current = 0;
          feedbackEl.textContent = "";
          feedbackEl.className = "quiz__feedback";
          render();
        }, 1200);
      }
    }

    function win() {
      if (card) card.hidden = true;
      if (prizeEl) {
        prizeEl.hidden = false;
        prizeEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      confetti();
    }

    render();
  }

  // ---------- Confetti for the perfect-score moment ----------
  function confetti() {
    if (reduceMotion()) return;
    const canvas = document.createElement("canvas");
    canvas.style.cssText =
      "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:50";
    document.body.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    if (!ctx) { canvas.remove(); return; }
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const COLORS = ["#ffd24d", "#ff5e3a", "#ff2d55", "#ffffff", "#ff9500", "#6fdc6f"];
    const pieces = [];
    for (let i = 0; i < 140; i++) {
      pieces.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 80,
        y: canvas.height / 3 + (Math.random() - 0.5) * 40,
        vx: (Math.random() - 0.5) * 9,
        vy: Math.random() * -9 - 3,
        size: 4 + Math.random() * 6,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
        life: 1,
      });
    }

    let frames = 0;
    function tick() {
      frames += 1;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      for (const p of pieces) {
        p.vy += 0.25; // gravity
        p.vx *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        p.life -= 0.006;
        if (p.life > 0 && p.y < canvas.height + 20) {
          alive = true;
          ctx.save();
          ctx.globalAlpha = Math.max(p.life, 0);
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
          ctx.restore();
        }
      }
      if (alive && frames < 400) {
        requestAnimationFrame(tick);
      } else {
        canvas.remove();
      }
    }
    requestAnimationFrame(tick);
  }
})();
