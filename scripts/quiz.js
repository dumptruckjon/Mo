// Front-door quiz for Mo. Answer all 3 correctly to unlock the festival.
// Any wrong answer restarts from question 1. Vanilla JS, no dependencies.

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
    const quiz = C.QUIZ;
    const dotsEl = document.getElementById("quiz-dots");
    const questionEl = document.getElementById("quiz-question");
    const optionsEl = document.getElementById("quiz-options");
    const feedbackEl = document.getElementById("quiz-feedback");
    const card = optionsEl && optionsEl.closest(".card");
    const prizeEl = document.getElementById("quiz-prize");
    const progressHeading = document.getElementById("quiz-h");
    if (!quiz || !quiz.length || !questionEl || !optionsEl) return;

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
          setTimeout(() => { locked = false; feedbackEl.textContent = ""; feedbackEl.className = "quiz__feedback"; render(); }, 600);
        }
      } else {
        // Wrong → restart from question 1.
        btn.classList.add("wrong");
        feedbackEl.textContent = "Not quite! Back to the start 💕";
        feedbackEl.className = "quiz__feedback bad";
        locked = true;
        setTimeout(() => {
          locked = false;
          current = 0;
          feedbackEl.textContent = "";
          feedbackEl.className = "quiz__feedback";
          render();
        }, 1100);
      }
    }

    function win() {
      if (card) card.hidden = true;
      if (prizeEl) {
        prizeEl.hidden = false;
        prizeEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }

    render();
  }
})();
