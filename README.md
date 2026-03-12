#  PDV Sistema — Node.js + MongoDB + Claude

Sistema completo de Ponto de Venda com interface moderna, integrado ao MongoDB.

---

##Requisitos

- Node.js 18+
- MongoDB 6+ (local ou Atlas)

---

##Instalação

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env
# Edite .env com suas configurações

# 3. Iniciar servidor
npm start

# 4. Acessar no navegador
http://localhost:3000
```

---

##Primeiro Acesso

Execute este script para criar o usuário admin inicial:

```bash
node backend/seed.js
```

Credenciais padrão:
- **Email:** admin@pdv.com
- **Senha:** admin123

---

##Funcionalidades

### 🖥️ PDV (Ponto de Venda)
- Busca por nome, código de barras ou departamento
- Leitura de código de barras automática
- Filtro por departamento
- Carrinho com quantidade ajustável
- Desconto por venda
- Formas de pagamento: Dinheiro, Crédito, Débito, PIX
- Cálculo de troco automático
- Indicador de caixa aberto/fechado em tempo real

### Produtos
- Cadastro completo com código de barras obrigatório
- Organização por departamento e categoria
- Controle de estoque com alerta de estoque mínimo
- Suporte a múltiplas unidades (UN, KG, LT, MT, CX, PC)
- Edição e desativação de produtos

### Caixa
- Abertura e fechamento de caixa com saldo
- Registro de vendas e descontos
- Histórico de operações

### Vendas
- Dashboard com estatísticas do dia
- Histórico completo de transações
- Cancelamento de vendas com reversão de estoque

###  Configurações
- Tema claro/escuro
- 8 cores de destaque + cor personalizada
- Gerenciamento de usuários (admin, gerente, operador)

---

##  Estrutura

```
pdv/
├── backend/
│   ├── config/
│   │   └── database.js       # Conexão MongoDB
│   ├── middleware/
│   │   └── auth.js           # JWT auth middleware
│   ├── models/
│   │   ├── User.js           # Usuários
│   │   ├── Produto.js        # Produtos com código de barras
│   │   ├── Caixa.js          # Controle de caixa
│   │   └── Venda.js          # Registro de vendas
│   ├── routes/
│   │   ├── auth.js           # Login, registro, tema
│   │   ├── produtos.js       # CRUD de produtos
│   │   ├── caixa.js          # Abertura/fechamento
│   │   └── vendas.js         # Vendas e relatórios
│   ├── seed.js               # Script de dados iniciais
│   └── server.js             # Entry point Express
├── frontend/
│   ├── css/style.css         # Estilos com variáveis CSS
│   ├── js/
│   │   ├── api.js            # Serviço de API
│   │   ├── app.js            # Navegação, auth, tema
│   │   ├── pdv.js            # Lógica do PDV/carrinho
│   │   ├── produtos.js       # Gestão de produtos
│   │   └── caixa.js          # Caixa e vendas
│   └── index.html            # SPA principal
├── .env.example
└── package.json
```

---

##  Variáveis de Ambiente

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/pdv_sistema
JWT_SECRET=sua_chave_secreta
JWT_EXPIRES_IN=8h
```

---

##  API Endpoints

| Método | Rota | Descrição |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Usuário atual |
| POST | /api/auth/register | Criar usuário |
| GET | /api/produtos/buscar?q=... | Busca PDV |
| GET | /api/produtos/barcode/:cod | Por código de barras |
| POST | /api/produtos | Criar produto |
| PUT | /api/produtos/:id | Atualizar produto |
| GET | /api/caixa/status | Status do caixa |
| POST | /api/caixa/abrir | Abrir caixa |
| POST | /api/caixa/fechar/:id | Fechar caixa |
| POST | /api/vendas | Realizar venda |
| POST | /api/vendas/:id/cancelar | Cancelar venda |
| GET | /api/vendas/stats/hoje | Estatísticas do dia |
#
