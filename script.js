(() => {
    // ===== Elements =====
    const card = document.getElementById('card');
    const front = document.getElementById('front');
    const content = document.getElementById('content');

    const badge = document.getElementById('badge');
    const badge2 = document.getElementById('badge2');

    const openBtn = document.getElementById('openBtn');
    const burstBtn = document.getElementById('burstBtn');
    const downloadBtn = document.getElementById('downloadBtn');

    const nameInput = document.getElementById('nameInput');
    const recipientName = document.getElementById('recipientName');
    const stickerPreview = document.getElementById('stickerPreview');

    const typingLine = document.getElementById('typingLine');
    const newWishBtn = document.getElementById('newWishBtn');
    const wishDynamic = document.getElementById('wishDynamic');

    const stickerPicker = document.getElementById('stickerPicker');

    const easterEgg = document.getElementById('easterEgg');
    const eggText = document.getElementById('eggText');

    // Mini-game
    const gameOverlay = document.getElementById('gameOverlay');
    const gameField = document.getElementById('gameField');
    const gameOpenBtn = document.getElementById('gameOpenBtn');
    const gameCloseBtn = document.getElementById('gameCloseBtn');
    const gameStartBtn = document.getElementById('gameStartBtn');
    const gameAgainBtn = document.getElementById('gameAgainBtn');
    const timeLeftEl = document.getElementById('timeLeft');
    const scoreEl = document.getElementById('score');

    // Theme chips
    const themeChips = Array.from(document.querySelectorAll('.chip[data-theme]'));

    // ===== Storage keys =====
    const STORAGE = {
        name: "march8_name",
        theme: "march8_theme",
        sticker: "march8_sticker"
    };

    // ===== Your wishes (fill yourself) =====
    // Пункт 2: генератор пожеланий — впиши сюда свои фразы
    const WISHES = [
        "Пожелание №1 (замени на своё)",
        "Пожелание №2 (замени на своё)",
        "Пожелание №3 (замени на своё)",
    ];

    // Пункт 3: пасхалка — впиши сюда скрытые строки
    const EGG_LINES = [
        "Ты наш секретный босс этой группы.",
        "Если это читаешь — тебе +100 к удаче.",
        "С 8 марта. Ты правда крутая."
    ];

    // Пункт 6: стикеры — можешь заменить набор
    const STICKERS = ["🌷", "🎀", "✨", "💐", "🫶", "🍓"];

    // Пункт 4: мини-игра — какие “цветочки” ловим
    const TARGETS = ["🌷", "💐", "✨", "🎀", "🫶"];

    // ===== Helpers =====
    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
    const rand = (min, max) => Math.random() * (max - min) + min;
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

    function sanitizeName(raw) {
        if (!raw) return "";
        let s = raw.trim().replace(/\s+/g, " ");
        s = s.slice(0, 24);
        s = s.replace(/[<>]/g, "");
        return s;
    }

    function save(key, val) {
        localStorage.setItem(key, val);
    }
    function load(key) {
        return localStorage.getItem(key) || "";
    }

    // ===== Theme system (пункт 5) =====
    const THEMES = {
        pink: {
            bg1:"#fff6fb", bg2:"#f3f4ff", bg3:"#f2fff9",
            accent:"#ff7fb1", accent2:"#6fe7c8", accent3:"#9aa6ff"
        },
        lavender: {
            bg1:"#fbf8ff", bg2:"#f3f2ff", bg3:"#f8fbff",
            accent:"#b99cff", accent2:"#7bd6ff", accent3:"#ff8fc7"
        },
        mint: {
            bg1:"#f3fffb", bg2:"#f2fbff", bg3:"#fff7fb",
            accent:"#6fe7c8", accent2:"#9aa6ff", accent3:"#ff7fb1"
        }
    };

    function applyTheme(themeName) {
        const t = THEMES[themeName] || THEMES.pink;
        const root = document.documentElement;
        root.style.setProperty("--bg1", t.bg1);
        root.style.setProperty("--bg2", t.bg2);
        root.style.setProperty("--bg3", t.bg3);
        root.style.setProperty("--accent", t.accent);
        root.style.setProperty("--accent2", t.accent2);
        root.style.setProperty("--accent3", t.accent3);

        themeChips.forEach(ch => ch.classList.toggle("active", ch.dataset.theme === themeName));
        save(STORAGE.theme, themeName);
    }

    themeChips.forEach(ch => {
        ch.addEventListener("click", () => applyTheme(ch.dataset.theme));
    });

    // ===== Sticker picker (пункт 6) =====
    function renderStickers() {
        stickerPicker.innerHTML = "";
        const saved = load(STORAGE.sticker);

        STICKERS.forEach(st => {
            const b = document.createElement("button");
            b.type = "button";
            b.className = "stickerBtn";
            b.textContent = st;
            if (saved === st) b.classList.add("active");

            b.addEventListener("click", () => {
                save(STORAGE.sticker, st);
                Array.from(stickerPicker.querySelectorAll(".stickerBtn"))
                    .forEach(x => x.classList.toggle("active", x.textContent === st));
            });

            stickerPicker.appendChild(b);
        });
    }

    function applyStickerToTitle() {
        const s = load(STORAGE.sticker);
        stickerPreview.textContent = s ? s : "";
        stickerPreview.style.display = s ? "inline-block" : "none";
    }

    // ===== Tilt (оставляем твой 4 пункт как раньше) =====
    function setTiltFromPoint(clientX, clientY) {
        const r = card.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;

        const dx = (clientX - cx) / (r.width / 2);
        const dy = (clientY - cy) / (r.height / 2);

        const tiltY = clamp(dx * 8, -8, 8);
        const tiltX = clamp(-dy * 8, -8, 8);

        card.style.setProperty('--tiltX', `${tiltX}deg`);
        card.style.setProperty('--tiltY', `${tiltY}deg`);
    }

    card.addEventListener('mousemove', (e) => setTiltFromPoint(e.clientX, e.clientY));
    card.addEventListener('mouseleave', () => {
        card.style.setProperty('--tiltX', `0deg`);
        card.style.setProperty('--tiltY', `0deg`);
    });

    // ===== Typing (пункт 5 из прошлого списка у тебя был typing; оставляем) =====
    async function typeText(el, text, speedMs = 18) {
        el.textContent = "";
        for (let i = 0; i < text.length; i++) {
            el.textContent += text[i];
            await new Promise(r => setTimeout(r, speedMs));
        }
    }

    // ===== Canvas burst (эффекты) =====
    const canvas = document.getElementById('fxCanvas');
    const ctx = canvas.getContext('2d');
    const particles = [];
    let animId = null;

    function resizeCanvas() {
        const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
        canvas.width = Math.floor(window.innerWidth * dpr);
        canvas.height = Math.floor(window.innerHeight * dpr);
        canvas.style.width = `${window.innerWidth}px`;
        canvas.style.height = `${window.innerHeight}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    function spawnBurst(x, y, count = 40) {
        const shapes = ['petal', 'dot', 'spark'];
        const colors = ['#ff7fb1', '#6fe7c8', '#9aa6ff', '#ffd6e8', '#ffffff'];

        for (let i = 0; i < count; i++) {
            const a = rand(0, Math.PI * 2);
            const sp = rand(1.4, 4.2);
            particles.push({
                x, y,
                vx: Math.cos(a) * sp,
                vy: Math.sin(a) * sp - rand(0.9, 2.0),
                rot: rand(0, Math.PI * 2),
                vr: rand(-0.12, 0.12),
                life: rand(60, 120),
                size: rand(4, 9),
                shape: pick(shapes),
                color: pick(colors)
            });
        }
        startLoop();
    }

    function drawParticle(p) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = clamp(p.life / 120, 0, 1);
        ctx.fillStyle = p.color;

        if (p.shape === 'dot') {
            ctx.beginPath();
            ctx.arc(0, 0, p.size * 0.45, 0, Math.PI * 2);
            ctx.fill();
        } else if (p.shape === 'spark') {
            ctx.fillRect(-p.size * 0.5, -p.size * 0.12, p.size, p.size * 0.24);
            ctx.fillRect(-p.size * 0.12, -p.size * 0.5, p.size * 0.24, p.size);
        } else {
            ctx.beginPath();
            ctx.ellipse(0, 0, p.size * 0.55, p.size, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.globalAlpha *= 0.6;
            ctx.fillStyle = '#ffffff55';
            ctx.beginPath();
            ctx.ellipse(p.size * 0.12, -p.size * 0.1, p.size * 0.18, p.size * 0.55, 0.2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    function step() {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];

            p.vy += 0.06;
            p.vx *= 0.995;
            p.vy *= 0.995;
            p.x += p.vx;
            p.y += p.vy;
            p.rot += p.vr;
            p.life -= 1;

            drawParticle(p);

            if (p.life <= 0 || p.y > window.innerHeight + 80) particles.splice(i, 1);
        }

        if (particles.length > 0) {
            animId = requestAnimationFrame(step);
        } else {
            animId = null;
            ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        }
    }

    function startLoop() {
        if (animId == null) animId = requestAnimationFrame(step);
    }

    // ===== Generator (пункт 2) =====
    function nextWish() {
        if (!WISHES.length) {
            wishDynamic.textContent = "Добавь пожелания в массив WISHES в script.js.";
            return;
        }
        const w = pick(WISHES);
        wishDynamic.textContent = w;
    }

    newWishBtn.addEventListener("click", nextWish);

    // ===== Easter egg (пункт 3) =====
    let badgeClicks = 0;
    let badgeTimer = null;

    function onBadgeClick() {
        badgeClicks += 1;
        clearTimeout(badgeTimer);
        badgeTimer = setTimeout(() => { badgeClicks = 0; }, 1500);

        // 7 кликов за 1.5 сек — открыть/обновить пасхалку
        if (badgeClicks >= 7) {
            badgeClicks = 0;

            const line = pick(EGG_LINES);
            eggText.textContent = line;
            easterEgg.hidden = false;

            // маленький burst для эффекта
            const r = card.getBoundingClientRect();
            spawnBurst(r.left + r.width * 0.25, r.top + 40, 35);
        }
    }

    badge.addEventListener("click", onBadgeClick);
    // badge2 в контенте можно тоже сделать кликабельным (если хочешь):
    // badge2.addEventListener("click", onBadgeClick);

    // ===== Name + open flow =====
    function applyName(n) {
        const nice = n || "дорогая";
        recipientName.textContent = nice;

        const template = typingLine.getAttribute("data-template") || "";
        return template.replaceAll("{{name}}", nice);
    }

    function openCard() {
        const inputName = sanitizeName(nameInput.value);
        if (inputName) save(STORAGE.name, inputName);

        applyStickerToTitle();

        const finalTypingText = applyName(inputName);

        front.style.display = 'none';
        content.style.display = 'block';

        // typing
        typeText(typingLine, finalTypingText, 18);

        // стартовое пожелание
        nextWish();

        // burst
        const r = card.getBoundingClientRect();
        spawnBurst(r.left + r.width / 2, r.top + r.height / 3, 55);
    }

    openBtn.addEventListener('click', openCard);

    burstBtn.addEventListener('click', () => {
        const r = burstBtn.getBoundingClientRect();
        spawnBurst(r.left + r.width / 2, r.top + r.height / 2, 45);
    });

    // ===== Mini-game (пункт 4) =====
    let gameTimer = null;
    let spawnTimer = null;
    let timeLeft = 10;
    let score = 0;
    let gameRunning = false;

    function openGame() {
        gameOverlay.classList.add("open");
        gameOverlay.setAttribute("aria-hidden", "false");
    }

    function closeGame() {
        stopGame();
        gameOverlay.classList.remove("open");
        gameOverlay.setAttribute("aria-hidden", "true");
    }

    function resetGameUI() {
        timeLeft = 10;
        score = 0;
        timeLeftEl.textContent = String(timeLeft);
        scoreEl.textContent = String(score);
        gameField.innerHTML = "";
        gameAgainBtn.disabled = true;
    }

    function spawnTarget() {
        const t = document.createElement("div");
        t.className = "target";
        t.textContent = pick(TARGETS);

        const field = gameField.getBoundingClientRect();
        // позиция внутри поля
        const x = rand(10, field.width - 54);
        const y = rand(50, field.height - 60);
        t.style.left = `${x}px`;
        t.style.top = `${y}px`;

        t.addEventListener("click", () => {
            if (!gameRunning) return;
            score += 1;
            scoreEl.textContent = String(score);
            t.remove();
            // микро-burst в месте клика (приятно)
            spawnBurst(field.left + x + 20, field.top + y + 20, 14);
        });

        gameField.appendChild(t);

        // удалить после анимации
        setTimeout(() => t.remove(), 1400);
    }

    function startGame() {
        if (gameRunning) return;
        resetGameUI();
        gameRunning = true;
        gameStartBtn.disabled = true;

        // спавним чаще в начале
        spawnTarget();
        spawnTimer = setInterval(spawnTarget, 450);

        gameTimer = setInterval(() => {
            timeLeft -= 1;
            timeLeftEl.textContent = String(timeLeft);
            if (timeLeft <= 0) {
                stopGame(true);
            }
        }, 1000);
    }

    function stopGame(finished = false) {
        gameRunning = false;
        gameStartBtn.disabled = false;

        if (spawnTimer) { clearInterval(spawnTimer); spawnTimer = null; }
        if (gameTimer) { clearInterval(gameTimer); gameTimer = null; }

        if (finished) {
            gameAgainBtn.disabled = false;
            // итоговое сообщение в пасхалку (по желанию)
            eggText.textContent = `Результат: ${score} очков. Ты молодец!`;
            easterEgg.hidden = false;
        }
    }

    gameOpenBtn.addEventListener("click", openGame);
    gameCloseBtn.addEventListener("click", closeGame);
    gameStartBtn.addEventListener("click", startGame);
    gameAgainBtn.addEventListener("click", startGame);

    // Закрытие по клику на фон
    gameOverlay.addEventListener("click", (e) => {
        if (e.target === gameOverlay) closeGame();
    });

    // ===== Download as image (пункт 10) =====
    async function downloadCard() {
        // html2canvas грузится через CDN, проверим
        if (typeof window.html2canvas !== "function") {
            alert("html2canvas не загрузился. Проверь интернет/блокировки или попробуй позже.");
            return;
        }

        // На время делаем tilt = 0, чтобы скрин был ровный
        const prevX = getComputedStyle(card).getPropertyValue("--tiltX");
        const prevY = getComputedStyle(card).getPropertyValue("--tiltY");
        card.style.setProperty("--tiltX", "0deg");
        card.style.setProperty("--tiltY", "0deg");

        try {
            const canvas = await window.html2canvas(card, {
                backgroundColor: null,
                scale: 2,
                useCORS: true
            });

            const link = document.createElement("a");
            link.download = "march8-card.png";
            link.href = canvas.toDataURL("image/png");
            link.click();
        } finally {
            card.style.setProperty("--tiltX", prevX || "0deg");
            card.style.setProperty("--tiltY", prevY || "0deg");
        }
    }

    downloadBtn.addEventListener("click", downloadCard);

    // ===== Init =====
    // theme
    const savedTheme = load(STORAGE.theme) || "pink";
    applyTheme(savedTheme);

    // name
    const savedName = sanitizeName(load(STORAGE.name));
    if (savedName) nameInput.value = savedName;

    // stickers
    renderStickers();
    // если есть сохранённый — подсветится в renderStickers()

})();