
const startBtn = document.getElementById("startBtn");
const checkBtn = document.getElementById("checkBtn");
const gameBoard = document.getElementById("gameBoard");
const userInput = document.getElementById("userInput");
const resultDiv = document.getElementById("result");
const countdownDiv = document.getElementById("countdown");
const progressBar = document.getElementById("progressBar");
const progressBarBg = progressBar ? progressBar.parentElement : null;
const modal = document.getElementById("modal");
const modalMessage = document.getElementById("modalMessage");
const closeModal = document.getElementById("closeModal");
const showInstructions = document.getElementById("showInstructions");
const instructionsPanel = document.getElementById("instructionsPanel");
const closeInstructions = document.getElementById("closeInstructions");
const highScoreEl = document.getElementById("highScore");
const gamesPlayedEl = document.getElementById("gamesPlayed");
const lastScoreEl = document.getElementById("lastScore");
const inputCounterEl = document.getElementById("inputCounter");


const levels = [
  { name: "Easy", count: 3, inputTime: 28, memorizeTime: 4 },
  { name: "Medium", count: 4, inputTime: 24, memorizeTime: 5 },
  { name: "Hard", count: 5, inputTime: 20, memorizeTime: 6 },
  { name: "Very Hard", count: 6, inputTime: 16, memorizeTime: 7 },
  { name: "Super Hard", count: 7, inputTime: 14, memorizeTime: 8 }
];
const statsKey = "brainwave_stats_v1";
let difficultyOffset = 0;
let statsInitialized = false;
let currentNumbers = [];
let score = 0;
let round = 1;
const maxRounds = 5;
let numbersToMemorize = 3;
let hideTimeout = null;
let hintUsed = false;
let inputTimer = null;
let inputTimeLeft = 0;
let retryTimer = null;
let retryTimeLeft = 0;
let autoCheckTimer = null;
const maxRetries = 2;
let retriesLeft = maxRetries;
let gameActive = false;
let roundActive = false;
let modalMode = "";
const encouragements = [
  "Awesome! You cleared Easy!",
  "Great job! Medium cleared!",
  "Impressive! Hard cleared!",
  "Fantastic! Very Hard cleared!",
  "Legendary! Super Hard cleared!"
];

checkBtn.disabled = true;
document.getElementById("hintBtn").disabled = true;
userInput.disabled = true;
if (progressBarBg) progressBarBg.classList.add("hidden");

function resetGame() {
  score = 0;
  round = 1;
  updateScore();
  updateProgressBar();
  updateInputCounter(0, numbersToMemorize);
}

function loadStats() {
  const raw = localStorage.getItem(statsKey);
  if (!raw) return { highScore: 0, gamesPlayed: 0, lastScore: 0 };
  try {
    const data = JSON.parse(raw);
    return {
      highScore: Number(data.highScore) || 0,
      gamesPlayed: Number(data.gamesPlayed) || 0,
      lastScore: Number(data.lastScore) || 0
    };
  } catch {
    return { highScore: 0, gamesPlayed: 0, lastScore: 0 };
  }
}

function saveStats(stats) {
  localStorage.setItem(statsKey, JSON.stringify(stats));
}

function renderStats() {
  const stats = loadStats();
  if (highScoreEl) highScoreEl.textContent = `High Score: ${stats.highScore}`;
  if (gamesPlayedEl) gamesPlayedEl.textContent = `Games: ${stats.gamesPlayed}`;
  if (lastScoreEl) lastScoreEl.textContent = `Last Score: ${stats.lastScore}`;
  statsInitialized = true;
}

function finalizeStats(finalScore) {
  const stats = loadStats();
  stats.lastScore = finalScore;
  if (finalScore > stats.highScore) stats.highScore = finalScore;
  saveStats(stats);
  renderStats();
}

function updateStatsProgress(currentScore) {
  const stats = loadStats();
  stats.lastScore = currentScore;
  if (currentScore > stats.highScore) stats.highScore = currentScore;
  saveStats(stats);
  renderStats();
}

