// Teste da Praça Escola na rede da sala, com o programa de verdade: 1 computador da instrutora (servidor) e
// 2 computadores de aluno. Confere que:
//  • cada aluno vê o boneco do outro andando, a conversa chega para quem está perto e o 🙋 aparece para todos;
//  • os dois jogam jogo da velha um contra o outro, cada um no seu computador, e quem ganha leva a medalha;
//  • o mural e a votação ficam guardados no computador da instrutora;
//  • a instrutora fala no megafone, deixa só frases prontas, silencia, fecha e abre a praça e chama todos (quem
//    está fora da praça recebe o convite e vai para perto da fonte);
//  • nada fica guardado nos computadores dos alunos.
//
//   npm run teste:praca
//   Linux sem tela: xvfb-run -a npm run teste:praca
//
// Precisa da porta 47123 livre (ou outra: PORTA=47199 npm run teste:praca). Leva uns 3 minutos.
const { _electron: electron } = require('playwright-core');
const fs = require('fs'); const os = require('os'); const path = require('path');
const CODIGO = '771204', PORTA = Number(process.env.PORTA || 47123), URL = `http://127.0.0.1:${PORTA}`;
const EXE = require('electron');
const APP = path.join(__dirname, '..');
const RAIZ = fs.mkdtempSync(path.join(os.tmpdir(), 'computador-escola-teste-praca-'));
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
const Z = (s) => J('praca', s);
async function entrar(p, aluno) {
  await p.waitForSelector('.login-usuario', { timeout: 60000 });
  await p.click(`.login-usuario:has(.login-nome:text-is("${aluno.nome}"))`);
  await p.fill('.login-caixa input', aluno.senha); await p.keyboard.press('Enter');
  await p.waitForSelector('#professor .prof-cartao', { timeout: 60000 });
  await p.waitForTimeout(800);
  await p.evaluate(() => { if (CE.professor.pararLicao) CE.professor.pararLicao(); CE.janelas.fecharTodas(); });
}
const lerDisco = (nome, padrao = null) => { try { return JSON.parse(fs.readFileSync(path.join(DI, 'dados', nome), 'utf8')); } catch { return padrao; } };
// Posição de um boneco na tela de um computador, em quadrinhos do mapa.
const ondeEsta = (p, id) => p.$eval(Z(`.pr-p[data-pessoa="${id}"]`), (e) => { const m = /translate\(([-\d.]+)px, ([-\d.]+)px\)/.exec(e.style.transform); return m ? { x: Number(m[1]) / 40, y: Number(m[2]) / 40 } : null; }).catch(() => null);
const ate = async (f, ms = 8000) => { const fim = Date.now() + ms; while (Date.now() < fim) { if (await f().catch(() => false)) return true; await espera(250); } return false; };

