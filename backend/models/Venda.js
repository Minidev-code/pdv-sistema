const mongoose = require('mongoose');

const ItemVendaSchema = new mongoose.Schema({
  produto: { type: mongoose.Schema.Types.ObjectId, ref: 'Produto', required: true },
  nome: { type: String, required: true },
  codigoBarras: { type: String, required: true },
  quantidade: { type: Number, required: true, min: 0.001 },
  precoUnitario: { type: Number, required: true },
  desconto: { type: Number, default: 0 },
  subtotal: { type: Number, required: true },
});

const PagamentoSchema = new mongoose.Schema({
  forma: { type: String, enum: ['dinheiro', 'credito', 'debito', 'pix', 'vale'], required: true },
  valor: { type: Number, required: true },
  troco: { type: Number, default: 0 },
});

const VendaSchema = new mongoose.Schema({
  numero: { type: Number, unique: true },
  caixa: { type: mongoose.Schema.Types.ObjectId, ref: 'Caixa', required: true },
  operador: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  nomeOperador: { type: String, required: true },
  itens: [ItemVendaSchema],
  subtotal: { type: Number, required: true },
  desconto: { type: Number, default: 0 },
  total: { type: Number, required: true },
  pagamentos: [PagamentoSchema],
  status: { type: String, enum: ['concluida', 'cancelada', 'pendente'], default: 'concluida' },
  motivoCancelamento: { type: String },
  dataVenda: { type: Date, default: Date.now },
}, { timestamps: true });

VendaSchema.pre('save', async function (next) {
  if (this.isNew) {
    const lastVenda = await this.constructor.findOne().sort({ numero: -1 });
    this.numero = lastVenda ? lastVenda.numero + 1 : 1;
  }
  next();
});

module.exports = mongoose.model('Venda', VendaSchema);
