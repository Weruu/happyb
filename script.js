/* ==========================================================
    НАСТРОЙКИ — здесь легко всё поменять под себя
   ========================================================== */
const FINAL_LINK = "https://example.com/sertificate.pdf"; // ЗАГЛУШКА: ссылка на страницу/pdf с сертификатом на пирсинг

const CAPTCHA_TARGET = 68;   // % позиции, где должен оказаться кусочек пазла (совпадает с .puzzle-gap в CSS)
const CAPTCHA_TOLERANCE = 4; // допустимая погрешность

const FAIL_JOKES = [
    "Доступ запрещён. Вы точно знаете именинницу?",
    "Подозрительная активность! Кто ты и куда дела мою подругу?",
    "Ошибка 404: дружба не найдена. Попробуй ещё раз.",
    "Кажется, ты самозванка. Настоящая бы уже собрала пазл!"
];

// ЗАГЛУШКА: замени вопросы, ответы и флаги под свою историю
const QUIZ_QUESTIONS = [
    {
    question: "Что мы закажем поесть в 2 часа ночи?",
    options: ["Суши", "Шаурму", "Пиццу", "Ничего, мы спим как нормальные люди"],
    correct: 2,
    timer: 15
    },
    {
    question: "Кто из нас дольше собирается перед выходом?",
    options: ["Я", "Ты", "Мы обе одинаково долго"],
    correct: 1,
    runaway: 1 // индекс варианта, который будет убегать от курсора
    },
    {
    question: "После какого события было записано это голосовое?",
    options: ["После контрольной", "После дня рождения", "После того самого похода", "Никто не помнит"],
    correct: 2,
    audio: true // ЗАГЛУШКА: вставь свой аудиофайл ниже в разметке рендера
    },
    {
    question: "Сколько раз мы обещали лечь спать пораньше и не сделали этого?",
    options: ["1-2 раза", "Каждый день", "Ни разу — мы держим слово", "Со счёту сбились"],
    correct: 1
    }
];

/* ==========================================================
        ПЕРЕКЛЮЧЕНИЕ ЭКРАНОВ
   ========================================================== */
function nextScreen(screenNumber) {
    const currentActive = document.querySelector('.screen.active');
    if (currentActive) currentActive.classList.remove('active');

    const target = document.getElementById(`screen-${screenNumber}`);
    if (target) target.classList.add('active');

    spawnDigitForScreen(screenNumber);

    if (screenNumber === 2) startQuiz();
    if (screenNumber === 3) initPuzzle();
    if (screenNumber === 4) initAlphabet();
    if (screenNumber === 5) initPeopleSort();
    if (screenNumber === 6) initPictureQuestion();
    if (screenNumber === 7) initTarot();
    if (screenNumber === 8) initScratchCard();
    if (screenNumber === 9) initDigitsScreen();
    if (screenNumber === 10) startFinale();
}


/* ==========================================================
        ЭКРАН 1 — КАПЧА (слайдер-пазл)
   ========================================================== */
const captchaSlider = document.getElementById('captchaSlider');
const puzzlePiece = document.getElementById('puzzlePiece');
const captchaMessage = document.getElementById('captchaMessage');
const captchaContinueBtn = document.getElementById('captchaContinueBtn');

let captchaSolved = false;

captchaSlider.addEventListener('input', () => {
    puzzlePiece.style.left = captchaSlider.value + '%';
});

function checkCaptcha() {
    if (captchaSolved) return;
    const value = Number(captchaSlider.value);
    const diff = Math.abs(value - CAPTCHA_TARGET);

    if (diff <= CAPTCHA_TOLERANCE) {
    captchaSolved = true;
    puzzlePiece.style.left = CAPTCHA_TARGET + '%';
    captchaMessage.textContent = "Доступ разрешён. Подтверждено: лучшая подруга ✅";
    captchaMessage.className = "captcha-message success";
    captchaSlider.disabled = true;
    captchaContinueBtn.classList.remove('hidden');
    playDing();
    } else {
    captchaMessage.textContent = FAIL_JOKES[Math.floor(Math.random() * FAIL_JOKES.length)];
    captchaMessage.className = "captcha-message error";
    // возвращаем кусочек в начало, чтобы попробовать снова
    setTimeout(() => {
        captchaSlider.value = 0;
        puzzlePiece.style.left = '0%';
    }, 700);
    }
}

captchaSlider.addEventListener('change', checkCaptcha); // отпустили мышь/палец
captchaSlider.addEventListener('touchend', checkCaptcha);

// простой звук "дзинь" без внешних файлов (Web Audio API)
function playDing() {
    try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 1200;
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) { /* тихо игнорируем, если звук недоступен */ }
}

/* ==========================================================
    ЭКРАН 2 — ЭКЗАМЕН НА ДРУЖБУ
   ========================================================== */
const quizContainer = document.getElementById('quizContainer');
const progressFill = document.getElementById('progressFill');
const progressLabel = document.getElementById('progressLabel');

const PROGRESS_LABELS = ["Просто знакомые", "Приятельницы", "Хорошие подруги", "Лучшие подруги", "Соулмейты"];

let currentQuestionIndex = 0;
let quizStarted = false;
let timerInterval = null;

