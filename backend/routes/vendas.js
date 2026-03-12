const express = require('express');
const router = express.Router();
const Venda = require('../models/Venda');
const Caixa = require('../models/Caixa');
const Produto = require('../models/Produto');
const { auth } = require('../middleware/auth');

// Realizar venda
router.post('/', auth, async (req, res) => {
  try {
    const { itens, pagamentos, desconto = 0 } = req.body;

    const caixa = await Caixa.findOne({ status: 'aberto' });
    if (!caixa) return res.status(400).json({ error: 'Nenhum caixa aberto. Abra o caixa antes de vender.' });

    // Validar e calcular itens
    let subtotal = 0;
    const itensProcessados = [];

    for (const item of itens) {
      const produto = await Produto.findById(item.produto);
      if (!produto || !produto.ativo) return res.status(400).json({ error: `Produto não encontrado: ${item.nome}` });

      const subtotalItem = (item.preco || produto.preco) * item.quantidade - (item.desconto || 0);
      subtotal += subtotalItem;

      itensProcessados.push({
        produto: produto._id,
        nome: produto.nome,
        codigoBarras: produto.codigoBarras,
        quantidade: item.quantidade,
        precoUnitario: item.preco || produto.preco,
        desconto: item.desconto || 0,
        subtotal: subtotalItem,
      });

      // Atualizar estoque
      await Produto.findByIdAndUpdate(produto._id, { $inc: { estoque: -item.quantidade } });
    }

    const total = subtotal - desconto;

    const venda = await Venda.create({
      caixa: caixa._id,
      operador: req.user._id,
      nomeOperador: req.user.nome,
      itens: itensProcessados,
      subtotal,
      desconto,
      total,
      pagamentos,
    });

    // Atualizar totais do caixa
    await Caixa.findByIdAndUpdate(caixa._id, {
      $inc: { totalVendas: total, totalDescontos: desconto, quantidadeVendas: 1 }
    });

    res.status(201).json({ venda, message: 'Venda realizada com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cancelar venda
router.post('/:id/cancelar', auth, async (req, res) => {
  try {
    const venda = await Venda.findById(req.params.id);
    if (!venda || venda.status === 'cancelada') return res.status(400).json({ error: 'Venda não encontrada ou já cancelada' });

    venda.status = 'cancelada';
    venda.motivoCancelamento = req.body.motivo || 'Cancelado pelo operador';
    await venda.save();

    // Reverter estoque
    for (const item of venda.itens) {
      await Produto.findByIdAndUpdate(item.produto, { $inc: { estoque: item.quantidade } });
    }

    // Atualizar caixa
    await Caixa.findByIdAndUpdate(venda.caixa, {
      $inc: { totalVendas: -venda.total, totalCancelamentos: venda.total, quantidadeVendas: -1 }
    });

    res.json({ venda, message: 'Venda cancelada com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Listar vendas
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, caixa, status } = req.query;
    let query = {};
    if (caixa) query.caixa = caixa;
    if (status) query.status = status;

    const total = await Venda.countDocuments(query);
    const vendas = await Venda.find(query)
      .sort({ dataVenda: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ vendas, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Dashboard stats
router.get('/stats/hoje', auth, async (req, res) => {
  try {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const stats = await Venda.aggregate([
      { $match: { dataVenda: { $gte: hoje }, status: 'concluida' } },
      {
        $group: {
          _id: null,
          totalVendido: { $sum: '$total' },
          quantidadeVendas: { $sum: 1 },
          ticketMedio: { $avg: '$total' },
        }
      }
    ]);

    res.json({ stats: stats[0] || { totalVendido: 0, quantidadeVendas: 0, ticketMedio: 0 } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
