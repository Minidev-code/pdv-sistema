// ===== CAIXA SECTION =====
async function loadCaixaSection() {
  const container = document.getElementById('caixa-content');
  container.innerHTML = '<div class="loading-spinner">Carregando...</div>';
  try {
    const { caixaAberto, caixa } = await api.statusCaixa();

    if (caixaAberto) {
      container.innerHTML = `
        <div class="caixa-panel">
          <h3 style="color:var(--green)">✓ Caixa Aberto</h3>
          <div class="caixa-info-grid">
            <div class="caixa-info-item">
              <div class="caixa-info-label">Operador</div>
              <div class="caixa-info-value" style="font-size:13px">${caixa.nomeOperador}</div>
            </div>
            <div class="caixa-info-item">
              <div class="caixa-info-label">Abertura</div>
              <div class="caixa-info-value" style="font-size:13px">${new Date(caixa.dataAbertura).toLocaleString('pt-BR')}</div>
            </div>
            <div class="caixa-info-item">
              <div class="caixa-info-label">Saldo Abertura</div>
              <div class="caixa-info-value">${fmtMoeda(caixa.saldoAbertura)}</div>
            </div>
            <div class="caixa-info-item">
              <div class="caixa-info-label">Vendas do Dia</div>
              <div class="caixa-info-value">${fmtMoeda(caixa.totalVendas)}</div>
            </div>
            <div class="caixa-info-item">
              <div class="caixa-info-label">Qtd. Vendas</div>
              <div class="caixa-info-value">${caixa.quantidadeVendas}</div>
            </div>
            <div class="caixa-info-item">
              <div class="caixa-info-label">Descontos</div>
              <div class="caixa-info-value" style="color:var(--yellow)">${fmtMoeda(caixa.totalDescontos)}</div>
            </div>
          </div>
          <div class="form-group" style="margin-bottom:14px">
            <label>Saldo em caixa (conferência)</label>
            <input type="number" id="saldo-fechamento" placeholder="0,00" min="0" step="0.01" />
          </div>
          <div class="form-group" style="margin-bottom:16px">
            <label>Observações</label>
            <textarea id="obs-fechamento" rows="2" placeholder="Opcional..."></textarea>
          </div>
          <button class="btn-primary" style="background:var(--red);color:white" onclick="fecharCaixa('${caixa._id}')">
            Fechar Caixa
          </button>
        </div>`;
    } else {
      container.innerHTML = `
        <div class="caixa-panel">
          <h3 style="color:var(--red)">✗ Caixa Fechado</h3>
          <p style="color:var(--text2);margin-bottom:20px">Abra o caixa para começar as vendas do dia.</p>
          <div class="form-group" style="margin-bottom:16px">
            <label>Saldo de abertura (R$)</label>
            <input type="number" id="saldo-abertura" placeholder="0,00" min="0" step="0.01" value="0" />
          </div>
          <button class="btn-primary" onclick="abrirCaixa()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            Abrir Caixa
          </button>
        </div>`;
    }
  } catch (e) {
    container.innerHTML = `<div class="loading-spinner" style="color:var(--red)">${e.message}</div>`;
  }
}

async function abrirCaixa() {
  const saldo = parseFloat(document.getElementById('saldo-abertura')?.value || 0) || 0;
  try {
    await api.abrirCaixa({ saldoAbertura: saldo });
    showToast('Caixa aberto!', 'success');
    checkCaixa();
    loadCaixaSection();
  } catch (e) { showToast(e.message, 'error'); }
}

async function fecharCaixa(id) {
  if (!confirm('Confirmar fechamento de caixa?')) return;
  const saldo = parseFloat(document.getElementById('saldo-fechamento')?.value || 0) || 0;
  const obs = document.getElementById('obs-fechamento')?.value || '';
  try {
    await api.fecharCaixa(id, { saldoFechamento: saldo, observacoes: obs });
    showToast('Caixa fechado com sucesso!', 'success');
    checkCaixa();
    loadCaixaSection();
  } catch (e) { showToast(e.message, 'error'); }
}

// ===== VENDAS SECTION =====
async function loadVendas() {
  try {
    const [statsRes, vendasRes] = await Promise.all([api.statsHoje(), api.getVendas('?limit=30')]);
    const s = statsRes.stats;

    document.getElementById('vendas-stats').innerHTML = `
      <div class="stat-card">
        <div class="stat-label">Total Hoje</div>
        <div class="stat-value">${fmtMoeda(s.totalVendido)}</div>
        <div class="stat-sub">em vendas</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Nº de Vendas</div>
        <div class="stat-value">${s.quantidadeVendas}</div>
        <div class="stat-sub">transações</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Ticket Médio</div>
        <div class="stat-value">${fmtMoeda(s.ticketMedio)}</div>
        <div class="stat-sub">por venda</div>
      </div>`;

    const { vendas } = vendasRes;
    document.getElementById('vendas-table').innerHTML = `
      <table class="data-table">
        <thead><tr><th>#</th><th>Data/Hora</th><th>Operador</th><th>Itens</th><th>Total</th><th>Pagamento</th><th>Status</th><th>Ação</th></tr></thead>
        <tbody>
          ${vendas.map(v => `
            <tr>
              <td><span style="font-family:var(--font-mono)">#${v.numero}</span></td>
              <td style="font-size:12px">${new Date(v.dataVenda).toLocaleString('pt-BR')}</td>
              <td>${v.nomeOperador}</td>
              <td>${v.itens?.length || 0} item(ns)</td>
              <td style="font-family:var(--font-mono);font-weight:700;color:var(--accent)">${fmtMoeda(v.total)}</td>
              <td><span class="badge badge-green">${v.pagamentos?.[0]?.forma || '-'}</span></td>
              <td><span class="badge ${v.status === 'concluida' ? 'badge-green' : 'badge-red'}">${v.status}</span></td>
              <td>${v.status === 'concluida' ? `<button class="btn-secondary" style="padding:4px 10px;font-size:11px;color:var(--red)" onclick="cancelarVenda('${v._id}', ${v.numero})">Cancelar</button>` : ''}</td>
            </tr>`).join('')}
        </tbody>
      </table>`;
  } catch (e) {
    document.getElementById('vendas-table').innerHTML = `<div class="loading-spinner" style="color:var(--red)">${e.message}</div>`;
  }
}

async function cancelarVenda(id, num) {
  const motivo = prompt(`Motivo do cancelamento da venda #${num}:`);
  if (motivo === null) return;
  try {
    await api.cancelarVenda(id, { motivo });
    showToast(`Venda #${num} cancelada`, 'success');
    loadVendas();
  } catch (e) { showToast(e.message, 'error'); }
}
