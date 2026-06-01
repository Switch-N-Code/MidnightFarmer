const DIFFICULTIES = {
  easy: {
    label: "Easy", moon: "🌕", crops: 8, turns: 17, strikes: 3,
    hsKey: "midnightFarmer_hs_easy",
    streakKey: "midnightFarmer_streak_easy",
    bestStreakKey: "midnightFarmer_bestStreak_easy",
    streakThreshold: 13,
  },
  normal: {
    label: "Normal", moon: "🌙", crops: 12, turns: 13, strikes: 3,
    hsKey: "midnightFarmer_hs_normal",
    streakKey: "midnightFarmer_streak_normal",
    bestStreakKey: "midnightFarmer_bestStreak_normal",
    streakThreshold: 10,
  },
  hard: {
    label: "Hard", moon: "🌑", crops: 16, turns: 9, strikes: 2,
    hsKey: "midnightFarmer_hs_hard",
    streakKey: "midnightFarmer_streak_hard",
    bestStreakKey: "midnightFarmer_bestStreak_hard",
    streakThreshold: 7,
  },
};

let currentDiff    = DIFFICULTIES.normal;
let selectedDiffKey = "normal";

let RIVAL_GRID = [];
let playerGrid = [];
let turns      = 0;
let maxTurns   = 0;
let maxStrikes = 0;
let strikes    = 0;
let planted    = 0;
let gameOver   = false;

function generateRivalGrid(cropCount) {
  const flat = Array(cropCount).fill("x").concat(Array(25 - cropCount).fill("o"));
  for (let i = flat.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [flat[i], flat[j]] = [flat[j], flat[i]];
  }
  const grid = [];
  for (let r = 0; r < 5; r++) grid.push(flat.slice(r * 5, r * 5 + 5));
  return grid;
}

function initGrid() {
  RIVAL_GRID = generateRivalGrid(currentDiff.crops);
  playerGrid = Array.from({ length: 5 }, () => Array(5).fill("?"));
}

function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

function setMessage(text, type = "") {
  const el = document.getElementById("message");
  el.textContent = text;
  el.className = type;
}

function getStored(key, fallback = -1) {
  return parseInt(localStorage.getItem(key) ?? fallback, 10);
}

function setStored(key, val) {
  localStorage.setItem(key, val);
}

function refreshIntroHighScores() {
  for (const [key, diff] of Object.entries(DIFFICULTIES)) {
    const hs = getStored(diff.hsKey);
    const el = document.getElementById(`hs-${key}`);
    if (el) el.textContent = hs >= 0 ? `Best: ${hs}/${diff.turns}` : "Best: —";
  }
}

function updateStats() {
  document.getElementById("turns-display").textContent = `${turns}/${maxTurns}`;
  document.getElementById("planted-display").textContent = planted;

  const strikesEl = document.getElementById("strikes-display");
  strikesEl.textContent = `${strikes}/${maxStrikes}`;
  strikesEl.className = "stat-value strike-value";
  if (strikes === 1 && maxStrikes === 3) strikesEl.classList.add("warning");
  if (strikes >= maxStrikes - 1)         strikesEl.classList.add("danger");

  const hs = getStored(currentDiff.hsKey);
  const hsEl = document.getElementById("highscore-display");
  hsEl.textContent = hs >= 0 ? `${hs}/${maxTurns}` : "—";
  hsEl.className = "stat-value highscore-value";

  const streak   = getStored(currentDiff.streakKey, 0);
  const streakEl = document.getElementById("streak-display");
  streakEl.textContent = streak;
  streakEl.className   = streak > 0 ? "stat-value streak-value" : "stat-value streak-value cold";
}

function renderGrid() {
  const grid = document.getElementById("grid");
  grid.innerHTML = "";

  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      const val = playerGrid[r][c];

      if (val === "?") {
        cell.classList.add("unknown");
        if (!gameOver) cell.addEventListener("click", () => handleGuess(r, c));
      } else if (val === "p") {
        cell.classList.add("planted");
        cell.textContent = "🌸";
      } else if (val === "x") {
        cell.classList.add("crop");
        cell.textContent = "🌽";
      }

      grid.appendChild(cell);
    }
  }
}

