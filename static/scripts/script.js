/* ══════════════════════════════════════════════
    NAVIGATION
══════════════════════════════════════════════ */
function showPage(name, e) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById(name).classList.add('active');
    document.querySelector(`.nav-item[data-page="${name}"]`)?.classList.add('active');
}

document.querySelectorAll('.nav-item').forEach(el => {
    el.addEventListener('click', function (e) {
    showPage(this.dataset.page, e);
    });
});

/* ══════════════════════════════════════════════
    HELPERS
══════════════════════════════════════════════ */
function setLoading(btnId, loading) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    if (!btn.dataset.label && !loading) return;
    if (!btn.dataset.label) btn.dataset.label = btn.innerHTML;
    if (!loading) btn.innerHTML = btn.dataset.label;
    btn.disabled = loading;
    btn.innerHTML = loading ? '<span class="spinner"></span>' : btn.dataset.label || btn.innerHTML;
}

function showResult(id, html) {
    const el = document.getElementById(id);
    el.innerHTML = html;
    el.classList.add('visible');
}

async function apiFetch(url, body, isForm = false) {
    const opts = { method: 'POST' };
    if (isForm) {
    opts.body = body;
    } else {
    opts.headers = { 'Content-Type': 'application/json' };
    opts.body = JSON.stringify(body);
    }
    const res = await fetch(url, opts);
    return res.json();
}

function fmtNum(n) {
    return new Intl.NumberFormat('en-IN').format(Math.round(n));
}

/* ══════════════════════════════════════════════
    DASHBOARD CHAT
══════════════════════════════════════════════ */
function appendMsg(boxId, role, text) {
    const box = document.getElementById(boxId);

    const d = document.createElement('div');
    d.className = `msg ${role}`; // 'user' or 'bot'

    let formattedText;

    if (role === 'bot') {
    formattedText = DOMPurify.sanitize(
        marked.parse(text) // Convert Markdown to HTML and sanitize it for safe display
    );
    } else {
        formattedText = text; // User messages are treated as plain text without Markdown parsing
    }

    d.innerHTML = `
        <div class="sender">
            ${role === 'user' ? 'You' : 'AI Advisor'}
        </div>
        ${formattedText}
    `;

    box.appendChild(d);
    box.scrollTop = box.scrollHeight;
}

async function dashSend() {
    const inp = document.getElementById('dashMsg');
    const msg = inp.value.trim();
    if (!msg) return;
    inp.value = '';
    appendMsg('dashChat', 'user', msg);
    setLoading('dashBtn', true);
    try {
    const data = await apiFetch('/chat', { message: msg });
    appendMsg('dashChat', 'bot', data.reply || data.error || 'No response');
    } catch (e) {
    appendMsg('dashChat', 'bot', '⚠ Could not reach server. Is Flask running?');
    }
    setLoading('dashBtn', false);
}

function dashQuick(text) {
    document.getElementById('dashMsg').value = text;
    dashSend();
}

/* ══════════════════════════════════════════════
    FULL CHAT PAGE
══════════════════════════════════════════════ */
async function chatSend() {
    const inp = document.getElementById('chatInput');
    const msg = inp.value.trim();
    if (!msg) return;
    inp.value = '';
    appendMsg('chatMessages', 'user', msg);
    setLoading('chatBtn', true);
    try {
    const data = await apiFetch('/chat', { message: msg });
    appendMsg('chatMessages', 'bot', data.reply || data.error);
    } catch (e) {
    appendMsg('chatMessages', 'bot', '⚠ Could not reach server.');
    }
    setLoading('chatBtn', false);
}

/* ══════════════════════════════════════════════
    MONEY SCORE → POST /money-score
══════════════════════════════════════════════ */
async function calcScore() {
    const income = document.getElementById('s_income').value;
    const expenses = document.getElementById('s_expenses').value;
    const savings = document.getElementById('s_savings').value;
    const invest = document.getElementById('s_invest').value;
    const debt = document.getElementById('s_debt').value;
    const emergency = document.getElementById('s_emergency').value;

    if (!income || !expenses || !savings || !invest || !debt || !emergency) {
    showResult('scoreResult', '⚠ Please fill in all fields.');
    return;
    }

    setLoading('scoreBtn', true);
    try {
    const data = await apiFetch('/money-score', {
        income: parseFloat(income),
        expenses: parseFloat(expenses),
        savings: parseFloat(savings),
        investments: parseFloat(invest),
        debt: parseFloat(debt),
        emergency: parseFloat(emergency)
    });

    if (data.error) {
        showResult('scoreResult', `⚠ ${data.error}`);
    } else {
        const color = data.score >= 80 ? '#2ecc8a' : data.score >= 60 ? '#d4a843' : '#e05252';
        showResult('scoreResult', `
    <div style="text-align:center;margin-bottom:10px">
        <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:0.06em">Your Money Score</div>
        <div style="font-family:'Syne',sans-serif;font-size:52px;font-weight:800;color:${color}">${data.score}</div>
        <div style="font-size:16px;font-weight:600">${data.status}</div>
    </div>
    `);
    }
    } catch (e) {
    showResult('scoreResult', '⚠ Could not reach server.');
    }
    setLoading('scoreBtn', false);
}