function startQuiz() {
    if (quizStarted) return;
    quizStarted = true;
    currentQuestionIndex = 0;
    renderQuestion();
}

function updateProgress() {
  const pct = (currentQuestionIndex / QUIZ_QUESTIONS.length) * 100;
    progressFill.style.width = pct + '%';
    const labelIndex = Math.min(
    Math.floor((currentQuestionIndex / QUIZ_QUESTIONS.length) * (PROGRESS_LABELS.length - 1)),
    PROGRESS_LABELS.length - 1
    );
    progressLabel.textContent = PROGRESS_LABELS[labelIndex];
}

function renderQuestion() {
    clearInterval(timerInterval);
    updateProgress();

    const q = QUIZ_QUESTIONS[currentQuestionIndex];

    const wrap = document.createElement('div');
    wrap.className = 'quiz-question';

    let html = `<h2>${q.question}</h2>`;
    if (q.timer) {
    html += `<div class="quiz-timer" id="quizTimer">⏱ ${q.timer} сек</div>`;
    }
    if (q.audio) {
    // ЗАГЛУШКА: замени src на свой аудиофайл, например assets/voice.mp3
    html += `<audio class="quiz-audio" controls src=""></audio><p style="font-size:0.8rem;opacity:0.6">ЗАГЛУШКА: вставь сюда аудиофайл (src у &lt;audio&gt;)</p>`;
    }
    html += `<div class="quiz-options" id="quizOptions"></div>`;
    wrap.innerHTML = html;

    quizContainer.innerHTML = '';
    quizContainer.appendChild(wrap);

    const optionsWrap = document.getElementById('quizOptions');
        q.options.forEach((optionText, index) => {
        const btn = document.createElement('button');
        btn.className = 'quiz-option';
        btn.textContent = optionText;
        btn.addEventListener('click', () => handleAnswer(index, btn));

        if (q.runaway === index) {
            btn.classList.add('runaway');
            makeButtonRunaway(btn, optionsWrap);
        }

        optionsWrap.appendChild(btn);
    });

  // фейковый тикающий таймер — чисто для драмы, ни на что не влияет
    if (q.timer) {
    let timeLeft = q.timer;
    const timerEl = document.getElementById('quizTimer');
    timerInterval = setInterval(() => {
        timeLeft -= 1;
        if (timerEl) timerEl.textContent = `⏱ ${Math.max(timeLeft, 0)} сек`;
        if (timeLeft <= 0) clearInterval(timerInterval);
    }, 1000);
    }
}

function handleAnswer(index, btnEl) {
    const q = QUIZ_QUESTIONS[currentQuestionIndex];
    if (index === q.correct) {
    btnEl.classList.add('correct-flash');
    clearInterval(timerInterval);
    setTimeout(() => {
        currentQuestionIndex++;
        if (currentQuestionIndex < QUIZ_QUESTIONS.length) {
        renderQuestion();
        } else {
        finishQuiz();
        }
    }, 600);
    } else {
    btnEl.classList.add('wrong-flash');
    setTimeout(() => btnEl.classList.remove('wrong-flash'), 500);
    }
}

function finishQuiz() {
    updateProgress();
    progressFill.style.width = '100%';
    progressLabel.textContent = "Соулмейты 💗";
    quizContainer.innerHTML = `
    <p style="font-weight:700; margin-bottom: 6px;">Экзамен сдан на отлично! 🎓</p>
    <p style="opacity:0.75; margin-bottom: 18px;">Осталось последнее испытание...</p>
    <button class="btn" onclick="nextScreen(3)">К финальному испытанию →</button>
    `;
}

// логика "убегающей" кнопки
let runawayDodgeCount = {};
function makeButtonRunaway(btn, container) {
    const key = btn.textContent;
    runawayDodgeCount[key] = 0;
  const MAX_DODGES = 4; // после нескольких побегов кнопка "устаёт" и её можно поймать

    btn.addEventListener('mouseenter', () => {
    if (runawayDodgeCount[key] >= MAX_DODGES) return;
    runawayDodgeCount[key]++;

    const containerRect = container.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    const maxX = containerRect.width - btnRect.width;
    const maxY = containerRect.height - btnRect.height;

    const randX = Math.max(0, Math.random() * maxX);
    const randY = Math.max(0, Math.random() * maxY);

    btn.style.position = 'absolute';
    btn.style.left = randX + 'px';
    btn.style.top = randY + 'px';
    });
}

/* ==========================================================
        ЭКРАН 3 — ПАЗЛ ВОСПОМИНАНИЙ (Pointer Events — работает и мышью, и пальцем)
   ========================================================== */
const GRID_SIZE = 3; // 3x3 = 9 деталей
const puzzleBoard = document.getElementById('puzzleBoard');
const puzzlePiecesWrap = document.getElementById('puzzlePieces');
const puzzleMessage = document.getElementById('puzzleMessage');
const puzzleContinueBtn = document.getElementById('puzzleContinueBtn');

let puzzleInitialized = false;
let placedCount = 0;
let activeDragTile = null;

