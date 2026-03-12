const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  nome: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  senha: { type: String, required: true, minlength: 6 },
  perfil: { type: String, enum: ['admin', 'operador', 'gerente'], default: 'operador' },
  ativo: { type: Boolean, default: true },
  temaPreferido: {
    cor: { type: String, default: '#00d4aa' },
    modo: { type: String, enum: ['dark', 'light'], default: 'dark' }
  },
  ultimoAcesso: { type: Date },
}, { timestamps: true });

UserSchema.pre('save', async function (next) {
  if (!this.isModified('senha')) return next();
  this.senha = await bcrypt.hash(this.senha, 12);
  next();
});

UserSchema.methods.verificarSenha = async function (senhaInformada) {
  return await bcrypt.compare(senhaInformada, this.senha);
};

UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.senha;
  return obj;
};

module.exports = mongoose.model('User', UserSchema);
