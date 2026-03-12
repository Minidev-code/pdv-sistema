// ===== PDV STATE =====
let cart = [];
let searchTimeout = null;
let selectedPayment = 'dinheiro';
let currentDept = '';

// ===== SEARCH =====
function handleSearchInput(val) {
  clearTimeout(searchTimeout);
  if (!val.trim()) { hideSearchResults(); return; }
  searchTimeout = setTimeout(() => searchProducts(val), 280);
}

async function handleSearchKeydown(e) {
  if (e.key === 'Enter') {
    const val = e.target.value.trim();
    if (!val) return;
    clearTimeout(searchTimeout);
    const isBarcode = /^[0-9]+$/.test(val);
    if (isBarcode) {
      try {
        const { produto } = await api.getProdutoByBarcode(val);
        addToCart(produto);
        e.target.value = '';
        hideSearchResults();
      } catch {
        showToast('Produto não encontrado', 'error');
      }
    } else {
      searchProducts(val);
    }
  }
  if (e.key === 'Escape') { hideSearchResults(); e.target.value = ''; }
}

async function searchProducts(q) {
  if (!q.trim()) return;
  try {
    const dept = window._currentDept || '';
    const { produtos } = await api.buscarProduto(q, dept);
    showSearchResults(produtos);
  } catch {}
}

function showSearchResults(produtos) {
  const container = document.getElementById('search-results');
  if (!produtos.length) {
    container.innerHTML = '<div style="padding:12px;color:var(--text2);font-size:13px;text-align:center">Nenhum produto encontrado</div>';
    container.classList.remove('hidden');
    return;
  }
  container.innerHTML = produtos.map(p => `
    <div class="search-result-item" onclick="selectSearchResult('${p._id}')">
      <div class="result-info">
        <div class="result-name">${p.nome}</div>
        <div class="result-meta">${p.codigoBarras} · ${p.departamento} · Estoque: ${p.estoque} ${p.unidade}</div>
      </div>
      <div class="result-price">${fmtMoeda(p.preco)}</div>
    </div>`).join('');
  container.classList.remove('hidden');
}

function hideSearchResults() {
  document.getElementById('search-results').classList.add('hidden');
}

async function selectSearchResult(id) {
  try {
    const { produto } = await api.req('GET', `/produtos/${id}`);
    addToCart(produto);
    document.getElementById('pdv-search').value = '';
    hideSearchResults();
  } catch {}
}

// ===== CART =====
function addToCart(produto) {
  if (produto.estoque <= 0) { showToast(`${produto.nome}: sem estoque`, 'error'); return; }
  const existing = cart.find(i => i._id === produto._id);
  if (existing) {
    existing.quantidade++;
  } else {
    cart.push({ ...produto, quantidade: 1 });
  }
  renderCart();
  showToast(`${produto.nome} adicionado`, 'success');
}

function updateQty(id, delta) {
  const item = cart.find(i => i._id === id);
  if (!item) return;
  item.quantidade = Math.max(1, item.quantidade + delta);
  renderCart();
}

function setQty(id, val) {
  const item = cart.find(i => i._id === id);
  if (!item) return;
  item.quantidade = Math.max(0.001, parseFloat(val) || 1);
  renderCart();
}

function removeFromCart(id) {
  cart = cart.filter(i => i._id !== id);
  renderCart();
}

function clearCart() {
  cart = [];
  document.getElementById('desconto-input').value = 0;
  renderCart();
}

