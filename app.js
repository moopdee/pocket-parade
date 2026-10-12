const SUITS = [
  { name: "spades", symbol: "♠", red: false },
  { name: "hearts", symbol: "♥", red: true },
  { name: "diamonds", symbol: "♦", red: true },
  { name: "clubs", symbol: "♣", red: false },
];
const RANKS = [
  { value: 2, label: "2" }, { value: 3, label: "3" }, { value: 4, label: "4" },
  { value: 5, label: "5" }, { value: 6, label: "6" }, { value: 7, label: "7" },
  { value: 8, label: "8" }, { value: 9, label: "9" }, { value: 10, label: "10" },
  { value: 11, label: "J" }, { value: 12, label: "Q" }, { value: 13, label: "K" },
  { value: 14, label: "A" },
];
const HANDS = [
  { name: "High Card", chips: 5, mult: 1 },
  { name: "Pair", chips: 10, mult: 2 },
  { name: "Two Pair", chips: 20, mult: 2 },
  { name: "Three of a Kind", chips: 30, mult: 3 },
  { name: "Straight", chips: 30, mult: 4 },
  { name: "Flush", chips: 35, mult: 4 },
  { name: "Full House", chips: 40, mult: 4 },
  { name: "Four of a Kind", chips: 60, mult: 7 },
  { name: "Straight Flush", chips: 100, mult: 8 },
];
const UPGRADES = [
  { id: "pocket-watch", name: "Pocket Watch", icon: "◷", description: "Add 8 chips to every hand.", price: 4, chips: 8 },
  { id: "lucky-button", name: "Lucky Button", icon: "✦", description: "Add +1 multiplier to every hand.", price: 5, mult: 1 },
  { id: "pair-of-socks", name: "Pair of Socks", icon: "≋", description: "Pairs and better get +3 multiplier.", price: 6, pairMult: 3 },
  { id: "marked-deck", name: "Marked Deck", icon: "▤", description: "Add 2 chips for every card you play.", price: 5, perCard: 2 },
  { id: "silver-coin", name: "Silver Coin", icon: "◇", description: "Earn $2 extra after each round.", price: 4, bonusCash: 2 },
  { id: "aces-up", name: "Aces Up", icon: "↑", description: "Aces add 12 bonus chips when scored.", price: 6, aceBonus: 12 },
];
const ROUND_TARGETS = [250, 520, 850];
const ROUND_NAMES = ["THE WARM-UP", "THE LATE SET", "THE HOUSE"];
const MAX_HAND_SIZE = 8;

const elements = {
  welcome: document.querySelector("#welcome-panel"),
  game: document.querySelector("#game-panel"),
  shop: document.querySelector("#shop-panel"),
  result: document.querySelector("#result-panel"),
  start: document.querySelector("#start-button"),
  cards: document.querySelector("#playing-cards"),
  play: document.querySelector("#play-button"),
  discard: document.querySelector("#discard-button"),
  preview: document.querySelector("#hand-preview"),
  selectionHint: document.querySelector("#selection-hint"),
  handCount: document.querySelector("#hand-count"),
  roundName: document.querySelector("#round-name"),
  anteNumber: document.querySelector("#ante-number"),
  anteName: document.querySelector("#ante-name"),
  money: document.querySelector("#money"),
  target: document.querySelector("#target-score"),
  score: document.querySelector("#round-score"),
  progress: document.querySelector("#score-progress"),
  handsLeft: document.querySelector("#hands-left"),
  discardsLeft: document.querySelector("#discards-left"),
  upgradeCount: document.querySelector("#upgrade-count"),
  upgrades: document.querySelector("#upgrade-list"),
  shopCards: document.querySelector("#shop-cards"),
  shopCopy: document.querySelector("#shop-copy"),
  shopStatus: document.querySelector("#shop-status"),
  continue: document.querySelector("#continue-button"),
  resultSymbol: document.querySelector("#result-symbol"),
  resultEyebrow: document.querySelector("#result-eyebrow"),
  resultTitle: document.querySelector("#result-title"),
  resultCopy: document.querySelector("#result-copy"),
  restart: document.querySelector("#restart-button"),
  deckStatus: document.querySelector("#deck-status"),
};

let state = "welcome";
let round = 0;
let money = 6;
let roundScore = 0;
let handsLeft = 4;
let discardsLeft = 3;
let deck = [];
let discardPile = [];
let hand = [];
let selected = new Set();
let ownedUpgrades = [];
let shopOffer = [];

function makeDeck() {
  const cards = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      cards.push({ ...rank, suit: suit.name, symbol: suit.symbol, red: suit.red, id: `${rank.value}-${suit.name}` });
    }
  }
  return shuffle(cards);
}

function shuffle(cards) {
  const shuffled = [...cards];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swap]] = [shuffled[swap], shuffled[index]];
  }
  return shuffled;
}

function drawCard() {
  if (!deck.length && discardPile.length) {
    deck = shuffle(discardPile);
    discardPile = [];
  }
  return deck.pop();
}

