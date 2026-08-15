const BACKEND_BASE = "https://backend-render-qs89.onrender.com";
const CHAT_URL = `${BACKEND_BASE}/api/chat`;
const PORTFOLIO_URL = `${BACKEND_BASE}/api/portfolio`;
const VERIFY_URL = `${BACKEND_BASE}/api/verify`;

let currentLang = 'zh';
let currentTheme = 'default';
let cachedSkillsData = null;

const i18n = {
    zh: {
        introPrompt: "请输入访问密码解锁",
        passwordPlaceholder: "输入访问密码...",
        unlockBtn: "解锁",
        tagline: "越努力，越幸运",
        profileDesc: "<p>欢迎！右侧是我的 <strong>AI 分身</strong>。欢迎与它对话，探索解锁我的个人档案。</p>",
        techStackTitle: "核心技术栈",
        featuredProjectsTitle: "精选项目",
        failedSkills: "加载技能失败",
        failedProjects: "加载项目失败",
        skillsSummary: "📂 我的技能栈:",
        skillUsagePrompt: "请用中文说明“{skill}”在他的哪些项目中使用到了，并简要介绍具体用途。",
        skillUsageTitle: "点击询问该技能的项目用途",
        chatTitle: "AI 分身",
        authSuccessMsg: "已授权", // 新增：授权成功提示
        initialMsg: "信号已建立。我王生卓的AI分身，您有什么想要了解的",
        prompt1Btn: "⚡ 核心技术栈",
        prompt1Query: "介绍一下他的核心技术栈？",
        prompt2Btn: "💼 精选项目",
        prompt2Query: "他做了哪些项目？",
        prompt3Btn: "📫 联系方式",
        prompt3Query: "如何直接联系到他？",
        prompt4Btn: "🎲 个人趣事",
        prompt4Query: "讲一个关于他的趣事或特长？",
        inputPlaceholder: "关于他，随便问点什么...",
        sendBtn: "发送",
        resetTitle: "重置对话",
        themeTitle: "🎨 视觉主题 // STYLES",
        themeDefault: "薰衣草",
        themeCyberpunk: "赛博朋克",
        themeAbstract: "抽象几何",
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
        introPrompt: "ENTER PASSWORD TO UNLOCK",
        passwordPlaceholder: "Enter password...",
        unlockBtn: "Unlock",
        tagline: "Fortune Favors the Sweat",
        profileDesc: "<p>Welcome! On the right is my <strong>AI avatar</strong>. Feel free to decrypt my profile by chatting with it.</p>",
        techStackTitle: "Tech Stack Tree",
        featuredProjectsTitle: "Featured Projects",
        failedSkills: "Failed to load skills.",
        failedProjects: "Failed to load projects.",
        skillsSummary: "📂 My skills:",
        skillUsagePrompt: "Please explain in English which of his projects use “{skill}” and what it is used for.",
        skillUsageTitle: "Click to ask where this skill is used",
        chatTitle: "AI Avatar",
        authSuccessMsg: "Authorized", // 新增：授权成功提示
        initialMsg: "Signal established. What would you like to know about Loyd?",
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
        themeTitle: "🎨 THEME // STYLES",
        themeDefault: "Lavender",
        themeCyberpunk: "Cyberpunk",
        themeAbstract: "Abstract",
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

async function verifyAndUnlock() {
    const passwordInput = document.getElementById('site-password');
    const errorEl = document.getElementById('password-error');
    const pwd = passwordInput.value.trim();

    if (!pwd) {
        errorEl.style.display = 'block';
        errorEl.textContent = currentLang === 'zh' ? '密码不能为空' : 'Password cannot be empty';
        return;
    }

    const unlockBtn = document.querySelector('.password-group button');
    if (unlockBtn) unlockBtn.disabled = true;

    try {
        const res = await fetch(VERIFY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: pwd })
        });

        const data = await res.json();

        if (res.ok && data.success) {
            sessionStorage.setItem('site_password', pwd);
            errorEl.style.display = 'none';

            // 修改部分：解锁成功后更新聊天框第一句话
            const chatBox = document.getElementById('chat-box');
            chatBox.innerHTML = `
                <div class="message msg-ai">${i18n[currentLang].authSuccessMsg}</div>
                <div class="message msg-ai">${i18n[currentLang].initialMsg}</div>
            `;

            const overlay = document.getElementById('intro-overlay');
            if (overlay) {
                overlay.classList.add('hidden');
                document.body.classList.add('unlocked');
                setTimeout(() => {
                    overlay.style.display = 'none';
                }, 800);
            }
        } else {
            errorEl.style.display = 'block';
            errorEl.textContent = currentLang === 'zh' ? '密码错误，请重试' : 'Incorrect password, please try again';
        }
    } catch (err) {
        console.error("Verification failed:", err);
        errorEl.style.display = 'block';
        errorEl.textContent = currentLang === 'zh' ? '连接服务器失败' : 'Failed to connect to backend';
    } finally {
        if (unlockBtn) unlockBtn.disabled = false;
    }
}