function renderCart() {
  const container = document.getElementById('cart-items');
  document.getElementById('cart-count').textContent = `${cart.length} item${cart.length !== 1 ? 's' : ''}`;

  if (!cart.length) {
    container.innerHTML = `
      <div class="cart-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
        <p>Carrinho vazio</p><span>Busque produtos acima</span>
      </div>`;
    updateTotals();
    return;
  }

  container.innerHTML = cart.map(item => {
    const sub = item.preco * item.quantidade;
    return `
      <div class="cart-item">
        <div class="cart-item-info">
          <div class="cart-item-name">${item.nome}</div>
          <div class="cart-item-price">${fmtMoeda(item.preco)} / ${item.unidade}</div>
        </div>
        <div class="cart-item-qty">
          <button class="qty-btn" onclick="updateQty('${item._id}', -1)">−</button>
          <input class="qty-input" type="number" value="${item.quantidade}" min="0.001" step="1" onchange="setQty('${item._id}', this.value)" />
          <button class="qty-btn" onclick="updateQty('${item._id}', 1)">+</button>
        </div>
        <div class="cart-item-subtotal">${fmtMoeda(sub)}</div>
        <button class="cart-item-del" onclick="removeFromCart('${item._id}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>`;
  }).join('');
  updateTotals();
}

function updateTotals() {
  const subtotal = cart.reduce((s, i) => s + i.preco * i.quantidade, 0);
  const desc = parseFloat(document.getElementById('desconto-input')?.value || 0) || 0;
  const total = Math.max(0, subtotal - desc);
  document.getElementById('subtotal-display').textContent = fmtMoeda(subtotal);
  document.getElementById('total-display').textContent = fmtMoeda(total);
  calcTroco();
}

// ===== PAYMENT =====
function selectPayment(btn) {
  document.querySelectorAll('.pay-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  selectedPayment = btn.dataset.method;
  const cashPanel = document.getElementById('cash-change-panel');
  cashPanel.style.display = selectedPayment === 'dinheiro' ? 'block' : 'none';
}

function calcTroco() {
  const total = parseFloat(document.getElementById('total-display').textContent.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
  const recebido = parseFloat(document.getElementById('valor-recebido')?.value || 0) || 0;
  const troco = Math.max(0, recebido - total);
  const el = document.getElementById('troco-valor');
  if (el) el.textContent = fmtMoeda(troco);
}

// ===== FINALIZAR VENDA =====
async function finalizarVenda() {
  if (!cart.length) { showToast('Carrinho vazio', 'error'); return; }
  
  const { caixaAberto } = await api.statusCaixa().catch(() => ({ caixaAberto: false }));
  if (!caixaAberto) { showToast('Abra o caixa antes de vender!', 'error'); showSection('caixa'); return; }

  const desconto = parseFloat(document.getElementById('desconto-input').value || 0) || 0;
  const subtotal = cart.reduce((s, i) => s + i.preco * i.quantidade, 0);
  const total = Math.max(0, subtotal - desconto);
  const recebido = parseFloat(document.getElementById('valor-recebido')?.value || 0) || 0;
  const troco = selectedPayment === 'dinheiro' ? Math.max(0, recebido - total) : 0;

  const itens = cart.map(i => ({
    produto: i._id, nome: i.nome, codigoBarras: i.codigoBarras,
    quantidade: i.quantidade, preco: i.preco, subtotal: i.preco * i.quantidade
  }));

  const pagamentos = [{ forma: selectedPayment, valor: total, troco }];

  try {
    const { venda } = await api.realizarVenda({ itens, pagamentos, desconto });
    document.getElementById('venda-ok-details').innerHTML = `
      <div>🧾 Venda <b>#${venda.numero}</b></div>
      <div>💰 Total: <b>${fmtMoeda(venda.total)}</b></div>
      ${selectedPayment === 'dinheiro' && troco > 0 ? `<div>💵 Troco: <b>${fmtMoeda(troco)}</b></div>` : ''}
      <div>📋 ${itens.length} item(ns)</div>
      <div>🕐 ${new Date().toLocaleTimeString('pt-BR')}</div>`;
    openModal('modal-venda-ok');
    clearCart();
    checkCaixa();
  } catch (e) { showToast(e.message, 'error'); }
}

// Close search on outside click
document.addEventListener('click', (e) => {
  if (!e.target.closest('.pdv-search-area')) hideSearchResults();
});
