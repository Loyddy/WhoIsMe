const BACKEND_BASE = "https://backend-render-qs89.onrender.com";
const CHAT_URL = `${BACKEND_BASE}/api/chat`;
const PORTFOLIO_URL = `${BACKEND_BASE}/api/portfolio`;

// 1. 粒子背景特效 (包含鼠标物理联动与 HUD 显示)
let currentMouseMode = 'repel'; // 当前鼠标联动模式: 'repel' | 'attract' | 'connect' | 'off'

(function bg() {
    if (window.innerWidth <= 860) return;
    const c = document.getElementById('bg-canvas'), ctx = c.getContext('2d');
    let W, H, pts = [];
    const mouse = { x: -1000, y: -1000, radius: 140 };

    function resize() { W = c.width = window.innerWidth; H = c.height = window.innerHeight; }
    window.addEventListener('resize', resize); resize();

    // 监听鼠标移动，实时更新坐标及 HUD 面板数字
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        const xEl = document.getElementById('hud-x');
        const yEl = document.getElementById('hud-y');
        if (xEl && yEl) {
            xEl.textContent = String(Math.round(mouse.x)).padStart(4, '0');
            yEl.textContent = String(Math.round(mouse.y)).padStart(4, '0');
        }
    });

    window.addEventListener('mouseleave', () => {
        mouse.x = -1000;
        mouse.y = -1000;
    });

    class P {
        constructor() { this.reset(); }
        reset() {
            this.x = Math.random() * W;
            this.y = Math.random() * H;
            this.baseVx = (Math.random() - 0.5) * 0.45;
            this.baseVy = (Math.random() - 0.5) * 0.45;
            this.vx = this.baseVx;
            this.vy = this.baseVy;
            this.s = Math.random() * 2.2 + 0.6;
            this.c = `hsla(${220 + Math.random() * 60}, 80%, 70%, 0.6)`;
        }
        update() {
            // 物理交互计算
            if (currentMouseMode !== 'off' && mouse.x > 0 && mouse.y > 0) {
                const dx = mouse.x - this.x;
                const dy = mouse.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < mouse.radius) {
                    const force = (mouse.radius - dist) / mouse.radius;
                    const angle = Math.atan2(dy, dx);

                    if (currentMouseMode === 'repel') {
                        // 磁极排斥
                        this.x -= Math.cos(angle) * force * 5;
                        this.y -= Math.sin(angle) * force * 5;
                    } else if (currentMouseMode === 'attract') {
                        // 万有引力
                        this.x += Math.cos(angle) * force * 3;
                        this.y += Math.sin(angle) * force * 3;
                    }
                }
            }

            // 基础惯性移动
            this.x += this.vx;
            this.y += this.vy;

            // 阻尼恢复原速
            this.vx += (this.baseVx - this.vx) * 0.05;
            this.vy += (this.baseVy - this.vy) * 0.05;

            // ===== 修复核心 Bug：严格边界处理与位置归位 =====
            if (this.x <= 0) {
                this.x = 0;
                this.vx = Math.abs(this.vx);
                this.baseVx = Math.abs(this.baseVx);
            } else if (this.x >= W) {
                this.x = W;
                this.vx = -Math.abs(this.vx);
                this.baseVx = -Math.abs(this.baseVx);
            }

            if (this.y <= 0) {
                this.y = 0;
                this.vy = Math.abs(this.vy);
                this.baseVy = Math.abs(this.baseVy);
            } else if (this.y >= H) {
                this.y = H;
                this.vy = -Math.abs(this.vy);
                this.baseVy = -Math.abs(this.baseVy);
            }
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.s, 0, Math.PI * 2);
            ctx.fillStyle = this.c;
            ctx.fill();

            // 量子连线模式算法
            if (currentMouseMode === 'connect' && mouse.x > 0 && mouse.y > 0) {
                const dx = mouse.x - this.x;
                const dy = mouse.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < mouse.radius + 30) {
                    ctx.beginPath();
                    ctx.moveTo(this.x, this.y);
                    ctx.lineTo(mouse.x, mouse.y);
                    ctx.strokeStyle = `rgba(0, 229, 255, ${1 - dist / (mouse.radius + 30)})`;
                    ctx.lineWidth = 0.8;
                    ctx.stroke();
                }
            }
        }
    }

    for (let i = 0; i < 110; i++) pts.push(new P());

    function anim() {
        ctx.clearRect(0, 0, W, H);
        for (let p of pts) { p.update(); p.draw(); }
        requestAnimationFrame(anim);
    }
    anim();
})();