function initPuzzle() {
    if (puzzleInitialized) return;
    puzzleInitialized = true;

  const total = GRID_SIZE * GRID_SIZE;
    puzzleBoard.innerHTML = '';
    puzzlePiecesWrap.innerHTML = '';

  // создаём слоты на доске
    for (let i = 0; i < total; i++) {
    const slot = document.createElement('div');
    slot.className = 'puzzle-slot';
    slot.dataset.index = i;
    // ЗАГЛУШКА: подсказка-номер видна только пока нет реального фото —
    // когда вставишь фрагменты фотографии, подсказка не нужна, убери строку ниже
    slot.innerHTML = `<span class="slot-hint">${i + 1}</span>`;
    puzzleBoard.appendChild(slot);
    }

  // создаём кусочки в перемешанном порядке
    const order = [...Array(total).keys()];
    shuffleArray(order);

    order.forEach((correctIndex) => {
    const tile = document.createElement('div');
    tile.className = 'puzzle-piece-tile';
    tile.dataset.correctIndex = correctIndex;
    // ЗАГЛУШКА: замени номер на фрагмент реальной фотографии (background-image + background-position)
    tile.textContent = correctIndex + 1;

    attachDragEvents(tile);
    puzzlePiecesWrap.appendChild(tile);
    });
}

function attachDragEvents(tile) {
    tile.addEventListener('pointerdown', (e) => {
    if (tile.classList.contains('placed')) return;
    e.preventDefault();

    activeDragTile = tile;
    tile.setPointerCapture(e.pointerId);

    const rect = tile.getBoundingClientRect();
    tile.dataset.grabOffsetX = e.clientX - rect.left;
    tile.dataset.grabOffsetY = e.clientY - rect.top;

    tile.style.width = rect.width + 'px';
    tile.style.height = rect.height + 'px';
    tile.style.position = 'fixed';
    tile.style.zIndex = '1000';
    tile.classList.add('dragging');
    moveTileTo(tile, e.clientX, e.clientY);
    });

    tile.addEventListener('pointermove', (e) => {
    if (activeDragTile !== tile) return;
    moveTileTo(tile, e.clientX, e.clientY);
    });

    tile.addEventListener('pointerup', (e) => finishDrag(tile, e.clientX, e.clientY));
    tile.addEventListener('pointercancel', (e) => finishDrag(tile, e.clientX, e.clientY));
}

function moveTileTo(tile, clientX, clientY) {
    const offsetX = Number(tile.dataset.grabOffsetX) || 0;
    const offsetY = Number(tile.dataset.grabOffsetY) || 0;
    tile.style.left = (clientX - offsetX) + 'px';
    tile.style.top = (clientY - offsetY) + 'px';
}

function finishDrag(tile, clientX, clientY) {
    if (activeDragTile !== tile) return;
    activeDragTile = null;
    tile.classList.remove('dragging');

  // на миг прячем кусочек, чтобы узнать, что находится под ним
    tile.style.visibility = 'hidden';
    const targetEl = document.elementFromPoint(clientX, clientY);
    tile.style.visibility = '';

    const slot = targetEl ? targetEl.closest('.puzzle-slot') : null;

    if (slot) {
    const correctIndex = Number(tile.dataset.correctIndex);
    const slotIndex = Number(slot.dataset.index);

    if (correctIndex === slotIndex && !slot.classList.contains('filled')) {
        placeTileInSlot(tile, slot);
        return;
    } else {
        puzzleMessage.textContent = "Не тот кусочек для этого места — попробуй ещё раз 🧩";
        puzzleMessage.className = "captcha-message error";
        setTimeout(() => { puzzleMessage.textContent = ''; }, 1200);
    }
    }

    resetTilePosition(tile);
}

function resetTilePosition(tile) {
    tile.style.position = '';
    tile.style.left = '';
    tile.style.top = '';
    tile.style.width = '';
    tile.style.height = '';
    tile.style.zIndex = '';
}

function placeTileInSlot(tile, slot) {
    resetTilePosition(tile);
    tile.classList.add('placed');
    tile.style.width = '100%';
    tile.style.height = '100%';
    slot.classList.add('filled');
    slot.innerHTML = '';
    slot.appendChild(tile);

    placedCount++;
  if (placedCount === GRID_SIZE * GRID_SIZE) {
    onPuzzleComplete();
    }
}

function onPuzzleComplete() {
    puzzleMessage.textContent = "Воспоминание собрано! 💗";
    puzzleMessage.className = "captcha-message success";
    puzzleContinueBtn.classList.remove('hidden');
    fireConfettiBurst();
}

function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}

/* ==========================================================
        ЭКРАН 4 — ФИНАЛ (титры + сертификат)
   ========================================================== */
const crawlWrap = document.getElementById('crawlWrap');
const crawlText = document.getElementById('crawlText');
const skipCrawlBtn = document.getElementById('skipCrawlBtn');
const certificateWrap = document.getElementById('certificateWrap');
const certificateBtn = document.getElementById('certificateBtn');

let finaleStarted = false;
let confettiInterval = null;

function startFinale() {
    if (finaleStarted) return;
    finaleStarted = true;

    crawlText.addEventListener('animationend', showCertificate);
    skipCrawlBtn.addEventListener('click', showCertificate);
}

