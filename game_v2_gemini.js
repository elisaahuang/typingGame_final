import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getDatabase, ref, push, set, onValue } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyB7JQgVjTCc2RfISKym4ub6wQaIwHHgRYM",
  authDomain: "finalproject-34c6f.firebaseapp.com",
  projectId: "finalproject-34c6f",
  storageBucket: "finalproject-34c6f.firebasestorage.app",
  messagingSenderId: "757603400653",
  appId: "1:757603400653:web:0f9adf29e2820537f92284"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const words = [
  "airport", "baby", "card", "central", "direction", "dollar", "fruit", "gift",
  "high", "illness", "milk", "not", "piece", "protect", "race", "since", "slow",
  "smile", "ticket", "well", "accident", "blood", "business", "during", "even",
  "floor", "general", "choose", "inform", "little", "meeting", "order", "party",
  "pink", "reply", "snow", "sugar", "travel", "virus", "watch", "another",
  "believe", "both", "crazy", "cup", "decide", "ever", "field", "heart", "imagine",
  "line", "meat", "over", "pull", "ring", "sell", "similar", "speed", "than", "your",
  "above", "begin", "century", "consider", "dangerous", "dark", "exchange",
  "government", "hear", "jump", "material", "near", "past"
];

const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
const input = document.getElementById("typing-input");
const scoreEl = document.getElementById("score");
const timeEl = document.getElementById("time");
const startBtn = document.getElementById("start-btn");
const pauseBtn = document.getElementById("pause-btn");
const restartBtn = document.getElementById("restart-btn");
const leaderboardList = document.getElementById("leaderboard-list");

const resultModal = document.getElementById("result-modal");
const finalBubbleCountEl = document.getElementById("final-bubble-count");
const finalSpeedEl = document.getElementById("final-speed");
const nicknameInput = document.getElementById("nickname");
const submitBtn = document.getElementById("submit-score");
const closeModal = document.getElementById("close-modal");
const overlay = document.getElementById("overlay");
const currentTargetWordEl = document.getElementById("current-target-word");


canvas.width = canvas.offsetWidth;
canvas.height = canvas.offsetHeight;

let bubbles = [];
let score = 0;
let time = 90;
let isRunning = false;
let startTime = null;
let gameTimer = null;
let bubbleTimer = null;
let bubbleCount = 0;
let initialBubbleSpeed = 0.8;
let currentBubbleSpeed = initialBubbleSpeed; // 泡泡當前速度
let bubblesEliminatedCounter = 0; // 消除泡泡計數器，用於加速
const bubblesPerSpeedIncrease = 5; // 每消除多少個泡泡加速一次
const speedIncreaseAmount = 1; // 每次加速增加的速度值

let maxBubblesOnScreen = 3; // 初始最大泡泡串數
const maxBubblesCap = 7; // 最大泡泡串數上限
const bubbleChainIncreaseInterval = 8; // 每消除多少個泡泡增加一串

function createBubbleChain() {
  if (bubbles.length >= maxBubblesOnScreen) return; // 限制同時存在的泡泡串數

  const word = words[Math.floor(Math.random() * words.length)];
  const positions = [canvas.width * 0.25, canvas.width * 0.5, canvas.width * 0.75, canvas.width * 0.1, canvas.width * 0.9]; // 增加更多可能的X座標
  
  const available = positions.filter(x => !bubbles.find(b => Math.abs(b.x - x) < 50));
  if (available.length === 0) return;
  
  const x = available[Math.floor(Math.random() * available.length)];
  bubbles.push({ word, letters: word.split(''), typedLetters: [], x, y: canvas.height, speed: currentBubbleSpeed }); // 使用 currentBubbleSpeed
  updateCurrentWordDisplay();
}