(async () => {
  if (!(await portaLivre(PORTA))) {
    console.error(`A porta ${PORTA} já está em uso. Feche o Computador Escola que está como "Computador do INSTRUTOR" ou use outra porta (PORTA=47199 npm run teste:praca).`);
    fs.rmSync(RAIZ, { recursive: true, force: true });
    process.exit(1);
  }
  // ---------------- Instrutora: cadastra Ana e Bruno e escolhe o Bruno como monitor ----------------
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
  await A.click(P('[data-aba="turma"]')); await A.waitForSelector(P(`[data-monitor="${BRUNO.nome}"]`));
  await A.check(P(`[data-monitor="${BRUNO.nome}"]`)); await A.waitForTimeout(1000);
  await A.evaluate(() => CE.janelas.fecharTodas());

  const pcs = await Promise.all([1, 2].map(async (n) => {
    const D = pastaPc(`aluno-${n}`);
    fs.writeFileSync(path.join(D, 'dados', 'sala.json'), JSON.stringify({ modo: 'aluno', servidor: URL, codigo: CODIGO }));
    return { ...(await abrir(D, `PC ${n}`)), D, n };
  }));
  const [p1, p2] = pcs.map((x) => x.p);
  await entrar(p1, ANA); await entrar(p2, BRUNO);

  // ================= Os dois na praça, cada um no seu computador =================
  ok(await p1.isVisible('#icones .icone[data-icone="praca"]'), 'o ícone da Praça Escola está na área de trabalho do aluno');
  await p1.evaluate(() => CE.janelas.abrir('praca')); await p2.evaluate(() => CE.janelas.abrir('praca'));
  const viu1 = await p1.waitForSelector(Z(`.pr-p[data-pessoa="${idBruno}"]`), { timeout: 15000 }).then(() => true).catch(() => false);
  const viu2 = await p2.waitForSelector(Z(`.pr-p[data-pessoa="${idAna}"]`), { timeout: 15000 }).then(() => true).catch(() => false);
  ok(viu1 && viu2, 'PC 1 vê o boneco do Bruno e o PC 2 vê o boneco da Ana');
  ok(/monitor/.test(await p1.textContent(Z(`.pr-p[data-pessoa="${idBruno}"] .nome`)).catch(() => '')), 'PC 1: o Bruno aparece como monitor(a)');
  // A Ana anda para a esquerda com as setas; o PC 2 vê o boneco dela sair do lugar.
  const antes = await ondeEsta(p2, idAna);
  await p1.focus(Z('.pr-mapa')); await p1.keyboard.down('ArrowLeft'); await espera(700); await p1.keyboard.up('ArrowLeft');
  const andou = await ate(async () => { const agora = await ondeEsta(p2, idAna); return antes && agora && antes.x - agora.x >= 2; }, 6000);
  ok(andou, `PC 2 vê a Ana andar para a esquerda (${antes && antes.x.toFixed(1)} → ${((await ondeEsta(p2, idAna)) || {}).x?.toFixed(1)})`);
  await p1.screenshot({ path: foto('praca-01-pc1.png') });
  // Conversa por perto
  await p1.click(Z('.pr-chip[data-frase="Bom dia!"]'));
  ok(await ate(async () => /Ana Souza: Bom dia!/.test(await p2.textContent(Z('.pr-log')))), 'PC 2: o "Bom dia!" da Ana chega na conversa do Bruno (estão perto)');
  // Mão levantada
  await p2.click(Z('.pr-gesto[data-gesto="ajuda"]'));
  ok(await ate(async () => !!(await p1.$(Z(`.pr-p[data-pessoa="${idBruno}"] .pr-mao`)))), 'PC 1: aparece o 🙋 em cima do Bruno quando ele pede ajuda');
  ok(/Bruno Lima pediu ajuda/.test(await p1.textContent(Z('.pr-log'))), 'PC 1: a conversa avisa que o Bruno pediu ajuda');
  await p2.click(Z('.pr-gesto[data-gesto="ajuda"]'));
  ok(await ate(async () => !(await p1.$(Z(`.pr-p[data-pessoa="${idBruno}"] .pr-mao`)))), 'o Bruno baixa a mão e o 🙋 some no PC 1');

  // ================= Jogo da velha entre os dois computadores =================
  const mesa = (p, ...a) => p.evaluate((a) => CE.api.chamar('praca:mesa', ...a).then((m) => m, (e) => ({ erro: e.message })), a);
  await mesa(p1, 'sentar'); const m2 = await mesa(p2, 'sentar');
  ok(m2.X && m2.X.id === idAna && m2.O && m2.O.id === idBruno, 'Ana senta com ❌ e Bruno com ⭕, cada um no seu computador');
  const foraDaVez = await mesa(p2, 'jogar', 4);
  ok(/vez do outro/.test(foraDaVez.erro || ''), 'o Bruno não joga fora da vez');
  for (const [p, casa] of [[p1, 0], [p2, 3], [p1, 1], [p2, 4], [p1, 2]]) await mesa(p, 'jogar', casa);
  ok(await ate(async () => /Ana Souza ganhou de Bruno Lima no jogo da velha/.test(await p2.textContent(Z('.pr-log')))), 'PC 2: a conversa conta que a Ana ganhou do Bruno');
  ok(await ate(() => Promise.resolve(!!((lerDisco(`progresso-${idAna}.json`, {}).medalhas || {})['praca-velha'])), 10000), 'disco da instrutora: a Ana ganhou a medalha ❌ Bom de jogo');

  // ================= A instrutora entra na praça =================
  await A.evaluate(() => CE.janelas.abrir('praca'));
  ok(await ate(async () => !!(await A.$(Z(`.pr-gente [data-gente="${idAna}"]`))) && !!(await A.$(Z(`.pr-gente [data-gente="${idBruno}"]`)))), 'instrutora: "Na praça agora" mostra a Ana e o Bruno');
  await A.fill(Z('#pr-campo-megafone'), 'Bingo em 5 minutos!'); await A.press(Z('#pr-campo-megafone'), 'Enter');
  ok(await ate(async () => /Bingo em 5 minutos!/.test(await p1.textContent(Z('.pr-megafone'))) && /Bingo em 5 minutos!/.test(await p2.textContent(Z('.pr-megafone')))), 'megafone: o recado da instrutora aparece no mapa dos dois alunos');
  await p2.screenshot({ path: foto('praca-02-megafone.png') });
  // Mural e votação (guardados no computador da instrutora)
  await p1.evaluate(() => CE.api.chamar('praca:recado', 'Quem vai no bingo?'));
  ok((lerDisco('praca.json', {}).recados || []).some((r) => r.texto === 'Quem vai no bingo?' && r.de.id === idAna), 'disco da instrutora: o recado da Ana no mural');
  ok((await p2.evaluate(() => CE.api.chamar('praca:mural'))).recados.some((r) => r.texto === 'Quem vai no bingo?'), 'PC 2: o Bruno lê o recado da Ana no mural');
  await p1.click(Z('.pr-voto[data-voto="biblioteca"]')); await p2.click(Z('.pr-voto[data-voto="biblioteca"]')); await espera(800);
  const votacao = await A.evaluate(() => CE.api.chamar('praca:votacao'));
  ok(votacao.total === 2 && votacao.opcoes.find((o) => o.id === 'biblioteca').votos === 2, 'votação: os dois votos chegam no computador da instrutora');
  await A.click(Z('[data-acao="encerrar-votacao"]'));
  ok(await ate(async () => (await p1.$$eval(Z('.pr-rotulo'), (l) => l.map((e) => e.textContent).join('|'))).includes('Obra: Biblioteca nova')), 'encerrada a votação: o Lote da turma vira "Obra: Biblioteca nova" na tela da Ana');
  // Só frases prontas
  await A.check(Z('#pr-so-frases'));
  ok(await ate(async () => p1.isHidden(Z('.pr-barra .pr-digitar'))), 'só frases prontas: o campo de escrever some no computador da Ana');
  const livre = await p1.evaluate(() => CE.api.chamar('praca:falar', 'texto livre qualquer').then(() => 'aceitou', (e) => e.message));
  ok(/frases prontas/.test(livre), 'só frases prontas: texto livre é recusado pelo computador da instrutora');
  await A.uncheck(Z('#pr-so-frases'));
  ok(await ate(async () => p1.isVisible(Z('.pr-barra .pr-digitar'))), 'conversa livre de novo: o campo volta');
  // Silenciar
  await A.click(Z(`[data-silenciar="${idAna}"]`));
  ok(await ate(async () => /só ouvindo/.test(await p1.textContent(Z('.pr-nota')))), 'silenciada: a Ana vê que está só ouvindo');
  const calada = await p1.evaluate(() => CE.api.chamar('praca:falar', 'Bom dia!').then(() => 'aceitou', (e) => e.message));
  ok(/ouvindo/.test(calada), 'silenciada: a fala da Ana é recusada');
  await A.click(Z(`[data-silenciar="${idAna}"]`));
  ok(await ate(async () => p1.isVisible(Z('.pr-barra .pr-digitar'))), 'a instrutora deixa a Ana falar de novo');
  // Fechar e abrir
  await A.click(Z('[data-acao="abrir-fechar"]'));
  ok(await ate(async () => (await p1.isVisible(Z('.pr-fechada'))) && (await p2.isVisible(Z('.pr-fechada')))), 'praça fechada: os dois alunos veem o aviso de praça fechada');
  await p1.screenshot({ path: foto('praca-03-fechada.png') });
  await A.click(Z('[data-acao="abrir-fechar"]'));
  ok(await ate(async () => (await p1.isHidden(Z('.pr-fechada'))) && (await p2.isHidden(Z('.pr-fechada')))), 'praça aberta de novo');

  // ================= Chamar todos: quem saiu recebe o convite e vai para a fonte =================
  await p2.evaluate(() => CE.janelas.fecharTodas());
  ok(await ate(async () => !(await A.$(Z(`.pr-gente [data-gente="${idBruno}"]`)))), 'o Bruno fecha a praça e sai da lista da instrutora');
  await A.click(Z('[data-acao="chamar-todos"]'));
  const convite = await p2.waitForSelector('.praca-convite [data-acao="ir-para-praca"]', { timeout: 20000 }).then(() => true).catch(() => false);
  ok(convite, 'PC 2: o Bruno, fora da praça, recebe o convite "Todo mundo para a praça!"');
  if (convite) await p2.click('.praca-convite [data-acao="ir-para-praca"]');
  const naFonte = await ate(async () => { const e = await ondeEsta(p2, idBruno); return e && Math.hypot(e.x - 17.5, e.y - 13.5) < 3; }, 12000);
  ok(naFonte, 'o Bruno volta para a praça e vai para perto da fonte');
  const anaNaFonte = await ate(async () => { const e = await ondeEsta(p1, idAna); return e && Math.hypot(e.x - 17.5, e.y - 13.5) < 3; }, 12000);
  ok(anaNaFonte, 'a Ana, que estava na praça, também vai para perto da fonte');
  await A.screenshot({ path: foto('praca-04-instrutora.png') });

  // ================= Onde os dados ficaram =================
  const disco = lerDisco('praca.json', {});
  ok(disco.votacao && disco.votacao.encerrada && disco.votacao.vencedor === 'biblioteca', 'disco da instrutora: a votação encerrada com a Biblioteca nova');
  const prAna = lerDisco(`progresso-${idAna}.json`, {});
  ok(prAna.praca && prAna.praca.visitou && prAna.medalhas && prAna.medalhas['praca-visita'], 'disco da instrutora: a medalha ⛲ Passeio na praça da Ana');
  const locais = pcs.flatMap(({ D }) => fs.readdirSync(path.join(D, 'dados')).filter((f) => f !== 'sala.json'));
  ok(!locais.length, `nada ficou guardado nos computadores dos alunos${locais.length ? ': ' + locais.join(', ') : ''}`);
  await p1.evaluate(() => CE.janelas.fecharTodas());
  ok(await ate(async () => !(await A.$(Z(`.pr-gente [data-gente="${idAna}"]`)))), 'a Ana fecha a praça e sai da lista na hora');
  const relevantes = erros.filter((e) => !/net::ERR|Failed to load resource/.test(e));
  ok(!relevantes.length, 'sem erros nas telas' + (relevantes.length ? ': ' + relevantes.slice(0, 5).join(' | ') : ''));
  await Promise.all([I.app, ...pcs.map((x) => x.app)].map((a) => a.close().catch(() => {})));
  console.log(`\nCapturas de tela: ${TELAS}`);
  console.log(falhas ? `FALHAS ${falhas}` : 'FALHAS 0');
  process.exit(falhas ? 1 : 0);
})().catch(async (e) => { console.error(e); console.log('FALHAS 1'); process.exit(1); });
