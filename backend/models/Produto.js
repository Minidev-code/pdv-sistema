const mongoose = require('mongoose');

const ProdutoSchema = new mongoose.Schema({
  nome: { type: String, required: true, trim: true, index: true },
  codigoBarras: { type: String, required: true, unique: true, trim: true, index: true },
  codigoInterno: { type: String, trim: true, unique: true, sparse: true },
  departamento: { type: String, required: true, trim: true, index: true },
  categoria: { type: String, trim: true },
  descricao: { type: String, trim: true },
  preco: { type: Number, required: true, min: 0 },
  precoCompra: { type: Number, min: 0 },
  estoque: { type: Number, default: 0, min: 0 },
  estoqueMinimo: { type: Number, default: 5 },
  unidade: { type: String, enum: ['UN', 'KG', 'LT', 'MT', 'CX', 'PC'], default: 'UN' },
  ativo: { type: Boolean, default: true },
  imagem: { type: String },
  tags: [{ type: String }],
}, { timestamps: true });

ProdutoSchema.index({ nome: 'text', codigoBarras: 'text', departamento: 'text' });

module.exports = mongoose.model('Produto', ProdutoSchema);
