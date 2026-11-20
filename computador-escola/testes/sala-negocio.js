// Teste do jogo "Do Campo ao Balcão" na rede da sala, com o programa de verdade: 1 computador da instrutora
// (servidor) e 2 de aluno. Confere que:
//  • a instrutora abre o jogo (turma = uma empresa só) e os alunos recebem o convite;
//  • a instrutora escolhe quem faz o quê: a Ana fica com o campo (roça, pasto, veterinário, transporte, frigorífico)
//    e o Bruno com a cidade (compras, chapeiro, caixa, gerente); o resto, a IA faz;
//  • o tempo anda sozinho no computador da instrutora e todos veem o mesmo relógio;
//  • cada um só mexe no seu setor (a Ana não muda o preço da lanchonete) e só vê os números do seu setor;
//  • os dois conversam: o Bruno pede hambúrguer para a Ana (pedido com prazo) e ela responde; a conversa chega;
//  • o caixa atende a fila digitando o pedido; o evento (doença no rebanho) chega para quem cuida do pasto;
//  • o termômetro (nível) e a pausa da instrutora chegam em todos; no fim, o resultado aparece para todos e fica
//    guardado no computador da instrutora (nada nos computadores dos alunos).
//
//   npm run teste:negocio
//   Linux sem tela: xvfb-run -a npm run teste:negocio
//
// Precisa da porta 47124 livre (ou outra: PORTA=47199 npm run teste:negocio). Leva uns 2 minutos.
const { _electron: electron } = require('playwright-core');
const fs = require('fs'); const os = require('os'); const path = require('path');
const CODIGO = '771205', PORTA = Number(process.env.PORTA || 47124), URL = `http://127.0.0.1:${PORTA}`;
const EXE = require('electron');
const APP = path.join(__dirname, '..');
const RAIZ = fs.mkdtempSync(path.join(os.tmpdir(), 'computador-escola-teste-negocio-'));
const TELAS = path.join(RAIZ, 'telas');
const foto = (nome) => path.join(TELAS, nome);
const ANA = { nome: 'Ana Souza', turma: 'Manhã', senha: 'senha01' }, BRUNO = { nome: 'Bruno Lima', turma: 'Manhã', senha: 'senha02' };
let falhas = 0;
const ok = (c, m) => { console.log((c ? '✔ ' : '✘ ') + m); if (!c) { falhas++; process.exitCode = 1; } };
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const erros = [];
fs.mkdirSync(TELAS, { recursive: true });
const pastaPc = (nome) => { const d = path.join(RAIZ, nome); fs.mkdirSync(path.join(d, 'dados'), { recursive: true }); return d; };
const DI = pastaPc('instrutor');
fs.writeFileSync(path.join(DI, 'dados', 'sala.json'), JSON.stringify({ modo: 'servidor', codigo: CODIGO, porta: PORTA }));
const abrir = async (D, rotulo) => {
  const app = await electron.launch({ executablePath: EXE, args: ['--no-sandbox', '--disable-gpu', `--user-data-dir=${path.join(D, 'perfil')}`, APP, '--janela'], env: { ...process.env, PORTABLE_EXECUTABLE_DIR: D, CE_SEM_IA: '1' }, timeout: 120000 });
  const p = await app.firstWindow(); await p.setViewportSize({ width: 1366, height: 768 });
  p.on('pageerror', (e) => erros.push(`${rotulo}: ${e.message}`));
  p.on('console', (m) => { if (m.type() === 'error') erros.push(`${rotulo} (console): ${m.text().slice(0, 200)}`); });
  return { app, p };
};
function portaLivre(porta) {
  return new Promise((resolver) => { const s = require('net').createServer(); s.once('error', () => resolver(false)); s.listen(porta, '0.0.0.0', () => s.close(() => resolver(true))); });
}
const J = (app, s) => `.janela[data-app="${app}"] ${s}`;
const N = (s) => J('negocio', s);
async function entrar(p, aluno) {
  await p.waitForSelector('.login-usuario', { timeout: 60000 });
  await p.click(`.login-usuario:has(.login-nome:text-is("${aluno.nome}"))`);
  await p.fill('.login-caixa input', aluno.senha); await p.keyboard.press('Enter');
  await p.waitForSelector('#professor .prof-cartao', { timeout: 60000 });
  await p.waitForTimeout(800);
  await p.evaluate(() => { if (CE.professor.pararLicao) CE.professor.pararLicao(); CE.janelas.fecharTodas(); });
}
const lerDisco = (nome, padrao = null) => { try { return JSON.parse(fs.readFileSync(path.join(DI, 'dados', nome), 'utf8')); } catch { return padrao; } };
const ate = async (f, ms = 8000) => { const fim = Date.now() + ms; while (Date.now() < fim) { if (await f().catch(() => false)) return true; await espera(250); } return false; };
const estadoDe = (p) => p.evaluate(() => CE.api.chamar('negocio:estado'));

