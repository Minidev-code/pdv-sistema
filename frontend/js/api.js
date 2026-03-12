const API_BASE = '/api';

const api = {
  token: localStorage.getItem('pdv_token'),

  setToken(t) { this.token = t; localStorage.setItem('pdv_token', t); },
  clearToken() { this.token = null; localStorage.removeItem('pdv_token'); },

  async req(method, path, data) {
    const res = await fetch(API_BASE + path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {})
      },
      body: data ? JSON.stringify(data) : undefined
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Erro na requisição');
    return json;
  },

  get: (p) => api.req('GET', p),
  post: (p, d) => api.req('POST', p, d),
  put: (p, d) => api.req('PUT', p, d),
  patch: (p, d) => api.req('PATCH', p, d),
  del: (p) => api.req('DELETE', p),

  // Auth
  login: (email, senha) => api.post('/auth/login', { email, senha }),
  me: () => api.get('/auth/me'),
  saveTema: (tema) => api.patch('/auth/tema', tema),
  getUsuarios: () => api.get('/auth/usuarios'),
  createUsuario: (d) => api.post('/auth/register', d),

  // Produtos
  buscarProduto: (q, dept) => api.get(`/produtos/buscar?q=${encodeURIComponent(q || '')}&departamento=${encodeURIComponent(dept || '')}`),
  getDepartamentos: () => api.get('/produtos/departamentos'),
  getProdutos: (params = '') => api.get('/produtos' + params),
  getProdutoByBarcode: (cod) => api.get(`/produtos/barcode/${cod}`),
  createProduto: (d) => api.post('/produtos', d),
  updateProduto: (id, d) => api.put(`/produtos/${id}`, d),
  deleteProduto: (id) => api.del(`/produtos/${id}`),

  // Caixa
  statusCaixa: () => api.get('/caixa/status'),
  abrirCaixa: (d) => api.post('/caixa/abrir', d),
  fecharCaixa: (id, d) => api.post(`/caixa/fechar/${id}`, d),
  getCaixas: () => api.get('/caixa'),

  // Vendas
  realizarVenda: (d) => api.post('/vendas', d),
  cancelarVenda: (id, d) => api.post(`/vendas/${id}/cancelar`, d),
  getVendas: (params = '') => api.get('/vendas' + params),
  statsHoje: () => api.get('/vendas/stats/hoje'),
};