function updateScore() {
  let scoreDiv = document.getElementById("scoreDiv");
  if (!scoreDiv) {
    scoreDiv = document.createElement("div");
    scoreDiv.id = "scoreDiv";
    scoreDiv.style.marginBottom = "0.7rem";
    scoreDiv.style.fontWeight = "bold";
    scoreDiv.style.color = "#00c6ff";
    scoreDiv.style.fontSize = "1.1rem";
    document.querySelector(".container").insertBefore(scoreDiv, document.querySelector(".container").children[3]);
  }
  scoreDiv.innerHTML = `Score: <span style='color:#7CFC00'>${score}</span> | Round: <span style='color:#ffe082'>${round}/${maxRounds}</span>`;
}

function updateProgressBar() {
  if (progressBar) {
    progressBar.style.width = `${((round-1)/maxRounds)*100}%`;
  }
}

function showModal(message) {
  modalMessage.innerHTML = message;
  modal.style.display = "flex";
}

function hideModal() {
  modal.style.display = "none";
  if (modalMode === "hint" && gameActive && roundActive) {
    resumeTimers();
  }
  modalMode = "";
}

function endGame() {
  gameActive = false;
  roundActive = false;
  userInput.disabled = true;
  checkBtn.disabled = true;
  document.getElementById("hintBtn").disabled = true;
  document.getElementById("hintBtn").style.opacity = 0.5;
  if (progressBarBg) progressBarBg.classList.add("hidden");
  updateInputCounter(0, numbersToMemorize);
}

showInstructions.onclick = () => {
  instructionsPanel.style.display = "block";
};
closeInstructions.onclick = () => {
  instructionsPanel.style.display = "none";
};
closeModal.onclick = hideModal;
window.onclick = function(event) {
  if (event.target === modal) hideModal();
};

startBtn.addEventListener("click", () => {
  startGameWithCountdown();
});

renderStats();

function startGameWithCountdown() {
  gameActive = true;
  roundActive = false;
  if (progressBarBg) progressBarBg.classList.remove("hidden");
  if (!statsInitialized) renderStats();
  const stats = loadStats();
  stats.gamesPlayed += 1;
  saveStats(stats);
  renderStats();
  userInput.disabled = true;
  checkBtn.disabled = true;
  document.getElementById("hintBtn").disabled = true;
  document.getElementById("hintBtn").style.opacity = 0.5;
  let count = 3;
  countdownDiv.textContent = `Starting in ${count}`;
  const countdownInterval = setInterval(() => {
    count--;
    if (count > 0) {
      countdownDiv.textContent = `Starting in ${count}`;
    } else {
      clearInterval(countdownInterval);
      countdownDiv.textContent = "Start!";
      setTimeout(() => {
        countdownDiv.textContent = "";
        resetGame();
        nextRound();
      }, 600);
    }
  }, 900);
}

function nextRound() {
  roundActive = false;
  resultDiv.textContent = "";
  userInput.value = "";
  userInput.disabled = true;
  checkBtn.disabled = true;
  hintUsed = false;
  document.getElementById("hintBtn").disabled = false;
  document.getElementById("hintBtn").style.opacity = 1;
  updateScore();
  updateProgressBar();
  retriesLeft = maxRetries;
  updateRetryInfo();
  // Level logic
  const level = levels[round-1];
  // Adaptive difficulty: adjust time only to avoid steep jumps in count
  numbersToMemorize = level.count;
  const adjustedInputTime = Math.max(12, Math.min(40, level.inputTime - (difficultyOffset * 2)));
  const adjustedMemorizeTime = Math.max(3, Math.min(10, level.memorizeTime + Math.floor(difficultyOffset / 2)));
  document.getElementById("levelLabel").textContent = `Level: ${level.name}`;
  currentNumbers = Array.from({length: numbersToMemorize}, () => Math.floor(Math.random()*90+10));
  renderBoard(currentNumbers);
  countdownDiv.textContent = "";
  gameBoard.style.opacity = 1;
  userInput.style.display = "none";
  checkBtn.style.display = "none";
  document.getElementById("hintBtn").style.display = "inline-block";
  updateInputCounter(0, numbersToMemorize);
  let count = adjustedMemorizeTime;
  countdownDiv.textContent = `Memorize: ${count}`;
  let countdownInterval = setInterval(() => {
    count--;
    if (count > 0) {
      countdownDiv.textContent = `Memorize: ${count}`;
    } else {
      clearInterval(countdownInterval);
      countdownDiv.textContent = "Now recall!";
      hideTimeout = setTimeout(() => {
        gameBoard.style.opacity = 0;
        countdownDiv.textContent = "";
        userInput.style.display = "inline-block";
        checkBtn.style.display = "inline-block";
        document.getElementById("hintBtn").style.display = "inline-block";
        userInput.disabled = false;
        checkBtn.disabled = false;
        userInput.focus();
        startInputTimer(adjustedInputTime);
        startRetryTimer();
        roundActive = true;
      }, 900);
    }
  }, 1000);
}