async function checkStoredPassword() {
    const savedPwd = sessionStorage.getItem('site_password');
    if (!savedPwd) return;

    try {
        const res = await fetch(VERIFY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: savedPwd })
        });

        const data = await res.json();

        if (res.ok && data.success) {
            const overlay = document.getElementById('intro-overlay');
            if (overlay) {
                overlay.classList.add('hidden');
                document.body.classList.add('unlocked');
                setTimeout(() => {
                    overlay.style.display = 'none';
                }, 800);
            }
        } else {
            sessionStorage.removeItem('site_password');
        }
    } catch (err) {
        console.error("Auto-verification failed:", err);
    }
}

function handlePasswordEnter(e) {
    if (e.key === 'Enter' && !e.isComposing) {
        e.preventDefault();
        verifyAndUnlock();
    }
}

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

function setThemeStyle(theme, btn) {
    currentTheme = theme;
    document.body.setAttribute('data-theme', theme);
    document.querySelectorAll('.theme-modes .hud-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
}

function toggleThemeHud() {
    const hud = document.getElementById('theme-hud');
    hud.classList.toggle('collapsed');
    document.getElementById('theme-toggle-icon').textContent = hud.classList.contains('collapsed') ? '+' : '−';
}

function toggleHud() {
    const hud = document.getElementById('mouse-hud');
    hud.classList.toggle('collapsed');
    document.getElementById('hud-toggle-icon').textContent = hud.classList.contains('collapsed') ? '+' : '−';
}

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
    const abstractColors = ['#ff3366', '#2244ff', '#ffee00', '#00e5ff', '#ff9900'];
    class Particle {
        constructor() { this.reset(); }
        reset() {
            this.x = Math.random() * W;
            this.y = Math.random() * H;
            this.baseVx = (Math.random() - 0.5) * 0.6;
            this.baseVy = (Math.random() - 0.5) * 0.6;
            this.vx = this.baseVx;
            this.vy = this.baseVy;
            this.s = Math.random() * 8 + 3;
            this.angle = Math.random() * Math.PI * 2;
            this.rotSpeed = (Math.random() - 0.5) * 0.05;
            this.shape = Math.floor(Math.random() * 4);
            this.color = abstractColors[Math.floor(Math.random() * abstractColors.length)];
        }
        update() {
            if (currentMouseMode !== 'off' && mouse.x > 0) {
                const dx = mouse.x - this.x, dy = mouse.y - this.y;
                const dist = Math.hypot(dx, dy);
                if (dist < mouse.radius) {
                    const force = (mouse.radius - dist) / mouse.radius;
                    const angle = Math.atan2(dy, dx);
                    const speed = currentMouseMode === 'repel' ? -6 : (currentMouseMode === 'attract' ? 4 : 0);
                    if (speed) {
                        this.x += Math.cos(angle) * force * speed;
                        this.y += Math.sin(angle) * force * speed;
                    }
                }
            }
            this.x += this.vx;
            this.y += this.vy;
            this.angle += this.rotSpeed;
            this.vx += (this.baseVx - this.vx) * 0.05;
            this.vy += (this.baseVy - this.vy) * 0.05;
            if (this.x <= 0 || this.x >= W) { this.vx *= -1; this.baseVx *= -1; }
            if (this.y <= 0 || this.y >= H) { this.vy *= -1; this.baseVy *= -1; }
        }
        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);
            if (currentTheme === 'cyberpunk') {
                const color = (this.shape % 2 === 0) ? '#00f0ff' : '#b026ff';
                ctx.strokeStyle = color;
                ctx.fillStyle = color;
                ctx.lineWidth = 1.5;
                ctx.shadowBlur = 10;
                ctx.shadowColor = color;
                if (this.shape % 2 === 0) {
                    ctx.strokeRect(-this.s/2, -this.s/2, this.s, this.s);
                } else {
                    ctx.beginPath();
                    ctx.moveTo(-this.s, 0); ctx.lineTo(this.s, 0);
                    ctx.moveTo(0, -this.s); ctx.lineTo(0, this.s);
                    ctx.stroke();
                }
            } else if (currentTheme === 'abstract') {
                ctx.fillStyle = this.color;
                ctx.strokeStyle = '#111111';
                ctx.lineWidth = 2;
                ctx.shadowBlur = 0;
                if (this.shape === 0) {
                    ctx.beginPath();
                    ctx.arc(0, 0, this.s, 0, Math.PI * 2);
                    ctx.fill(); ctx.stroke();
                } else if (this.shape === 1) {
                    ctx.fillRect(-this.s, -this.s, this.s * 2, this.s * 2);
                    ctx.strokeRect(-this.s, -this.s, this.s * 2, this.s * 2);
                } else if (this.shape === 2) {
                    ctx.beginPath();
                    ctx.moveTo(0, -this.s * 1.3);
                    ctx.lineTo(this.s, this.s);
                    ctx.lineTo(-this.s, this.s);
                    ctx.closePath();
                    ctx.fill(); ctx.stroke();
                } else {
                    ctx.beginPath();
                    ctx.arc(0, 0, this.s, 0, Math.PI * 2);
                    ctx.stroke();
                }
            } else {
                ctx.shadowBlur = 0;
                ctx.beginPath();
                ctx.arc(0, 0, this.s * 0.35, 0, Math.PI * 2);
                ctx.fillStyle = `hsla(${255 + Math.random() * 25}, 65%, 72%, 0.55)`;
                ctx.fill();
            }
            ctx.restore();
            if (currentMouseMode === 'connect' && mouse.x > 0) {
                const dist = Math.hypot(mouse.x - this.x, mouse.y - this.y);
                if (dist < mouse.radius + 30) {
                    ctx.beginPath();
                    ctx.moveTo(this.x, this.y);
                    ctx.lineTo(mouse.x, mouse.y);
                    const alpha = 1 - dist / (mouse.radius + 30);
                    if (currentTheme === 'cyberpunk') {
                        ctx.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
                        ctx.shadowBlur = 8;
                        ctx.shadowColor = '#00f0ff';
                    } else if (currentTheme === 'abstract') {
                        ctx.strokeStyle = `rgba(17, 17, 17, ${alpha})`;
                        ctx.lineWidth = 1.5;
                        ctx.shadowBlur = 0;
                    } else {
                        ctx.strokeStyle = `rgba(155, 135, 202, ${alpha})`;
                        ctx.shadowBlur = 0;
                    }
                    ctx.stroke();
                }
            }
        }
    }
    for (let i = 0; i < 90; i++) pts.push(new Particle());
    (function anim() {
        ctx.clearRect(0, 0, W, H);
        pts.forEach(p => { p.update(); p.draw(); });
        requestAnimationFrame(anim);
    })();
})();

