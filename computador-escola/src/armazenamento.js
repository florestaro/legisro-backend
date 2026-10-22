// Armazenamento local em arquivos JSON.
// Cada "chave" vira um arquivo dentro da pasta de dados. No futuro (modo sala de aula),
// este módulo é o único ponto a trocar para gravar no computador do instrutor pela rede.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

let pastaDados = null;

function iniciar(pasta) {
  pastaDados = pasta;
  fs.mkdirSync(pastaDados, { recursive: true });
}

function caminho(chave) {
  const seguro = String(chave).replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(pastaDados, seguro + '.json');
}

function ler(chave, padrao = null) {
  try {
    return JSON.parse(fs.readFileSync(caminho(chave), 'utf8'));
  } catch {
    return padrao;
  }
}

function salvar(chave, valor) {
  const destino = caminho(chave);
  const temporario = destino + '.tmp';
  fs.writeFileSync(temporario, JSON.stringify(valor, null, 2), 'utf8');
  fs.renameSync(temporario, destino);
  return true;
}

// ---------- Usuários ----------

function gerarHash(segredo, sal = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(String(segredo), sal, 32).toString('hex');
  return { sal, hash };
}

function confere(segredo, usuario) {
  const { hash } = gerarHash(segredo, usuario.sal);
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(usuario.hash, 'hex'));
}

function publico(u) {
  return { id: u.id, nome: u.nome, papel: u.papel, turma: u.turma || '', avatar: u.avatar || '🙂', crianca: !!u.crianca };
}

function listarUsuarios() {
  return ler('usuarios', []).map(publico);
}

function existeInstrutor() {
  return ler('usuarios', []).some((u) => u.papel === 'instrutor');
}

function criarUsuario({ nome, segredo, papel = 'aluno', turma = '', avatar = '🙂', crianca = false }) {
  nome = String(nome || '').trim();
  if (!nome) throw new Error('Informe o nome.');
  if (!segredo || String(segredo).length < 4) throw new Error('A senha precisa ter pelo menos 4 caracteres.');
  const usuarios = ler('usuarios', []);
  if (usuarios.some((u) => u.nome.toLowerCase() === nome.toLowerCase())) {
    throw new Error('Já existe alguém com esse nome.');
  }
  const novo = { id: crypto.randomUUID(), nome, papel, turma, avatar, crianca: !!crianca, ...gerarHash(segredo), criadoEm: Date.now() };
  usuarios.push(novo);
  salvar('usuarios', usuarios);
  return publico(novo);
}

function entrar(id, segredo) {
  const usuario = ler('usuarios', []).find((u) => u.id === id);
  if (!usuario || !confere(segredo, usuario)) throw new Error('Senha incorreta. Tente de novo.');
  return publico(usuario);
}

function trocarSenha(id, segredo) {
  if (!segredo || String(segredo).length < 4) throw new Error('A senha precisa ter pelo menos 4 caracteres.');
  const usuarios = ler('usuarios', []);
  const usuario = usuarios.find((u) => u.id === id);
  if (!usuario) throw new Error('Usuário não encontrado.');
  Object.assign(usuario, gerarHash(segredo));
  salvar('usuarios', usuarios);
  return true;
}

function removerUsuario(id) {
  salvar('usuarios', ler('usuarios', []).filter((u) => u.id !== id));
  return true;
}

module.exports = {
  iniciar, ler, salvar,
  listarUsuarios, existeInstrutor, criarUsuario, entrar, trocarSenha, removerUsuario,
};