(async () => {
  if (!(await portaLivre(PORTA))) { console.error(`A porta ${PORTA} já está em uso (use PORTA=47199 npm run teste:negocio).`); fs.rmSync(RAIZ, { recursive: true, force: true }); process.exit(1); }
  // ---------------- Instrutora: cadastra Ana e Bruno ----------------
  const I = await abrir(DI, 'instrutora'); const A = I.p;
  const c = A.locator('.login-caixa input'); await c.nth(0).fill('Professora Rita'); await c.nth(1).fill('1234'); await c.nth(2).fill('1234');
  await A.click('text=Cadastrar e entrar'); await A.waitForSelector('#professor .prof-cartao');
  const P = (s) => J('instrutor', s);
  await A.evaluate(() => { CE.janelas.fecharTodas(); CE.janelas.abrir('instrutor'); }); await A.waitForTimeout(800);
  await A.click(P('[data-aba="alunos"]')); await A.waitForSelector(P('.painel-form'));
  for (const a of [ANA, BRUNO]) {
    const campos = A.locator(P('.painel-form input.campo'));
    await campos.nth(0).fill(a.nome); await campos.nth(1).fill(a.turma); await campos.nth(2).fill(a.senha);
    await A.click(P('.painel-form .botao:has-text("Cadastrar")'));
    await A.waitForFunction((nome) => [...document.querySelectorAll('.janela[data-app="instrutor"] .painel-tabela td')].some((td) => td.textContent === nome), a.nome, { timeout: 15000 });
  }
  const usuarios = lerDisco('usuarios.json', []);
  const idAna = usuarios.find((u) => u.nome === ANA.nome).id, idBruno = usuarios.find((u) => u.nome === BRUNO.nome).id;
  await A.evaluate(() => CE.janelas.fecharTodas());
  const pcs = await Promise.all([1, 2].map(async (n) => {
    const D = pastaPc(`aluno-${n}`);
    fs.writeFileSync(path.join(D, 'dados', 'sala.json'), JSON.stringify({ modo: 'aluno', servidor: URL, codigo: CODIGO }));
    return { ...(await abrir(D, `PC ${n}`)), D, n };
  }));
  const [p1, p2] = pcs.map((x) => x.p);
  await entrar(p1, ANA); await entrar(p2, BRUNO);

  // ================= A instrutora abre o jogo; os alunos recebem o convite e entram =================
  await A.evaluate(() => CE.janelas.abrir('negocio')); await A.waitForSelector(N('[data-acao="abrir-negocio"]'));
  await A.selectOption(N('[data-campo="dias"]'), '10');
  await A.selectOption(N('[data-campo="distribuicao"]'), 'escolher');
  await A.click(N('[data-acao="abrir-negocio"]'));
  ok(await A.waitForSelector(N('[data-acao="comecar-negocio"]'), { timeout: 8000 }).then(() => true, () => false), 'a instrutora abre o jogo: sala de espera');
  for (const p of [p1, p2]) {
    const convite = await p.waitForSelector('.negocio-convite [data-acao="entrar-negocio"]', { timeout: 20000 }).then(() => true).catch(() => false);
    ok(convite, `${p === p1 ? 'Ana' : 'Bruno'} recebe o convite "Do Campo ao Balcão"`);
    if (convite) await p.click('.negocio-convite [data-acao="entrar-negocio"]');
  }
  ok(await ate(async () => (await A.$$(N('[data-participante]'))).length === 2, 15000), 'os dois aparecem na sala de espera da instrutora');
  // A instrutora escolhe quem faz o quê
  await A.evaluate(([a, b]) => Promise.all([
    CE.api.chamar('negocio:atribuir', { aluno: a, funcoes: ['agricultor', 'pecuarista', 'veterinario', 'logistica', 'frigorifico'] }),
    CE.api.chamar('negocio:atribuir', { aluno: b, funcoes: ['compras', 'chapeiro', 'caixa', 'gerente'] }),
  ]), [idAna, idBruno]);
  ok(await ate(async () => /Pecuarista/.test(await p1.textContent(N('.ng-minhas')))), 'a Ana vê a função dela antes de começar (Pecuarista...)');
  await A.screenshot({ path: foto('negocio-01-espera.png') });
  await A.click(N('[data-acao="comecar-negocio"]'));
  ok(await ate(async () => (await p1.isVisible(N('[data-relogio]'))) && (await p2.isVisible(N('[data-relogio]'))), 10000), 'começou: o relógio aparece nos dois computadores');
  const h1 = (await estadoDe(p1)).hora;
  ok(await ate(async () => (await estadoDe(p1)).hora !== h1, 15000), 'o tempo anda sozinho (o mundo roda no computador da instrutora)');
  const e1 = await estadoDe(p1), e2 = await estadoDe(p2);
  ok(e1.dia === e2.dia && Math.abs(e1.hora - e2.hora) <= 1, `os dois veem o mesmo dia e hora (dia ${e1.dia}, ${e1.hora}h e ${e2.hora}h)`);
  ok(!!e1.empresa.pasto && !e1.empresa.escritorio, 'a Ana vê o pasto, mas não as contas do escritório');
  ok(!!e2.empresa.loja && !e2.empresa.pasto, 'o Bruno vê a lanchonete, mas não o pasto');
  ok(await ate(async () => !!(await p1.$(N('.ng-cena canvas'))) && !!(await p2.$(N('.ng-cena canvas')))), 'cada um vê a cena animada do seu setor (pasto, lanchonete...)');
  await p1.screenshot({ path: foto('negocio-02-ana.png') });
  // Cada um só mexe no seu setor
  const preco = await p1.evaluate(() => CE.api.chamar('negocio:acao', { funcao: 'gerente', tipo: 'preco', valor: 30 }).then(() => 'mudou', (e) => e.message));
  ok(/não é sua/.test(preco), 'a Ana não consegue mudar o preço da lanchonete (função do Bruno)');
  const precoB = await p2.evaluate(() => CE.api.chamar('negocio:acao', { funcao: 'gerente', tipo: 'preco', valor: 17 }).then((r) => r.empresa.loja.preco));
  ok(precoB === 17, 'o Bruno (gerente) muda o preço para R$ 17');
  // Pedido entre setores e conversa
  await p2.evaluate(() => CE.api.chamar('negocio:pedido', { de: 'gerente', para: 'logistica', item: 'hamburgueres', qtd: 500, prazo: 1, texto: 'Antes do almoço!' }));
  ok(await ate(async () => (await estadoDe(p1)).empresa.pedidos.some((x) => x.para === 'logistica' && x.qtd === 500 && x.status === 'aberto')), 'a Ana (Logística) recebe o pedido do Bruno: 500 hambúrgueres até hoje');
  const pedidoId = (await estadoDe(p1)).empresa.pedidos[0].id;
  const r = await p1.evaluate(() => CE.api.chamar('negocio:acao', { funcao: 'logistica', tipo: 'viajar', rota: 'frig_loja', qtd: 500 }).then(() => 'ok', (e) => e.message));
  ok(r === 'ok', `a Ana manda o caminhão do frigorífico para a lanchonete (${r})`);
  await p1.evaluate((id) => CE.api.chamar('negocio:responder', { id, status: 'feito' }), pedidoId);
  ok(await ate(async () => (await estadoDe(p2)).empresa.pedidos.some((x) => x.id === pedidoId && x.status === 'feito')), 'o Bruno vê o pedido como "feito"');
  await p1.evaluate(() => CE.api.chamar('negocio:falar', { texto: 'O caminhão já saiu com 500!' }));
  ok(await ate(async () => (await estadoDe(p2)).empresa.conversa.some((m) => /caminhão já saiu/.test(m.texto))), 'a conversa da Ana chega no Bruno');
  // Hora do almoço: o caixa atende a fila digitando o pedido
  await A.evaluate(() => CE.api.chamar('negocio:pular', { horas: 4 }));
  await p2.click(N('[data-aba-negocio="f:caixa"]'));
  const fila = (await estadoDe(p2)).empresa.loja.fila;
  if (fila > 0) {
    const pedido = await p2.textContent(N('.ng-pedido'));
    const item = /um (.+), por favor/.exec(pedido)[1];
    const antes = (await estadoDe(p2)).empresa.loja.hoje.clientes;
    await p2.fill(N('[data-campo="pedido-caixa"]'), item); await p2.press(N('[data-campo="pedido-caixa"]'), 'Enter');
    ok(await ate(async () => (await estadoDe(p2)).empresa.loja.hoje.clientes > antes), `o Bruno (caixa) digita "${item}" e atende um cliente da fila`);
  } else ok(true, 'fila vazia na hora do teste (o caixa não precisou atender)');
  await p2.screenshot({ path: foto('negocio-03-bruno-caixa.png') });
  // Evento: doença no rebanho chega para quem cuida do pasto
  await A.evaluate(() => CE.api.chamar('negocio:evento', { tipo: 'doenca' }));
  ok(await ate(async () => (await estadoDe(p1)).empresa.pasto.doentes > 0), 'a instrutora dispara "doença no rebanho": a Ana vê os bois doentes');
  await p1.evaluate(() => CE.api.chamar('negocio:acao', { funcao: 'veterinario', tipo: 'tratar' }));
  ok((await estadoDe(p1)).empresa.pasto.doentes === 0, 'a Ana (veterinária) trata os doentes');
  // Termômetro e pausa
  await A.evaluate(() => CE.api.chamar('negocio:nivel', 8));
  ok(await ate(async () => (await estadoDe(p2)).nivel === 8), 'a instrutora sobe o termômetro para 8: chega no Bruno');
  await p2.evaluate(() => CE.api.chamar('negocio:votar', 'dificil'));
  ok(await ate(async () => ((await estadoDe(A)).instrutor.votos.dificil || 0) === 1), 'o voto do Bruno ("difícil") chega no painel da instrutora');
  await A.evaluate(() => CE.api.chamar('negocio:pausar', true));
  ok(await ate(async () => /Pausado/.test(await p1.textContent(N('[data-relogio]')))), 'a instrutora pausa (reunião): a Ana vê "Pausado"');
  const pausado = await p1.evaluate(() => CE.api.chamar('negocio:acao', { funcao: 'agricultor', tipo: 'irrigar', ligar: true }).then(() => 'ok', (e) => e.message));
  ok(/pausado/.test(pausado), 'com o jogo pausado, ninguém mexe');
  await A.evaluate(() => CE.api.chamar('negocio:pausar', false));
  await A.screenshot({ path: foto('negocio-04-instrutora.png') });
  // Fim: resultado para todos, guardado no disco da instrutora
  await A.evaluate(() => CE.api.chamar('negocio:encerrar'));
  ok(await ate(async () => (await p1.isVisible(N('[data-resultado]'))) && (await p2.isVisible(N('[data-resultado]')))), 'encerrado: o resultado aparece nos dois computadores');
  const salvo = lerDisco('negocio-ultimo.json', null);
  ok(salvo && salvo.resultado && salvo.resultado[0].membros.length === 2 && salvo.stats[idAna] && salvo.stats[idBruno], 'disco da instrutora: o resultado e a participação de cada aluno');
  await p2.screenshot({ path: foto('negocio-05-fim.png') });
  const locais = pcs.flatMap(({ D }) => fs.readdirSync(path.join(D, 'dados')).filter((f) => f !== 'sala.json'));
  ok(!locais.length, `nada ficou guardado nos computadores dos alunos${locais.length ? ': ' + locais.join(', ') : ''}`);
  const relevantes = erros.filter((e) => !/net::ERR|Failed to load resource/.test(e));
  ok(!relevantes.length, 'sem erros nas telas' + (relevantes.length ? ': ' + relevantes.slice(0, 5).join(' | ') : ''));
  await Promise.all([I.app, ...pcs.map((x) => x.app)].map((a) => a.close().catch(() => {})));
  console.log(`\nCapturas de tela: ${TELAS}`);
  console.log(falhas ? `FALHAS ${falhas}` : 'FALHAS 0');
  process.exit(falhas ? 1 : 0);
})().catch(async (e) => { console.error(e); console.log('FALHAS 1'); process.exit(1); });