function showCertificate() {
    crawlWrap.classList.add('hidden');
    certificateWrap.classList.remove('hidden');
    startAmbientConfetti();
}

function startAmbientConfetti() {
    if (confettiInterval) return;
    confettiInterval = setInterval(() => {
    confetti({
        particleCount: 30,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FF6FA5', '#FFD166', '#FFB8D2', '#C9184A']
    });
    }, 1200);
}

function fireConfettiBurst() {
    confetti({
    particleCount: 120,
    spread: 90,
    origin: { y: 0.6 },
    colors: ['#FF6FA5', '#FFD166', '#FFB8D2', '#C9184A']
    });
}

certificateBtn.addEventListener('click', activateCertificate);
certificateBtn.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') activateCertificate();
});

function activateCertificate() {
    certificateBtn.style.pointerEvents = 'none';
    fireConfettiBurst();
    setTimeout(() => fireConfettiBurst(), 300);

    setTimeout(() => {
        window.location.href = FINAL_LINK;
    }, 1200);
}

/* ==========================================================
    ЭКРАН 4 — АЛФАВИТКА
   ========================================================== */

// ЗАГЛУШКА: впиши пути к своим фото букв украинского алфавита
const ALPHABET_IMAGES = {
    'а': 'assets/alphabet/a.jpg',
    'б': 'assets/alphabet/b.jpg',
    'в': 'assets/alphabet/v.jpg',
    'г': 'assets/alphabet/g.jpg',
    'ґ': 'assets/alphabet/g2.jpg',
    'д': 'assets/alphabet/d.jpg',
    'е': 'assets/alphabet/e.jpg',
    'є': 'assets/alphabet/ye.jpg',
    'ж': 'assets/alphabet/zh.jpg',
    'з': 'assets/alphabet/z.jpg',
    'и': 'assets/alphabet/y.jpg',
    'і': 'assets/alphabet/i.jpg',
    'ї': 'assets/alphabet/yi.jpg',
    'й': 'assets/alphabet/i-short.jpg',
    'к': 'assets/alphabet/k.jpg',
    'л': 'assets/alphabet/l.jpg',
    'м': 'assets/alphabet/m.jpg',
    'н': 'assets/alphabet/n.jpg',
    'о': 'assets/alphabet/o.jpg',
    'п': 'assets/alphabet/p.jpg',
    'р': 'assets/alphabet/r.jpg',
    'с': 'assets/alphabet/s.jpg',
    'т': 'assets/alphabet/t.jpg',
    'у': 'assets/alphabet/u.jpg',
    'ф': 'assets/alphabet/f.jpg',
    'х': 'assets/alphabet/h.jpg',
    'ц': 'assets/alphabet/ts.jpg',
    'ч': 'assets/alphabet/ch.jpg',
    'ш': 'assets/alphabet/sh.jpg',
    'щ': 'assets/alphabet/shch.jpg',
    'ь': 'assets/alphabet/soft.jpg',
    'ю': 'assets/alphabet/yu.jpg',
    'я': 'assets/alphabet/ya.jpg',
    "'": 'assets/alphabet/apostrophe.jpg'
};

// ЗАГЛУШКА: свой вопрос и правильный ответ (ответ — маленькими буквами)
const ALPHABET_QUESTION = "Впиши сюда свой вопрос";
const ALPHABET_ANSWER = "правильный ответ";

const alphabetDisplayBox = document.getElementById('alphabetDisplayBox');
const alphabetInput = document.getElementById('alphabetInput');
const alphabetMessage = document.getElementById('alphabetMessage');
const alphabetCheckBtn = document.getElementById('alphabetCheckBtn');
const alphabetContinueBtn = document.getElementById('alphabetContinueBtn');
const alphabetQuestionEl = document.getElementById('alphabetQuestion');

let alphabetInitialized = false;

function initAlphabet() {
    if (alphabetInitialized) {
    alphabetInput.focus();
    return;
    }
    alphabetInitialized = true;

    alphabetQuestionEl.textContent = ALPHABET_QUESTION;

    alphabetDisplayBox.addEventListener('click', () => alphabetInput.focus());
    alphabetInput.addEventListener('input', renderAlphabetDisplay);
    alphabetCheckBtn.addEventListener('click', checkAlphabetAnswer);

    setTimeout(() => alphabetInput.focus(), 300);
}

function renderAlphabetDisplay() {
    alphabetDisplayBox.innerHTML = '';
    const value = alphabetInput.value;

    for (const rawChar of value) {
    if (rawChar === ' ') {
        const spacer = document.createElement('div');
        spacer.className = 'alphabet-space';
        alphabetDisplayBox.appendChild(spacer);
        continue;
    }

    const char = rawChar.toLowerCase();
    const imgSrc = ALPHABET_IMAGES[char];
    const el = document.createElement(imgSrc ? 'img' : 'span');

    if (imgSrc) {
        el.className = 'alphabet-letter-img';
        el.src = imgSrc;
        el.alt = rawChar;
        el.onerror = function () {
        const fallback = document.createElement('span');
        fallback.className = 'alphabet-letter-fallback';
        fallback.textContent = rawChar;
        this.replaceWith(fallback);
        };
    } else {
        el.className = 'alphabet-letter-fallback';
        el.textContent = rawChar;
    }

    alphabetDisplayBox.appendChild(el);
    }
}

