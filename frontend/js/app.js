// ===== STATE =====
let currentUser = null;
let caixaAtual = null;
let accentColor = '#00d4aa';
let darkMode = true;

// ===== INIT =====
window.addEventListener('DOMContentLoaded', async () => {
  startClock();
  updateDate();
  const token = localStorage.getItem('pdv_token');
  if (token) {
    api.setToken(token);
    await tryAutoLogin();
  }
});

async function tryAutoLogin() {
  try {
    const { user } = await api.me();
    currentUser = user;
    applyUserTheme();
    enterApp();
  } catch {
    api.clearToken();
  }
}

// ===== LOGIN =====
async function handleLogin() {
  const email = document.getElementById('login-email').value.trim();
  const senha = document.getElementById('login-senha').value;
  const errEl = document.getElementById('login-error');
  errEl.classList.add('hidden');
  if (!email || !senha) { errEl.textContent = 'Preencha e-mail e senha.'; errEl.classList.remove('hidden'); return; }
  try {
    const { token, user } = await api.login(email, senha);
    api.setToken(token);
    currentUser = user;
    applyUserTheme();
    enterApp();
  } catch (e) {
    errEl.textContent = e.message;
    errEl.classList.remove('hidden');
  }
}

document.addEventListener('keydown', (e) => {
  if (document.getElementById('page-login').classList.contains('active') && e.key === 'Enter') handleLogin();
});

function enterApp() {
  document.getElementById('page-login').classList.remove('active');
  document.getElementById('page-login').classList.add('hidden');
  document.getElementById('page-app').classList.remove('hidden');
  document.getElementById('page-app').classList.add('active');
  updateUserUI();
  checkCaixa();
  loadDepartamentos();
  showSection('pdv');
}

function handleLogout() {
  api.clearToken();
  currentUser = null;
  location.reload();
}

function updateUserUI() {
  if (!currentUser) return;
  const initials = currentUser.nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  document.getElementById('user-avatar-sidebar').textContent = initials;
  document.getElementById('sidebar-user-name').textContent = currentUser.nome.split(' ')[0];
  document.getElementById('sidebar-user-role').textContent = currentUser.perfil;
}

// ===== SECTIONS =====
function showSection(name) {
  document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById(`section-${name}`).classList.add('active');
  document.querySelector(`[data-section="${name}"]`)?.classList.add('active');
  if (name === 'produtos') loadProdutos();
  if (name === 'caixa') loadCaixaSection();
  if (name === 'vendas') loadVendas();
  if (name === 'configuracoes') loadConfigSection();
}

// ===== CAIXA STATUS =====
async function checkCaixa() {
  try {
    const { caixaAberto, caixa } = await api.statusCaixa();
    caixaAtual = caixa;
    const badge = document.getElementById('caixa-status-badge');
    const text = document.getElementById('caixa-status-text');
    if (caixaAberto) {
      badge.className = 'caixa-status aberto';
      text.textContent = `Caixa Aberto — ${caixa.nomeOperador}`;
    } else {
      badge.className = 'caixa-status fechado';
      text.textContent = 'Caixa Fechado';
    }
  } catch {}
}

// ===== CLOCK =====
function startClock() {
  setInterval(() => {
    const now = new Date();
    document.getElementById('topbar-clock').textContent = now.toLocaleTimeString('pt-BR');
  }, 1000);
}

function updateDate() {
  const now = new Date();
  document.getElementById('topbar-date').textContent = now.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
}

// ===== THEME =====
function applyUserTheme() {
  if (!currentUser?.temaPreferido) return;
  const { cor, modo } = currentUser.temaPreferido;
  if (cor) setAccentColor(cor, null, false);
  if (modo) { darkMode = modo === 'dark'; applyDarkMode(false); }
}