function updateInputCounter(current, total) {
  if (!inputCounterEl) return;
  inputCounterEl.textContent = `Entered ${current}/${total}`;
}

function updateRetryInfo() {
  document.getElementById("retryInfo").textContent = `Retries: ${retriesLeft}`;
}

function startRetryTimer() {
  retryTimeLeft = 12; // 12 seconds per retry
  updateRetryTimer();
  if (retryTimer) clearInterval(retryTimer);
  retryTimer = setInterval(() => {
    retryTimeLeft--;
    updateRetryTimer();
    if (retryTimeLeft <= 0) {
      clearInterval(retryTimer);
      handleRetryTimeout();
    }
  }, 1000);
}

function updateRetryTimer() {
  document.getElementById("retryInfo").textContent = `Retries: ${retriesLeft} | ⏳ ${retryTimeLeft}s`;
}

function handleRetryTimeout() {
  retriesLeft--;
  updateRetryInfo();
  if (retriesLeft > 0) {
    retryTimeLeft = 12;
    updateRetryTimer();
    startRetryTimer();
    shakeInput();
    resultDiv.textContent = "⏰ Retry time's up! Try again.";
    resultDiv.style.color = "#ff4d4f";
    userInput.value = "";
    updateInputCounter(0, currentNumbers.length);
  } else {
    roundActive = false;
    userInput.disabled = true;
    checkBtn.disabled = true;
    document.getElementById("hintBtn").disabled = true;
    document.getElementById("hintBtn").style.opacity = 0.5;
    promptExitOrRestart("❌ No retries left!");
  }
}

function startInputTimer(seconds) {
  inputTimeLeft = seconds;
  updateInputTimer();
  if (inputTimer) clearInterval(inputTimer);
  inputTimer = setInterval(() => {
    inputTimeLeft--;
    updateInputTimer();
    if (inputTimeLeft <= 0) {
      clearInterval(inputTimer);
      roundActive = false;
      userInput.disabled = true;
      checkBtn.disabled = true;
      document.getElementById("hintBtn").disabled = true;
      document.getElementById("hintBtn").style.opacity = 0.5;
      promptExitOrRestart("⏰ Time's up!");
    }
  }, 1000);
}

function updateInputTimer() {
  document.getElementById("inputTimer").textContent = inputTimeLeft > 0 ? `⏳ ${inputTimeLeft}s` : "";
}