function drawBubbles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  bubbles.forEach(chain => {
    chain.letters.forEach((ch, i) => {
      const boxY = chain.y - (chain.letters.length - 1 - i) * 35;

      if (i < chain.typedLetters.length) {
        ctx.fillStyle = 'green';
      } else {
        ctx.fillStyle = 'white';
      }
      
      ctx.fillRect(chain.x, boxY, 30, 30);
      ctx.fillStyle = 'black';
      ctx.font = '20px Arial';
      ctx.fillText(ch, chain.x + 8, boxY + 20);
    });
  });
}

function updateBubbles() {
  let gameShouldEnd = false;
  bubbles.forEach(chain => {
    chain.y -= chain.speed;
    if (chain.y - (chain.letters.length * 35) < -50) { // 允許泡泡向上移動更多，直到完全看不見
      gameShouldEnd = true;
    }
  });

  bubbles = bubbles.filter(chain => {
      return !(chain.y - (chain.letters.length * 35) < -50);
  });

  if (gameShouldEnd) {
      endGame();
  }
}

function gameLoop() {
  if (!isRunning) return;
  updateBubbles();
  drawBubbles();
  requestAnimationFrame(gameLoop);
}

function updateCurrentWordDisplay() {
  if (bubbles.length === 0) {
    currentTargetWordEl.textContent = '';
    return;
  }

  currentTargetWordEl.innerHTML = bubbles
    .map((b, i) => `<div class="target-bubble" data-index="${i}">${b.word}</div>`)
    .join('');
}


function startGame() {
  if (isRunning) return;
  isRunning = true;
  startTime = performance.now();
  input.disabled = false;
  input.focus();
  
  gameTimer = setInterval(() => {
    time--;
    timeEl.textContent = time;
    if (time <= 0) {
      endGame();
    }
  }, 1000);

  // 每 3 秒生成一個新的泡泡鏈
  bubbleTimer = setInterval(() => {
    createBubbleChain();
  }, 2000);

  requestAnimationFrame(gameLoop);
}

function pauseGame() {
  isRunning = !isRunning;
  if (isRunning) {
    requestAnimationFrame(gameLoop);
    gameTimer = setInterval(() => {
        time--;
        timeEl.textContent = time;
        if (time <= 0) {
            endGame();
        }
    }, 1000);
    bubbleTimer = setInterval(() => {
        createBubbleChain();
    }, 3000);
  } else {
    clearInterval(gameTimer);
    clearInterval(bubbleTimer);
  }
}

function resetGame() {
  clearInterval(gameTimer);
  clearInterval(bubbleTimer);
  score = 0;
  time = 60;
  bubbles = [];
  bubbleCount = 0;
  currentBubbleSpeed = initialBubbleSpeed; // 重置泡泡速度
  bubblesEliminatedCounter = 0; // 重置消除泡泡計數器
  maxBubblesOnScreen = 3; // 重置最大泡泡串數
  scoreEl.textContent = score;
  timeEl.textContent = time;
  // 如果有 bubbleCountEl，也要更新它
  input.value = '';
  input.disabled = true;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  isRunning = false;
  overlay.classList.add('hidden');
}

function endGame() {
  isRunning = false;
  clearInterval(gameTimer);
  clearInterval(bubbleTimer);
  const elapsedSeconds = (performance.now() - startTime) / 1000;
  const avgSpeed = elapsedSeconds > 0 ? (bubbleCount / elapsedSeconds).toFixed(2) : (0).toFixed(2);
  finalBubbleCountEl.textContent = bubbleCount;
  finalSpeedEl.textContent = avgSpeed;
  resultModal.classList.remove('hidden');
  overlay.classList.remove('hidden');
}

