const BACKEND_BASE = "https://backend-render-qs89.onrender.com";
const CHAT_URL = `${BACKEND_BASE}/api/chat`;
const PORTFOLIO_URL = `${BACKEND_BASE}/api/portfolio`;

// 1. 粒子背景特效
(function bg() {
    if (window.innerWidth <= 860) return;
    const c = document.getElementById('bg-canvas'), ctx = c.getContext('2d');
    let W, H, pts = [];
    function resize() { W = c.width = window.innerWidth; H = c.height = window.innerHeight; }
    window.addEventListener('resize', resize); resize();
    class P {
        constructor() { this.reset(); }
        reset() {
            this.x = Math.random() * W; this.y = Math.random() * H;
            this.s = Math.random() * 2.2 + 0.6;
            this.vx = (Math.random() - 0.5) * 0.45;
            this.vy = (Math.random() - 0.5) * 0.45;
            this.c = `hsla(${220 + Math.random() * 60}, 80%, 70%, 0.5)`;
        }
        update() {
            this.x += this.vx; this.y += this.vy;
            if (this.x < 0 || this.x > W) this.vx *= -1;
            if (this.y < 0 || this.y > H) this.vy *= -1;
        }
        draw() {
            ctx.beginPath(); ctx.arc(this.x, this.y, this.s, 0, Math.PI * 2);
            ctx.fillStyle = this.c; ctx.fill();
        }
    }
    for (let i = 0; i < 100; i++) pts.push(new P());
    function anim() {
        ctx.clearRect(0, 0, W, H);
        for (let p of pts) { p.update(); p.draw(); }
        requestAnimationFrame(anim);
    }
    anim();
})();

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

// 3. AI 对话逻辑 (使用 DOM 节点直接引用更新，彻底解决误删 Bug)
let chatHistory = [];
let isSending = false;

async function sendMessage() {
    if (isSending) return;

    const input = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const text = input.value.trim();
    if (!text) return;

    // 进入发送状态：加锁 & 禁用输入框
    isSending = true;
    input.value = '';
    input.disabled = true;
    if (sendBtn) sendBtn.disabled = true;

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
            // 直接在原地将 Processing... 更新为真正的回复
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
        input.focus();
    }
}

// 创建并追加消息元素，返回 DOM 节点引用
function appendMessage(text, sender) {
    const box = document.getElementById('chat-box');
    const div = document.createElement('div');
    div.className = `message msg-${sender}`;

    updateMessageElement(div, text, sender === 'ai');

    box.appendChild(div);
    scrollToBottom();

    return div; // 返回 DOM 节点
}

// 原地更新 DOM 节点的内容
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