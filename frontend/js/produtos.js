// ===== PRODUTOS =====
async function loadProdutos() {
  const q = document.getElementById('produtos-search')?.value.trim() || '';
  const dept = document.getElementById('produtos-dept-filter')?.value || '';
  const params = `?limit=50${dept ? `&departamento=${encodeURIComponent(dept)}` : ''}`;

  const container = document.getElementById('produtos-table');
  container.innerHTML = '<div class="loading-spinner">Carregando produtos...</div>';

  try {
    let { produtos } = await api.getProdutos(params);
    if (q) produtos = produtos.filter(p =>
      p.nome.toLowerCase().includes(q.toLowerCase()) ||
      p.codigoBarras.includes(q) ||
      p.departamento.toLowerCase().includes(q.toLowerCase())
    );

    if (!produtos.length) {
      container.innerHTML = '<div class="loading-spinner">Nenhum produto encontrado.</div>';
      return;
    }

    container.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Código de Barras</th>
            <th>Nome</th>
            <th>Departamento</th>
            <th>Preço</th>
            <th>Estoque</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          ${produtos.map(p => `
            <tr>
              <td><span style="font-family:var(--font-mono);font-size:12px">${p.codigoBarras}</span></td>
              <td>
                <div style="font-weight:500">${p.nome}</div>
                ${p.categoria ? `<div style="font-size:11px;color:var(--text2)">${p.categoria}</div>` : ''}
              </td>
              <td><span class="badge badge-green">${p.departamento}</span></td>
              <td style="font-family:var(--font-mono);font-weight:700;color:var(--accent)">${fmtMoeda(p.preco)}</td>
              <td>
                <span class="${p.estoque <= p.estoqueMinimo ? 'badge badge-red' : 'badge badge-green'}">
                  ${p.estoque} ${p.unidade}
                </span>
              </td>
              <td><span class="badge ${p.ativo ? 'badge-green' : 'badge-red'}">${p.ativo ? 'Ativo' : 'Inativo'}</span></td>
              <td>
                <div style="display:flex;gap:6px">
                  <button class="btn-secondary" style="padding:5px 10px;font-size:12px" onclick="editProduto('${p._id}')">Editar</button>
                  <button class="btn-secondary" style="padding:5px 10px;font-size:12px;color:var(--red)" onclick="deleteProduto('${p._id}', '${p.nome}')">Remover</button>
                </div>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>`;
  } catch (e) {
    container.innerHTML = `<div class="loading-spinner" style="color:var(--red)">${e.message}</div>`;
  }
}

async function editProduto(id) {
  try {
    const { produto } = await api.req('GET', `/produtos/${id}`);
    document.getElementById('produto-id').value = produto._id;
    document.getElementById('modal-produto-title').textContent = 'Editar Produto';
    document.getElementById('produto-nome').value = produto.nome;
    document.getElementById('produto-barcode').value = produto.codigoBarras;
    document.getElementById('produto-codigo-interno').value = produto.codigoInterno || '';
    document.getElementById('produto-departamento').value = produto.departamento;
    document.getElementById('produto-categoria').value = produto.categoria || '';
    document.getElementById('produto-preco').value = produto.preco;
    document.getElementById('produto-preco-compra').value = produto.precoCompra || '';
    document.getElementById('produto-estoque').value = produto.estoque;
    document.getElementById('produto-estoque-min').value = produto.estoqueMinimo;
    document.getElementById('produto-unidade').value = produto.unidade;
    document.getElementById('produto-descricao').value = produto.descricao || '';
    openModal('modal-produto');
  } catch (e) { showToast(e.message, 'error'); }
}

function resetProdutoForm() {
  document.getElementById('produto-id').value = '';
  document.getElementById('modal-produto-title').textContent = 'Novo Produto';
  ['produto-nome','produto-barcode','produto-codigo-interno','produto-departamento',
   'produto-categoria','produto-preco','produto-preco-compra','produto-descricao'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('produto-estoque').value = 0;
  document.getElementById('produto-estoque-min').value = 5;
  document.getElementById('produto-unidade').value = 'UN';
}

// Override openModal for produto to reset form
const _origOpenModal = window.openModal;
window.openModal = function(id) {
  if (id === 'modal-produto') resetProdutoForm();
  _origOpenModal(id);
};

async function saveProduto() {
  const id = document.getElementById('produto-id').value;
  const data = {
    nome: document.getElementById('produto-nome').value.trim(),
    codigoBarras: document.getElementById('produto-barcode').value.trim(),
    codigoInterno: document.getElementById('produto-codigo-interno').value.trim() || undefined,
    departamento: document.getElementById('produto-departamento').value.trim(),
    categoria: document.getElementById('produto-categoria').value.trim() || undefined,
    preco: parseFloat(document.getElementById('produto-preco').value),
    precoCompra: parseFloat(document.getElementById('produto-preco-compra').value) || undefined,
    estoque: parseFloat(document.getElementById('produto-estoque').value) || 0,
    estoqueMinimo: parseFloat(document.getElementById('produto-estoque-min').value) || 5,
    unidade: document.getElementById('produto-unidade').value,
    descricao: document.getElementById('produto-descricao').value.trim() || undefined,
  };

  if (!data.nome || !data.codigoBarras || !data.departamento || isNaN(data.preco)) {
    showToast('Preencha todos os campos obrigatórios', 'error'); return;
  }

  try {
    if (id) {
      await api.updateProduto(id, data);
      showToast('Produto atualizado!', 'success');
    } else {
      await api.createProduto(data);
      showToast('Produto cadastrado!', 'success');
    }
    closeModal('modal-produto');
    loadProdutos();
    loadDepartamentos();
  } catch (e) { showToast(e.message, 'error'); }
}

async function deleteProduto(id, nome) {
  if (!confirm(`Desativar "${nome}"?`)) return;
  try {
    await api.deleteProduto(id);
    showToast('Produto desativado', 'success');
    loadProdutos();
  } catch (e) { showToast(e.message, 'error'); }
}
