// Teste da Cobrinha da Turma na rede da sala, com o programa de verdade: 1 computador da instrutora (servidor) e 2 de
// aluno (Ana e Bruno, da mesma turma). Confere que:
//  • o prédio da Cobrinha (🐍) aparece na Praça; a Ana clica nele, o boneco vai até a porta e ela entra na arena;
//  • o Bruno entra também: os dois estão na MESMA arena (a da turma Manhã), com 6 robôs completando;
//  • a cobrinha da Ana vira para o mouse (a arena anda no computador da instrutora) e segurar o Espaço acelera;
//  • a instrutora assiste à arena inteira da Manhã e vê os dois; desliga os robôs (só gente na arena);
//  • a instrutora fecha a arena: os dois saem e veem "fechada" (o botão Jogar apaga); abre de novo e o botão acende;
//  • quem fecha a janela sai da arena; nada fica guardado nos computadores dos alunos; sem erros nas telas.
//
//   npm run teste:cobrinha
//   Linux sem tela: xvfb-run -a npm run teste:cobrinha
//
// Precisa da porta 47126 livre (ou outra: PORTA=47199 npm run teste:cobrinha). Leva uns 2 minutos.
const { _electron: electron } = require('playwright-core');
const fs = require('fs'); const os = require('os'); const path = require('path');
const CODIGO = '580319', PORTA = Number(process.env.PORTA || 47127), URL = `http://127.0.0.1:${PORTA}`;
const EXE = require('electron');
const APP = path.join(__dirname, '..');
const RAIZ = fs.mkdtempSync(path.join(os.tmpdir(), 'computador-escola-teste-cobrinha-'));
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
const G = (s) => J('cobrinha', s);
const Z = (s) => J('praca', s);
async function entrar(p, aluno) {
  await p.waitForSelector('.login-usuario', { timeout: 60000 });
  await p.click(`.login-usuario:has(.login-nome:text-is("${aluno.nome}"))`);
  await p.fill('.login-caixa input', aluno.senha); await p.keyboard.press('Enter');
  await p.waitForSelector('#professor .prof-cartao', { timeout: 60000 });
  await p.waitForTimeout(800);
  await p.evaluate(() => { if (CE.professor.pararLicao) CE.professor.pararLicao(); CE.janelas.fecharTodas(); });
}
const ate = async (f, ms = 8000) => { const fim = Date.now() + ms; while (Date.now() < fim) { if (await f().catch(() => false)) return true; await espera(250); } return false; };
// "cobrinha:jogar" sem mouse: só lê a arena (não muda para onde a cobrinha vai).
const arenaDe = (p) => p.evaluate(() => CE.api.chamar('cobrinha:jogar', {}));
const estadoDe = (p) => p.evaluate(() => CE.api.chamar('cobrinha:estado'));
// Numa partida de verdade alguém pode bater e morrer: antes de conferir, quem morreu clica em "Jogar de novo".
async function vivos(...ps) { for (const p of ps) if (await p.isVisible(G('[data-acao="jogar-de-novo"]')).catch(() => false)) { await p.click(G('[data-acao="jogar-de-novo"]')); await espera(600); } }

