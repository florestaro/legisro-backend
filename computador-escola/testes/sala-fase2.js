// Teste das novidades da fase 2 na rede da sala, com o programa de verdade: 1 computador do instrutor (servidor) e
// 3 computadores de aluno. Confere que o aluno pode usar QUALQUER computador da sala com o mesmo nome e senha e
// encontra tudo o que fez: o Celular (PIN e letra grande), a empresa do Gestão Fácil, as fotos salvas, a missão da
// semana, as matérias do jornal, as medalhas e a gincana. Nada fica guardado no computador do aluno.
//
//   npm run teste:fase2
//   Linux sem tela: xvfb-run -a npm run teste:fase2
//
// Precisa da porta 47123 livre (ou outra: PORTA=47199 npm run teste:fase2). Leva uns 3 minutos.
const { _electron: electron } = require('playwright-core');
const fs = require('fs'); const os = require('os'); const path = require('path');
const CODIGO = '582914', PORTA = Number(process.env.PORTA || 47123), URL = `http://127.0.0.1:${PORTA}`;
const EXE = require('electron');
const APP = path.join(__dirname, '..');
const RAIZ = fs.mkdtempSync(path.join(os.tmpdir(), 'computador-escola-teste-fase2-'));
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
  await p.addStyleTag({ content: '*{animation-duration:0s!important;transition-duration:0s!important}' }).catch(() => {});
  return { app, p };
};
function portaLivre(porta) {
  return new Promise((resolver) => { const s = require('net').createServer(); s.once('error', () => resolver(false)); s.listen(porta, '0.0.0.0', () => s.close(() => resolver(true))); });
}
const J = (app, s) => `.janela[data-app="${app}"] ${s}`;

// Entrar com nome e senha (na primeira vez, "Estou começando" e fecha a aula).
async function entrar(p, aluno, { convite } = {}) {
  await p.waitForSelector('.login-usuario', { timeout: 60000 });
  await p.click(`.login-usuario:has(.login-nome:text-is("${aluno.nome}"))`);
  await p.fill('.login-caixa input', aluno.senha); await p.keyboard.press('Enter');
  await p.waitForSelector('#professor .prof-cartao', { timeout: 60000 });
  await p.waitForTimeout(800);
  if (convite) return;
  const comecar = await p.$('#prof-licao [data-acao="comecar"]');
  if (comecar) {
    await comecar.click();
    await p.waitForFunction(() => /Passo 1 de/.test(document.querySelector('#prof-licao').textContent), null, { timeout: 30000 });
    await p.evaluate(() => CE.sessao.atualizarProgresso(() => {}));
    await p.evaluate(() => { CE.professor.pararLicao && CE.professor.pararLicao(); });
  }
  await p.evaluate(() => CE.janelas.fecharTodas());
}
async function sair(p) { await p.evaluate(() => CE.sairDoSistema()); await p.waitForSelector('.login-usuario', { timeout: 30000 }); }
const abrirApp = async (p, id, arg) => { await p.evaluate(([a, g]) => { CE.janelas.fecharTodas(); CE.janelas.abrir(a, g); }, [id, arg]); await p.waitForTimeout(900); };
const responderDialogo = async (p, valor) => { await p.waitForSelector('.dialogo-fundo .dialogo input.campo'); await p.fill('.dialogo-fundo .dialogo input.campo', valor); await p.click('.dialogo-fundo .botao:has-text("OK")'); await p.waitForTimeout(600); };
const progresso = (p) => p.evaluate(() => CE.sessao.progresso());