function checkAlphabetAnswer() {
    const value = alphabetInput.value.trim().toLowerCase();
    if (value === ALPHABET_ANSWER.trim().toLowerCase()) {
    alphabetMessage.textContent = "Верно! Ты знаешь наш алфавит 💗";
    alphabetMessage.className = "captcha-message success";
    alphabetInput.disabled = true;
    alphabetCheckBtn.classList.add('hidden');
    alphabetContinueBtn.classList.remove('hidden');
    } else {
    alphabetMessage.textContent = "Не то... попробуй ещё раз 🔤";
    alphabetMessage.className = "captcha-message error";
    }
}

/* ==========================================================
    ЭКРАН 5 — КТО ЕСТЬ КТО
   ========================================================== */

// ЗАГЛУШКА: замени name/img/category под своих 10 человек
// category: 'friend' — наши, 'enemy' — не наши
const PEOPLE_DATA = [
    { name: "Человек 1",  img: "assets/people/1.jpg",  category: "friend" },
    { name: "Человек 2",  img: "assets/people/2.jpg",  category: "friend" },
    { name: "Человек 3",  img: "assets/people/3.jpg",  category: "friend" },
    { name: "Человек 4",  img: "assets/people/4.jpg",  category: "friend" },
    { name: "Человек 5",  img: "assets/people/5.jpg",  category: "friend" },
    { name: "Человек 6",  img: "assets/people/6.jpg",  category: "enemy" },
    { name: "Человек 7",  img: "assets/people/7.jpg",  category: "enemy" },
    { name: "Человек 8",  img: "assets/people/8.jpg",  category: "enemy" },
    { name: "Человек 9",  img: "assets/people/9.jpg",  category: "enemy" },
    { name: "Человек 10", img: "assets/people/10.jpg", category: "enemy" }
];

const peopleTray = document.getElementById('peopleTray');
const peopleMessage = document.getElementById('peopleMessage');
const peopleContinueBtn = document.getElementById('peopleContinueBtn');
const peopleZones = document.querySelectorAll('.people-zone');

let peopleInitialized = false;
let peoplePlacedCount = 0;
let activePersonTile = null;

function initPeopleSort() {
    if (peopleInitialized) return;
    peopleInitialized = true;

    const order = [...PEOPLE_DATA.keys()];
    shuffleArray(order);

    order.forEach((dataIndex) => {
    const person = PEOPLE_DATA[dataIndex];
    const tile = document.createElement('div');
    tile.className = 'person-tile';
    tile.dataset.category = person.category;

    const img = document.createElement('img');
    img.src = person.img;
    img.alt = person.name;
    img.onerror = function () {
        tile.textContent = person.name.slice(0, 2);
        tile.style.display = 'flex';
        tile.style.alignItems = 'center';
        tile.style.justifyContent = 'center';
        tile.style.color = '#fff';
        tile.style.fontWeight = '700';
        this.remove();
    };
    tile.appendChild(img);

    attachPersonDragEvents(tile);
    peopleTray.appendChild(tile);
    });
}

function attachPersonDragEvents(tile) {
    tile.addEventListener('pointerdown', (e) => {
    if (tile.classList.contains('placed')) return;
    e.preventDefault();

    activePersonTile = tile;
    tile.setPointerCapture(e.pointerId);

    const rect = tile.getBoundingClientRect();
    tile.dataset.grabOffsetX = e.clientX - rect.left;
    tile.dataset.grabOffsetY = e.clientY - rect.top;

    tile.style.width = rect.width + 'px';
    tile.style.height = rect.height + 'px';
    tile.style.position = 'fixed';
    tile.style.zIndex = '1000';
    tile.classList.add('dragging');
    movePersonTo(tile, e.clientX, e.clientY);
    });

    tile.addEventListener('pointermove', (e) => {
    if (activePersonTile !== tile) return;
    movePersonTo(tile, e.clientX, e.clientY);
    highlightZoneUnder(e.clientX, e.clientY, tile);
    });

    tile.addEventListener('pointerup', (e) => finishPersonDrag(tile, e.clientX, e.clientY));
    tile.addEventListener('pointercancel', (e) => finishPersonDrag(tile, e.clientX, e.clientY));
}

function movePersonTo(tile, clientX, clientY) {
    const offsetX = Number(tile.dataset.grabOffsetX) || 0;
    const offsetY = Number(tile.dataset.grabOffsetY) || 0;
    tile.style.left = (clientX - offsetX) + 'px';
    tile.style.top = (clientY - offsetY) + 'px';
}

function highlightZoneUnder(clientX, clientY, tile) {
    tile.style.visibility = 'hidden';
    const el = document.elementFromPoint(clientX, clientY);
    tile.style.visibility = '';
    peopleZones.forEach(z => z.classList.remove('drag-hover'));
    const zone = el ? el.closest('.people-zone') : null;
    if (zone) zone.classList.add('drag-hover');
}