function handleGuess(row, col) {
  if (gameOver) return;
  if (playerGrid[row][col] !== "?") return;

  if (RIVAL_GRID[row][col] === "x") {
    playerGrid[row][col] = "x";
    strikes++;
    playStrike();
    setMessage("Oh no! There's already a plant here! Stubborn thing...", "strike");

    if (strikes >= maxStrikes) {
      endGame("caught"); renderGrid(); updateStats(); return;
    }
  } else {
    playerGrid[row][col] = "p";
    planted++;
    playPlant();
    setMessage("Success! You secretly planted a sabotaging flower!", "success");
    turns--;

    if (planted === maxTurns) {
      endGame("perfect"); renderGrid(); updateStats(); return;
    }
  }

  if (turns <= 0) {
    endGame("timeup"); renderGrid(); updateStats(); return;
  }

  renderGrid();
  updateStats();
}

function endGame(reason) {
  gameOver = true;
  renderGrid();
  updateStats();
  if (reason === "caught")  playCaught();
  else if (reason === "perfect") playPerfect();
  else playTimeUp();

  setTimeout(() => showEndScreen(reason), 600);
}

function showEndScreen(reason) {
  showScreen("end-screen");

  const titleEl       = document.getElementById("end-title");
  const msgEl         = document.getElementById("end-message");
  const scoreEl       = document.getElementById("score-text");
  const newRecordEl   = document.getElementById("new-record-text");
  const hsTextEl      = document.getElementById("highscore-text");
  const streakResEl   = document.getElementById("streak-result-text");
  const bestStreakEl  = document.getElementById("best-streak-text");

  scoreEl.textContent = `You sneaked ${planted}/${maxTurns} sabotaging flowers onto the Rival's farm!`;

  const prevBest    = getStored(currentDiff.hsKey);
  const isNewRecord = planted > prevBest;

  if (isNewRecord) {
    setStored(currentDiff.hsKey, planted);
    newRecordEl.textContent = planted === maxTurns
      ? "⭐ NEW RECORD — PERFECT SCORE! ⭐"
      : "⭐ NEW PERSONAL BEST! ⭐";
    hsTextEl.textContent = `Previous best on ${currentDiff.label}: ${prevBest >= 0 ? prevBest + "/" + maxTurns : "none"}`;
    document.getElementById("highscore-display").classList.add("new-record");
  } else {
    newRecordEl.textContent = "";
    hsTextEl.textContent = `Personal best on ${currentDiff.label}: ${prevBest >= 0 ? prevBest + "/" + maxTurns : "none"}`;
  }

  const goodRun      = planted >= currentDiff.streakThreshold;
  const prevStreak   = getStored(currentDiff.streakKey, 0);
  const prevBestStr  = getStored(currentDiff.bestStreakKey, 0);
  let   newStreak    = goodRun ? prevStreak + 1 : 0;
  setStored(currentDiff.streakKey, newStreak);

  const newBestStreak = Math.max(prevBestStr, newStreak);
  setStored(currentDiff.bestStreakKey, newBestStreak);

  streakResEl.className = "";
  if (goodRun && newStreak === 1) {
    streakResEl.textContent = `🔥 Streak started!`;
    streakResEl.classList.add("streak-alive");
  } else if (goodRun && newStreak > prevBestStr) {
    streakResEl.textContent = `🔥 NEW BEST STREAK: ${newStreak} in a row!`;
    streakResEl.classList.add("streak-new");
  } else if (goodRun) {
    streakResEl.textContent = `🔥 Streak: ${newStreak} in a row!`;
    streakResEl.classList.add("streak-alive");
  } else if (prevStreak > 0) {
    streakResEl.textContent = `💔 Streak of ${prevStreak} broken.`;
    streakResEl.classList.add("streak-broken");
  } else {
    streakResEl.textContent = `Plant ${currentDiff.streakThreshold}+ flowers to start a streak!`;
    streakResEl.className = "";
    streakResEl.style.color = "#507050";
    streakResEl.style.fontSize = "0.82rem";
  }

  bestStreakEl.textContent = newBestStreak > 0
    ? `Best streak on ${currentDiff.label}: ${newBestStreak} in a row`
    : "";

  if (reason === "caught") {
    titleEl.textContent = "=== BUSTED! ===";
    msgEl.textContent   = "UH OH! You made too much noise rummaging in the crops!\nThe rival Farmer turned on the porch lights! You gotta get outta there!";
  } else if (reason === "perfect") {
    titleEl.textContent = "=== PERFECT! ===";
    msgEl.textContent   = "A perfect, chaotic victory!\nThrough some sorcery, you manage to perfectly fill up all empty spots in the dark!\nNow your rival's prize winning crops are overrun with invasive flowers~\nYou are the Ultimate Midnight Saboteur!";
  } else {
    titleEl.textContent = "=== TIME'S UP! ===";
    if (planted >= Math.floor(maxTurns * 0.75)) {
      msgEl.textContent = "Great job! You seriously vandalised that field.\nYour Rival is going to have a hard time fixing that!";
    } else {
      msgEl.textContent = "Not bad, but the rival farmer will probably think it was just some weeds.\nNot much sabotaged here.";
    }
  }

  renderFinalGrid();
}