function setMouseMode(mode, btn) {
    currentMouseMode = mode;
    document.querySelectorAll('#mouse-hud .hud-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
}

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
    let html = `<details class="skill-group"><summary>${i18n[currentLang].skillsSummary}</summary><div class="details-content"><ul>`;
    skills.forEach(s => {
        html += `<li><details class="skill-group"><summary>📁 ${escapeHtml(s.category)}</summary><div class="details-content"><ul>`;
        if (s.subcategories) {
            s.subcategories.forEach(sub => {
                html += `<li><details class="skill-group"><summary>📁 ${escapeHtml(sub.title)}</summary><div class="details-content"><ul>`;
                sub.items.forEach(i => html += renderSkillLeaf(i));
                html += '</ul></div></details></li>';
            });
        } else if (s.items) {
            s.items.forEach(i => html += renderSkillLeaf(i));
        }
        html += '</ul></div></details></li>';
    });
    html += '</ul></div></details>';
    document.getElementById('tree-container').innerHTML = html;
    document.querySelectorAll('.skill-leaf').forEach(button => {
        button.addEventListener('click', () => askSkillUsage(button.dataset.skill));
    });
}

function renderSkillLeaf(skill) {
    return `<li><button type="button" class="skill-leaf" data-skill="${escapeAttribute(skill)}" title="${escapeAttribute(i18n[currentLang].skillUsageTitle)}">📄 ${escapeHtml(skill)}</button></li>`;
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

function escapeAttribute(str) {
    return escapeHtml(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

let chatHistory = [];
let isSending = false;
let pendingSkill = '';

function askSkillUsage(skill) {
    if (isSending || !skill) return;
    const prompt = i18n[currentLang].skillUsagePrompt.replace('{skill}', skill);
    const input = document.getElementById('user-input');
    input.value = prompt;
    pendingSkill = skill;
    sendMessage();
}

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
    document.querySelectorAll('.skill-leaf').forEach(btn => btn.disabled = disabled);
}

async function sendMessage() {
    if (isSending) return;
    const input = document.getElementById('user-input');
    const text = input.value.trim();
    if (!text) return;

    isSending = true;
    input.value = '';
    const selectedSkill = pendingSkill;
    pendingSkill = '';
    setFormDisabled(true);

    appendMessage(text, 'user');

    const thinkingHtml = `
        <div class="quantum-thinking">
            <span class="thinking-orbit" aria-hidden="true"><span></span></span>
            <span>${i18n[currentLang].thinkingText}</span>
            <div class="wave-bars">
                <div class="wave-bar"></div><div class="wave-bar"></div>
                <div class="wave-bar"></div><div class="wave-bar"></div>
                <div class="wave-bar"></div>
            </div>
        </div>
    `;
    const aiMsgEl = appendMessage(thinkingHtml, 'ai', true);

    const password = sessionStorage.getItem('site_password') || '';

    try {
        const res = await fetch(CHAT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text, skill: selectedSkill, history: chatHistory, password: password })
        });

        const data = await res.json();

        if (res.status === 401) {
            sessionStorage.removeItem('site_password');
            updateMessageElement(aiMsgEl, data.reply || "⚠️ 密码已失效或错误，请重新输入密码解锁。", false);
            const overlay = document.getElementById('intro-overlay');
            if (overlay) {
                overlay.style.display = 'flex';
                overlay.classList.remove('hidden');
                document.body.classList.remove('unlocked');
            }
            return;
        }

        if (!res.ok) throw new Error(`Status: ${res.status}`);

        if (data.reply) {
            await typeMessageElement(aiMsgEl, data.reply);
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
    div.className = `message msg-${sender} message-enter`;
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

async function typeMessageElement(el, text) {
    const characters = Array.from(String(text));
    const typingSpeed = 14;
    el.classList.add('is-typing');
    el.textContent = '';

    for (const character of characters) {
        el.textContent += character;
        scrollToBottom();
        await new Promise(resolve => setTimeout(resolve, typingSpeed));
    }

    el.classList.remove('is-typing');
    updateMessageElement(el, text, true);
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
    checkStoredPassword();
});