// HUD 模式切换函数
function setMouseMode(mode, btn) {
    currentMouseMode = mode;
    document.querySelectorAll('.hud-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
}

// HUD 折叠/展开切换
function toggleHud() {
    const hud = document.getElementById('mouse-hud');
    const icon = document.getElementById('hud-toggle-icon');
    hud.classList.toggle('collapsed');
    icon.textContent = hud.classList.contains('collapsed') ? '+' : '−';
}

// 2. 动态获取后端 Portfolio 数据
async function loadPortfolioData() {
    try {
        const res = await fetch(PORTFOLIO_URL);
        const data = await res.json();
        if (data.skills) renderSkills(data.skills);
        if (data.projects) renderProjects(data.projects);
    } catch (e) {
        document.getElementById('tree-container').innerText = "Failed to load skills.";
        document.getElementById('repoList').innerText = "Failed to load projects.";
    }
}

function renderSkills(skills) {
    let html = '<details><summary>📂 My skills:</summary><ul>';
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

// 3. AI 对话逻辑
let chatHistory = [];
let isSending = false;

// 快捷提问气泡触发函数
function sendQuickPrompt(promptText) {
    if (isSending) return;
    const input = document.getElementById('user-input');
    input.value = promptText;
    sendMessage();
}

function setQuickPromptsDisabled(disabled) {
    document.querySelectorAll('.prompt-btn').forEach(btn => btn.disabled = disabled);
}

async function sendMessage() {
    if (isSending) return;

    const input = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const text = input.value.trim();
    if (!text) return;

    // 进入发送状态：加锁 & 禁用输入框与快捷气泡
    isSending = true;
    input.value = '';
    input.disabled = true;
    if (sendBtn) sendBtn.disabled = true;
    setQuickPromptsDisabled(true);

    // 1. 追加用户发送的消息
    appendMessage(text, 'user');

    // 2. 追加 AI 占位消息，并直接拿到该 DOM 节点的引用
    const aiMsgEl = appendMessage('⟡ Processing...', 'ai');

    try {
        const res = await fetch(CHAT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text, history: chatHistory })
        });

        if (!res.ok) throw new Error(`HTTP Error status: ${res.status}`);

        const data = await res.json();

        if (data.reply) {
            updateMessageElement(aiMsgEl, data.reply, true);
            chatHistory.push({ role: "user", content: text });
            chatHistory.push({ role: "assistant", content: data.reply });
        } else {
            updateMessageElement(aiMsgEl, "⚠️ Error fetching reply.", false);
        }
    } catch (err) {
        console.error("Chat request failed:", err);
        updateMessageElement(aiMsgEl, "❌ Connection lost.", false);
    } finally {
        // 解锁恢复状态
        isSending = false;
        input.disabled = false;
        if (sendBtn) sendBtn.disabled = false;
        setQuickPromptsDisabled(false);
        input.focus();
    }
}

function appendMessage(text, sender) {
    const box = document.getElementById('chat-box');
    const div = document.createElement('div');
    div.className = `message msg-${sender}`;

    updateMessageElement(div, text, sender === 'ai');

    box.appendChild(div);
    scrollToBottom();

    return div;
}

function updateMessageElement(el, text, isAi) {
    if (isAi && typeof marked !== 'undefined') {
        el.innerHTML = marked.parse(text);
    } else {
        el.textContent = text;
    }
    scrollToBottom();
}

function scrollToBottom() {
    const box = document.getElementById('chat-box');
    setTimeout(() => {
        box.scrollTop = box.scrollHeight;
    }, 20);
}

function resetChat() {
    chatHistory = [];
    isSending = false;
    const input = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');

    if (input) {
        input.disabled = false;
        input.value = '';
    }
    if (sendBtn) sendBtn.disabled = false;
    setQuickPromptsDisabled(false);

    document.getElementById('chat-box').innerHTML = `
        <div class="message msg-ai">Signal acquired. I am Master's quantum echo. Tell me your identity. What would you like to decrypt about him? (you can use any language you want)</div>
    `;
}

function handleEnter(e) {
    if (e.key === 'Enter' && !e.isComposing) {
        e.preventDefault();
        sendMessage();
    }
}

window.addEventListener('DOMContentLoaded', loadPortfolioData);