function finishPersonDrag(tile, clientX, clientY) {
    if (activePersonTile !== tile) return;
    activePersonTile = null;
    tile.classList.remove('dragging');
    peopleZones.forEach(z => z.classList.remove('drag-hover'));

    tile.style.visibility = 'hidden';
    const targetEl = document.elementFromPoint(clientX, clientY);
    tile.style.visibility = '';

    const zone = targetEl ? targetEl.closest('.people-zone') : null;

    if (zone) {
    const zoneCategory = zone.dataset.category;
    const personCategory = tile.dataset.category;

    if (zoneCategory === personCategory) {
        placePersonInZone(tile, zone);
        return;
    } else {
        peopleMessage.textContent = "Не туда! Присмотрись получше 👀";
        peopleMessage.className = "captcha-message error";
        setTimeout(() => { peopleMessage.textContent = ''; }, 1200);
    }
    }

    resetPersonPosition(tile);
}

function resetPersonPosition(tile) {
    tile.style.position = '';
    tile.style.left = '';
    tile.style.top = '';
    tile.style.width = '';
    tile.style.height = '';
    tile.style.zIndex = '';
}

function placePersonInZone(tile, zone) {
    resetPersonPosition(tile);
    tile.classList.add('placed');
    zone.appendChild(tile);

    peoplePlacedCount++;
    if (peoplePlacedCount === PEOPLE_DATA.length) {
    onPeopleSortComplete();
    }
}

function onPeopleSortComplete() {
    peopleMessage.textContent = "Всё верно, ты знаешь наш круг! 💗";
    peopleMessage.className = "captcha-message success";
    peopleContinueBtn.classList.remove('hidden');
    fireConfettiBurst();
}
/* ==========================================================
    ЭКРАН 6 — ВОПРОС ПО КАРТИНКЕ
   ========================================================== */

// ЗАГЛУШКА: свои варианты ответа, correct — индекс правильного (с нуля)
const PICTURE_OPTIONS = [
    "Вариант ответа 1",
    "Вариант ответа 2",
    "Вариант ответа 3",
    "Вариант ответа 4"
];
const PICTURE_CORRECT_INDEX = 0;

const pictureOptionsWrap = document.getElementById('pictureOptions');
const pictureMessage = document.getElementById('pictureMessage');
const pictureContinueBtn = document.getElementById('pictureContinueBtn');

let pictureInitialized = false;

function initPictureQuestion() {
    if (pictureInitialized) return;
    pictureInitialized = true;

    PICTURE_OPTIONS.forEach((text, index) => {
    const btn = document.createElement('button');
    btn.className = 'picture-option';
    btn.textContent = text;
    btn.addEventListener('click', () => handlePictureAnswer(index, btn));
    pictureOptionsWrap.appendChild(btn);
    });
}

function handlePictureAnswer(index, btnEl) {
    const allButtons = pictureOptionsWrap.querySelectorAll('.picture-option');

    if (index === PICTURE_CORRECT_INDEX) {
    btnEl.classList.add('correct-flash');
    allButtons.forEach(b => b.disabled = true);
    pictureMessage.textContent = "Точно! Ты помнишь этот момент 💗";
    pictureMessage.className = "captcha-message success";
    pictureContinueBtn.classList.remove('hidden');
    } else {
    btnEl.classList.add('wrong-flash');
    setTimeout(() => btnEl.classList.remove('wrong-flash'), 500);
    pictureMessage.textContent = "Не то... попробуй ещё раз";
    pictureMessage.className = "captcha-message error";
    }
}

/* ==========================================================
    ПРЯЧУЩИЕСЯ ЦИФРЫ (экраны 2-8) — дата знакомства 30.06.24
   ========================================================== */

// ЗАГЛУШКА: если захочешь поменять расстановку — просто поменяй номера экранов здесь
const DIGIT_PLACEMENTS = {
    2: { id: 'digit-1', value: '3', hint: true },
    3: { id: 'digit-2', value: '0' },
    4: { id: 'digit-3', value: '0' },
    5: { id: 'digit-4', value: '6' },
    6: { id: 'digit-5', value: '2' },
    8: { id: 'digit-6', value: '4' }
  // экран 7 — без цифры, так и задумано (6 цифр на 7 экранов)
};

let foundDigits = {}; // instanceId -> значение цифры

function spawnDigitForScreen(screenNumber) {
    const placement = DIGIT_PLACEMENTS[screenNumber];
    if (!placement) return;
    createHiddenDigit(`#screen-${screenNumber}`, placement.id, placement.value, placement.hint);
}

function createHiddenDigit(screenSelector, instanceId, digitValue, withHint) {
    const screen = document.querySelector(screenSelector);
  if (!screen || document.getElementById(instanceId)) return; // не создаём дважды

    const digitEl = document.createElement('div');
    digitEl.id = instanceId;
    digitEl.className = 'hidden-digit';
    digitEl.textContent = digitValue;

  // случайная позиция в пределах экрана, не совсем впритык к краям
  const top = 8 + Math.random() * 80;
  const left = 6 + Math.random() * 82;
    digitEl.style.top = top + '%';
    digitEl.style.left = left + '%';

    let hintEl = null;
    if (withHint) {
    hintEl = document.createElement('div');
    hintEl.className = 'hidden-digit-hint';
    hintEl.id = 'hint-' + instanceId;
    hintEl.innerHTML = '↖ будь внимательна на КАЖДОМ слайде';
    hintEl.style.top = top + '%';
    hintEl.style.left = Math.min(left + 6, 60) + '%';
    screen.appendChild(hintEl);

    // подсказка сама плавно исчезает через 5 секунд, если её не заметили
    setTimeout(() => hideHint(hintEl), 5000);
    }

    digitEl.addEventListener('click', () => collectDigit(digitEl, instanceId, digitValue, hintEl));
    screen.appendChild(digitEl);
}

