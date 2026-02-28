(() => {
    const card = document.getElementById('card');
    const front = document.getElementById('front');
    const content = document.getElementById('content');
    const openBtn = document.getElementById('openBtn');
    const burstBtn = document.getElementById('burstBtn');

    const nameInput = document.getElementById('nameInput');
    const recipientName = document.getElementById('recipientName');

    const typingLine = document.getElementById('typingLine');

    // ===== Name storage =====
    const STORAGE_KEY = "march8_name";

    function sanitizeName(raw) {
        if (!raw) return "";
        // убираем лишние пробелы, ограничиваем длину, без "опасных" символов
        let s = raw.trim().replace(/\s+/g, " ");
        s = s.slice(0, 24);
        // мягко убираем угловые скобки, чтобы не ломать HTML
        s = s.replace(/[<>]/g, "");
        return s;
    }

    function loadName() {
        const saved = localStorage.getItem(STORAGE_KEY);
        const n = sanitizeName(saved);
        if (n) nameInput.value = n;
        return n;
    }

    function saveName(n) {
        localStorage.setItem(STORAGE_KEY, n);
    }

    // Подставить имя в текст открытки
    function applyName(n) {
        const nice = n || "дорогая";
        recipientName.textContent = nice;

        const template = typingLine.getAttribute("data-template") || "";
        const text = template.replaceAll("{{name}}", nice);
        return text;
    }

    // ===== Tilt (parallax) =====
    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

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

    // ===== Typing effect =====
    async function typeText(el, text, speedMs = 20) {
        el.textContent = "";
        for (let i = 0; i < text.length; i++) {
            el.textContent += text[i];
            await new Promise(r => setTimeout(r, speedMs));
        }
    }

    // ===== Confetti / petals (canvas) =====
    const canvas = document.getElementById('fxCanvas');
    const ctx = canvas.getContext('2d');

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

    const particles = [];
    let animId = null;

    function rand(min, max) { return Math.random() * (max - min) + min; }
    function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

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

            if (p.life <= 0 || p.y > window.innerHeight + 80) {
                particles.splice(i, 1);
            }
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

    // ===== Open flow =====
    function openCard() {
        const inputName = sanitizeName(nameInput.value);
        if (inputName) saveName(inputName);

        const finalTextForTyping = applyName(inputName);

        front.style.display = 'none';
        content.style.display = 'block';

        typeText(typingLine, finalTextForTyping, 18);

        const r = card.getBoundingClientRect();
        spawnBurst(r.left + r.width / 2, r.top + r.height / 3, 55);
    }

    openBtn.addEventListener('click', openCard);

    burstBtn.addEventListener('click', () => {
        const r = burstBtn.getBoundingClientRect();
        spawnBurst(r.left + r.width / 2, r.top + r.height / 2, 45);
    });

    // лёгкий микро-эффект по клику в любом месте
    document.addEventListener('click', (e) => {
        if (e.target === openBtn || e.target === burstBtn || e.target === nameInput) return;
        spawnBurst(e.clientX, e.clientY, 10);
    }, { passive: true });

    // init: подставить сохранённое имя в инпут
    loadName();
})();