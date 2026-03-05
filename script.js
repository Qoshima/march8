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

    const revealZone = document.getElementById("revealZone");
    const bar = document.getElementById("bar");
    const doneText = document.getElementById("doneText");

    // --- Настройки раскрытия ---
    const BINS = 40;
    const TARGET_COVER = 0.85;
    let seen = new Array(BINS).fill(false);
    let revealed = false;

    const wishTemplates = [
        "Дорогая {{name}}, пусть эта весна принесет тебе спокойствие в голове, уверенность в себе и много поводов улыбаться. Пусть учеба идет легче, планы складываются, а рядом будут люди, с которыми тепло и безопасно.\\n\\nС праздником! 💐",
        "{{name}}, желаем тебе больше легких дней, вдохновения и маленьких радостей каждый день. Пусть в учебе будут высокие результаты, а в жизни - поддержка, забота и счастье. 🌸",
        "С 8 Марта, {{name}}! Пусть у тебя всегда хватает сил на мечты и смелости на новые шаги. Желаем крепкого здоровья, душевного тепла и яркой, красивой весны. 🌷",
        "{{name}}, пусть в твоей жизни будет больше поводов гордиться собой. Желаем гармонии, добрых встреч, удачи в каждом деле и отличного настроения не только сегодня, но и весь год. ✨"
    ];

    let currentName = "";
    let wishIndex = 0;

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

    function showWish(name) {
        currentName = name;
        wishIndex = 0;
        nameSlot.textContent = getNiceName();
        renderWishText();

        stepName.hidden = true;
        stepWish.hidden = false;

        resetReveal();
    }

    function resetReveal() {
        revealed = false;
        seen.fill(false);
        bar.style.width = "0%";
        doneText.hidden = true;
        nextWishBtn.hidden = true;
        wishBox.classList.remove("revealed");
    }

    function coverage() {
        return seen.filter(Boolean).length / BINS;
    }

    function updateProgressUI() {
        const c = coverage();
        bar.style.width = `${Math.round(c * 100)}%`;

        if (!revealed && c >= TARGET_COVER) {
            revealed = true;
            wishBox.classList.add("revealed");
            doneText.hidden = false;
            nextWishBtn.hidden = false;
        }
    }

    function markAt(clientX) {
        if (revealed) return;

        const r = revealZone.getBoundingClientRect();
        const x = clientX - r.left;
        const t = Math.max(0, Math.min(0.9999, x / r.width));
        const idx = Math.floor(t * BINS);
        seen[idx] = true;
        updateProgressUI();
    }

    let isDown = false;

    revealZone.addEventListener("pointerdown", (e) => {
        isDown = true;
        revealZone.setPointerCapture(e.pointerId);
        markAt(e.clientX);
    });

    revealZone.addEventListener("pointermove", (e) => {
        if (!isDown) return;
        markAt(e.clientX);
    });

    revealZone.addEventListener("pointerup", (e) => {
        isDown = false;
        try {
            revealZone.releasePointerCapture(e.pointerId);
        } catch {
            // noop
        }
    });

    revealZone.addEventListener("pointercancel", () => {
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
})();
