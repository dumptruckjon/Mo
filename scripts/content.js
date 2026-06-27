// All of Mo's site content lives here so it's easy to edit and easy to test.
// Works in the browser (sets window.MoContent) and in Node tests (module.exports).
// TODO (Jon): personalize anytime — add inside jokes, real love notes, her
// favorite flowers/foods/sweets. Keep the same shapes and the tests will pass.
(function (global) {
  const CONTENT = {
    // Countdown start value (kept here so tests and UI share one source of truth).
    COUNTDOWN_START: 5,

    // Short jokes in Simplified Chinese (zh + punch line) with pinyin + English.
    JOKES: [
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
    ],

    // Sweet "fortune cookie" love notes (Chinese-food + sweets + romance).
    FORTUNES: [
      "幸运饼干 says: the best seat at any table is the one next to you. 🥢",
      "A lucky day — someone is thinking about you right now. (It's me.) 💌",
      "You are the extra dumpling in life's steamer basket. 🥟",
      "Sweet things are headed your way, starting with this little note. 🍬",
      "Your smile could light a thousand lanterns. 🏮",
      "Fortune says: you are deeply, ridiculously, completely loved. 💗",
      "The garden of your kindness blooms all year round. 🌷",
      "You make ordinary days taste like a feast. 🍜",
      "Today's special: a little extra joy, served just for you. ✨",
      "Lucky numbers: all of them — because you're a catch. 🍀",
    ],

    // Flowers the garden can bloom.
    FLOWERS: ["🌸", "🌷", "🌺", "🌻", "🌼", "🪷", "💐", "🏵️", "🌹"],

    // Chinese food that gently drifts across the background.
    FOODS: ["🥟", "🍜", "🥡", "🍚", "🧋", "🍡", "🥮", "🍤", "🫖", "🍥", "🥢", "🍣"],

    // Sweets that rain down with the fireworks.
    CANDY: ["🍬", "🍭", "🍡", "🥮", "🧁", "🍥", "🧧", "🍮"],

    // Redeemable "treat coupons" hidden inside the lucky red envelopes.
    // TODO (Jon): make these real — favorite restaurant, inside jokes, etc.
    COUPONS: [
      "🥟 Coupon: one homemade dumpling dinner, on me.",
      "🧋 Coupon: a boba run — your order, my treat.",
      "💆 Coupon: a 15-minute shoulder rub, no questions asked.",
      "🌷 Coupon: fresh flowers, just because.",
      "🍰 Coupon: dessert first tonight — rules don't apply.",
      "🎬 Coupon: movie night, you pick, I make the snacks.",
      "☕ Coupon: breakfast in bed this weekend.",
      "🤗 Coupon: one extra-long hug, redeemable anytime.",
    ],

    // Emoji used as pairs in the memory-match game (each appears twice).
    MEMORY: ["🥟", "🍜", "🧋", "🥮", "🍡", "🍤"],

    // A different one of these shows each day (date-seeded, same all day).
    // TODO (Jon): swap in personal ones whenever you like.
    DAILY_NOTES: [
      "Day after day, it's still you. 💖",
      "Good morning to the best part of my day.",
      "You + me = my favorite equation.",
      "If I had to do it all again, I'd pick you faster.",
      "You make ordinary days feel like a celebration.",
      "Somewhere right now, I'm thinking about you.",
      "You're my favorite hello and my hardest goodbye.",
      "Lucky isn't a strong enough word for having you.",
      "Today's forecast: 100% chance of loving you.",
      "You're proof my best decisions weren't accidents.",
      "Every day with you is my favorite day. (Yes, again.)",
      "You're the sweetest thing on any menu. 🍰",
      "Home isn't a place — it's wherever you are.",
      "Still smitten. Still yours.",
      "Thanks for being my favorite person, today and always.",
      "I'd cross any room just to get to you.",
    ],

    // Front-door quiz POOL. Each visit shows 3 random questions; any wrong
    // answer restarts. `answer` must exactly match one of `options` (options are
    // shuffled at render time). TODO (Jon): add your own inside jokes here — the
    // first three are yours; the rest are cute filler you can replace.
    QUIZ: [
      {
        q: "Who is the naughtiest?",
        answer: "Mo",
        options: ["Mo", "Jon", "Josh", "Not me! 🙊"],
      },
      {
        q: "What is Molly's favorite hobby?",
        answer: "Pickin' and fartin'",
        options: ["Pickin' and fartin'", "Gardening", "Cooking", "Cleaning"],
      },
      {
        q: "Which gushis are the most commonly shared gushis?",
        answer: "LooAyi gushi",
        options: ["LooAyi gushi", "Huali gushi", "Josh gushi", "Baba gushi"],
      },
      {
        q: "Who deserves dessert first, always?",
        answer: "Mo",
        options: ["Mo", "Jon", "Josh", "The dog 🐶"],
      },
      {
        q: "Best way to spend a Saturday?",
        answer: "Together 💕",
        options: ["Together 💕", "Doing chores", "Working", "Taxes 🧾"],
      },
      {
        q: "What's the superior food group?",
        answer: "Dumplings 🥟",
        options: ["Dumplings 🥟", "Salad", "Plain rice", "Air"],
      },
      {
        q: "How much does Jon love Mo?",
        answer: "To the moon and back 🌙",
        options: ["To the moon and back 🌙", "A little", "Meh", "It's complicated"],
      },
    ],

    // Playful messages shown when she gets one wrong (the quiz restarts).
    WRONG_REACTIONS: [
      "Nope! Back to the start, cutie 💕",
      "Ha! Not quite — try again 😜",
      "Wrong! But I still love you. Restart 💖",
      "Close… but no dumpling 🥟 From the top!",
      "Eep! That one resets us. Again! 🔁",
      "Nice try, troublemaker 😏 Start over!",
      "Incorrect — but adorable. Back to Q1 💋",
    ],

    // Hidden prizes revealed by scratching the scratch-off card.
    SCRATCH: [
      "💖 You're my favorite person. Always.",
      "🥠 Lucky you — a kiss is owed. Redeem now.",
      "🍰 Surprise: dessert is on me tonight.",
      "🌷 You make everything bloom.",
      "🧧 A little luck and a lot of love, just for you.",
      "😘 Scratch complete: one free smooch.",
      "🍜 You + me + noodles = the perfect night.",
      "✨ The real prize is you. (Cheesy, but true.)",
    ],
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = CONTENT;
  } else {
    global.MoContent = CONTENT;
  }
})(typeof window !== "undefined" ? window : globalThis);