checkBtn.addEventListener("click", (e) => {
  e.preventDefault();
  if (!gameActive || !roundActive) return;
  if (inputTimer) clearInterval(inputTimer);
  if (retryTimer) clearInterval(retryTimer);
  document.getElementById("inputTimer").textContent = "";
  updateRetryInfo();
  const inputArr = userInput.value
    .split(",")
    .map(s => s.trim())
    .filter(s => s !== "")
    .map(Number);

  if (inputArr.length === 0) {
    resultDiv.textContent = "Please enter your numbers!";
    resultDiv.style.color = "#ffe066";
    shakeInput();
    playSound('error');
    startRetryTimer();
    return;
  }

  const isCorrect = inputArr.length === currentNumbers.length && inputArr.every((n, i) => n === currentNumbers[i]);
  if (isCorrect) {
    roundActive = false;
    // Increase difficulty when player is accurate and fast
    if (retriesLeft === maxRetries && inputTimeLeft > 8) {
      difficultyOffset = Math.min(2, difficultyOffset + 1);
    }
    score += 10;
    updateStatsProgress(score);
    resultDiv.textContent = `🎉 ${encouragements[round-1]}`;
    resultDiv.style.color = "#7CFC00";
    resultDiv.classList.add("result-pop");
    setTimeout(() => resultDiv.classList.remove("result-pop"), 400);
    playSound('success');
    confetti();
    userInput.disabled = true;
    checkBtn.disabled = true;
    document.getElementById("hintBtn").disabled = true;
    document.getElementById("hintBtn").style.opacity = 0.5;
    if (round < maxRounds) {
      setTimeout(() => {
        round++;
        nextRound();
      }, 1200);
    } else {
      setTimeout(() => {
        endGame();
        finalizeStats(score);
        showModal(`🏆 <b>Game Over!</b><br>Final Score: <span style='color:#00c6ff'>${score}</span><br><br><button onclick='window.location.reload()' class='info-btn'>Play Again</button>`);
        resultDiv.textContent = "";
      }, 1200);
    }
  } else {
    retriesLeft--;
    updateRetryInfo();
    // Decrease difficulty if player struggles
    difficultyOffset = Math.max(-2, difficultyOffset - 1);
    if (retriesLeft > 0) {
      resultDiv.textContent = `❌ Try Again! (${retriesLeft} retries left)`;
      resultDiv.style.color = "#ff4d4f";
      resultDiv.classList.add("result-pop");
      setTimeout(() => resultDiv.classList.remove("result-pop"), 400);
      shakeInput();
      playSound('error');
      userInput.value = "";
      updateInputCounter(0, currentNumbers.length);
      startRetryTimer();
    } else {
      roundActive = false;
      userInput.disabled = true;
      checkBtn.disabled = true;
      document.getElementById("hintBtn").disabled = true;
      document.getElementById("hintBtn").style.opacity = 0.5;
      promptExitOrRestart("❌ No retries left!");
    }
  }
  updateScore();
  updateInputCounter(0, numbersToMemorize);
});

userInput.addEventListener("input", () => {
  if (!gameActive || !roundActive) return;
  if (autoCheckTimer) clearTimeout(autoCheckTimer);
  autoCheckTimer = setTimeout(() => {
    if (!gameActive || !roundActive || checkBtn.disabled) return;
    const raw = userInput.value.trim();
    if (raw === "" || /,\s*$/.test(raw)) return;
    const parsed = raw.split(",").map(s => s.trim()).filter(s => s !== "").map(Number);
    updateInputCounter(parsed.length, currentNumbers.length);
    // Only auto-check if input length matches and all entries are valid numbers
    if (
      parsed.length === currentNumbers.length &&
      parsed.every(num => !Number.isNaN(num))
    ) {
      checkBtn.click();
    }
  }, 450);
});

document.getElementById("hintBtn").onclick = function() {
  if (!gameActive || !roundActive) return;
  if (hintUsed) return;
  hintUsed = true;
  document.getElementById("hintBtn").disabled = true;
  document.getElementById("hintBtn").style.opacity = 0.5;
  // Reveal two positions as a useful hint
  if (!Array.isArray(currentNumbers) || currentNumbers.length < 2) return;
  const idxA = Math.floor(Math.random() * currentNumbers.length);
  let idxB = Math.floor(Math.random() * currentNumbers.length);
  if (idxB === idxA) idxB = (idxA + 1) % currentNumbers.length;
  showHintModal(idxA, currentNumbers[idxA], idxB, currentNumbers[idxB]);
  score = Math.max(0, score-2);
  updateScore();
};

function showHintModal(idxA, valueA, idxB, valueB) {
  pauseTimers();
  modalMode = "hint";
  modalMessage.innerHTML = `<div class='hint-modal-content'>
    <span class='hint-label'>Hint</span>
    <div class='hint-lines'>
      <div class='hint-line'><span class='hint-pos'>Pos ${idxA+1}</span><span class='hint-num'>${valueA}</span></div>
      <div class='hint-line'><span class='hint-pos'>Pos ${idxB+1}</span><span class='hint-num'>${valueB}</span></div>
    </div>
    <span style='color:#ff4d4f;font-size:1rem;'>-2 points</span>
  </div>`;
  modal.style.display = "flex";
}

function pauseTimers() {
  if (inputTimer) clearInterval(inputTimer);
  if (retryTimer) clearInterval(retryTimer);
}

