// Processo principal do Electron: abre a janela em tela cheia, guarda os dados e roda a IA local.
const { app, BrowserWindow, ipcMain, Menu, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const os = require('os');
const dados = require('./src/armazenamento');
const ia = require('./src/ia');
const { criarCanais } = require('./src/canais');
const { criarSala } = require('./src/sala');

// Versão portátil (pen drive): guarda os dados ao lado do .exe. Instalada: na pasta do sistema.
const pastaPortatil = process.env.PORTABLE_EXECUTABLE_DIR;
const pastaBase = pastaPortatil || (app.isPackaged ? path.dirname(process.execPath) : __dirname);
const pastaDados = pastaPortatil ? path.join(pastaPortatil, 'dados') : path.join(app.getPath('userData'), 'dados');

let janela = null;
const canais = criarCanais(dados);
const sessaoLocal = { usuario: null, pc: os.hostname() };
const sala = criarSala({ pastaDados, canais });

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

// Envolve os tratadores para devolver { ok, valor } ou { ok:false, erro } para a tela.
function tratar(canal, funcao) {
  ipcMain.handle(canal, async (_evento, ...args) => {
    try {
      return { ok: true, valor: await funcao(...args) };
    } catch (erro) {
      return { ok: false, erro: erro.message, semSessao: !!erro.semSessao };
    }
  });
}

function registrarCanais() {
  // Os pedidos de dados vão para este computador mesmo ou, no computador de aluno, para o computador do instrutor.
  for (const canal of Object.keys(canais)) {
    tratar(canal, async (...args) => {
      const valor = sala.ehCliente() ? await sala.remoto(canal, args) : await canais[canal](sessaoLocal, ...args);
      // A sessão local acompanha quem entrou (a IA usa o nome; o modo sozinho usa para conferir os dados).
      if (canal === 'sessao:entrar' || canal === 'usuarios:primeiro-instrutor') { sessaoLocal.usuario = valor; ia.novaConversa(); }
      if (canal === 'sessao:sair') { sessaoLocal.usuario = null; ia.novaConversa(); }
      return valor;
    });
  }
  tratar('sala:ler', () => sala.ler());
  tratar('sala:status', () => sala.status());
  tratar('sala:procurar', () => sala.procurar());
  tratar('sala:salvar', async (opcoes) => {
    const r = await sala.salvar(opcoes || {});
    sessaoLocal.usuario = null;
    return r;
  });

  tratar('ia:status', () => ia.status());
  tratar('ia:perguntar', async (idPergunta, pergunta, situacao) => {
    const enviar = (trecho) => {
      if (janela && !janela.isDestroyed()) janela.webContents.send('ia:trecho', idPergunta, trecho);
    };
    return ia.perguntar(String(pergunta).slice(0, 500), { ...situacao, nome: sessaoLocal.usuario && sessaoLocal.usuario.nome }, enviar);
  });
  tratar('app:sair', () => app.quit());
  // Certificados e relatórios: salvar em PDF ou planilha (CSV) num lugar que a pessoa escolhe (começa em Documentos).
  tratar('janela:pdf', async ({ nome, paisagem } = {}) => {
    const destino = await escolherOndeSalvar(nome || 'documento.pdf', 'Documento PDF', 'pdf');
    if (!destino) return null;
    const pdf = await janela.webContents.printToPDF({ landscape: !!paisagem, pageSize: 'A4', printBackground: true, preferCSSPageSize: true });
    fs.writeFileSync(destino, pdf);
    return destino;
  });
  tratar('arquivo:salvar-texto', async ({ nome, conteudo } = {}) => {
    const destino = await escolherOndeSalvar(nome || 'arquivo.csv', 'Planilha (CSV)', 'csv');
    if (!destino) return null;
    fs.writeFileSync(destino, String(conteudo || ''), 'utf8');
    return destino;
  });
  // "Colar" do menu do botão direito: cola o que está na área de transferência do Windows (igual ao Ctrl+V).
  tratar('janela:colar', () => { if (janela && !janela.isDestroyed()) janela.webContents.paste(); return true; });
  // Acessibilidade: aumenta tudo na tela (letras, botões e janelas), como o zoom do Windows.
  tratar('janela:zoom', (fator) => {
    const f = Math.min(1.6, Math.max(0.8, Number(fator) || 1));
    if (janela && !janela.isDestroyed()) janela.webContents.setZoomFactor(f);
    return f;
  });
}

async function escolherOndeSalvar(nome, rotulo, extensao) {
  const limpo = path.basename(String(nome)).replace(/[\\/:*?"<>|]/g, '-').slice(0, 120);
  // Nos testes automáticos não dá para clicar na janela de salvar: CE_PASTA_SALVAR diz onde guardar direto.
  if (process.env.CE_PASTA_SALVAR) return path.join(process.env.CE_PASTA_SALVAR, limpo);
  const r = await dialog.showSaveDialog(janela, { defaultPath: path.join(app.getPath('documents'), limpo), filters: [{ name: rotulo, extensions: [extensao] }] });
  return r.canceled || !r.filePath ? null : r.filePath;
}

app.whenReady().then(() => {
  dados.iniciar(pastaDados);
  registrarCanais();
  sala.iniciar();
  criarJanela();
  // A IA carrega em segundo plano para a tela abrir rápido (CE_SEM_IA desliga, como nos testes com 21 programas abertos).
  ia.iniciar(process.env.CE_SEM_IA ? [] : [path.join(pastaBase, 'modelos'), path.join(__dirname, 'modelos'), path.join(app.getPath('userData'), 'modelos')]);
});

app.on('window-all-closed', () => app.quit());
