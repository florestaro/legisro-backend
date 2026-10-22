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

// Se o arquivo estiver estragado (problema no disco, por exemplo), usa a cópia de reserva:
// assim um cadastro novo nunca grava por cima da lista inteira de alunos.
function ler(chave, padrao = null) {
  const arquivo = caminho(chave);
  for (const c of [arquivo, arquivo + '.bak']) {
    try {
      return JSON.parse(fs.readFileSync(c, 'utf8'));
    } catch { /* tenta a cópia */ }
  }
  return padrao;
}

function salvar(chave, valor) {
  const destino = caminho(chave);
  const temporario = destino + '.tmp';
  const fd = fs.openSync(temporario, 'w');
  try {
    fs.writeFileSync(fd, JSON.stringify(valor, null, 2), 'utf8');
    fs.fsyncSync(fd); // garante que está no disco antes de trocar
  } finally {
    fs.closeSync(fd);
  }
  fs.copyFileSync(temporario, destino + '.bak'); // cópia de reserva com o mesmo conteúdo
  fs.renameSync(temporario, destino);
  return true;
}

// ---------- Usuários ----------

function gerarHash(segredo, sal = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(String(segredo), sal, 32).toString('hex');
  return { sal, hash };
}

// Conferir a senha em segundo plano: com a sala inteira entrando ao mesmo tempo, o computador do instrutor não trava.
function confere(segredo, usuario) {
  return new Promise((resolver, falhar) => crypto.scrypt(String(segredo), usuario.sal, 32, (erro, hash) => {
    if (erro) falhar(erro); else resolver(crypto.timingSafeEqual(hash, Buffer.from(usuario.hash, 'hex')));
  }));
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

async function entrar(id, segredo) {
  const usuario = ler('usuarios', []).find((u) => u.id === id);
  if (!usuario || !(await confere(segredo, usuario))) throw new Error('Senha incorreta. Tente de novo.');
  // O instrutor pode ter removido a conta (ou trocado a senha) enquanto a senha era conferida.
  const agora = ler('usuarios', []).find((u) => u.id === id);
  if (!agora) throw new Error('Usuário não encontrado.');
  if (agora.hash !== usuario.hash) throw new Error('Senha incorreta. Tente de novo.');
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

// Um pedaço do código da senha: muda quando a senha é trocada (as sessões abertas com a senha antiga acabam).
function versaoSenha(id) {
  const usuario = ler('usuarios', []).find((u) => u.id === id);
  return usuario ? usuario.hash.slice(0, 16) : null;
}

function removerUsuario(id) {
  salvar('usuarios', ler('usuarios', []).filter((u) => u.id !== id));
  return true;
}

module.exports = {
  iniciar, ler, salvar,
  listarUsuarios, existeInstrutor, criarUsuario, entrar, trocarSenha, removerUsuario, versaoSenha,
};
