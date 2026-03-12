const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token não fornecido' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_pdv_2024');
    const user = await User.findById(decoded.id).select('-senha');
    if (!user || !user.ativo) return res.status(401).json({ error: 'Usuário inativo ou não encontrado' });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};

exports.admin = (req, res, next) => {
  if (req.user.perfil !== 'admin' && req.user.perfil !== 'gerente') {
    return res.status(403).json({ error: 'Acesso restrito a administradores' });
  }
  next();
};