function setAccentColor(color, btn, save = true) {
  accentColor = color;
  document.documentElement.style.setProperty('--accent', color);
  const r = parseInt(color.slice(1,3), 16), g = parseInt(color.slice(3,5), 16), b = parseInt(color.slice(5,7), 16);
  document.documentElement.style.setProperty('--accent-dim', `rgba(${r},${g},${b},0.12)`);
  document.documentElement.style.setProperty('--accent-glow', `rgba(${r},${g},${b},0.3)`);
  document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
  if (btn) btn.classList.add('active');
  document.getElementById('custom-color').value = color;
  if (save && currentUser) api.saveTema({ cor: color }).catch(() => {});
}

function toggleTheme() {
  darkMode = !darkMode;
  applyDarkMode();
}

function applyDarkMode(save = true) {
  const toggle = document.getElementById('theme-toggle');
  const label = document.getElementById('theme-label');
  if (darkMode) {
    document.body.classList.remove('light-mode'); document.body.classList.add('dark-mode');
    toggle?.classList.remove('active'); if (label) label.textContent = 'Escuro';
  } else {
    document.body.classList.remove('dark-mode'); document.body.classList.add('light-mode');
    toggle?.classList.add('active'); if (label) label.textContent = 'Claro';
  }
  if (save && currentUser) api.saveTema({ modo: darkMode ? 'dark' : 'light' }).catch(() => {});
}

// ===== MODALS =====
function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

// ===== TOASTS =====
function showToast(msg, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<div class="toast-dot"></div><span>${msg}</span>`;
  document.getElementById('toast-container').appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

// ===== LOAD DEPARTAMENTOS =====
async function loadDepartamentos() {
  try {
    const { departamentos } = await api.getDepartamentos();
    const deptFilter = document.getElementById('dept-filter');
    const deptContainer = document.querySelector('.dept-filter');

    // PDV department buttons
    departamentos.forEach(d => {
      if (!deptContainer.querySelector(`[data-dept="${d}"]`)) {
        const btn = document.createElement('button');
        btn.className = 'dept-btn'; btn.dataset.dept = d; btn.textContent = d;
        btn.onclick = () => filterDept(btn, d);
        deptContainer.appendChild(btn);
      }
    });

    // Products filter select
    const sel = document.getElementById('produtos-dept-filter');
    if (sel) {
      departamentos.forEach(d => {
        const opt = document.createElement('option'); opt.value = d; opt.textContent = d;
        sel.appendChild(opt);
      });
    }

    // Datalist for product form
    const dl = document.getElementById('dept-list');
    if (dl) { dl.innerHTML = ''; departamentos.forEach(d => { const o = document.createElement('option'); o.value = d; dl.appendChild(o); }); }
  } catch {}
}

function filterDept(btn, dept) {
  document.querySelectorAll('.dept-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  window._currentDept = dept;
}

// ===== CONFIG SECTION =====
function loadConfigSection() { loadUsuarios(); }

async function loadUsuarios() {
  try {
    const { users } = await api.getUsuarios();
    const list = document.getElementById('usuarios-list');
    list.innerHTML = users.map(u => `
      <div class="usuario-item">
        <div class="user-avatar">${u.nome[0].toUpperCase()}</div>
        <div class="user-name">
          <div>${u.nome}</div>
          <div style="font-size:11px;color:var(--text2)">${u.email}</div>
        </div>
        <span class="badge ${u.perfil === 'admin' ? 'badge-yellow' : 'badge-green'}">${u.perfil}</span>
      </div>`).join('');
  } catch {}
}

async function saveUsuario() {
  const nome = document.getElementById('user-nome').value.trim();
  const email = document.getElementById('user-email').value.trim();
  const senha = document.getElementById('user-senha').value;
  const perfil = document.getElementById('user-perfil').value;
  if (!nome || !email || !senha) { showToast('Preencha todos os campos obrigatórios', 'error'); return; }
  try {
    await api.createUsuario({ nome, email, senha, perfil });
    closeModal('modal-usuario');
    showToast('Usuário criado com sucesso!', 'success');
    loadUsuarios();
    ['user-nome','user-email','user-senha'].forEach(id => document.getElementById(id).value = '');
  } catch (e) { showToast(e.message, 'error'); }
}

// ===== FORMAT HELPERS =====
function fmtMoeda(v) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0); }
