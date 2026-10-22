// Modo sala de aula em rede (cabo): o computador do instrutor guarda os dados de todos e atende os computadores
// dos alunos pela rede. Três modos:
//   local    — este computador sozinho (os dados ficam nele mesmo)
//   servidor — computador do instrutor: guarda os dados e atende a sala
//   aluno    — computador de aluno: entra e salva tudo no computador do instrutor
// Proteção: um código de 6 números (só quem tem o código fala com o servidor), uma sessão para cada computador
// (cada aluno só mexe nos próprios dados, como no modo sozinho) e limite de tentativas de senha.
const http = require('http');
const dgram = require('dgram');
const os = require('os');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORTA = 47123;        // pedidos dos alunos (HTTP)
const PORTA_BUSCA = 47124;  // "tem algum computador de instrutor aí?" (UDP)
const LIMITE = 25 * 1024 * 1024; // e-mail com anexos de imagem pode ser grande
const TEMPO_SESSAO = 12 * 60 * 60 * 1000;

class ErroDoServidor extends Error {}

function criarSala({ pastaDados, canais }) {
  const arquivo = path.join(pastaDados, 'sala.json');
  let config = lerConfig();
  let estado = { conectado: null, erro: '' };
  let servidorHttp = null, socketBusca = null, limpeza = null;
  let tokenCliente = null;
  const sessoes = new Map();   // token -> { usuario, pc, ip, usadoEm }
  const tentativas = new Map(); // ip -> horários das senhas erradas

  function lerConfig() {
    try { return { modo: 'local', ...JSON.parse(fs.readFileSync(arquivo, 'utf8')) }; } catch { return { modo: 'local' }; }
  }
  function gravarConfig(novo) {
    fs.mkdirSync(pastaDados, { recursive: true });
    fs.writeFileSync(arquivo, JSON.stringify(novo, null, 2), 'utf8');
    config = novo;
  }
  const interfaces = () => Object.values(os.networkInterfaces()).flat().filter((i) => i && i.family === 'IPv4' && !i.internal);
  const ips = () => interfaces().map((i) => i.address);
  // Endereço de "todos da rede" de cada placa (ex.: 192.168.0.255).
  const broadcasts = () => interfaces().map((i) => {
    const a = i.address.split('.').map(Number), m = i.netmask.split('.').map(Number);
    return a.map((x, k) => (x & m[k]) | (~m[k] & 255)).join('.');
  });
  const normalizarEndereco = (texto) => {
    let t = String(texto || '').trim().replace(/^https?:\/\//i, '').replace(/\/.*$/, '');
    if (!t) return '';
    if (!/:\d+$/.test(t)) t += ':' + PORTA;
    return 'http://' + t;
  };

  // ---------- Servidor (computador do instrutor) ----------
  function iniciarServidor() {
    pararServidor();
    servidorHttp = http.createServer((req, res) => {
      const responder = (codigo, corpo) => {
        if (res.writableEnded) return;
        res.writeHead(codigo, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(corpo));
      };
      if (req.method === 'GET' && req.url === '/ping') return responder(200, { app: 'computador-escola', nome: os.hostname() });
      if (req.method !== 'POST' || req.url !== '/api') return responder(404, { ok: false, erro: 'Não encontrado.' });
      const codigo = String(req.headers['x-sala'] || '');
      if (!config.codigo || codigo.length !== config.codigo.length || !crypto.timingSafeEqual(Buffer.from(codigo), Buffer.from(config.codigo))) {
        return responder(403, { ok: false, erro: 'Código da sala errado.', codigoErrado: true });
      }
      let tamanho = 0;
      const partes = [];
      req.on('data', (p) => {
        tamanho += p.length;
        if (tamanho > LIMITE) { responder(413, { ok: false, erro: 'O pedido ficou grande demais.' }); req.destroy(); } else partes.push(p);
      });
      req.on('end', async () => {
        if (res.writableEnded) return;
        let pedido;
        try { pedido = JSON.parse(Buffer.concat(partes).toString('utf8')); } catch { return responder(400, { ok: false, erro: 'Pedido inválido.' }); }
        const { canal, args = [], token, pc } = pedido || {};
        const tratador = Object.prototype.hasOwnProperty.call(canais, canal) ? canais[canal] : null;
        if (!tratador || !Array.isArray(args)) return responder(400, { ok: false, erro: 'Pedido desconhecido.' });
        const ip = req.socket.remoteAddress;
        let chave = typeof token === 'string' && sessoes.has(token) ? token : null;
        if (!chave) {
          chave = crypto.randomBytes(24).toString('hex');
          sessoes.set(chave, { usuario: null, pc: '', ip, usadoEm: Date.now() });
        }
        const s = sessoes.get(chave);
        s.usadoEm = Date.now();
        if (pc) s.pc = String(pc).slice(0, 60);
        if (canal === 'sessao:entrar') {
          const recentes = (tentativas.get(ip) || []).filter((t) => Date.now() - t < 60000);
          if (recentes.length >= 8) return responder(200, { ok: false, erro: 'Muitas tentativas de senha. Espere um minuto e tente de novo.', token: chave });
        }
        try {
          responder(200, { ok: true, valor: await tratador(s, ...args), token: chave });
        } catch (e) {
          if (canal === 'sessao:entrar') tentativas.set(ip, [...(tentativas.get(ip) || []).filter((t) => Date.now() - t < 60000), Date.now()]);
          responder(200, { ok: false, erro: e.message, token: chave });
        }
      });
    });
    servidorHttp.on('error', (e) => { estado = { conectado: false, erro: e.code === 'EADDRINUSE' ? 'A porta da sala já está sendo usada neste computador.' : e.message }; });
    servidorHttp.listen(config.porta || PORTA, '0.0.0.0', () => { estado = { conectado: true, erro: '' }; });
    // Responde quando um computador de aluno procura o instrutor na rede.
    socketBusca = dgram.createSocket({ type: 'udp4', reuseAddr: true });
    socketBusca.on('message', (msg, rinfo) => {
      if (String(msg) !== 'CE-PROCURA') return;
      socketBusca.send(JSON.stringify({ app: 'computador-escola', nome: os.hostname(), porta: config.porta || PORTA }), rinfo.port, rinfo.address);
    });
    socketBusca.on('error', () => {});
    socketBusca.bind(PORTA_BUSCA);
    limpeza = setInterval(() => {
      const agora = Date.now();
      for (const [t, s] of sessoes) if (agora - s.usadoEm > TEMPO_SESSAO) sessoes.delete(t);
    }, 10 * 60 * 1000);
  }
  function pararServidor() {
    if (servidorHttp) servidorHttp.close();
    if (socketBusca) { try { socketBusca.close(); } catch { /* já fechado */ } }
    clearInterval(limpeza);
    servidorHttp = null; socketBusca = null;
  }

  // ---------- Cliente (computador de aluno) ----------
  async function pedir(endereco, codigo, canal, args, token) {
    const resposta = await fetch(endereco + '/api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-sala': codigo || '' },
      body: JSON.stringify({ canal, args, token, pc: os.hostname() }),
      signal: AbortSignal.timeout(10000),
    });
    return resposta.json();
  }
  async function remoto(canal, args) {
    let corpo;
    try {
      corpo = await pedir(config.servidor, config.codigo, canal, args, tokenCliente);
    } catch {
      estado = { conectado: false, erro: 'Sem conexão com o computador do instrutor.' };
      throw new Error(`Sem conexão com o computador do instrutor (${config.servidor.replace('http://', '')}). Confira se ele está ligado, com o Computador Escola aberto, e se o cabo de rede está encaixado.`);
    }
    estado = { conectado: true, erro: '' };
    if (corpo.token) tokenCliente = corpo.token;
    if (!corpo.ok) throw new ErroDoServidor(corpo.erro);
    return corpo.valor;
  }

  // Procura o computador do instrutor na rede (resposta em até 1,5 s).
  function procurar(tempo = 1500) {
    return new Promise((resolver) => {
      const achados = new Map();
      const sock = dgram.createSocket('udp4');
      sock.on('message', (msg, rinfo) => {
        try {
          const d = JSON.parse(String(msg));
          if (d.app === 'computador-escola') achados.set(`${rinfo.address}:${d.porta}`, { nome: d.nome, endereco: rinfo.address, porta: d.porta });
        } catch { /* outra coisa na rede */ }
      });
      sock.on('error', () => {});
      sock.bind(0, () => {
        try { sock.setBroadcast(true); } catch { /* sem permissão de broadcast */ }
        new Set(['255.255.255.255', '127.0.0.1', ...broadcasts()]).forEach((d) => sock.send('CE-PROCURA', PORTA_BUSCA, d, () => {}));
      });
      setTimeout(() => { try { sock.close(); } catch { /* já fechado */ } resolver([...achados.values()]); }, tempo);
    });
  }

  return {
    ehCliente: () => config.modo === 'aluno' && !!config.servidor,
    remoto,
    procurar,
    iniciar() { if (config.modo === 'servidor') iniciarServidor(); },
    parar: pararServidor,
    // O código da sala só aparece no computador do instrutor.
    ler: () => ({ modo: config.modo, servidor: (config.servidor || '').replace('http://', ''), codigo: config.modo === 'servidor' ? config.codigo : '', protegido: config.modo !== 'local' && !!config.codigo, porta: config.porta || PORTA, nomePc: os.hostname(), ips: ips() }),
    status: () => ({ modo: config.modo, ...estado, servidor: (config.servidor || '').replace('http://', ''), computadores: config.modo === 'servidor' ? new Set([...sessoes.values()].filter((s) => s.usuario && Date.now() - s.usadoEm < 60000).map((s) => s.ip)).size : undefined }),
    // Trocar o modo. Depois de configurado, só muda quem souber o código da sala.
    async salvar({ modo, servidor, codigo, codigoAtual }) {
      if (!['local', 'servidor', 'aluno'].includes(modo)) throw new Error('Modo desconhecido.');
      if (config.modo !== 'local' && config.codigo && String(codigoAtual || '') !== config.codigo) throw new Error('Para mudar a rede da sala, digite o código atual da sala.');
      if (modo === 'local') { pararServidor(); gravarConfig({ modo: 'local' }); tokenCliente = null; estado = { conectado: null, erro: '' }; return this.ler(); }
      if (modo === 'servidor') {
        const novo = { modo: 'servidor', porta: config.porta || PORTA, codigo: config.modo === 'servidor' && config.codigo ? config.codigo : String(crypto.randomInt(100000, 1000000)) };
        gravarConfig(novo);
        iniciarServidor();
        return this.ler();
      }
      const endereco = normalizarEndereco(servidor);
      if (!endereco) throw new Error('Escreva o endereço do computador do instrutor (ex.: 192.168.0.10).');
      if (!/^\d{6}$/.test(String(codigo || ''))) throw new Error('O código da sala tem 6 números. Ele aparece no computador do instrutor.');
      let teste;
      try { teste = await pedir(endereco, String(codigo), 'usuarios:existe-instrutor', [], null); } catch {
        throw new Error(`Não consegui falar com ${endereco.replace('http://', '')}. Confira o endereço e se o computador do instrutor está com o Computador Escola aberto.`);
      }
      if (teste.codigoErrado) throw new Error('O código da sala está errado. Confira no computador do instrutor.');
      pararServidor();
      gravarConfig({ modo: 'aluno', servidor: endereco, codigo: String(codigo) });
      tokenCliente = teste.token || null;
      estado = { conectado: true, erro: '' };
      return this.ler();
    },
  };
}

module.exports = { criarSala, ErroDoServidor, PORTA };