(async () => {
  if (!(await portaLivre(PORTA))) {
    console.error(`A porta ${PORTA} já está em uso. Feche o Computador Escola que está como "Computador do INSTRUTOR" ou use outra porta (PORTA=47199 npm run teste:fase2).`);
    fs.rmSync(RAIZ, { recursive: true, force: true });
    process.exit(1);
  }
  // ---------------- Computador do instrutor ----------------
  const I = await abrir(DI, 'instrutor'); const A = I.p;
  const c = A.locator('.login-caixa input'); await c.nth(0).fill('Professora Rita'); await c.nth(1).fill('1234'); await c.nth(2).fill('1234');
  await A.click('text=Cadastrar e entrar'); await A.waitForSelector('#professor .prof-cartao');
  const P = (s) => J('instrutor', s);
  await abrirApp(A, 'instrutor');
  await A.click(P('[data-aba="alunos"]')); await A.waitForSelector(P('.painel-form'));
  for (const a of [ANA, BRUNO]) {
    const campos = A.locator(P('.painel-form input.campo'));
    await campos.nth(0).fill(a.nome); await campos.nth(1).fill(a.turma); await campos.nth(2).fill(a.senha);
    await A.click(P('.painel-form .botao:has-text("Cadastrar")'));
    await A.waitForFunction((nome) => [...document.querySelectorAll('.janela[data-app="instrutor"] .painel-tabela td')].some((td) => td.textContent === nome), a.nome, { timeout: 15000 });
  }
  const usuarios = JSON.parse(fs.readFileSync(path.join(DI, 'dados', 'usuarios.json'), 'utf8'));
  const idAna = usuarios.find((u) => u.nome === ANA.nome).id;
  ok(!!idAna && usuarios.some((u) => u.nome === BRUNO.nome), 'instrutora cadastrou Ana e Bruno pelo Painel');
  // Missão da semana escolhida pela instrutora
  await A.click(P('[data-aba="turma"]')); await A.waitForSelector(P('[data-campo="missao-semana"]'));
  await A.selectOption(P('[data-campo="missao-semana"]'), 'cartaz'); await A.waitForTimeout(1200);
  ok(await A.evaluate(() => CE.missao.atual().id) === 'cartaz', 'instrutora escolheu a missão da semana: "Faça uma imagem"');

  // ---------------- Três computadores de aluno ----------------
  const pcs = await Promise.all([1, 2, 3].map(async (n) => {
    const D = pastaPc(`aluno-${n}`);
    fs.writeFileSync(path.join(D, 'dados', 'sala.json'), JSON.stringify({ modo: 'aluno', servidor: URL, codigo: CODIGO }));
    return { ...(await abrir(D, `PC ${n}`)), D, n };
  }));
  const [pc1, pc2, pc3] = pcs;
  ok(pcs.length === 3, '3 computadores de aluno ligados no servidor da sala');

  // ================= PC 1: a Ana usa as novidades =================
  const p1 = pc1.p;
  await entrar(p1, ANA);
  ok(await p1.evaluate(() => CE.sessao.usuario.nome) === ANA.nome, 'PC 1: Ana entrou com o nome e a senha dela');
  ok(await p1.isVisible('#status-missao') && /pendente/.test(await p1.getAttribute('#status-missao', 'class')), 'PC 1: a missão da semana aparece pendente na barra (🎯)');
  // Celular: letra grande e PIN
  const C = (s) => J('celular', s);
  const toque = async (p, s, ms = 350) => { await p.click(C(s)); await p.waitForTimeout(ms); };
  await abrirApp(p1, 'celular');
  await toque(p1, '[data-acao="cel-desbloquear"]');
  await toque(p1, '[data-acao="cel-inicio"]'); await toque(p1, '[data-cel-app="ajustes"]');
  await toque(p1, '[data-ajuste="tela"]'); await toque(p1, '[data-letra="grande"]');
  await toque(p1, '[data-acao="cel-voltar-topo"]'); await toque(p1, '[data-ajuste="seguranca"]');
  await p1.fill(C('[data-campo="pin-novo"]'), '7391'); await toque(p1, '[data-acao="salvar-pin"]', 800);
  ok(/letra-grande/.test(await p1.getAttribute(C('.cel-aparelho'), 'class')), 'PC 1: Celular com letra grande e PIN 7391');
  // Gestão Fácil: um cliente novo
  const G = (s) => J('gestao', s);
  await abrirApp(p1, 'gestao');
  await p1.click(G('[data-gf-aba="clientes"]')); await p1.waitForTimeout(300);
  await p1.click(G('[data-gf-acao="novo-cliente"]')); await p1.waitForTimeout(300);
  for (const [k, v] of Object.entries({ nome: 'Mercadinho da Ana', doc: '34567891230', tel: '(69) 98123-4567', email: 'mercadinho@correio.escola', cidade: 'Porto Velho' })) await p1.fill(`.dialogo [data-gf-campo="${k}"]`, v);
  await p1.click('.dialogo [data-gf-acao="confirmar"]'); await p1.waitForTimeout(900);
  ok(!!(await p1.$(G('[data-gf-cliente="Mercadinho da Ana"]'))), 'PC 1: cliente "Mercadinho da Ana" cadastrado no Gestão Fácil');
  // Editor de Fotos: salva uma foto (cumpre a missão)
  const F = (s) => J('fotos', s);
  await abrirApp(p1, 'fotos');
  await p1.click(F('[data-comando="abrir"]')); await p1.waitForTimeout(400); await p1.click('.dialogo [data-exemplo="bolo"]'); await p1.waitForTimeout(800);
  await p1.click(F('[data-comando="girar"]')).catch(() => {}); await p1.waitForTimeout(300);
  await p1.click(F('[data-comando="salvar"]')); await responderDialogo(p1, 'Bolo da Ana');
  await p1.waitForFunction(() => document.getElementById('status-missao').textContent.includes('✅'), null, { timeout: 15000 }).catch(() => {});
  ok((await p1.textContent('#status-missao')).includes('✅'), 'PC 1: foto salva e a missão da semana cumprida (🎯✅)');
  // Jornal: manda uma matéria pelo Editor de Texto
  const E = (s) => J('editor', s);
  await abrirApp(p1, 'editor');
  await p1.evaluate(() => { const pg = document.querySelector('.janela[data-app="editor"] .editor-pagina'); pg.innerHTML = '<h2>Notícia da Ana</h2><p>A turma da manhã aprendeu a usar o celular com segurança e a cadastrar clientes no sistema da empresa.</p>'; pg.dispatchEvent(new Event('input', { bubbles: true })); });
  await p1.click(E('[data-comando="jornal"]')); await p1.waitForSelector('[data-acao="confirmar-jornal"]');
  await p1.click('[data-acao="confirmar-jornal"]'); await p1.waitForTimeout(1500);
  ok(!(await p1.$('[data-acao="confirmar-jornal"]')), 'PC 1: matéria "Notícia da Ana" enviada para o jornal da turma');
  await p1.evaluate(() => CE.sessao.atualizarProgresso(() => {})); await p1.waitForTimeout(3000); // medalhas gravadas
  await p1.screenshot({ path: foto('fase2-01-pc1-ana.png') });
  await sair(p1);

  // ================= PC 2: a mesma Ana em OUTRO computador =================
  const p2 = pc2.p;
  await entrar(p2, ANA);
  ok(await p2.evaluate(() => CE.sessao.usuario.nome) === ANA.nome, 'PC 2: Ana entrou em outro computador com o mesmo nome e senha');
  ok((await p2.textContent('#status-missao')).includes('✅'), 'PC 2: a missão cumprida no PC 1 aparece cumprida (🎯✅)');
  await abrirApp(p2, 'celular');
  ok(/letra-grande/.test(await p2.getAttribute(C('.cel-aparelho'), 'class')), 'PC 2: o Celular continua com a letra grande');
  await toque(p2, '[data-acao="cel-desbloquear"]');
  ok(!!(await p2.$(C('[data-pin-visor]'))), 'PC 2: o Celular pede o PIN criado no PC 1');
  for (const d of '7391') await toque(p2, `[data-tecla="${d}"]`, 120);
  await p2.waitForTimeout(300);
  ok((await p2.getAttribute(C('.cel-tela'), 'data-tela')) !== 'bloqueio', 'PC 2: o PIN 7391 desbloqueia o Celular');
  await abrirApp(p2, 'gestao');
  await p2.click(G('[data-gf-aba="clientes"]')); await p2.waitForTimeout(500);
  ok(!!(await p2.$(G('[data-gf-cliente="Mercadinho da Ana"]'))), 'PC 2: o cliente cadastrado no PC 1 está no Gestão Fácil');
  const arqs2 = await p2.evaluate(async () => (await CE.sessao.arquivos()).filter((a) => !a.naLixeira).map((a) => `${a.nome}|${a.tipo}`));
  ok(arqs2.some((a) => a.startsWith('Bolo da Ana|')), `PC 2: a foto "Bolo da Ana" está nos arquivos dela (${arqs2.join(', ')})`);
  await abrirApp(p2, 'editor');
  await p2.click(E('[data-comando="jornal"]')); await p2.waitForSelector('.jornal-minhas', { timeout: 10000 }).catch(() => {});
  ok(/Notícia da Ana/.test((await p2.textContent('.jornal-minhas').catch(() => '')) || ''), 'PC 2: no 📰 Jornal, a Ana vê a matéria mandada do PC 1');
  await p2.click('.dialogo-fundo .botao.secundario'); await p2.waitForTimeout(300);
  const pr2 = await progresso(p2);
  ok(pr2.medalhas && pr2.medalhas['missao-1'] && pr2.medalhas.reporter, 'PC 2: as medalhas 🎯 Missão cumprida e 📰 Repórter ganhas no PC 1 estão lá');
  await p2.screenshot({ path: foto('fase2-02-pc2-ana.png') });

  // ================= Gincana ao vivo: Ana (PC 2) e Bruno (PC 3) =================
  const p3 = pc3.p;
  await entrar(p3, BRUNO);
  await abrirApp(A, 'instrutor'); await A.click(P('[data-aba="turma"]')); await A.waitForSelector(P('[data-acao="abrir-programa-gincana"]'));
  await A.click(P('[data-acao="abrir-programa-gincana"]')); await A.waitForTimeout(1200);
  const GI = (s) => J('gincana', s);
  await A.selectOption(GI('[data-campo="perguntas-gincana"]'), '5');
  await A.uncheck(GI('[data-tarefa-gincana="soma"]'));
  await A.selectOption(GI('[data-campo="equipes-gincana"]'), '2');
  await A.fill(GI('[data-campo="titulo-gincana"]'), 'Gincana da manhã');
  await A.click(GI('[data-acao="abrir-gincana"]')); await A.waitForTimeout(800);
  // O convite chega pela presença (a cada 8 s)
  const convites = await Promise.all([p2, p3].map((p) => p.waitForSelector('.gincana-convite', { timeout: 30000 }).then(() => true).catch(() => false)));
  ok(convites.every(Boolean), 'o convite "🏆 Gincana!" apareceu na tela da Ana (PC 2) e do Bruno (PC 3)');
  for (const p of [p2, p3]) { await p.click('[data-acao="entrar-gincana"]'); await p.waitForSelector(GI('[data-gincana-aluno="espera"]'), { timeout: 15000 }).catch(() => {}); }
  await A.waitForFunction(() => /2 na gincana/.test(document.querySelector('.janela[data-app="gincana"] .gc-espera').textContent), null, { timeout: 15000 }).catch(() => {});
  ok(/2 na gincana/.test(await A.textContent(GI('.gc-espera'))), 'telão da instrutora: 2 alunos na gincana');
  await A.click(GI('[data-acao="comecar-gincana"]')); await A.waitForTimeout(1500);
  const certa = (p) => p.evaluate(async () => {
    const r = (await CE.api.chamar('gincana:estado')).rodada;
    if (!r || r.tipo !== 'pergunta') return -1;
    const q = CE.LICOES.flatMap((l) => l.passos.filter((x) => x.quiz).map((x) => x.quiz)).find((x) => x.pergunta === r.pergunta);
    return r.opcoes.indexOf(q.opcoes[q.correta]);
  });
  let rodadas = 0;
  for (; rodadas < 8; rodadas++) {
    const e = await A.evaluate(() => CE.api.chamar('gincana:estado'));
    if (e.fase === 'fim') break;
    if (e.rodada.tipo === 'tarefa') {
      await p2.waitForSelector(GI('[data-gincana-aluno="tarefa"]'), { timeout: 15000 }).catch(() => {});
      await p2.evaluate(() => CE.janelas.abrir('calculadora')); await p2.waitForTimeout(2000);
      await A.waitForSelector(GI('[data-acao="fechar-rodada"]'), { timeout: 10000 }).catch(() => {});
      await A.click(GI('[data-acao="fechar-rodada"]')).catch(() => {}); await A.waitForTimeout(1500);
    } else {
      await Promise.all([p2, p3].map(async (p, k) => {
        await p.evaluate(() => { CE.janelas.abrir('gincana'); });
        await p.waitForSelector(GI('[data-opcao-gincana]:not([disabled])'), { timeout: 15000 });
        const c2 = await certa(p);
        const n = (await p.$$(GI('[data-opcao-gincana]'))).length;
        await p.click(GI(`[data-opcao-gincana="${k === 0 ? c2 : (c2 + 1) % n}"]`));
      }));
      await A.waitForSelector(GI('[data-acao="proxima-rodada"]'), { timeout: 15000 }).catch(() => {});
    }
    if (rodadas === 0) await A.screenshot({ path: foto('fase2-03-gincana-telao.png') });
    await A.click(GI('[data-acao="proxima-rodada"]')); await A.waitForTimeout(1500);
  }
  const fim = await A.evaluate(() => CE.api.chamar('gincana:estado'));
  ok(fim.fase === 'fim' && rodadas === 6, `a gincana passou pelas 6 rodadas (5 perguntas + 1 tarefa) e terminou (${rodadas} rodadas)`);
  ok(fim.participantes[0].nome === ANA.nome && fim.participantes[0].pontos >= 600 && fim.participantes[1].pontos === 0, `placar: Ana em 1º com ${fim.participantes[0].pontos} pontos (acertou tudo e fez a tarefa), Bruno com ${fim.participantes[1].pontos}`);
  await Promise.all([p2, p3].map((p) => p.waitForSelector(GI('[data-gincana-fim]'), { timeout: 15000 }).then(() => true).catch(() => false)));
  ok(!!(await p2.$(GI('[data-gincana-fim]'))) && !!(await p3.$(GI('[data-gincana-fim]'))), 'o pódio aparece também nos computadores da Ana e do Bruno');
  await p2.screenshot({ path: foto('fase2-04-gincana-pc2.png') });
  await p2.waitForTimeout(3500); // participação gravada e medalhas conferidas

  // ================= PC 3: a Ana agora no terceiro computador =================
  await sair(p3); await sair(p2);
  await entrar(p3, ANA);
  const pr3 = await progresso(p3);
  ok(Object.values(pr3.gincanas || {}).some((g) => g.lugar === 1) && pr3.medalhas.gincana && pr3.medalhas['gincana-podio'], 'PC 3: a gincana feita no PC 2 está no progresso da Ana, com as medalhas 🏁 e 🥇');
  ok(pr3.celular && pr3.celular.pin === '7391' && pr3.celular.letra === 'grande', 'PC 3: o Celular dela continua com PIN e letra grande');
  ok((await p3.textContent('#status-missao')).includes('✅'), 'PC 3: missão da semana cumprida');

  // ================= Instrutora aprova e monta o jornal =================
  await abrirApp(A, 'instrutor'); await A.click(P('[data-aba="turma"]')); await A.waitForSelector(P('[data-secao-turma="jornal"]'));
  ok((await A.getAttribute(P(`[data-aluno-missao="${ANA.nome}"]`), 'data-cumpriu')) === 'sim' && (await A.getAttribute(P(`[data-aluno-missao="${BRUNO.nome}"]`), 'data-cumpriu')) === 'nao', 'Painel: a missão aparece cumprida pela Ana e pendente para o Bruno');
  ok(/Gincana da manhã/.test(await A.textContent(P('[data-secao-turma="gincana"]'))), 'Painel: resultado da última gincana');
  await A.click(P('.pt-materia[data-materia="Notícia da Ana"] [data-acao="aprovar-materia"]')); await A.waitForTimeout(900);
  await A.click(P('[data-acao="montar-jornal"]')); await A.waitForSelector('#area-impressao .pagina.jornal');
  const destaques = await A.textContent('#area-impressao .jn-destaques');
  ok(!!(await A.$('#area-impressao [data-materia-jornal="Notícia da Ana"]')) && /Ana Souza/.test(destaques) && /Gincana da manhã/.test(destaques), 'jornal montado: matéria da Ana e destaques (missão, medalhas e gincana)');
  await A.screenshot({ path: foto('fase2-05-jornal.png') });
  await A.click('#area-impressao [data-acao="fechar-impressao"]');
  await A.click(P('[data-acao="fechar-edicao"]')); await A.click('.dialogo-fundo .botao:has-text("Sim")'); await A.waitForTimeout(900);
  const minhas = await p3.evaluate(() => CE.api.chamar('jornal:minhas'));
  ok(minhas.length === 1 && minhas[0].status === 'publicada', 'PC 3: a Ana vê a matéria dela publicada');

  // ================= Onde os dados ficaram =================
  await espera(1500);
  const pasta = path.join(DI, 'dados');
  const ler = (k) => { try { return JSON.parse(fs.readFileSync(path.join(pasta, k + '.json'), 'utf8')); } catch { return null; } };
  const prDisco = ler(`progresso-${idAna}`) || {};
  const empresa = ler(`empresa-${idAna}`) || {};
  const arquivos = ler(`arquivos-${idAna}`) || [];
  ok(prDisco.celular && prDisco.celular.pin === '7391' && prDisco.missoes && Object.values(prDisco.missoes).some((m) => m.feita) && Object.keys(prDisco.gincanas || {}).length === 1 && prDisco.jornal && prDisco.jornal.enviadas === 1,
    'disco do instrutor: o progresso da Ana tem o Celular, a missão, a gincana e o jornal');
  ok(JSON.stringify(empresa).includes('Mercadinho da Ana') && arquivos.some((a) => a.nome === 'Bolo da Ana'), 'disco do instrutor: a empresa do Gestão Fácil e a foto da Ana');
  ok(((ler('jornal') || {}).publicadas || []).length === 1 && (ler('gincana-ultima') || {}).titulo === 'Gincana da manhã', 'disco do instrutor: o jornal e o resultado da gincana');
  const locais = pcs.flatMap(({ D }) => fs.readdirSync(path.join(D, 'dados')).filter((f) => f !== 'sala.json'));
  ok(!locais.length, `nada ficou guardado nos computadores dos alunos${locais.length ? ': ' + locais.join(', ') : ''}`);
  const chaves = (await Promise.all(pcs.map(({ p }) => p.evaluate(() => Object.keys(localStorage))))).flat();
  ok(!chaves.some((k) => /celular|empresa|progresso|jornal|missao|gincana|arquivos/i.test(k)), `nem no armazenamento do navegador dos alunos${chaves.length ? ' (chaves: ' + chaves.join(', ') + ')' : ''}`);

  const relevantes = erros.filter((e) => !/net::ERR|Failed to load resource/.test(e));
  ok(!relevantes.length, 'sem erros nas telas' + (relevantes.length ? ': ' + relevantes.slice(0, 5).join(' | ') : ''));
  await Promise.all([I.app, ...pcs.map((x) => x.app)].map((a) => a.close().catch(() => {})));
  console.log(`\nCapturas de tela: ${TELAS}`);
  console.log(falhas ? `FALHAS ${falhas}` : 'FALHAS 0');
  process.exit(falhas ? 1 : 0);
})().catch(async (e) => { console.error(e); console.log('FALHAS 1'); process.exit(1); });
