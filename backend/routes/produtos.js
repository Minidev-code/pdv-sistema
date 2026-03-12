const express = require('express');
const router = express.Router();
const Produto = require('../models/Produto');
const { auth } = require('../middleware/auth');

// Buscar produto (por nome, código de barras ou departamento)
router.get('/buscar', auth, async (req, res) => {
  try {
    const { q, departamento } = req.query;
    let query = { ativo: true };

    if (departamento) query.departamento = new RegExp(departamento, 'i');

    if (q) {
      const isBarcode = /^[0-9]+$/.test(q.trim());
      if (isBarcode) {
        query.codigoBarras = q.trim();
      } else {
        query.$or = [
          { nome: new RegExp(q, 'i') },
          { codigoInterno: new RegExp(q, 'i') },
          { tags: new RegExp(q, 'i') }
        ];
      }
    }

    const produtos = await Produto.find(query).limit(20).sort({ nome: 1 });
    res.json({ produtos });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Listar departamentos
router.get('/departamentos', auth, async (req, res) => {
  try {
    const departamentos = await Produto.distinct('departamento', { ativo: true });
    res.json({ departamentos: departamentos.sort() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Listar todos os produtos
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, departamento, ativo } = req.query;
    let query = {};
    if (departamento) query.departamento = new RegExp(departamento, 'i');
    if (ativo !== undefined) query.ativo = ativo === 'true';

    const total = await Produto.countDocuments(query);
    const produtos = await Produto.find(query)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ nome: 1 });

    res.json({ produtos, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Buscar por código de barras exato
router.get('/barcode/:codigo', auth, async (req, res) => {
  try {
    const produto = await Produto.findOne({ codigoBarras: req.params.codigo, ativo: true });
    if (!produto) return res.status(404).json({ error: 'Produto não encontrado' });
    res.json({ produto });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obter produto por ID
router.get('/:id', auth, async (req, res) => {
  try {
    const produto = await Produto.findById(req.params.id);
    if (!produto) return res.status(404).json({ error: 'Produto não encontrado' });
    res.json({ produto });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Criar produto
router.post('/', auth, async (req, res) => {
  try {
    const produto = await Produto.create(req.body);
    res.status(201).json({ produto, message: 'Produto cadastrado com sucesso' });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ error: 'Código de barras já cadastrado' });
    res.status(500).json({ error: err.message });
  }
});

// Atualizar produto
router.put('/:id', auth, async (req, res) => {
  try {
    const produto = await Produto.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!produto) return res.status(404).json({ error: 'Produto não encontrado' });
    res.json({ produto, message: 'Produto atualizado com sucesso' });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ error: 'Código de barras já cadastrado' });
    res.status(500).json({ error: err.message });
  }
});

// Excluir (desativar) produto
router.delete('/:id', auth, async (req, res) => {
  try {
    const produto = await Produto.findByIdAndUpdate(req.params.id, { ativo: false }, { new: true });
    if (!produto) return res.status(404).json({ error: 'Produto não encontrado' });
    res.json({ message: 'Produto desativado com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