/* ══════════════════════════════════════════════
    SIP → POST /sip
══════════════════════════════════════════════ */
async function calcSIP() {
    const monthly = document.getElementById('sip_monthly').value;
    const rate = document.getElementById('sip_rate').value;
    const years = document.getElementById('sip_years').value;

    if (!monthly || !rate || !years) {
    showResult('sipResult', '⚠ Please fill all fields.');
    return;
    }

    setLoading('sipBtn', true);
    try {
    const data = await apiFetch('/sip', {
        monthly: parseFloat(monthly),
        rate: parseFloat(rate),
        years: parseInt(years)
    });

    if (data.error) {
        showResult('sipResult', `⚠ ${data.error}`);
    } else {
        const fv = data.future_value;
        showResult('sipResult', `
    <div style="font-size:11px;color:var(--muted);margin-bottom:6px;text-transform:uppercase;letter-spacing:0.06em">Estimated Future Value</div>
    <div class="result-big">₹${fmtNum(fv)}</div>
    <div style="font-size:12px;color:var(--muted);margin-top:6px">
        Invested: ₹${fmtNum(monthly * years * 12)} &nbsp;·&nbsp; 
        Gains: ₹${fmtNum(fv - monthly * years * 12)}
    </div>
    `);
    }
    } catch (e) {
    showResult('sipResult', '⚠ Could not reach server.');
    }
    setLoading('sipBtn', false);
}

/* ══════════════════════════════════════════════
    STOCK → POST /portfolio
══════════════════════════════════════════════ */
async function checkStock() {
    const sym = document.getElementById('stockSym').value.trim();
    if (!sym) { showResult('stockResult', '⚠ Enter a stock symbol.'); return; }

    setLoading('stockBtn', true);
    try {
    const data = await apiFetch('/portfolio', { stock: sym });

    if (data.error) {
        showResult('stockResult', `⚠ ${data.error}`);
    } else {
        showResult('stockResult', `
    <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:0.06em">${sym.toUpperCase()}.NS — Last Close</div>
    <div class="result-big">₹${fmtNum(data.price)}</div>
    <div style="font-size:11px;color:var(--muted);margin-top:4px">Data from Yahoo Finance</div>
    `);
    }
    } catch (e) {
    showResult('stockResult', '⚠ Could not reach server.');
    }
    setLoading('stockBtn', false);
}

/* ══════════════════════════════════════════════
    TAX → POST /tax
══════════════════════════════════════════════ */
async function calcTax() {
    const income = document.getElementById('taxIncome').value;
    if (!income) { showResult('taxResult', '⚠ Enter your annual income.'); return; }

    setLoading('taxBtn', true);
    try {
    const data = await apiFetch('/tax', { income: parseFloat(income) });

    if (data.error) {
        showResult('taxResult', `⚠ ${data.error}`);
    } else {
        const tax = data.tax;
        const eff = ((tax / parseFloat(income)) * 100).toFixed(1);
        showResult('taxResult', `
    <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:0.06em">Total Tax Payable</div>
    <div class="result-big">₹${fmtNum(tax)}</div>
    <div style="font-size:12px;color:var(--muted);margin-top:6px">Effective Rate: ${eff}% &nbsp;·&nbsp; Take-home: ₹${fmtNum(parseFloat(income) - tax)}/yr</div>
    `);
    }
    } catch (e) {
    showResult('taxResult', '⚠ Could not reach server.');
    }
    setLoading('taxBtn', false);
}

/* ══════════════════════════════════════════════
    PDF → POST /upload  (multipart)
══════════════════════════════════════════════ */
async function uploadPDF() {
    const file = document.getElementById('pdfFile').files[0];
    if (!file) { showResult('pdfResult', '⚠ Please select a PDF file.'); return; }

    const form = new FormData();
    form.append('file', file);

    setLoading('pdfBtn', true);
    try {
    const data = await apiFetch('/upload', form, true);
    if (data.error) {
        showResult('pdfResult', `⚠ ${data.error}`);
    } else {
        const content = data.data || data.text || JSON.stringify(data);
        showResult('pdfResult', `<pre style="white-space:pre-wrap;font-family:'JetBrains Mono',monospace;font-size:12px">${content}</pre>`);
    }
    } catch (e) {
    showResult('pdfResult', '⚠ Could not reach server.');
    }
    setLoading('pdfBtn', false);
}

/* ══════════════════════════════════════════════
    MULTI AGENT → POST /agent
══════════════════════════════════════════════ */
async function runAgent() {
    const query = document.getElementById('agentQuery').value.trim();
    if (!query) { showResult('agentResult', '⚠ Enter a query.'); return; }

    setLoading('agentBtn', true);
    try {
    const data = await apiFetch('/agent', { query });
    if (data.error) {
        showResult('agentResult', `⚠ ${data.error}`);
    } else {
        const resp = data.response || JSON.stringify(data);
        showResult('agentResult', `<div style="white-space:pre-wrap;font-size:13px;line-height:1.7">${resp}</div>`);
    }
    } catch (e) {
    showResult('agentResult', '⚠ Could not reach server.');
    }
    setLoading('agentBtn', false);
}

/* ══════════════════════════════════════════════
    SIP SLIDER (dashboard)
══════════════════════════════════════════════ */
function updateSIP() {
    const m = +document.getElementById('sipAmt').value;
    const y = +document.getElementById('sipYrs').value;
    const r = +document.getElementById('sipRt').value / 100 / 12;
    const n = y * 12;
    const fv = m * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);

    document.getElementById('sipAmtLbl').textContent = fmtNum(m);
    document.getElementById('sipYrLbl').textContent = y;
    document.getElementById('sipRtLbl').textContent = document.getElementById('sipRt').value;
    document.getElementById('sipOut').textContent = fv >= 1e7
    ? '₹' + (fv / 1e7).toFixed(2) + 'Cr'
    : '₹' + (fv / 1e5).toFixed(1) + 'L';
}

updateSIP();