function drawToHand() {
  while (hand.length < MAX_HAND_SIZE) {
    const card = drawCard();
    if (!card) break;
    hand.push(card);
  }
}

function rankPips(rank) {
  return rank === 14 ? 11 : rank >= 11 ? 10 : rank;
}

function evaluateHand(cards) {
  const sorted = cards.map((card) => card.value).sort((a, b) => a - b);
  const counts = new Map();
  for (const rank of sorted) counts.set(rank, (counts.get(rank) || 0) + 1);
  const groups = [...counts.values()].sort((a, b) => b - a);
  const flush = cards.every((card) => card.suit === cards[0].suit);
  let straight = sorted.length === 5 && sorted.every((rank, index) => index === 0 || rank === sorted[index - 1] + 1);
  if (!straight && sorted.join(",") === "2,3,4,5,14") straight = true;

  let tier = 0;
  if (straight && flush) tier = 8;
  else if (groups[0] === 4) tier = 7;
  else if (groups[0] === 3 && groups[1] === 2) tier = 6;
  else if (flush) tier = 5;
  else if (straight) tier = 4;
  else if (groups[0] === 3) tier = 3;
  else if (groups[0] === 2 && groups[1] === 2) tier = 2;
  else if (groups[0] === 2) tier = 1;

  const handType = HANDS[tier];
  const cardChips = cards.reduce((sum, card) => sum + rankPips(card.value), 0);
  const aceBonus = ownedUpgrades.filter((item) => item.id === "aces-up").length
    * cards.filter((card) => card.value === 14).length * 12;
  const flatChips = ownedUpgrades.reduce((sum, item) => sum + (item.chips || 0), 0);
  const perCardChips = ownedUpgrades.reduce((sum, item) => sum + (item.perCard || 0), 0) * cards.length;
  const flatMult = ownedUpgrades.reduce((sum, item) => sum + (item.mult || 0), 0);
  const pairMult = tier >= 1
    ? ownedUpgrades.reduce((sum, item) => sum + (item.pairMult || 0), 0)
    : 0;
  const chips = handType.chips + cardChips + flatChips + perCardChips + aceBonus;
  const mult = handType.mult + flatMult + pairMult;
  return { name: handType.name, chips, mult, score: chips * mult };
}

function renderCards() {
  elements.cards.replaceChildren();
  hand.forEach((card) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `playing-card${card.red ? " red-suit" : ""}${card.value >= 11 ? " face-card" : ""}${selected.has(card.id) ? " selected" : ""}`;
    button.setAttribute("aria-label", `${card.label} of ${card.suit}${selected.has(card.id) ? ", selected" : ""}`);
    button.setAttribute("aria-pressed", String(selected.has(card.id)));
    button.disabled = state !== "playing";
    button.innerHTML = `<span class="card-corner">${card.label}<small>${card.symbol}</small></span><span class="card-pip">${card.symbol}</span>${card.value >= 11 ? `<span class="face-letter">${card.label}</span>` : ""}`;
    button.addEventListener("click", () => toggleCard(card.id));
    elements.cards.append(button);
  });
  elements.handCount.textContent = `${hand.length} CARDS`;
  elements.deckStatus.textContent = `${deck.length} IN DECK`;
}

function renderUpgrades() {
  elements.upgrades.replaceChildren();
  for (const upgrade of ownedUpgrades) {
    const chip = document.createElement("span");
    chip.className = "upgrade-chip";
    chip.textContent = `${upgrade.icon} ${upgrade.name}`;
    elements.upgrades.append(chip);
  }
  elements.upgradeCount.textContent = ownedUpgrades.length ? `${ownedUpgrades.length} ACTIVE` : "NONE YET";
}

function renderStatus() {
  const target = ROUND_TARGETS[round] || ROUND_TARGETS.at(-1);
  elements.roundName.textContent = `ROUND ${String(round + 1).padStart(2, "0")} · ${ROUND_NAMES[round] || "THE HOUSE"}`;
  elements.anteNumber.textContent = String(round + 1).padStart(2, "0");
  elements.anteName.textContent = ROUND_NAMES[round] || "THE HOUSE";
  elements.money.textContent = `$${money}`;
  elements.target.textContent = target.toLocaleString();
  elements.score.textContent = roundScore.toLocaleString();
  elements.handsLeft.textContent = handsLeft;
  elements.discardsLeft.textContent = discardsLeft;
  elements.progress.style.width = `${Math.min(100, (roundScore / target) * 100)}%`;
  elements.play.disabled = state !== "playing" || selected.size !== 5;
  elements.discard.disabled = state !== "playing" || selected.size === 0 || discardsLeft === 0;
  elements.selectionHint.textContent = `${selected.size} / 5 SELECTED`;
  if (selected.size === 5) {
    const result = evaluateHand(hand.filter((card) => selected.has(card.id)));
    elements.preview.innerHTML = `<strong>${result.name}</strong> · ${result.chips} × ${result.mult} = ${result.score} chips`;
  } else {
    elements.preview.textContent = selected.size ? "Select exactly five cards to play." : "Pick five cards to see your hand.";
  }
  renderUpgrades();
}

