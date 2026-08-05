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

// 3. AI 对话逻辑
let chatHistory = [];
async function sendMessage() {
    const input = document.getElementById('user-input');
    const text = input.value.trim();
    if (!text) return;
    appendMessage(text, 'user');
    chatHistory.push({ role: "user", content: text });
    input.value = '';
    const loadingId = appendMessage('⟡ Processing...', 'ai');
    try {
        const res = await fetch(CHAT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text, history: chatHistory })
        });
        const data = await res.json();
        document.getElementById(loadingId).remove();
        if (data.reply) {
            appendMessage(data.reply, 'ai');
            chatHistory.push({ role: "assistant", content: data.reply });
        } else {
            appendMessage("⚠️ Error fetching reply.", 'ai');
        }
    } catch {
        document.getElementById(loadingId).remove();
        appendMessage("❌ Connection lost.", 'ai');
    }
}

function appendMessage(text, sender) {
    const box = document.getElementById('chat-box');
    const id = 'msg-' + Date.now();
    const div = document.createElement('div');
    div.id = id;
    div.className = `message msg-${sender}`;
    if (sender === 'ai' && typeof marked !== 'undefined') {
        div.innerHTML = marked.parse(text);
    } else {
        div.textContent = text;
    }
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
    return id;
}

function resetChat() {
    chatHistory = [];
    document.getElementById('chat-box').innerHTML = `<div class="message msg-ai">Signal acquired. I am Master's quantum echo. Ask me anything.</div>`;
}

function handleEnter(e) { if (e.key === 'Enter') sendMessage(); }

window.addEventListener('DOMContentLoaded', loadPortfolioData);