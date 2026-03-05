(() => {
    const stepName = document.getElementById("stepName");
    const stepWish = document.getElementById("stepWish");

    const nameInput = document.getElementById("nameInput");
    const nameHint = document.getElementById("nameHint");

    const openBtn = document.getElementById("openBtn");
    const demoBtn = document.getElementById("demoBtn");
    const backBtn = document.getElementById("backBtn");
    const nextWishBtn = document.getElementById("nextWishBtn");

    const nameSlot = document.getElementById("nameSlot");

    const wishBox = document.getElementById("wishBox");
    const wishText = document.getElementById("wishText");
    const scratchLayer = document.getElementById("scratchLayer");

    const doneText = document.getElementById("doneText");

    const GRID_X = 24;
    const GRID_Y = 16;
    const TARGET_COVER = 0.62;

    const wishTemplates = [
        "Дорогая {{name}}, пусть эта весна принесет тебе спокойствие в голове, уверенность в себе и много поводов улыбаться. Пусть учеба идет легче, планы складываются, а рядом будут люди, с которыми тепло и безопасно.\\n\\nС праздником! 💐",
        "{{name}}, желаем тебе больше легких дней, вдохновения и маленьких радостей каждый день. Пусть в учебе будут высокие результаты, а в жизни - поддержка, забота и счастье. 🌸",
        "С 8 Марта, {{name}}! Пусть у тебя всегда хватает сил на мечты и смелости на новые шаги. Желаем крепкого здоровья, душевного тепла и яркой, красивой весны. 🌷",
        "{{name}}, пусть в твоей жизни будет больше поводов гордиться собой. Желаем гармонии, добрых встреч, удачи в каждом деле и отличного настроения не только сегодня, но и весь год. ✨"
    ];

    let currentName = "";
    let wishIndex = 0;
    let revealed = false;

    let seen = new Array(GRID_X * GRID_Y).fill(false);
    let seenCount = 0;

    let isDown = false;
    let lastX = 0;
    let lastY = 0;

    const ctx = scratchLayer.getContext("2d");

    function sanitizeName(raw) {
        if (!raw) return "";
        let s = raw.trim().replace(/\s+/g, " ");
        s = s.slice(0, 24);
        s = s.replace(/[<>]/g, "");
        return s;
    }

    function getNiceName() {
        return currentName || "дорогая";
    }

    function renderWishText(animate = false) {
        const nice = getNiceName();
        const template = wishTemplates[wishIndex % wishTemplates.length];
        const prepared = template.replaceAll("{{name}}", nice);

        if (animate) {
            wishText.classList.remove("wishSwap");
            void wishText.offsetWidth;
            wishText.classList.add("wishSwap");
        }

        wishText.innerHTML = prepared.replaceAll("\n\n", "<br><br>");
    }

    function resizeCanvas() {
        const rect = wishBox.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        scratchLayer.width = Math.max(1, Math.floor(rect.width * dpr));
        scratchLayer.height = Math.max(1, Math.floor(rect.height * dpr));
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function drawScratchCover() {
        const w = scratchLayer.clientWidth;
        const h = scratchLayer.clientHeight;

        ctx.globalCompositeOperation = "source-over";
        ctx.clearRect(0, 0, w, h);

        const grad = ctx.createLinearGradient(0, 0, w, h);
        grad.addColorStop(0, "#fff4da");
        grad.addColorStop(1, "#ecdab8");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = "#00000010";
        for (let i = 0; i < 120; i += 1) {
            const x = Math.random() * w;
            const y = Math.random() * h;
            ctx.fillRect(x, y, 1.2, 1.2);
        }

        ctx.strokeStyle = "#7f6a4f20";
        ctx.lineWidth = 1;
        for (let y = 0; y < h; y += 8) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y + 3);
            ctx.stroke();
        }

        ctx.fillStyle = "#5b4b3599";
        ctx.font = "700 14px 'Trebuchet MS', sans-serif";
        ctx.fillText("Сотри слой, чтобы прочитать", 14, 24);
    }

    function markCoverage(x, y, radius) {
        const w = scratchLayer.clientWidth;
        const h = scratchLayer.clientHeight;
        const points = [
            [x, y],
            [x - radius * 0.6, y],
            [x + radius * 0.6, y],
            [x, y - radius * 0.6],
            [x, y + radius * 0.6]
        ];

        for (const [px, py] of points) {
            const nx = Math.max(0, Math.min(w - 1, px));
            const ny = Math.max(0, Math.min(h - 1, py));
            const gx = Math.floor((nx / w) * GRID_X);
            const gy = Math.floor((ny / h) * GRID_Y);
            const idx = gy * GRID_X + gx;
            if (!seen[idx]) {
                seen[idx] = true;
                seenCount += 1;
            }
        }
    }

    function currentBrushRadius() {
        const minSide = Math.min(scratchLayer.clientWidth, scratchLayer.clientHeight);
        return Math.max(16, Math.min(30, minSide * 0.045));
    }

    function scratchLine(fromX, fromY, toX, toY) {
        if (revealed) return;

        const radius = currentBrushRadius();

        ctx.globalCompositeOperation = "destination-out";
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.lineWidth = radius * 2;
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(toX, toY, radius, 0, Math.PI * 2);
        ctx.fill();

        markCoverage(toX, toY, radius);

        if (!revealed && seenCount / seen.length >= TARGET_COVER) {
            revealed = true;
            wishBox.classList.add("revealed");
            doneText.hidden = false;
            nextWishBtn.hidden = false;
        }
    }

    function pointerToLocal(e) {
        const r = scratchLayer.getBoundingClientRect();
        return {
            x: e.clientX - r.left,
            y: e.clientY - r.top
        };
    }

    function resetReveal() {
        revealed = false;
        seen.fill(false);
        seenCount = 0;

        doneText.hidden = true;
        nextWishBtn.hidden = true;
        wishBox.classList.remove("revealed");

        requestAnimationFrame(() => {
            resizeCanvas();
            drawScratchCover();
        });
    }

    function showWish(name) {
        currentName = name;
        wishIndex = 0;

        nameSlot.textContent = getNiceName();
        renderWishText();

        stepName.hidden = true;
        stepWish.hidden = false;

        resetReveal();
    }

    scratchLayer.addEventListener("pointerdown", (e) => {
        if (revealed) return;
        isDown = true;
        scratchLayer.setPointerCapture(e.pointerId);

        const p = pointerToLocal(e);
        lastX = p.x;
        lastY = p.y;
        scratchLine(lastX, lastY, lastX, lastY);
    });

    scratchLayer.addEventListener("pointermove", (e) => {
        if (!isDown || revealed) return;
        const p = pointerToLocal(e);
        scratchLine(lastX, lastY, p.x, p.y);
        lastX = p.x;
        lastY = p.y;
    });

    scratchLayer.addEventListener("pointerup", (e) => {
        isDown = false;
        try {
            scratchLayer.releasePointerCapture(e.pointerId);
        } catch {
            // noop
        }
    });

    scratchLayer.addEventListener("pointercancel", () => {
        isDown = false;
    });

    openBtn.addEventListener("click", () => {
        const n = sanitizeName(nameInput.value);
        if (!n) {
            nameHint.textContent = "Введи имя (или нажми “Без имени”).";
            return;
        }

        nameHint.textContent = "";
        showWish(n);
    });

    demoBtn.addEventListener("click", () => {
        nameHint.textContent = "";
        showWish("");
    });

    nextWishBtn.addEventListener("click", () => {
        wishIndex = (wishIndex + 1) % wishTemplates.length;
        renderWishText(true);
        resetReveal();
    });

    backBtn.addEventListener("click", () => {
        stepWish.hidden = true;
        stepName.hidden = false;
        nameInput.focus();
    });

    window.addEventListener("resize", () => {
        if (stepWish.hidden || revealed) return;
        resetReveal();
    });
})();
