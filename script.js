const BACKEND_BASE = "https://backend-render-qs89.onrender.com";
const CHAT_URL = `${BACKEND_BASE}/api/chat`;
const PORTFOLIO_URL = `${BACKEND_BASE}/api/portfolio`;

let currentLang = 'zh';
let cachedSkillsData = null;

const i18n = {
    zh: {
        tagline: "越努力，越幸运",
        profileDesc: "<p>欢迎！右侧是我的 <strong>AI 分身</strong>。欢迎与它对话，探索解锁我的个人档案。</p>",
        techStackTitle: "核心技术栈",
        featuredProjectsTitle: "精选项目",
        failedSkills: "加载技能失败",
        failedProjects: "加载项目失败",
        skillsSummary: "📂 我的技能栈:",
        chatTitle: "AI 分身",
        initialMsg: "我是他的AI分身。你想了解关于他的什么信息？",
        prompt1Btn: "⚡ 核心技术栈",
        prompt1Query: "介绍一下他的核心技术栈？",
        prompt2Btn: "💼 我的项目",
        prompt2Query: "他做了哪些项目？",
        prompt3Btn: "📫 联系方式",
        prompt3Query: "如何直接联系到他？",
        prompt4Btn: "🎲 个人趣事",
        prompt4Query: "讲一个关于他的趣事或特长？",
        inputPlaceholder: "关于他，随便问点什么...",
        sendBtn: "发送",
        resetTitle: "重置对话",
        hudTitle: "⚡ 鼠标联动 // HUD",
        hudRepel: "排斥",
        hudAttract: "吸引",
        hudConnect: "连线",
        hudOff: "关闭",
        hudRepelTitle: "粒子避开鼠标",
        hudAttractTitle: "粒子向鼠标聚集",
        hudConnectTitle: "鼠标与粒子连线",
        hudOffTitle: "关闭交互",
        thinkingText: "⟡ 量子回响计算中...",
        errReply: "⚠️ 获取回复失败。",
        connLost: "❌ 网络连接中断。"
    },
    en: {
        tagline: "Fortune Favors the Sweat",
        profileDesc: "<p>Welcome! On the right is my <strong>AI avatar</strong>. Feel free to decrypt my profile by chatting with it.</p>",
        techStackTitle: "Tech Stack Tree",
        featuredProjectsTitle: "Featured Projects",
        failedSkills: "Failed to load skills.",
        failedProjects: "Failed to load projects.",
        skillsSummary: "📂 My skills:",
        chatTitle: "AI Avatar",
        initialMsg: "I am his AI avatar. What would you like to decrypt about him?",
        prompt1Btn: "⚡ Core Tech Stack",
        prompt1Query: "Can you introduce his core tech stack?",
        prompt2Btn: "💼 Featured Projects",
        prompt2Query: "What featured projects has he built?",
        prompt3Btn: "📫 Contact Info",
        prompt3Query: "How can I contact him directly?",
        prompt4Btn: "🎲 Fun Facts",
        prompt4Query: "Tell me a fun fact or unique skill about him.",
        inputPlaceholder: "ask anything about me...",
        sendBtn: "send",
        resetTitle: "Reset Chat",
        hudTitle: "⚡ MOUSE_LINK // HUD",
        hudRepel: "Repel",
        hudAttract: "Attract",
        hudConnect: "Connect",
        hudOff: "Off",
        hudRepelTitle: "Particles repel from cursor",
        hudAttractTitle: "Particles attract towards cursor",
        hudConnectTitle: "Draw lines to cursor",
        hudOffTitle: "Disable interaction",
        thinkingText: "⟡ Quantum Echo Processing",
        errReply: "⚠️ Error fetching reply.",
        connLost: "❌ Connection lost."
    }
};

// 1. 语言切换机制 (声明式属性驱动)
function switchLanguage(lang) {
    if (!i18n[lang]) return;
    currentLang = lang;

    document.getElementById('lang-zh').classList.toggle('active', lang === 'zh');
    document.getElementById('lang-en').classList.toggle('active', lang === 'en');

    const dict = i18n[lang];

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[key]) el.innerHTML = dict[key];
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (dict[key]) el.placeholder = dict[key];
    });
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        if (dict[key]) el.title = dict[key];
    });

    if (cachedSkillsData) renderSkills(cachedSkillsData);
}

// 2. Canvas 粒子背景特效
let currentMouseMode = 'connect';