(async () => {
  if (!(await portaLivre(PORTA))) { console.error(`A porta ${PORTA} já está em uso (use PORTA=47199 npm run teste:cobrinha).`); fs.rmSync(RAIZ, { recursive: true, force: true }); process.exit(1); }
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
  await A.evaluate(() => CE.janelas.fecharTodas());
  const pcs = await Promise.all([1, 2].map(async (n) => {
    const D = pastaPc(`aluno-${n}`);
    fs.writeFileSync(path.join(D, 'dados', 'sala.json'), JSON.stringify({ modo: 'aluno', servidor: URL, codigo: CODIGO }));
    return { ...(await abrir(D, `PC ${n}`)), D, n };
  }));
  const [p1, p2] = pcs.map((x) => x.p);
  await entrar(p1, ANA); await entrar(p2, BRUNO);

  // ================= A Ana chega na arena pela Praça; o Bruno abre direto =================
  await p1.evaluate(() => CE.janelas.abrir('praca'));
  await p1.waitForSelector(Z('.pr-mapa'), { timeout: 20000 });
  await p1.click(Z('.pr-maquete-pular'), { timeout: 8000 }).catch(() => {});
  ok(await ate(async () => (await p1.$$(Z('[data-lugar="cobrinha"]'))).length > 0, 15000), 'PC 1: o prédio da Cobrinha (🐍) aparece na Praça');
  // Aluno novo na cidade: a entrevista de boas-vindas fica para depois; e a cidade inteira na tela (a arena fica embaixo)
  await p1.waitForTimeout(1500);
  await p1.evaluate(() => document.querySelectorAll('.janela[data-app="praca"] .pr-dlg-fechar').forEach((b) => b.click()));
  await p1.click(Z('[data-acao="cidade-inteira"]')); await p1.waitForTimeout(1200);
  // Clica no desenho do prédio (em 3D, o clique precisa acertar a parede ou o telhado)
  const caixas = await p1.$$eval(Z('.pr-iso[data-lugar="cobrinha"]'), (els) => els.map((e) => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height * 0.62, a: r.width * r.height }; })
    .filter((x) => x.a > 0).sort((a, b) => b.a - a.a)).catch(() => []);
  let pelaPraca = false;
  for (const cx of caixas.slice(0, 4)) {
    await p1.mouse.click(cx.x, cx.y);
    pelaPraca = await p1.waitForSelector(Z('[data-opcao="entrar-cobrinha"]'), { timeout: 20000 }).then(() => true, () => false);
    if (pelaPraca) break;
  }
  ok(pelaPraca, 'a Ana clica no prédio: o boneco vai até a porta e aparece "Entrar na arena"');
  await p1.screenshot({ path: foto('cobrinha-01-porta-da-arena.png') });
  if (pelaPraca) await p1.click(Z('[data-opcao="entrar-cobrinha"]')); else await p1.evaluate(() => CE.janelas.abrir('cobrinha'));
  await p2.evaluate(() => CE.janelas.abrir('cobrinha'));
  for (const p of [p1, p2]) await p.waitForSelector(G('[data-acao="jogar-cobrinha"]:not([disabled])'), { timeout: 15000 });
  ok(true, 'a janela do jogo abre nos dois computadores, com "como jogar" e o botão Jogar');
  for (const p of [p1, p2]) await p.click(G('[data-acao="jogar-cobrinha"]'));
  ok(await ate(async () => (await arenaDe(p1)).eu.vivo && (await arenaDe(p2)).eu.vivo), 'os dois clicam em Jogar e nascem na arena');
  const r1 = await arenaDe(p1), r2 = await arenaDe(p2);
  ok(r1.turma === 'Manhã' && r2.turma === 'Manhã', 'os dois estão na arena da turma Manhã');
  ok(await ate(async () => { const r = await arenaDe(p1); return r.total === 8 && r.gente === 2; }, 8000), 'na arena: os 2 alunos e 6 robôs (8 cobrinhas)');
  const nomes = (r) => r.rk.map((x) => x[0]);
  ok(await ate(async () => { const a = await arenaDe(p1), b = await arenaDe(p2); return nomes(a).includes('Ana') && nomes(a).includes('Bruno') && nomes(b).includes('Ana') && nomes(b).includes('Bruno'); }),
    'o ranking dos dois computadores mostra a Ana e o Bruno');

  // ================= A bolinha anda atrás do mouse; o Espaço chega no jogo =================
  const tela = await p1.$eval(G('canvas.ag-tela'), (e) => { const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
  const antes = await arenaDe(p1);
  const praEsquerda = antes.eu.x > 1500; // vira para o lado com mais espaço
  await p1.mouse.move(tela.x + tela.w / 2 + (praEsquerda ? -1 : 1) * tela.w * 0.4, tela.y + tela.h / 2);
  ok(await ate(async () => { const x = (await arenaDe(p1)).eu.x; return praEsquerda ? x < antes.eu.x - 100 : x > antes.eu.x + 100; }, 8000), 'a cobrinha da Ana vira e vai para onde o mouse aponta (a arena anda no computador da instrutora)');
  await p1.evaluate(() => { window.__turbo = 0; const o = CE.api.chamar; CE.api.chamar = (canal, ...a) => { if (canal === 'cobrinha:jogar' && a[0] && a[0].acelerar) window.__turbo++; return o(canal, ...a); }; });
  await vivos(p1);
  const caixa = await p1.$eval(G('canvas.ag-tela'), (e) => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  await p1.mouse.click(caixa.x, caixa.y); await p1.evaluate(() => { window.__turbo = 0; });
  await p1.keyboard.down('Space'); await espera(1200); await p1.keyboard.up('Space');
  const turbo = await p1.evaluate(() => window.__turbo);
  ok(turbo >= 5, `segurando o Espaço, a janela manda acelerar (${turbo} pedidos)` + (turbo >= 5 ? '' : ' | ' + await p1.evaluate(() => [document.querySelector('.janela[data-app="cobrinha"]').className, document.activeElement && document.activeElement.tagName].join(' / '))));
  await p1.screenshot({ path: foto('cobrinha-02-ana-jogando.png') });

  // ================= A instrutora assiste, desliga os robôs, fecha e abre a arena =================
  await A.evaluate(() => CE.janelas.abrir('cobrinha'));
  await A.waitForSelector(G('[data-campo="turma-cobrinha"]'), { timeout: 15000 });
  ok(await ate(async () => (await A.$$eval(G('[data-campo="turma-cobrinha"] option'), (o) => o.map((x) => x.textContent).join('|'))).includes('Manhã: 2 alunos jogando'), 8000),
    'a instrutora vê "Manhã: 2 alunos jogando" na escolha de arena');
  await A.selectOption(G('[data-campo="turma-cobrinha"]'), 'Manhã');
  await vivos(p1, p2);
  await A.click(G('[data-acao="assistir-cobrinha"]'));
  ok(await ate(async () => { await vivos(p1, p2); const r = await arenaDe(A); return r.eu.espectador && r.c.some((x) => x[1] === 'Ana') && r.c.some((x) => x[1] === 'Bruno'); }, 10000),
    'assistindo à arena inteira da Manhã, a instrutora vê a Ana e o Bruno');
  await A.screenshot({ path: foto('cobrinha-03-instrutora-assistindo.png') });
  await A.evaluate(() => CE.api.chamar('cobrinha:configurar', { robos: false }));
  await vivos(p1, p2);
  ok(await ate(async () => { await vivos(p1, p2); const r = await arenaDe(p2); return r.total === 2 && !r.rk.some((x) => x[3]); }, 10000), 'a instrutora desliga os robôs: o Bruno vê só gente na arena (2 cobrinhas)');
  await A.evaluate(() => CE.api.chamar('cobrinha:configurar', { robos: true }));
  await A.evaluate(() => CE.api.chamar('cobrinha:configurar', { aberta: false }));
  for (const [p, nome] of [[p1, 'Ana'], [p2, 'Bruno']]) {
    ok(await ate(async () => (await p.isVisible(G('[data-tela="fechada"]'))) && (await p.isDisabled(G('[data-acao="jogar-cobrinha"]'))), 10000), `a instrutora fecha a arena: ${nome} sai e vê "fechada" (o botão Jogar apaga)`);
  }
  ok(/fechou a arena/.test(await p1.textContent(G('.ag-capa'))), 'a Ana vê o aviso "O professor fechou a arena"');
  await p1.screenshot({ path: foto('cobrinha-04-arena-fechada.png') });
  ok(/fechada/.test(await p2.evaluate(() => CE.api.chamar('cobrinha:entrar').then(() => 'entrou', (e) => e.message))), 'com a arena fechada, o Bruno não consegue entrar');
  await A.evaluate(() => CE.api.chamar('cobrinha:configurar', { aberta: true }));
  ok(await ate(async () => p1.isEnabled(G('[data-acao="jogar-cobrinha"]')), 10000), 'a instrutora abre de novo: o botão Jogar da Ana acende');
  await p1.click(G('[data-acao="jogar-cobrinha"]'));
  ok(await ate(async () => (await arenaDe(p1)).eu.vivo), 'a Ana volta para a arena');

  // ================= Quem fecha a janela sai; nada fica nos computadores dos alunos =================
  await p1.evaluate(() => CE.janelas.fechar('cobrinha'));
  ok(await ate(async () => { const e = await estadoDe(A); const m = (e.salas || []).find((s) => s.turma === 'Manhã'); return !!m && m.gente === 0; }, 8000),
    'a Ana fecha a janela e sai da arena (o Bruno também está fora, desde que a arena fechou)');
  const locais = pcs.flatMap(({ D }) => fs.readdirSync(path.join(D, 'dados')).filter((f) => f !== 'sala.json'));
  ok(!locais.length, `nada ficou guardado nos computadores dos alunos${locais.length ? ': ' + locais.join(', ') : ''}`);
  const relevantes = erros.filter((e) => !/net::ERR|Failed to load resource/.test(e));
  ok(!relevantes.length, 'sem erros nas telas' + (relevantes.length ? ': ' + relevantes.slice(0, 5).join(' | ') : ''));
  await Promise.all([I.app, ...pcs.map((x) => x.app)].map((a) => a.close().catch(() => {})));
  console.log(`\nCapturas de tela: ${TELAS}`);
  console.log(falhas ? `FALHAS ${falhas}` : 'FALHAS 0');
  process.exit(falhas ? 1 : 0);
})().catch(async (e) => { console.error(e); console.log('FALHAS 1'); process.exit(1); });
