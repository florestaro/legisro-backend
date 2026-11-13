// Teste das novidades da fase 3 na rede da sala, com o programa de verdade: 1 computador do instrutor (servidor) e
// 3 computadores de aluno. Confere que:
//  • o que a aluna faz num computador (o MEI aberto, o anúncio com foto na Feira Online e o formulário em PDF
//    preenchido) aparece em outro computador, entrando com o mesmo nome e senha;
//  • a MONITORIA funciona entre computadores: o monitor (escolhido pela instrutora) vê o "🙋 Não entendi" da colega,
//    avisa que vai ajudar, ela recebe o aviso na tela dela, e a ajuda fica contada no computador do instrutor.
//
//   npm run teste:fase3
//   Linux sem tela: xvfb-run -a npm run teste:fase3
//
// Precisa da porta 47123 livre (ou outra: PORTA=47199 npm run teste:fase3). Leva uns 3 minutos.
const { _electron: electron } = require('playwright-core');
const fs = require('fs'); const os = require('os'); const path = require('path');
const CODIGO = '682915', PORTA = Number(process.env.PORTA || 47123), URL = `http://127.0.0.1:${PORTA}`;
const EXE = require('electron');
const APP = path.join(__dirname, '..');
const RAIZ = fs.mkdtempSync(path.join(os.tmpdir(), 'computador-escola-teste-fase3-'));
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
async function entrar(p, aluno) {
  await p.waitForSelector('.login-usuario', { timeout: 60000 });
  await p.click(`.login-usuario:has(.login-nome:text-is("${aluno.nome}"))`);
  await p.fill('.login-caixa input', aluno.senha); await p.keyboard.press('Enter');
  await p.waitForSelector('#professor .prof-cartao', { timeout: 60000 });
  await p.waitForTimeout(800);
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
const N = (s) => J('navegador', s), L = (s) => J('leitor-pdf', s);
const ir = async (p, url) => {
  if (!(await p.evaluate(() => CE.janelas.estaAberta('navegador')))) { await p.evaluate(() => CE.janelas.abrir('navegador')); await p.waitForTimeout(800); }
  await p.fill(N('.nav-endereco-caixa input'), url); await p.keyboard.press('Enter'); await p.waitForTimeout(800);
};
const responder = async (p, v) => { await p.waitForSelector('.dialogo-fundo .dialogo input.campo'); await p.fill('.dialogo-fundo .dialogo input.campo', v); await p.click('.dialogo-fundo .botao:has-text("OK")'); await p.waitForTimeout(700); };

(async () => {
  if (!(await portaLivre(PORTA))) {
    console.error(`A porta ${PORTA} já está em uso. Feche o Computador Escola que está como "Computador do INSTRUTOR" ou use outra porta (PORTA=47199 npm run teste:fase3).`);
    fs.rmSync(RAIZ, { recursive: true, force: true });
    process.exit(1);
  }
  // ---------------- Instrutora: cadastra Ana e Bruno e escolhe o Bruno como monitor ----------------
  const I = await abrir(DI, 'instrutor'); const A = I.p;
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
  const usuarios = JSON.parse(fs.readFileSync(path.join(DI, 'dados', 'usuarios.json'), 'utf8'));
  const idAna = usuarios.find((u) => u.nome === ANA.nome).id, idBruno = usuarios.find((u) => u.nome === BRUNO.nome).id;
  await A.click(P('[data-aba="turma"]')); await A.waitForSelector(P(`[data-monitor="${BRUNO.nome}"]`));
  await A.check(P(`[data-monitor="${BRUNO.nome}"]`)); await A.waitForTimeout(1000);
  const prBrunoDisco = JSON.parse(fs.readFileSync(path.join(DI, 'dados', `progresso-${idBruno}.json`), 'utf8'));
  ok(prBrunoDisco.monitor === true, 'instrutora escolheu o Bruno como monitor pelo Painel (guardado no computador dela)');

  const pcs = await Promise.all([1, 2, 3].map(async (n) => {
    const D = pastaPc(`aluno-${n}`);
    fs.writeFileSync(path.join(D, 'dados', 'sala.json'), JSON.stringify({ modo: 'aluno', servidor: URL, codigo: CODIGO }));
    return { ...(await abrir(D, `PC ${n}`)), D, n };
  }));
  const [p1, p2, p3] = pcs.map((x) => x.p);
  ok(pcs.length === 3, '3 computadores de aluno ligados no servidor da sala');

  // ================= PC 1: a Ana abre o MEI, anuncia e preenche um PDF =================
  await entrar(p1, ANA);
  await ir(p1, 'empreendedor.org.br/formalizar');
  await p1.fill(N('[name="nome"]'), ANA.nome); await p1.fill(N('[name="cpf"]'), '123.456.789-09'); await p1.selectOption(N('[name="ocupacao"]'), 'Doceira / confeiteira');
  await p1.fill(N('[name="bairro"]'), 'Centro'); await p1.check(N('[name="declaracao"]')); await p1.click(N('.cd-form .cd-botao')); await p1.waitForTimeout(900);
  ok(!!(await p1.$(N('[data-cnpj]'))), 'PC 1: MEI aberto no Portal do Empreendedor (CNPJ de treino)');
  await p1.evaluate(() => CE.L.garantirArquivo('Foto do bolo de pote', CE.celular.imagemDe({ cena: 'bolo' }), 'imagem'));
  await ir(p1, 'feiraonline.com.br/anunciar');
  await p1.fill(N('[name="titulo"]'), 'Bolo de pote da Ana'); await p1.fill(N('[name="preco"]'), '12,00'); await p1.fill(N('[name="descricao"]'), 'Bolo de pote de chocolate, 250 ml. Entrego no bairro.');
  await p1.click(N('[data-site-acao="escolher-foto"]')); await p1.waitForTimeout(500);
  await p1.click('.escolher-arquivo [data-escolher="Foto do bolo de pote"]'); await p1.waitForTimeout(1200);
  await p1.click(N('.fo-form button[type="submit"]')); await p1.waitForTimeout(1000);
  ok(!!(await p1.$(N('[data-anuncio-publicado="Bolo de pote da Ana"]'))), 'PC 1: anúncio com foto publicado na Feira Online');
  await p1.evaluate(async () => {
    const a = await CE.sessao.salvarArquivo({ nome: 'Ficha da Ana', tipo: 'pdf', conteudo: CE.pdf.montar({}, ['<p>Nome: <span class="pdf-campo" data-campo="nome" data-rotulo="Nome"></span></p><p>Curso: <span class="pdf-campo" data-campo="curso" data-rotulo="Curso"></span></p>']) });
    CE.janelas.fecharTodas(); CE.janelas.abrir('leitor-pdf', { arquivo: a });
  });
  await p1.waitForTimeout(800);
  for (const [k, v] of [['nome', 'Ana Souza'], ['curso', 'Informática']]) { await p1.fill(L(`[data-campo-pdf="${k}"]`), v); await p1.press(L(`[data-campo-pdf="${k}"]`), 'Tab'); await p1.waitForTimeout(300); }
  await p1.click(L('[data-comando="salvar-formulario"]')); await responder(p1, 'Ficha da Ana preenchida');
  ok(await p1.evaluate(async () => { const a = (await CE.sessao.arquivos()).find((x) => x.nome === 'Ficha da Ana preenchida'); return !!a && CE.pdf.campos(a.conteudo).curso === 'Informática'; }), 'PC 1: formulário em PDF preenchido e salvo');
  await p1.evaluate(() => CE.sessao.atualizarProgresso(() => {})); await p1.waitForTimeout(1500);
  await p1.screenshot({ path: foto('fase3-01-pc1.png') });
  await sair(p1);

  // ================= PC 2: a mesma Ana em outro computador =================
  await entrar(p2, ANA);
  await ir(p2, 'empreendedor.org.br/painel');
  const cnpj = (await p2.textContent(N('[data-cnpj]')).catch(() => '')) || '';
  ok(/12\.345\.678\/0001-90/.test(cnpj), 'PC 2: o MEI aberto no PC 1 aparece no Portal do Empreendedor');
  await ir(p2, 'feiraonline.com.br/meus');
  ok(!!(await p2.$(N('[data-meu-anuncio="Bolo de pote da Ana"] img'))), 'PC 2: o anúncio com a foto, feito no PC 1, está em "Meus anúncios"');
  ok(await p2.evaluate(async () => { const a = (await CE.sessao.arquivos()).find((x) => x.nome === 'Ficha da Ana preenchida'); return !!a && CE.pdf.campos(a.conteudo).nome === 'Ana Souza'; }), 'PC 2: o PDF preenchido no PC 1 está nos arquivos dela, com o que foi escrito');
  await p2.screenshot({ path: foto('fase3-02-pc2.png') });

  // ================= Monitoria: o Bruno (PC 3) ajuda a Ana (PC 2) =================
  await entrar(p3, BRUNO);
  ok(await p3.isVisible('#status-monitor'), 'PC 3: o Bruno (monitor) vê o 💁 na barra de tarefas');
  await p2.evaluate(() => { window.__monitorVindo = null; CE.ouvir('sala:monitor-vindo', (d) => { window.__monitorVindo = d.nome; }); });
  await p2.evaluate(() => CE.professor.comecarLicao(CE.LICOES[0].id)); await p2.waitForTimeout(800);
  await p2.click('#prof-licao [data-acao="nao-entendi"]'); await p2.waitForTimeout(500);
  const chegou = await p3.waitForFunction(() => /💁\d/.test(document.getElementById('status-monitor').textContent), null, { timeout: 25000 }).then(() => true).catch(() => false);
  ok(chegou, 'PC 3: o pedido de ajuda da Ana chegou no 💁 do Bruno (com o número de pedidos)');
  await p3.click('#status-monitor'); await p3.waitForSelector(J('monitoria', `[data-pedido="${ANA.nome}"]`), { timeout: 15000 }).catch(() => {});
  ok(!!(await p3.$(J('monitoria', `[data-pedido="${ANA.nome}"] [data-acao="monitor-ajudar"]`))), 'PC 3: a Monitoria mostra a Ana, com o botão "🙋 Vou ajudar"');
  await p3.click(J('monitoria', `[data-pedido="${ANA.nome}"] [data-acao="monitor-ajudar"]`)); await p3.waitForTimeout(800);
  const avisada = await p2.waitForFunction(() => window.__monitorVindo, null, { timeout: 25000 }).then(() => true).catch(() => false);
  ok(avisada && await p2.evaluate(() => window.__monitorVindo) === BRUNO.nome, 'PC 2: a Ana recebeu na tela dela: "Bruno Lima, monitor(a) da turma, está vindo te ajudar!"');
  await A.click(P('[data-aba="sala"]')); await A.waitForTimeout(3500);
  ok(/Bruno Lima está indo ajudar/.test(await A.textContent(P('.painel-cartao[data-aluno-online="Ana Souza"]')).catch(() => '')), 'instrutora: a Sala ao vivo mostra que o Bruno está indo ajudar a Ana');
  await A.screenshot({ path: foto('fase3-03-sala-ao-vivo.png') });
  await p3.waitForSelector(J('monitoria', `[data-pedido="${ANA.nome}"] [data-acao="monitor-ajudei"]`), { timeout: 10000 }).catch(() => {});
  await p3.click(J('monitoria', `[data-pedido="${ANA.nome}"] [data-acao="monitor-ajudei"]`)); await p3.waitForTimeout(1500);
  await p3.screenshot({ path: foto('fase3-04-monitoria.png') });
  await p3.waitForTimeout(3000);
  const prBruno = JSON.parse(fs.readFileSync(path.join(DI, 'dados', `progresso-${idBruno}.json`), 'utf8'));
  ok(prBruno.ajudas === 1 && prBruno.medalhas && prBruno.medalhas.monitor, 'disco do instrutor: 1 ajuda contada para o Bruno e a medalha 💁 Monitor da turma');

  // ================= Onde os dados ficaram =================
  const prAna = JSON.parse(fs.readFileSync(path.join(DI, 'dados', `progresso-${idAna}.json`), 'utf8'));
  ok(prAna.mei && prAna.mei.cnpj && prAna.feira && prAna.feira.anuncios.some((a) => a.titulo === 'Bolo de pote da Ana' && a.foto), 'disco do instrutor: o MEI e o anúncio (com a foto) da Ana');
  const locais = pcs.flatMap(({ D }) => fs.readdirSync(path.join(D, 'dados')).filter((f) => f !== 'sala.json'));
  ok(!locais.length, `nada ficou guardado nos computadores dos alunos${locais.length ? ': ' + locais.join(', ') : ''}`);
  const relevantes = erros.filter((e) => !/net::ERR|Failed to load resource/.test(e));
  ok(!relevantes.length, 'sem erros nas telas' + (relevantes.length ? ': ' + relevantes.slice(0, 5).join(' | ') : ''));
  await Promise.all([I.app, ...pcs.map((x) => x.app)].map((a) => a.close().catch(() => {})));
  console.log(`\nCapturas de tela: ${TELAS}`);
  console.log(falhas ? `FALHAS ${falhas}` : 'FALHAS 0');
  process.exit(falhas ? 1 : 0);
})().catch(async (e) => { console.error(e); console.log('FALHAS 1'); process.exit(1); });