function renderFinalGrid() {
  const grid = document.getElementById("final-grid");
  grid.innerHTML = "";

  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const cell  = document.createElement("div");
      cell.className = "final-cell";
      const val   = playerGrid[r][c];
      const rival = RIVAL_GRID[r][c];

      if      (val === "p")   { cell.classList.add("planted");       cell.textContent = "🌸"; }
      else if (val === "x")   { cell.classList.add("crop");          cell.textContent = "🌽"; }
      else if (rival === "x") { cell.classList.add("revealed-crop"); cell.textContent = "🌽"; }
      else                    { cell.classList.add("unknown");        cell.textContent = "?"; }

      grid.appendChild(cell);
    }
  }
}

function startGame() {
  currentDiff = DIFFICULTIES[selectedDiffKey];
  maxTurns    = currentDiff.turns;
  maxStrikes  = currentDiff.strikes;

  initGrid();
  turns    = maxTurns;
  strikes  = 0;
  planted  = 0;
  gameOver = false;

  const badge = document.getElementById("difficulty-badge");
  badge.textContent = `${currentDiff.moon} ${currentDiff.label.toUpperCase()} MODE`;
  badge.className   = selectedDiffKey;

  setMessage("Click a dark patch to plant your invasive flower...");
  updateStats();
  renderGrid();
  showScreen("game-screen");
}

document.querySelectorAll(".diff-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".diff-btn").forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    selectedDiffKey = btn.dataset.diff;
  });
});

document.getElementById("start-btn").addEventListener("click", startGame);

document.getElementById("restart-btn").addEventListener("click", () => {
  refreshIntroHighScores();
  showScreen("intro-screen");
});

document.getElementById("copy-btn").addEventListener("click", () => {
  const streak   = getStored(currentDiff.streakKey, 0);
  const prevBest = getStored(currentDiff.hsKey);

  const CELL = {
    p: "🌸",
    x: "🌽",
    hidden_crop: "🌿",
    empty: "⬛",
  };

  const rows = playerGrid.map((row, r) =>
    row.map((val, c) => {
      if (val === "p") return CELL.p;
      if (val === "x") return CELL.x;
      return RIVAL_GRID[r][c] === "x" ? CELL.hidden_crop : CELL.empty;
    }).join("")
  ).join("\n");

  const streakLine = streak > 0 ? ` | 🔥 ${streak}-game streak` : "";
  const recordLine = planted === prevBest && planted > 0 ? " ⭐" : "";

  const card = [
    `ᗰIᗪᑎIGᕼT ᖴᗩᖇᗰEᖇ`,
    `${currentDiff.moon} ${currentDiff.label} | ${planted}/${maxTurns} flowers${streakLine}${recordLine}`,
    ``,
    rows,
    ``,
    `🌸 planted  🌽 struck  🌿 hidden  ⬛ untouched`,
  ].join("\n");

  navigator.clipboard.writeText(card).then(() => {
    const btn     = document.getElementById("copy-btn");
    const confirm = document.getElementById("copy-confirm");
    btn.textContent = "Copied! ✓";
    btn.classList.add("copied");
    confirm.textContent = "Result copied to clipboard!";
    setTimeout(() => {
      btn.textContent = "Copy Result 📋";
      btn.classList.remove("copied");
      confirm.textContent = "";
    }, 2500);
  });
});

document.querySelectorAll(".diff-btn")[1].classList.add("selected");
refreshIntroHighScores();