(function initCanvas() {
    if (window.innerWidth <= 860) return;
    const c = document.getElementById('bg-canvas'), ctx = c.getContext('2d');
    let W, H, pts = [];
    const mouse = { x: -1000, y: -1000, radius: 140 };

    const resize = () => { W = c.width = window.innerWidth; H = c.height = window.innerHeight; };
    window.addEventListener('resize', resize);
    resize();

    const xEl = document.getElementById('hud-x');
    const yEl = document.getElementById('hud-y');

    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        if (xEl && yEl) {
            xEl.textContent = String(Math.round(mouse.x)).padStart(4, '0');
            yEl.textContent = String(Math.round(mouse.y)).padStart(4, '0');
        }
    });

    window.addEventListener('mouseleave', () => { mouse.x = mouse.y = -1000; });

    class Particle {
        constructor() { this.reset(); }
        reset() {
            this.x = Math.random() * W;
            this.y = Math.random() * H;
            this.baseVx = (Math.random() - 0.5) * 0.45;
            this.baseVy = (Math.random() - 0.5) * 0.45;
            this.vx = this.baseVx;
            this.vy = this.baseVy;
            this.s = Math.random() * 2.2 + 0.6;
            this.c = `hsla(${255 + Math.random() * 25}, 65%, 72%, 0.55)`;
        }
        update() {
            if (currentMouseMode !== 'off' && mouse.x > 0) {
                const dx = mouse.x - this.x, dy = mouse.y - this.y;
                const dist = Math.hypot(dx, dy);

                if (dist < mouse.radius) {
                    const force = (mouse.radius - dist) / mouse.radius;
                    const angle = Math.atan2(dy, dx);
                    const speed = currentMouseMode === 'repel' ? -5 : (currentMouseMode === 'attract' ? 3 : 0);
                    if (speed) {
                        this.x += Math.cos(angle) * force * speed;
                        this.y += Math.sin(angle) * force * speed;
                    }
                }
            }

            this.x += this.vx;
            this.y += this.vy;
            this.vx += (this.baseVx - this.vx) * 0.05;
            this.vy += (this.baseVy - this.vy) * 0.05;

            // 边缘反弹简化
            if (this.x <= 0 || this.x >= W) { this.x = Math.max(0, Math.min(W, this.x)); this.vx *= -1; this.baseVx *= -1; }
            if (this.y <= 0 || this.y >= H) { this.y = Math.max(0, Math.min(H, this.y)); this.vy *= -1; this.baseVy *= -1; }
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.s, 0, Math.PI * 2);
            ctx.fillStyle = this.c;
            ctx.fill();

            if (currentMouseMode === 'connect' && mouse.x > 0) {
                const dist = Math.hypot(mouse.x - this.x, mouse.y - this.y);
                if (dist < mouse.radius + 30) {
                    ctx.beginPath();
                    ctx.moveTo(this.x, this.y);
                    ctx.lineTo(mouse.x, mouse.y);
                    ctx.strokeStyle = `rgba(155, 135, 202, ${1 - dist / (mouse.radius + 30)})`;
                    ctx.lineWidth = 0.8;
                    ctx.stroke();
                }
            }
        }
    }

    for (let i = 0; i < 110; i++) pts.push(new Particle());

    (function anim() {
        ctx.clearRect(0, 0, W, H);
        pts.forEach(p => { p.update(); p.draw(); });
        requestAnimationFrame(anim);
    })();
})();

