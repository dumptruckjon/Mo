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

    // Wishes carried up by released sky lanterns.
    WISHES: [
      "A wish for endless dumplings 🥟",
      "A wish for slow mornings together ☀️",
      "A wish that you always feel loved 💗",
      "A wish for more boba runs 🧋",
      "A wish for a garden that never stops blooming 🌷",
      "A wish for laughter until it hurts 😂",
      "A wish for a lifetime of you 🌙",
      "A wish for sweet dreams tonight ✨",
    ],

    // The love letter that types itself out when she enters the festival.
    LETTER: [
      "Dear Mo — every day with you is the festival. Yours, always. 💌",
      "Mo, you make ordinary days feel like fireworks. Forever yours. 🎆",
      "To Mo: of all my favorite places, next to you is the best. 💕",
    ],

    // Endless love-note draw (a big, bottomless pool).
    LOVE_NOTES: [
      "You're the best part of every day.",
      "I'd choose you in every lifetime. 💞",
      "You make my whole world softer.",
      "Being loved by you is my luckiest thing. 🍀",
      "You're my favorite hello and my safest place.",
      "Even my bad days are good with you in them.",
      "You + me is my favorite story. 📖",
      "I love your laugh more than anything.",
      "You're proof that good things are real.",
      "Home is just a word for being near you. 🏠",
      "You make me want to be sweeter. 🍯",
      "My heart still skips for you. 💓",
      "You are deeply, ridiculously loved.",
      "Thank you for being exactly you.",
      "I could fall for you a thousand more times.",
      "You're the wish I didn't know to make. ✨",
    ],

    // Origami fortune-teller (cootie catcher) outcomes.
    TELLER: [
      "Today holds a happy surprise. 🎁",
      "Someone adores you more than you know. 💗",
      "Sweetness is coming your way. 🍬",
      "A good day to be spoiled a little. 🌷",
      "Expect a hug when you least expect it. 🤗",
      "Luck and love are on your side. 🍀",
      "A kiss is owed and will be paid. 😘",
      "Your smile will fix someone's whole day. 😊",
    ],

    // Reactions when she taps the festival mascot.
    MASCOT_REACTIONS: [
      "招财! Good luck for Mo! 🧧",
      "Mew~ you're the best! 😺",
      "I'm your lucky charm today 🍀",
      "Pspsps… come play! 🐾",
      "Purrfect. Just like you 💖",
      "Tap tap! More treats! 🍡",
    ],

    // Spinner segments for the "what shall we do?" wheel.
    WHEEL: [
      "Dumpling dinner 🥟",
      "Boba run 🧋",
      "Movie night 🎬",
      "Dessert first 🍰",
      "Long walk 🚶",
      "Lazy cuddles 🛋️",
      "Dance in the kitchen 💃",
      "Stargaze 🌌",
    ],

    // Slot-machine reel symbols + the jackpot lines (shown on 3-of-a-kind).
    SLOT: ["🥟", "🧋", "🍡", "🥮", "🍰", "🧧"],
    SLOT_PRIZES: [
      "JACKPOT! A real date, your pick. 💕",
      "Three of a kind! Dessert is on me. 🍰",
      "Winner! Redeem one giant hug. 🤗",
      "Lucky you — a kiss is owed. 😘",
    ],

    // Noodle Catch: the treats that rain down, and end-of-round cheers.
    CATCH_ITEMS: ["🥟", "🍜", "🧋", "🍡", "🥮", "🍬", "🍥"],
    CATCH_MSGS: [
      "A feast! You caught dinner for two 🍜💕",
      "Quick chopsticks, Mo! 🥢",
      "Not a single dumpling wasted 🥟",
      "The noodle gods smile upon you ✨",
    ],

    // Tea Ceremony: the four cups shown in the grid + end-of-game cheers.
    TEA_CUPS: ["🍵", "🧋", "🫖", "☕"],
    TEA_MSGS: [
      "A perfect pour! 🍵",
      "Tea master Mo strikes again 🫖",
      "Steeped in brilliance ✨",
      "Boba-lievable memory! 🧋",
    ],

    // Dumpling Stack: end-of-game cheers.
    STACK_MSGS: [
      "A tower of deliciousness! 🥟",
      "Dumpling architect of the year 🏗️",
      "Steamy skyline achieved 🌆",
      "One wobble away from greatness 💛",
    ],

    // Memory Lane: one lantern per real milestone, in order.
    // ⚠️ PLACEHOLDERS — Jon: replace every entry with your real story!
    MILESTONES: [
      { when: "The day we met", scene: "✨👀✨", note: "Placeholder: the day the whole world got noticeably better." },
      { when: "Our first date", scene: "🥟🍜🧋", note: "Placeholder: you ordered dumplings. I was done for." },
      { when: "The first 'I love you'", scene: "💛🌙💛", note: "Placeholder: said quietly, meant enormously." },
      { when: "The proposal", scene: "💍🎆😭", note: "Placeholder: best yes in recorded history." },
      { when: "Our wedding day", scene: "👰🤵💒", note: "Placeholder: everyone cried. Especially me." },
      { when: "Today", scene: "🏮💖🏮", note: "Still my favorite person. The best is still cooking." },
    ],

    // Special days the site remembers by itself. Keys are "MM-DD".
    SPECIAL_DAYS: [
      {
        date: "01-20", // Mo's birthday
        label: "Mo's birthday",
        emoji: "🎂",
        banner: "生日快乐, Mo! Happy birthday! The whole festival is your party today 🎂🏮",
        note: "It's your birthday, so today's note is simple: the world is better because you're in it. Cake for breakfast is not only allowed, it's auspicious.",
      },
      {
        date: "10-16", // our anniversary
        label: "our anniversary",
        emoji: "💍",
        banner: "Happy anniversary, my love! 结婚快乐! Another year of us 💍💛",
        note: "Happy anniversary! Marrying you remains my best decision, narrowly beating 'let's get dumplings AND boba.'",
      },
      {
        date: "02-14",
        label: "Valentine's Day",
        emoji: "💘",
        banner: "情人节快乐! Happy Valentine's Day to my favorite valentine 💘",
        note: "Roses are red, dumplings are steamed, you're even better than the wife I dreamed.",
      },
    ],

    // The hidden 888 jackpot (8 fast taps on the lucky cat). One of a kind.
    SECRET_888: "8️⃣8️⃣8️⃣ 发发发! You found the luckiest secret on the whole site. It exists to tell you one thing, hidden where only a serial cat-tapper would look: of all the luck I've ever had, you are the jackpot, Mo. 🧧💛",
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = CONTENT;
  } else {
    global.MoContent = CONTENT;
  }
})(typeof window !== "undefined" ? window : globalThis);
