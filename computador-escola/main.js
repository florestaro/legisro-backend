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

// Chaves que a tela pode usar: "progresso:<id do usuário>" e "arquivos:<id do usuário>".
// Cada aluno só lê e grava os próprios dados; o instrutor pode ler e gravar os de todos.
const TIPOS_DE_DADOS = ['progresso', 'arquivos'];

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