input.addEventListener('input', () => {
    const val = input.value.trim().toLowerCase();
    const targetWordContainer = document.getElementById('current-word-display');

    // 在每次輸入時，先清除舊的錯誤狀態
    targetWordContainer.classList.remove('error');
    document.querySelectorAll('.target-bubble').forEach(el => el.classList.remove('error'));

    if (!val) { // 如果輸入框是空的，就不用做任何事
        return;
    }

    const matchingBubbleIndex = bubbles.findIndex(chain => 
        chain.word.toLowerCase().startsWith(val)
    );

    if (matchingBubbleIndex !== -1) {
        // --- 情況 1: 輸入正確 ---
        // 使用者輸入的字串是螢幕上某個單字的開頭
        const chain = bubbles[matchingBubbleIndex];
        chain.typedLetters = val.split('');

        if (chain.word.toLowerCase() === val) {
            // 單字完全輸入正確，消除泡泡
            bubbleCount += chain.letters.length;
            score += chain.letters.length * 10;
            scoreEl.textContent = score;
            bubbles.splice(matchingBubbleIndex, 1);
            updateCurrentWordDisplay();
            input.value = '';

            bubblesEliminatedCounter++;

            if (bubblesEliminatedCounter % bubblesPerSpeedIncrease === 0) {
                currentBubbleSpeed += speedIncreaseAmount;
                bubbles.forEach(b => b.speed = currentBubbleSpeed);
            }

            if (bubblesEliminatedCounter % bubbleChainIncreaseInterval === 0 && maxBubblesOnScreen < maxBubblesCap) {
                maxBubblesOnScreen++;
            }
        }
    } else {
        // --- 情況 2: 輸入錯誤 ---
        const prevVal = val.slice(0, -1); // 檢查前一個字元的輸入狀態
        let specificErrorFound = false;

        if (prevVal.length > 0) {
            const prevMatchIndex = bubbles.findIndex(chain => 
                chain.word.toLowerCase().startsWith(prevVal)
            );

            if (prevMatchIndex !== -1) {
                // 子情況 A: 特定單字輸入錯誤
                // 使用者上一步還在正確輸入某個單字，但這一步打錯了
                const errorWordEl = document.querySelector(`.target-bubble[data-index='${prevMatchIndex}']`);
                if (errorWordEl) {
                    errorWordEl.classList.add('error'); // 觸發特定單字的紅色抖動效果
                    // 讓效果持續一小段時間後消失
                    setTimeout(() => errorWordEl.classList.remove('error'), 300);
                    specificErrorFound = true;
                }
            }
        }

        if (!specificErrorFound) {
            // 子情況 B: 全域輸入錯誤
            // 使用者一開始就打錯，或輸入的字串完全沒有對應目標
            targetWordContainer.classList.add('error'); // 觸發整個目標區塊的紅色警告
            // 讓效果持續一小段時間後消失
            setTimeout(() => targetWordContainer.classList.remove('error'), 300);
        }
        
        // 套用懲罰機制並清空輸入框
        score -= 10;
        if (score < 0) score = 0;
        scoreEl.textContent = score;
        input.value = '';
    }
});

startBtn.addEventListener('click', startGame);
pauseBtn.addEventListener('click', pauseGame);
restartBtn.addEventListener('click', resetGame);

submitBtn.addEventListener('click', () => {
  const refPush = push(ref(db, 'scores'));
  set(refPush, {
    name: nicknameInput.value || '匿名',
    bubbleCount,
    avgSpeed: finalSpeedEl.textContent,
    timestamp: new Date().toISOString()
  });
  resultModal.classList.add('hidden');
  overlay.classList.add('hidden');
  resetGame();
});

closeModal.addEventListener('click', () => {
  resetGame();
  resultModal.classList.add('hidden');
  overlay.classList.add('hidden');
});

onValue(ref(db, 'scores'), (snapshot) => {
  const scores = [];
  snapshot.forEach((childSnapshot) => {
    scores.push(childSnapshot.val());
  });
  scores.sort((a, b) => b.bubbleCount - a.bubbleCount || b.avgSpeed - a.avgSpeed); 
  leaderboardList.innerHTML = '';
  scores.slice(0, 10).forEach((scoreEntry, index) => {
    const li = document.createElement('li');
    li.textContent = `${index + 1}. ${scoreEntry.name} - 泡泡: ${scoreEntry.bubbleCount} 顆, 速度: ${scoreEntry.avgSpeed} 顆/秒`;
    leaderboardList.appendChild(li);
  });
});
