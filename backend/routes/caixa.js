const express = require('express');
const router = express.Router();
const Caixa = require('../models/Caixa');
const { auth } = require('../middleware/auth');

// Verificar se há caixa aberto
router.get('/status', auth, async (req, res) => {
  try {
    const caixa = await Caixa.findOne({ status: 'aberto' }).sort({ dataAbertura: -1 });
    res.json({ caixaAberto: !!caixa, caixa });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Abrir caixa
router.post('/abrir', auth, async (req, res) => {
  try {
    const aberto = await Caixa.findOne({ status: 'aberto' });
    if (aberto) return res.status(400).json({ error: 'Já existe um caixa aberto', caixa: aberto });

    const caixa = await Caixa.create({
      operador: req.user._id,
      nomeOperador: req.user.nome,
      saldoAbertura: req.body.saldoAbertura || 0,
    });
    res.status(201).json({ caixa, message: 'Caixa aberto com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fechar caixa
router.post('/fechar/:id', auth, async (req, res) => {
  try {
    const caixa = await Caixa.findById(req.params.id);
    if (!caixa || caixa.status !== 'aberto') return res.status(400).json({ error: 'Caixa não encontrado ou já fechado' });

    caixa.status = 'fechado';
    caixa.saldoFechamento = req.body.saldoFechamento || 0;
    caixa.dataFechamento = new Date();
    caixa.observacoes = req.body.observacoes;
    await caixa.save();

    res.json({ caixa, message: 'Caixa fechado com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Histórico de caixas
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const total = await Caixa.countDocuments();
    const caixas = await Caixa.find()
      .sort({ dataAbertura: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('operador', 'nome email');
    res.json({ caixas, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