// HUD 切换与折叠
function setMouseMode(mode, btn) {
    currentMouseMode = mode;
    document.querySelectorAll('.hud-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
}

function toggleHud() {
    const hud = document.getElementById('mouse-hud');
    hud.classList.toggle('collapsed');
    document.getElementById('hud-toggle-icon').textContent = hud.classList.contains('collapsed') ? '+' : '−';
}

// 3. 后端 API 交互
async function loadPortfolioData() {
    try {
        const res = await fetch(PORTFOLIO_URL);
        const data = await res.json();
        if (data.skills) {
            cachedSkillsData = data.skills;
            renderSkills(data.skills);
        }
        if (data.projects) renderProjects(data.projects);
    } catch {
        document.getElementById('tree-container').innerText = i18n[currentLang].failedSkills;
        document.getElementById('repoList').innerText = i18n[currentLang].failedProjects;
    }
}

function renderSkills(skills) {
    let html = `<details><summary>${i18n[currentLang].skillsSummary}</summary><ul>`;
    skills.forEach(s => {
        html += `<li><details><summary>📁 ${escapeHtml(s.category)}</summary><ul>`;
        if (s.subcategories) {
            s.subcategories.forEach(sub => {
                html += `<li><details><summary>📁 ${escapeHtml(sub.title)}</summary><ul>`;
                sub.items.forEach(i => html += `<li>📄 ${escapeHtml(i)}</li>`);
                html += '</ul></details></li>';
            });
        } else if (s.items) {
            s.items.forEach(i => html += `<li>📄 ${escapeHtml(i)}</li>`);
        }
        html += '</ul></details></li>';
    });
    html += '</ul></details>';
    document.getElementById('tree-container').innerHTML = html;
}

function renderProjects(projects) {
    document.getElementById('repoList').innerHTML = projects.map(p => `
        <a href="${escapeHtml(p.url)}" target="_blank" class="repo-card-item">
            <div class="repo-card-title"><span>${escapeHtml(p.title)}</span><span>→</span></div>
            <div class="repo-card-desc">${escapeHtml(p.description)}</div>
        </a>
    `).join('');
}

function escapeHtml(str) {
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// 4. AI 聊天功能
let chatHistory = [];
let isSending = false;

function sendQuickPrompt(queryKey) {
    if (isSending) return;
    const text = i18n[currentLang][queryKey];
    if (text) {
        document.getElementById('user-input').value = text;
        sendMessage();
    }
}

function setFormDisabled(disabled) {
    document.getElementById('user-input').disabled = disabled;
    const sendBtn = document.getElementById('send-btn');
    if (sendBtn) sendBtn.disabled = disabled;
    document.querySelectorAll('.prompt-btn').forEach(btn => btn.disabled = disabled);
}

async function sendMessage() {
    if (isSending) return;
    const input = document.getElementById('user-input');
    const text = input.value.trim();
    if (!text) return;

    isSending = true;
    input.value = '';
    setFormDisabled(true);

    appendMessage(text, 'user');

    const thinkingHtml = `
        <div class="quantum-thinking">
            <span>${i18n[currentLang].thinkingText}</span>
            <div class="wave-bars">
                <div class="wave-bar"></div><div class="wave-bar"></div>
                <div class="wave-bar"></div><div class="wave-bar"></div>
                <div class="wave-bar"></div>
            </div>
        </div>
    `;
    const aiMsgEl = appendMessage(thinkingHtml, 'ai', true);

    try {
        const res = await fetch(CHAT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text, history: chatHistory })
        });

        if (!res.ok) throw new Error(`Status: ${res.status}`);
        const data = await res.json();

        if (data.reply) {
            updateMessageElement(aiMsgEl, data.reply, true);
            chatHistory.push({ role: "user", content: text }, { role: "assistant", content: data.reply });
        } else {
            updateMessageElement(aiMsgEl, i18n[currentLang].errReply, false);
        }
    } catch (err) {
        console.error("Chat request failed:", err);
        updateMessageElement(aiMsgEl, i18n[currentLang].connLost, false);
    } finally {
        isSending = false;
        setFormDisabled(false);
        input.focus();
    }
}

function appendMessage(text, sender, isHtml = false) {
    const box = document.getElementById('chat-box');
    const div = document.createElement('div');
    div.className = `message msg-${sender}`;
    box.appendChild(div);

    if (isHtml) {
        div.innerHTML = text;
    } else {
        updateMessageElement(div, text, sender === 'ai');
    }

    scrollToBottom();
    return div;
}

function updateMessageElement(el, text, isAi) {
    el.innerHTML = (isAi && typeof marked !== 'undefined') ? marked.parse(text) : escapeHtml(text);
    scrollToBottom();
}

function scrollToBottom() {
    const box = document.getElementById('chat-box');
    setTimeout(() => { box.scrollTop = box.scrollHeight; }, 20);
}

function resetChat() {
    chatHistory = [];
    isSending = false;
    const input = document.getElementById('user-input');
    if (input) { input.value = ''; }
    setFormDisabled(false);

    document.getElementById('chat-box').innerHTML = `
        <div class="message msg-ai" data-i18n="initialMsg">${i18n[currentLang].initialMsg}</div>
    `;
}

function handleEnter(e) {
    if (e.key === 'Enter' && !e.isComposing) {
        e.preventDefault();
        sendMessage();
    }
}

window.addEventListener('DOMContentLoaded', () => {
    switchLanguage('zh');
    loadPortfolioData();
});