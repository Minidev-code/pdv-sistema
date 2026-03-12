const mongoose = require('mongoose');

const CaixaSchema = new mongoose.Schema({
  operador: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  nomeOperador: { type: String, required: true },
  status: { type: String, enum: ['aberto', 'fechado', 'suspenso'], default: 'aberto' },
  saldoAbertura: { type: Number, required: true, default: 0 },
  saldoFechamento: { type: Number },
  totalVendas: { type: Number, default: 0 },
  totalDescontos: { type: Number, default: 0 },
  totalCancelamentos: { type: Number, default: 0 },
  quantidadeVendas: { type: Number, default: 0 },
  dataAbertura: { type: Date, default: Date.now },
  dataFechamento: { type: Date },
  observacoes: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Caixa', CaixaSchema);
