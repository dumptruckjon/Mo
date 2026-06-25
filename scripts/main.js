// Mo's website — vanilla JS, no dependencies, no build step.

// TODO (Jon): swap these out for real inside jokes and personal ones.
const COMPLIMENTS = [
  "You're the only person who laughs at my jokes. That's the whole economy.",
  "Scientists confirm: you light up rooms. Also hallways. Possibly parking lots.",
  "You're 100% that person. The good kind. The best kind.",
  "If being wonderful were illegal, you'd be in a LOT of trouble.",
  "You make Mondays slightly less of a war crime.",
  "Objectively, statistically, undeniably: a delight.",
  "You're proof the universe occasionally gets something exactly right.",
  "Ten out of ten cats would knock things off a table for your attention.",
  "Your vibe? Immaculate. Your snacks? Shared. A true legend.",
  "You're my favorite notification.",
];

function pickDifferent(list, current) {
  if (list.length <= 1) return list[0];
  let next = current;
  while (next === current) {
    next = list[Math.floor(Math.random() * list.length)];
  }
  return next;
}

document.addEventListener("DOMContentLoaded", () => {
  // --- Compliment generator ---
  const complimentEl = document.getElementById("compliment");
  const complimentBtn = document.getElementById("compliment-btn");
  let lastCompliment = "";

  complimentBtn?.addEventListener("click", () => {
    lastCompliment = pickDifferent(COMPLIMENTS, lastCompliment);
    complimentEl.textContent = lastCompliment;
  });

  // --- Appreciation counter (persists across visits) ---
  const counterEl = document.getElementById("counter");
  const counterBtn = document.getElementById("counter-btn");
  const STORAGE_KEY = "mo-appreciation-count";

  let count = Number(localStorage.getItem(STORAGE_KEY)) || 0;
  counterEl.textContent = count;

  counterBtn?.addEventListener("click", () => {
    count += 1;
    counterEl.textContent = count;
    localStorage.setItem(STORAGE_KEY, String(count));

    // Tiny celebration on milestones.
    if (count % 10 === 0) {
      counterEl.textContent = `${count} 🎉`;
    }
  });
});