function hideHint(hintEl) {
    if (!hintEl || !hintEl.isConnected) return;
    hintEl.classList.add('hint-hide');
    setTimeout(() => hintEl.remove(), 500);
}

function collectDigit(el, instanceId, digitValue, hintEl) {
    if (foundDigits[instanceId]) return;
    foundDigits[instanceId] = digitValue;

    // конфетти вылетает именно из того места, где была цифра
    const rect = el.getBoundingClientRect();
    confetti({
        particleCount: 60,
        spread: 70,
        startVelocity: 25,
        origin: {
            x: (rect.left + rect.width / 2) / window.innerWidth,
            y: (rect.top + rect.height / 2) / window.innerHeight
        },
        colors: ['#FF6FA5', '#FFD166', '#FFB8D2', '#C9184A']
    });

    el.classList.add('digit-collected');
    if (hintEl) hideHint(hintEl);

    setTimeout(() => el.remove(), 400);
}

/* ==========================================================
    ЭКРАН 9 — СБОРКА КОДА
   ========================================================== */
const HIDDEN_DIGITS_ANSWER = "300624";

const digitsEntered = document.getElementById('digitsEntered');
const digitsPool = document.getElementById('digitsPool');
const digitsMessage = document.getElementById('digitsMessage');
const digitsResetBtn = document.getElementById('digitsResetBtn');
const digitsContinueBtn = document.getElementById('digitsContinueBtn');

let digitsInitialized = false;
let enteredSequence = [];
let enteredTiles = []; // какие именно плитки были использованы — нужно, чтобы уметь отменять ввод

function initDigitsScreen() {
    if (digitsInitialized) return;
    digitsInitialized = true;

    renderDigitsEntered();
    renderDigitsPool();
    digitsResetBtn.addEventListener('click', resetDigitsEntry);
    document.addEventListener('keydown', handleDigitsKeydown);
}

function handleDigitsKeydown(e) {
    const screen9 = document.getElementById('screen-9');
    if (!screen9.classList.contains('active')) return; // работаем, только когда экран 9 активен

    if (e.key === 'Backspace') {
        e.preventDefault();
        removeLastDigit();
        return;
    }

    if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        const tile = Array.from(digitsPool.querySelectorAll('.digit-tile'))
            .find(t => !t.disabled && t.textContent === e.key);
        if (tile) pickDigit(e.key, tile);
    }
}

function renderDigitsEntered() {
    digitsEntered.innerHTML = '';
    for (let i = 0; i < HIDDEN_DIGITS_ANSWER.length; i++) {
    const slot = document.createElement('div');
    slot.className = 'digit-slot';
    slot.textContent = enteredSequence[i] || '';
    digitsEntered.appendChild(slot);
    }
}

function renderDigitsPool() {
    digitsPool.innerHTML = '';

  // берём цифры, найденные на экранах 2-8
    let values = Object.values(foundDigits);

  // ЗАГЛУШКА: если тестируешь экран 9 отдельно, не проходя экраны 2-8,
  // раскомментируй строку ниже — получишь все 6 цифр сразу:
  // values = ['3', '0', '0', '6', '2', '4'];

    const shuffled = [...values];
    shuffleArray(shuffled);

    shuffled.forEach((value) => {
    const tile = document.createElement('button');
    tile.className = 'digit-tile';
    tile.textContent = value;
    tile.addEventListener('click', () => pickDigit(value, tile));
    digitsPool.appendChild(tile);
    });
}

function pickDigit(value, tileEl) {
    if (tileEl.disabled || enteredSequence.length >= HIDDEN_DIGITS_ANSWER.length) return;

    enteredSequence.push(value);
    enteredTiles.push(tileEl);
    tileEl.disabled = true;
    tileEl.classList.add('digit-used');
    renderDigitsEntered();

    if (enteredSequence.length === HIDDEN_DIGITS_ANSWER.length) {
    checkDigitsAnswer();
    }
}

function removeLastDigit() {
    if (enteredSequence.length === 0) return;
    enteredSequence.pop();
    const tile = enteredTiles.pop();
    if (tile) {
        tile.disabled = false;
        tile.classList.remove('digit-used');
    }
    digitsMessage.textContent = '';
    renderDigitsEntered();
}

function checkDigitsAnswer() {
    const guess = enteredSequence.join('');
    if (guess === HIDDEN_DIGITS_ANSWER) {
    digitsMessage.textContent = "Верно! Ты запомнила нашу дату 💗";
    digitsMessage.className = "captcha-message success";
    digitsContinueBtn.classList.remove('hidden');
    digitsResetBtn.classList.add('hidden');
    fireConfettiBurst();
    } else {
    digitsMessage.textContent = "Порядок не тот... попробуй ещё раз";
    digitsMessage.className = "captcha-message error";
    setTimeout(resetDigitsEntry, 900);
    }
}

