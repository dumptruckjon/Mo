// Mo's festive countdown — vanilla JS, no dependencies, no build step.

// A pool of short jokes in Simplified Chinese (with pinyin + English).
// A random one is shown each time the countdown reaches zero.
// TODO (Jon): add your own inside jokes here anytime — keep zh/punch/pinyin/en.
const JOKES = [
  {
    zh: "什么东西越洗越脏？",
    punch: "——水！💦",
    pinyin: "Shénme dōngxi yuè xǐ yuè zāng? Shuǐ!",
    en: '"What gets dirtier the more you wash it? Water!" 😆',
  },
  {
    zh: "谁是百兽之王？",
    punch: "——动物园园长！🦁",
    pinyin: "Shéi shì bǎishòu zhī wáng? Dòngwùyuán yuánzhǎng!",
    en: '"Who is the king of all the beasts? The zoo director!"',
  },
  {
    zh: "什么东西天气越热，它爬得越高？",
    punch: "——温度计！🌡️",
    pinyin: "Shénme dōngxi tiānqì yuè rè, tā pá de yuè gāo? Wēndùjì!",
    en: '"What climbs higher the hotter it gets? A thermometer!"',
  },
  {
    zh: "什么布剪不断？",
    punch: "——瀑布！🌊",
    pinyin: "Shénme bù jiǎn bù duàn? Pùbù!",
    en: '"What cloth (bù) can\'t be cut? A waterfall (pùbù)!"',
  },
  {
    zh: "什么车寸步难行？",
    punch: "——风车！🎡",
    pinyin: "Shénme chē cùnbù nánxíng? Fēngchē!",
    en: '"What vehicle can\'t move an inch? A pinwheel (fēngchē)!"',
  },
  {
    zh: "为什么北极熊不吃企鹅？",
    punch: "——因为它们够不着！🐻‍❄️🐧",
    pinyin: "Wèishéme běijíxióng bù chī qǐ'é? Yīnwèi tāmen gòu bù zháo!",
    en: '"Why don\'t polar bears eat penguins? They can\'t reach them!"',
  },
];

function pickJoke(currentIndex) {
  if (JOKES.length <= 1) return 0;
  let next = currentIndex;
  while (next === currentIndex) {
    next = Math.floor(Math.random() * JOKES.length);
  }
  return next;
}

document.addEventListener("DOMContentLoaded", () => {
  const countdownEl = document.getElementById("countdown");
  const jokeEl = document.getElementById("joke");
  const restartBtn = document.getElementById("restart");
  const jokeZh = document.getElementById("joke-zh");
  const jokePunch = document.getElementById("joke-punch");
  const jokePinyin = document.getElementById("joke-pinyin");
  const jokeEn = document.getElementById("joke-en");

  const START = 5;
  let timerId = null;
  let lastJoke = -1;

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
      } else {
        clearInterval(timerId);
        reachZero();
      }
    }, 1000);
  }

  function reachZero() {
    // Pick and show a fresh random joke.
    lastJoke = pickJoke(lastJoke);
    const joke = JOKES[lastJoke];
    jokeZh.textContent = joke.zh;
    jokePunch.textContent = joke.punch;
    jokePinyin.textContent = joke.pinyin;
    jokeEn.textContent = joke.en;

    countdownEl.hidden = true;
    jokeEl.hidden = false;
    restartBtn.hidden = false;
    fireworks.celebrate();
  }

  restartBtn.addEventListener("click", startCountdown);

  // ---------- Fireworks ----------
  const fireworks = createFireworks(document.getElementById("fireworks"));
  fireworks.start();

  startCountdown();
});

// ---------- Fireworks (canvas particle system) ----------
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
      launch(canvas.width * 0.3, canvas.height * 0.35);
      launch(canvas.width * 0.7, canvas.height * 0.3);
      launch(canvas.width * 0.5, canvas.height * 0.45);
    },
  };
}