function showPanel(panel) {
  for (const candidate of [elements.welcome, elements.game, elements.shop, elements.result]) {
    candidate.classList.toggle("hidden", candidate !== panel);
  }
}

function startRun() {
  round = 0;
  money = 6;
  ownedUpgrades = [];
  beginRound();
}

function beginRound() {
  state = "playing";
  roundScore = 0;
  handsLeft = 4;
  discardsLeft = 3;
  deck = makeDeck();
  discardPile = [];
  hand = [];
  selected.clear();
  drawToHand();
  showPanel(elements.game);
  renderCards();
  renderStatus();
}

function toggleCard(cardId) {
  if (state !== "playing") return;
  if (selected.has(cardId)) selected.delete(cardId);
  else if (selected.size < 5) selected.add(cardId);
  renderCards();
  renderStatus();
}

function removeSelected() {
  const used = hand.filter((card) => selected.has(card.id));
  discardPile.push(...used);
  hand = hand.filter((card) => !selected.has(card.id));
  selected.clear();
  drawToHand();
}

function playHand() {
  if (state !== "playing" || selected.size !== 5) return;
  const played = hand.filter((card) => selected.has(card.id));
  const result = evaluateHand(played);
  roundScore += result.score;
  handsLeft -= 1;
  removeSelected();

  if (roundScore >= ROUND_TARGETS[round]) {
    completeRound();
    return;
  }
  if (handsLeft <= 0) {
    finishRun(false);
    return;
  }
  renderCards();
  renderStatus();
  elements.preview.innerHTML = `<strong>${result.name}</strong> scored ${result.score} chips.`;
}

function discardSelected() {
  if (state !== "playing" || selected.size === 0 || discardsLeft <= 0) return;
  discardsLeft -= 1;
  removeSelected();
  renderCards();
  renderStatus();
}

function completeRound() {
  state = "shop";
  money += 3 + handsLeft + ownedUpgrades.reduce((sum, item) => sum + (item.bonusCash || 0), 0);
  if (round === ROUND_TARGETS.length - 1) {
    finishRun(true);
    return;
  }
  showShop();
}

function showShop() {
  const shuffled = shuffle(UPGRADES);
  shopOffer = shuffled.slice(0, 3);
  elements.shopCards.replaceChildren();
  elements.shopCopy.textContent = `Round ${round + 1} clear! You earned cash. Choose an advantage, or head back to the table.`;
  elements.shopStatus.textContent = `You have $${money}.`;
  for (const upgrade of shopOffer) {
    const card = document.createElement("article");
    card.className = "upgrade-card";
    const title = document.createElement("h3");
    title.textContent = upgrade.name;
    const description = document.createElement("p");
    description.textContent = upgrade.description;
    const icon = document.createElement("span");
    icon.className = "upgrade-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = upgrade.icon;
    const buy = document.createElement("button");
    buy.type = "button";
    buy.className = "buy-button";
    buy.textContent = `TAKE · $${upgrade.price}`;
    buy.disabled = money < upgrade.price;
    buy.addEventListener("click", () => buyUpgrade(upgrade));
    card.append(icon, title, description, buy);
    elements.shopCards.append(card);
  }
  showPanel(elements.shop);
}

function buyUpgrade(upgrade) {
  if (state !== "shop" || money < upgrade.price) return;
  money -= upgrade.price;
  ownedUpgrades.push(upgrade);
  elements.money.textContent = `$${money}`;
  elements.shopStatus.textContent = `${upgrade.name} added to your advantages.`;
  for (const button of elements.shopCards.querySelectorAll(".buy-button")) {
    const price = Number(button.textContent.match(/\$(\d+)/)?.[1]);
    button.disabled = money < price;
  }
}

function finishRun(won) {
  state = won ? "won" : "lost";
  showPanel(elements.result);
  if (won) {
    elements.resultSymbol.textContent = "♛";
    elements.resultEyebrow.textContent = "THE HOUSE IS YOURS";
    elements.resultTitle.textContent = "What a lovely run.";
    elements.resultCopy.textContent = `You cleared all three rounds with ${ownedUpgrades.length} house advantage${ownedUpgrades.length === 1 ? "" : "s"} in your pocket. One more hand?`;
  } else {
    elements.resultSymbol.textContent = "♠";
    elements.resultEyebrow.textContent = "THE TABLE WINS THIS TIME";
    elements.resultTitle.textContent = "The cards had other plans.";
    elements.resultCopy.textContent = `You scored ${roundScore.toLocaleString()} of ${ROUND_TARGETS[round].toLocaleString()} chips in round ${round + 1}. Shuffle up and try a different strategy.`;
  }
}

elements.start.addEventListener("click", startRun);
elements.play.addEventListener("click", playHand);
elements.discard.addEventListener("click", discardSelected);
elements.continue.addEventListener("click", () => {
  if (state !== "shop") return;
  round += 1;
  beginRound();
});
elements.restart.addEventListener("click", () => {
  state = "welcome";
  showPanel(elements.welcome);
});

showPanel(elements.welcome);