function resetDigitsEntry() {
    enteredSequence = [];
    enteredTiles = [];
    digitsMessage.textContent = '';
    renderDigitsEntered();
    renderDigitsPool();
}

/* ==========================================================
    ЭКРАН 7 — ТАРО НАШЕЙ ДРУЖБЫ
   ========================================================== */
const tarotCards = document.querySelectorAll('.tarot-card');
const tarotContinueBtn = document.getElementById('tarotContinueBtn');

let tarotInitialized = false;
let flippedCount = 0;

function initTarot() {
    if (tarotInitialized) return;
    tarotInitialized = true;

    tarotCards.forEach((card) => {
    card.addEventListener('click', () => flipTarotCard(card));
    });
}

function flipTarotCard(card) {
    if (card.classList.contains('flipped')) return;

    card.classList.add('flipped');
    flippedCount++;

    if (flippedCount === tarotCards.length) {
    setTimeout(() => {
        tarotContinueBtn.classList.remove('hidden');
        fireConfettiBurst();
    }, 500);
    }
}

/* ==========================================================
    ЭКРАН 8 — БЕСПРОИГРЫШНАЯ ЛОТЕРЕЯ (scratch-card на canvas)
   ========================================================== */
const scratchArea = document.getElementById('scratchArea');
const scratchCanvas = document.getElementById('scratchCanvas');
const scratchMessage = document.getElementById('scratchMessage');
const scratchContinueBtn = document.getElementById('scratchContinueBtn');

const SCRATCH_THRESHOLD = 0.5; // 50% стёртой поверхности достаточно для победы

let scratchInitialized = false;
let scratchCtx = null;
let isScratching = false;
let scratchRevealed = false;

function initScratchCard() {
    if (scratchInitialized) return;
    scratchInitialized = true;

    scratchCtx = scratchCanvas.getContext('2d');
    drawScratchLayer();

    window.addEventListener('resize', drawScratchLayer);

    scratchCanvas.addEventListener('pointerdown', startScratching);
    scratchCanvas.addEventListener('pointermove', doScratch);
    scratchCanvas.addEventListener('pointerup', stopScratching);
    scratchCanvas.addEventListener('pointerleave', stopScratching);
}

function drawScratchLayer() {
    const rect = scratchArea.getBoundingClientRect();
    scratchCanvas.width = rect.width;
    scratchCanvas.height = rect.height;

  // серебристый защитный слой (градиент, чтобы выглядело как настоящая монетка-скретч)
    const gradient = scratchCtx.createLinearGradient(0, 0, rect.width, rect.height);
    gradient.addColorStop(0, '#d8d8de');
    gradient.addColorStop(0.5, '#b8b8c2');
    gradient.addColorStop(1, '#d8d8de');
    scratchCtx.fillStyle = gradient;
    scratchCtx.fillRect(0, 0, rect.width, rect.height);

    scratchCtx.font = '700 16px Fredoka, sans-serif';
    scratchCtx.fillStyle = '#6b6b78';
    scratchCtx.textAlign = 'center';
    scratchCtx.fillText('✦ сотри меня ✦', rect.width / 2, rect.height / 2);
}

function startScratching(e) {
    if (scratchRevealed) return;
    isScratching = true;
    scratchAt(e);
}

function doScratch(e) {
    if (!isScratching || scratchRevealed) return;
    scratchAt(e);
}

function stopScratching() {
    if (!isScratching) return;
    isScratching = false;
    checkScratchProgress();
}

function scratchAt(e) {
    const rect = scratchCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    scratchCtx.globalCompositeOperation = 'destination-out';
    scratchCtx.beginPath();
    scratchCtx.arc(x, y, 26, 0, Math.PI * 2);
    scratchCtx.fill();
}

function checkScratchProgress() {
    if (scratchRevealed) return;

    const { width, height } = scratchCanvas;
    const imageData = scratchCtx.getImageData(0, 0, width, height).data;

    let transparentPixels = 0;
  // проверяем каждый 4-й пиксель для скорости (alpha-канал)
    for (let i = 3; i < imageData.length; i += 16) {
    if (imageData[i] === 0) transparentPixels++;
    }

    const totalChecked = imageData.length / 16;
    const scratchedRatio = transparentPixels / totalChecked;

    if (scratchedRatio >= SCRATCH_THRESHOLD) {
    revealScratchPrize();
    }
}

function revealScratchPrize() {
    scratchRevealed = true;

  // плавно стираем весь оставшийся слой и запускаем анимацию победы
    scratchCanvas.style.transition = 'opacity 0.6s ease';
    scratchCanvas.style.opacity = '0';
    setTimeout(() => { scratchCanvas.style.display = 'none'; }, 600);

    scratchMessage.textContent = "Джекпот! Билет выигрышный 🎉";
    scratchMessage.className = "captcha-message success";
    scratchContinueBtn.classList.remove('hidden');
    fireConfettiBurst();
}