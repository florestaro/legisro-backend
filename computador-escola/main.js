// Processo principal do Electron: abre a janela em tela cheia, guarda os dados e roda a IA local.
const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const dados = require('./src/armazenamento');
const ia = require('./src/ia');

// Versão portátil (pen drive): guarda os dados ao lado do .exe. Instalada: na pasta do sistema.
const pastaPortatil = process.env.PORTABLE_EXECUTABLE_DIR;
const pastaBase = pastaPortatil || (app.isPackaged ? path.dirname(process.execPath) : __dirname);
const pastaDados = pastaPortatil ? path.join(pastaPortatil, 'dados') : path.join(app.getPath('userData'), 'dados');

let janela = null;
let usuarioAtual = null;

function criarJanela() {
  Menu.setApplicationMenu(null);
  janela = new BrowserWindow({
    width: 1366,
    height: 768,
    fullscreen: !process.argv.includes('--janela'),
    backgroundColor: '#0b3d6e',
    title: 'Computador Escola',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
    },
  });
  janela.loadFile(path.join(__dirname, 'app', 'index.html'));
  // O programa é offline: nenhum link abre fora dele.
  janela.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  janela.webContents.on('will-navigate', (evento) => evento.preventDefault());
}

function exigirInstrutor() {
  if (!usuarioAtual || usuarioAtual.papel !== 'instrutor') throw new Error('Apenas o instrutor pode fazer isso.');
}

// Chaves que a tela pode usar: "progresso:<id>", "arquivos:<id>" e "email:<id>" (a caixa de e-mail do aluno).
// Cada aluno só lê e grava os próprios dados; o instrutor pode ler e gravar os de todos.
const TIPOS_DE_DADOS = ['progresso', 'arquivos', 'email'];

function conferirChave(chave) {
  const [tipo, dono] = String(chave).split(':');
  if (!usuarioAtual) throw new Error('Ninguém entrou no sistema.');
  if (!TIPOS_DE_DADOS.includes(tipo) || !dono) throw new Error('Tipo de dado desconhecido.');
  if (dono !== usuarioAtual.id && usuarioAtual.papel !== 'instrutor') throw new Error('Acesso negado.');
  return `${tipo}-${dono}`;
}

// Envolve os tratadores para devolver { ok, valor } ou { ok:false, erro } para a tela.
function tratar(canal, funcao) {
  ipcMain.handle(canal, async (_evento, ...args) => {
    try {
      return { ok: true, valor: await funcao(...args) };
    } catch (erro) {
      return { ok: false, erro: erro.message };
    }
  });
}

function registrarCanais() {
  tratar('usuarios:listar', () => dados.listarUsuarios());
  tratar('usuarios:existe-instrutor', () => dados.existeInstrutor());
  tratar('usuarios:primeiro-instrutor', (info) => {
    if (dados.existeInstrutor()) throw new Error('O instrutor já foi cadastrado.');
    usuarioAtual = dados.criarUsuario({ ...info, papel: 'instrutor', avatar: '🧑‍🏫' });
    return usuarioAtual;
  });
  tratar('usuarios:criar', (info) => {
    exigirInstrutor();
    return dados.criarUsuario({ ...info, papel: info.papel === 'instrutor' ? 'instrutor' : 'aluno' });
  });
  tratar('usuarios:trocar-senha', (id, segredo) => {
    exigirInstrutor();
    return dados.trocarSenha(id, segredo);
  });
  tratar('usuarios:remover', (id) => {
    exigirInstrutor();
    if (id === usuarioAtual.id) throw new Error('Você não pode remover a si mesmo.');
    return dados.removerUsuario(id);
  });
  tratar('sessao:entrar', (id, segredo) => {
    usuarioAtual = dados.entrar(id, segredo);
    ia.novaConversa();
    return usuarioAtual;
  });
  tratar('sessao:sair', () => {
    usuarioAtual = null;
    ia.novaConversa();
    return true;
  });
  tratar('dados:ler', (chave, padrao) => dados.ler(conferirChave(chave), padrao));
  tratar('dados:salvar', (chave, valor) => dados.salvar(conferirChave(chave), valor));

  // E-mail entre alunos do mesmo computador: o remetente só escreve na caixa do destinatário por aqui,
  // e só pode acrescentar uma mensagem na Caixa de entrada (nunca ler ou apagar as mensagens dele).
  const caixas = () => dados.listarUsuarios().map((u) => ({ usuario: u, caixa: dados.ler(`email-${u.id}`, null) }));
  tratar('email:endereco-livre', (endereco) => {
    if (!usuarioAtual) throw new Error('Ninguém entrou no sistema.');
    const alvo = String(endereco).toLowerCase();
    return !caixas().some(({ usuario, caixa }) => usuario.id !== usuarioAtual.id && caixa && caixa.conta && caixa.conta.endereco === alvo);
  });
  tratar('email:contatos', () => {
    if (!usuarioAtual) throw new Error('Ninguém entrou no sistema.');
    return caixas().filter(({ usuario, caixa }) => usuario.id !== usuarioAtual.id && caixa && caixa.conta)
      .map(({ usuario, caixa }) => ({ nome: caixa.conta.nome || usuario.nome, endereco: caixa.conta.endereco }));
  });
  tratar('email:entregar', (mensagem) => {
    if (!usuarioAtual) throw new Error('Ninguém entrou no sistema.');
    // O remetente é sempre o dono da sessão: ninguém consegue mandar e-mail fingindo ser outra pessoa.
    const minha = dados.ler(`email-${usuarioAtual.id}`, null);
    if (!minha || !minha.conta) throw new Error('Crie a sua conta de e-mail primeiro.');
    const para = String(mensagem.para || '').toLowerCase();
    const destino = caixas().find(({ caixa }) => caixa && caixa.conta && caixa.conta.endereco === para);
    if (!destino) return { entregue: false };
    const recebida = {
      id: `${Date.now()}${Math.random().toString(16).slice(2, 8)}`, pasta: 'entrada', lida: false, em: Date.now(),
      de: minha.conta.endereco, deNome: minha.conta.nome, para,
      assunto: String(mensagem.assunto || '').slice(0, 200), texto: String(mensagem.texto || '').slice(0, 20000),
      anexos: Array.isArray(mensagem.anexos) ? mensagem.anexos.slice(0, 5) : [],
    };
    destino.caixa.mensagens = (destino.caixa.mensagens || []).concat(recebida);
    dados.salvar(`email-${destino.usuario.id}`, destino.caixa);
    return { entregue: true, nome: destino.caixa.conta.nome };
  });

  tratar('ia:status', () => ia.status());
  tratar('ia:perguntar', async (idPergunta, pergunta, situacao) => {
    const enviar = (trecho) => {
      if (janela && !janela.isDestroyed()) janela.webContents.send('ia:trecho', idPergunta, trecho);
    };
    return ia.perguntar(String(pergunta).slice(0, 500), { ...situacao, nome: usuarioAtual && usuarioAtual.nome }, enviar);
  });
  tratar('app:sair', () => app.quit());
}

app.whenReady().then(() => {
  dados.iniciar(pastaDados);
  registrarCanais();
  criarJanela();
  // A IA carrega em segundo plano para a tela abrir rápido.
  ia.iniciar([path.join(pastaBase, 'modelos'), path.join(__dirname, 'modelos'), path.join(app.getPath('userData'), 'modelos')]);
});

app.on('window-all-closed', () => app.quit());