function resumeTimers() {
  if (roundActive && inputTimeLeft > 0) {
    inputTimer = setInterval(() => {
      inputTimeLeft--;
      updateInputTimer();
      if (inputTimeLeft <= 0) {
        clearInterval(inputTimer);
        roundActive = false;
        userInput.disabled = true;
        checkBtn.disabled = true;
        document.getElementById("hintBtn").disabled = true;
        document.getElementById("hintBtn").style.opacity = 0.5;
        promptExitOrRestart("⏰ Time's up!");
      }
    }, 1000);
  }
  if (roundActive && retryTimeLeft > 0) {
    retryTimer = setInterval(() => {
      retryTimeLeft--;
      updateRetryTimer();
      if (retryTimeLeft <= 0) {
        clearInterval(retryTimer);
        handleRetryTimeout();
      }
    }, 1000);
  }
}

function promptExitOrRestart(reasonText) {
  modalMode = "prompt";
  const message = `<div class='hint-modal-content'>
    <span class='hint-label'>${reasonText}</span>
    <span>Would you like to exit or restart the game?</span>
    <div style='display:flex;gap:0.8rem;justify-content:center;margin-top:0.6rem;'>
      <button id='exitGameBtn' class='info-btn'>Exit</button>
      <button id='restartGameBtn' class='info-btn'>Restart</button>
    </div>
  </div>`;
  showModal(message);
  setTimeout(() => {
    const exitBtn = document.getElementById('exitGameBtn');
    const restartBtn = document.getElementById('restartGameBtn');
    if (exitBtn) exitBtn.onclick = () => {
      endGame();
      finalizeStats(score);
      hideModal();
      resultDiv.textContent = "Game exited.";
      // Try to close the window/tab. If blocked, fall back to about:blank.
      window.close();
      setTimeout(() => {
        window.open('', '_self');
        window.location.href = 'about:blank';
      }, 100);
    };
    if (restartBtn) restartBtn.onclick = () => { hideModal(); startGameWithCountdown(); };
  }, 0);
}



function renderBoard(numbers) {
  gameBoard.innerHTML = "";
  numbers.forEach((num, idx) => {
    const tile = document.createElement("div");
    tile.className = "game-tile";
    tile.textContent = num;
    tile.style.animationDelay = (idx * 0.08) + "s";
    tile.style.transform = 'scale(0.7)';
    setTimeout(() => {
      tile.style.transform = 'scale(1)';
      tile.style.transition = 'transform 0.4s cubic-bezier(.68,-0.55,.27,1.55)';
    }, 80*idx);
    gameBoard.appendChild(tile);
  });
}

// --- Interactivity helpers ---
function shakeInput() {
  userInput.classList.add("shake");
  setTimeout(() => userInput.classList.remove("shake"), 400);
}

function playSound(type) {
  return;
}

function confetti() {
  // Simple confetti effect using emoji
  const confettiDiv = document.createElement("div");
  confettiDiv.style.position = "fixed";
  confettiDiv.style.left = 0;
  confettiDiv.style.top = 0;
  confettiDiv.style.width = "100vw";
  confettiDiv.style.height = "100vh";
  confettiDiv.style.pointerEvents = "none";
  confettiDiv.style.zIndex = 9999;
  for (let i = 0; i < 24; i++) {
    const span = document.createElement("span");
    span.textContent = ["🎉","✨","🟦","🟩","🟨","🟧"][Math.floor(Math.random()*6)];
    span.style.position = "absolute";
    span.style.left = Math.random()*100 + "vw";
    span.style.top = "-2vh";
    span.style.fontSize = (Math.random()*1.2+1.2) + "rem";
    span.style.opacity = 0.85;
    span.style.transition = "top 1.2s cubic-bezier(.68,-0.55,.27,1.55), opacity 1.2s";
    confettiDiv.appendChild(span);
    setTimeout(() => {
      span.style.top = (Math.random()*80+10) + "vh";
      span.style.opacity = 0;
    }, 30);
  }
  document.body.appendChild(confettiDiv);
  setTimeout(() => confettiDiv.remove(), 1400);
}

// Add shake animation CSS
const style = document.createElement('style');
style.innerHTML = `
@keyframes shake {
  0% { transform: translateX(0); }
  20% { transform: translateX(-8px); }
  40% { transform: translateX(8px); }
  60% { transform: translateX(-6px); }
  80% { transform: translateX(6px); }
  100% { transform: translateX(0); }
}
.shake {
  animation: shake 0.4s;
}
`;
document.head.appendChild(style);
