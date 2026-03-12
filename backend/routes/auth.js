const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET || 'secret_pdv_2024', {
  expiresIn: process.env.JWT_EXPIRES_IN || '8h'
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    if (!email || !senha) return res.status(400).json({ error: 'Email e senha são obrigatórios' });

    const user = await User.findOne({ email, ativo: true });
    if (!user) return res.status(401).json({ error: 'Credenciais inválidas' });

    const senhaOk = await user.verificarSenha(senha);
    if (!senhaOk) return res.status(401).json({ error: 'Credenciais inválidas' });

    user.ultimoAcesso = new Date();
    await user.save();

    res.json({ token: generateToken(user._id), user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  res.json({ user: req.user });
});

// Update theme preference
router.patch('/tema', auth, async (req, res) => {
  try {
    const { cor, modo } = req.body;
    const user = await User.findById(req.user._id);
    if (cor) user.temaPreferido.cor = cor;
    if (modo) user.temaPreferido.modo = modo;
    await user.save();
    res.json({ temaPreferido: user.temaPreferido });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Register new user (admin only)
router.post('/register', auth, async (req, res) => {
  try {
    const { nome, email, senha, perfil } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: 'Email já cadastrado' });

    const user = await User.create({ nome, email, senha, perfil });
    res.status(201).json({ user, message: 'Usuário criado com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List users
router.get('/usuarios', auth, async (req, res) => {
  try {
    const users = await User.find().select('-senha').sort({ nome: 1 });
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
