export const WORDS = [
  // Animals
  "cat", "dog", "elephant", "giraffe", "monkey", "lion", "tiger", "bear", "penguin", "dolphin",
  "whale", "shark", "octopus", "rabbit", "kangaroo", "zebra", "panda", "fox", "owl", "frog",
  "turtle", "snake", "butterfly", "bee", "spider", "snail", "crab", "duck", "chicken", "pig",
  "sheep", "horse", "cow", "bat", "crocodile", "flamingo", "hedgehog", "parrot", "peacock", "squirrel",

  // Food & Drink
  "pizza", "burger", "taco", "sushi", "ice cream", "cookie", "cake", "donut", "apple", "banana",
  "watermelon", "strawberry", "pineapple", "sandwich", "popcorn", "hotdog", "cheese", "egg", "pancake",
  "spaghetti", "french fries", "coffee", "tea", "milkshake", "cupcake", "lollipop", "bread", "carrot", "broccoli",

  // Everyday Objects & Tools
  "chair", "table", "clock", "lamp", "television", "phone", "laptop", "camera", "guitar", "piano",
  "drum", "book", "pencil", "scissors", "umbrella", "glasses", "key", "backpack", "watch", "candle",
  "mirror", "pillow", "blanket", "toothbrush", "soap", "fork", "spoon", "knife", "cup", "bottle",
  "door", "window", "lightbulb", "battery", "bucket", "ladder", "hammer", "wrench", "paintbrush", "bell",

  // Clothes & Wearables
  "shirt", "pants", "shoes", "socks", "hat", "cap", "jacket", "dress", "tie", "scarf",
  "gloves", "boots", "sunglasses", "necklace", "ring", "crown", "helmet", "belt", "swimsuit", "mask",

  // Vehicles & Transportation
  "car", "bus", "train", "airplane", "helicopter", "rocket", "bicycle", "motorcycle", "boat", "ship",
  "submarine", "skateboard", "scooter", "tractor", "ambulance", "fire truck", "police car", "hot air balloon", "van", "truck",

  // Nature & Weather
  "sun", "moon", "star", "cloud", "rain", "rainbow", "snow", "snowflake", "lightning", "tornado",
  "mountain", "volcano", "ocean", "river", "tree", "flower", "grass", "cactus", "leaf", "island",
  "beach", "cave", "forest", "desert", "waterfall", "fire", "iceberg", "planet", "comet", "mushroom",

  // Places & Buildings
  "house", "castle", "hospital", "school", "tent", "bridge", "lighthouse", "stadium", "church", "pyramid",
  "supermarket", "airport", "park", "zoo", "cinema", "hotel", "barn", "bank", "restaurant", "playground",

  // Fantasy & Fun Characters
  "ghost", "vampire", "wizard", "pirate", "ninja", "robot", "alien", "superhero", "zombie", "mermaid",
  "dragon", "unicorn", "monster", "angel", "clown", "king", "queen", "knight", "astronaut", "detective"
];

export function cleanWord(word) {
  if (!word) return "";
  return word.trim().toLowerCase().replace(/\s+/g, " ");
}

export function getRandomWords(count = 3, customPool = null, exclude = []) {
  let source = WORDS;
  if (Array.isArray(customPool) && customPool.length >= count) {
    source = customPool.map(w => w.trim()).filter(Boolean);
  }
  const excludeLower = (exclude || []).map(w => (w || "").trim().toLowerCase());
  const available = source.filter(w => !excludeLower.includes(w.toLowerCase()));
  const pool = available.length >= count ? available : source;
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export function formatWordHint(word, revealedIndices = new Set()) {
  return word
    .split("")
    .map((char, index) => {
      if (char === " " || char === "-") return char;
      if (revealedIndices.has(index)) return char;
      return "_";
    })
    .join(" ");
}

export function getWordPattern(word) {
  // Returns word lengths e.g. "ice cream" => "_ _ _   _ _ _ _ _ (3, 5)"
  const parts = word.split(" ");
  const lengths = parts.map(p => p.length).join(", ");
  return {
    pattern: formatWordHint(word),
    lengths: `(${lengths})`
  };
}

export function levenshteinDistance(a, b) {
  const cleanA = cleanWord(a);
  const cleanB = cleanWord(b);

  const matrix = Array.from({ length: cleanA.length + 1 }, () =>
    Array(cleanB.length + 1).fill(0)
  );

  for (let i = 0; i <= cleanA.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= cleanB.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= cleanA.length; i++) {
    for (let j = 1; j <= cleanB.length; j++) {
      const cost = cleanA[i - 1] === cleanB[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[cleanA.length][cleanB.length];
}

export function isCloseGuess(guess, targetWord) {
  const a = cleanWord(guess);
  const b = cleanWord(targetWord);
  if (!a || !b || a === b) return false;
  // Ignore very short words to prevent false positives like 'cat' vs 'car'
  if (b.length < 4) return false;
  const dist = levenshteinDistance(a, b);
  return dist === 1;
}

