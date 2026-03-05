(() => {
    const stepName = document.getElementById("stepName");
    const stepWish = document.getElementById("stepWish");

    const nameInput = document.getElementById("nameInput");
    const nameHint = document.getElementById("nameHint");

    const openBtn = document.getElementById("openBtn");
    const demoBtn = document.getElementById("demoBtn");
    const backBtn = document.getElementById("backBtn");

    const nameSlot = document.getElementById("nameSlot");

    const wishBox = document.getElementById("wishBox");
    const wishText = document.getElementById("wishText");

    const revealZone = document.getElementById("revealZone");
    const bar = document.getElementById("bar");
    const doneText = document.getElementById("doneText");

    // --- Настройки раскрытия ---
    const BINS = 40;              // насколько “точно” считаем покрытие
    const TARGET_COVER = 0.85;    // 85% ширины нужно “пройти”
    let seen = new Array(BINS).fill(false);
    let revealed = false;

    function sanitizeName(raw) {
        if (!raw) return "";
        let s = raw.trim().replace(/\s+/g, " ");
        s = s.slice(0, 24);
        s = s.replace(/[<>]/g, "");
        return s;
    }

    function showWish(name) {
        const nice = name || "дорогая";

        // Подставляем имя в заголовок
        nameSlot.textContent = nice;

        // Подставляем имя в текст (шаблон {{name}})
        const tpl = wishText.textContent;
        wishText.textContent = tpl.replaceAll("{{name}}", nice);

        // Переключаем шаги
        stepName.hidden = true;
        stepWish.hidden = false;

        // сброс механики раскрытия
        resetReveal();
    }

    function resetReveal() {
        revealed = false;
        seen.fill(false);
        bar.style.width = "0%";
        doneText.hidden = true;
        wishBox.classList.remove("revealed");
    }

    function coverage() {
        const c = seen.filter(Boolean).length / BINS;
        return c;
    }

    function updateProgressUI() {
        const c = coverage();
        bar.style.width = `${Math.round(c * 100)}%`;

        if (!revealed && c >= TARGET_COVER) {
            revealed = true;
            wishBox.classList.add("revealed");
            doneText.hidden = false;
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

    // Pointer events: работает и для мышки, и для тача
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
        try { revealZone.releasePointerCapture(e.pointerId); } catch {}
    });

    revealZone.addEventListener("pointercancel", () => {
        isDown = false;
    });

    // Кнопки
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
        showWish(""); // без имени
    });

    backBtn.addEventListener("click", () => {
        // Вернуться к вводу имени
        stepWish.hidden = true;
        stepName.hidden = false;

        // Вернём текст шаблона назад (чтобы не накапливались подстановки)
        // Проще: перезагрузить страницу — но сделаем аккуратно:
        location.reload();
    });

})();