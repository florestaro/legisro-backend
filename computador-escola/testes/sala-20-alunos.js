// Teste da sala de aula com a turma inteira: 1 computador do instrutor (servidor) + N computadores de aluno
// (o programa de verdade, cada um com a sua pasta de dados), todos usando o sistema ao mesmo tempo.
//
//   npm run teste:sala            (20 alunos)
//   npm run teste:sala -- 5       (5 alunos, mais rápido)
//   Linux sem tela: xvfb-run -a npm run teste:sala
//
// Precisa da porta 47123 livre (feche o Computador Escola em modo "Computador do INSTRUTOR" antes) e de uns 6 GB de
// memória para 20 alunos. As capturas de tela ficam na pasta temporária do sistema (o caminho aparece no fim).
const { _electron: electron } = require('playwright-core');
const fs = require('fs'); const os = require('os'); const path = require('path'); const { execSync } = require('child_process');
const N = Number(process.argv[2] || process.env.N || 20);
if (!Number.isInteger(N) || N < 5 || N > 20) { console.error('O número de alunos vai de 5 a 20 (ex.: npm run teste:sala -- 5).'); process.exit(1); }
const CODIGO = '482913', PORTA = Number(process.env.PORTA || 47123), URL = `http://127.0.0.1:${PORTA}`;
const EXE = require('electron'); // o Electron instalado no projeto
const APP = path.join(__dirname, '..');
// Cada rodada tem a sua pasta: duas rodadas ao mesmo tempo não mexem uma nos dados da outra.
const RAIZ = fs.mkdtempSync(path.join(os.tmpdir(), 'computador-escola-teste-sala-'));
const TELAS = path.join(RAIZ, 'telas');
const foto = (nome) => path.join(TELAS, nome);
const NOMES = ['Ana Souza', 'Bruno Lima', 'Carla Dias', 'Diego Rocha', 'Elisa Melo', 'Fábio Nunes', 'Gabi Torres', 'Heitor Ramos', 'Iara Castro', 'João Pires',
  'Kátia Freitas', 'Lucas Moura', 'Marta Alves', 'Nilo Barros', 'Olga Teixeira', 'Paulo Reis', 'Quitéria Gomes', 'Rafael Cunha', 'Sônia Prado', 'Tiago Fontes'].slice(0, N);
const slug = (n) => n.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '');
const endereco = (n) => `${slug(n)}@correio.escola`;
const senha = (i) => `senha${String(i + 1).padStart(2, '0')}`;
let falhas = 0;
const ok = (c, m) => { console.log((c ? '✔ ' : '✘ ') + m); if (!c) { falhas++; process.exitCode = 1; } };
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const inicio = Date.now(); const T = () => ((Date.now() - inicio) / 1000).toFixed(1) + 's';
const erros = [];

fs.mkdirSync(TELAS, { recursive: true });
const pastaPc = (nome) => { const d = path.join(RAIZ, nome); fs.mkdirSync(path.join(d, 'dados'), { recursive: true }); return d; };
const DI = pastaPc('instrutor');
fs.writeFileSync(path.join(DI, 'dados', 'sala.json'), JSON.stringify({ modo: 'servidor', codigo: CODIGO, porta: PORTA }));
const abrir = async (D, rotulo) => {
  // CE_SEM_IA: os 21 programas não carregam a IA local, mesmo com um modelo .gguf na pasta modelos.
  const app = await electron.launch({ executablePath: EXE, args: ['--no-sandbox', '--disable-gpu', `--user-data-dir=${path.join(D, 'perfil')}`, APP, '--janela'], env: { ...process.env, PORTABLE_EXECUTABLE_DIR: D, CE_SEM_IA: '1' }, timeout: 120000 });
  const p = await app.firstWindow(); await p.setViewportSize({ width: 1366, height: 768 });
  p.on('pageerror', (e) => erros.push(`${rotulo}: ${e.message}`));
  p.on('console', (m) => { if (m.type() === 'error') erros.push(`${rotulo} (console): ${m.text().slice(0, 200)}`); });
  await p.addStyleTag({ content: '*{animation-duration:0s!important;transition-duration:0s!important}' }).catch(() => {});
  return { app, p };
};

// Sonda de latência: um pedido leve ao servidor a cada 250 ms durante todo o teste.
const latencias = []; let sondando = true; const falhasSonda = [];
async function sonda() {
  while (sondando) {
    const t0 = performance.now();
    try {
      const r = await fetch(URL + '/api', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-sala': CODIGO }, body: JSON.stringify({ canal: 'usuarios:existe-instrutor', args: [] }), signal: AbortSignal.timeout(10000) });
      await r.json(); latencias.push({ t: Date.now(), ms: performance.now() - t0 });
    } catch (e) { falhasSonda.push(`${T()} ${e.message}`); }
    await espera(250);
  }
}
const pct = (arr, q) => { const s = [...arr].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(q * s.length))] : 0; };
const resumoLat = (de, ate) => { const ms = latencias.filter((l) => l.t >= de && l.t <= ate).map((l) => l.ms); return ms.length ? `p50 ${pct(ms, 0.5).toFixed(0)} ms, p95 ${pct(ms, 0.95).toFixed(0)} ms, máx ${Math.max(...ms).toFixed(0)} ms (${ms.length} pedidos)` : 'sem dados'; };

// Barreira simples: todos os alunos esperam aqui até o último chegar.
function barreira(n) { let c = 0, soltar; const p = new Promise((r) => { soltar = r; }); return () => { if (++c >= n) soltar(); return p; }; }

async function seguirAula(p, idLicao, paciencia = 1) {
  let parado = 0;
  for (let i = 0; i < 60; i++) {
    await p.waitForTimeout(400);
    const texto = (await p.textContent('#prof-licao').catch(() => '')) || '';
    if (/Aula concluída|aprovada/.test(texto)) return true;
    if (await p.$('#prof-licao .prof-opcao')) {
      const n = Number((/Passo (\d+) de/.exec(texto) || [])[1] || 0);
      const certa = await p.evaluate(([id, n]) => CE.curso.licao(id).passos[n - 1].quiz.correta, [idLicao, n]);
      await p.click(`#prof-licao .prof-opcao[data-opcao="${certa}"]`); await p.waitForTimeout(200);
    }
    const cont = await p.$('#prof-licao [data-acao="continuar"]:not([hidden])');
    if (cont) { await cont.click().catch(() => {}); parado = 0; continue; }
    if (++parado >= paciencia) return false; // passo que pede uma ação
  }
  return false;
}

// A porta precisa estar livre (senão o teste conversaria com outro Computador Escola aberto como instrutor).
function portaLivre(porta) {
  return new Promise((resolver) => {
    const s = require('net').createServer();
    s.once('error', () => resolver(false));
    s.listen(porta, '0.0.0.0', () => s.close(() => resolver(true)));
  });
}

(async () => {
  if (!(await portaLivre(PORTA))) {
    console.error(`A porta ${PORTA} já está em uso. Feche o Computador Escola que está como "Computador do INSTRUTOR" ou rode com outra porta (veja testes/LEIA-ME.md).`);
    fs.rmSync(RAIZ, { recursive: true, force: true });
    process.exit(1);
  }
  // Memória somada dos Electron (só no Linux; a soma conta em dobro a memória compartilhada).
  const memoria = () => { if (process.platform !== 'linux') return ''; try { return `, memória dos Electron: ${Math.round(Number(execSync("ps -eo rss,comm | grep -i electron | awk '{s+=$1} END {print s}'").toString().trim()) / 1024)} MB`; } catch { return ''; } };
  // ---------------- Computador do instrutor ----------------
  const I = await abrir(DI, 'instrutor'); const A = I.p;
  const c = A.locator('.login-caixa input'); await c.nth(0).fill('Professora Rita'); await c.nth(1).fill('1234'); await c.nth(2).fill('1234');
  await A.click('text=Cadastrar e entrar'); await A.waitForSelector('#professor .prof-cartao');
  sonda();
  const J = (s) => `.janela[data-app="instrutor"] ${s}`;
  await A.evaluate(() => { CE.janelas.fecharTodas(); CE.janelas.abrir('instrutor'); }); await A.waitForTimeout(500);

  // ---------------- 1) 20 cadastros pela tela do Painel do Instrutor ----------------
  const t0Cad = Date.now();
  await A.click(J('[data-aba="alunos"]')); await A.waitForSelector(J('.painel-form'));
  for (let i = 0; i < N; i++) {
    const campos = A.locator(J('.painel-form input.campo'));
    await campos.nth(0).fill(NOMES[i]); await campos.nth(1).fill(i < N / 2 ? 'Manhã' : 'Tarde'); await campos.nth(2).fill(senha(i));
    if (i % 7 === 3) await A.check(J('#cadastro-crianca'));
    await A.click(J('.painel-form .botao:has-text("Cadastrar")'));
    await A.waitForFunction((nome) => [...document.querySelectorAll('.janela[data-app="instrutor"] .painel-tabela td')].some((td) => td.textContent === nome), NOMES[i], { timeout: 15000 });
  }
  const usuarios = JSON.parse(fs.readFileSync(path.join(DI, 'dados', 'usuarios.json'), 'utf8'));
  const alunos = usuarios.filter((u) => u.papel === 'aluno');
  ok(alunos.length === N && NOMES.every((n) => alunos.some((u) => u.nome === n)), `${N} alunos cadastrados pela tela do Painel (${((Date.now() - t0Cad) / 1000).toFixed(1)} s) — usuarios.json tem ${usuarios.length} contas`);
  const linhas = await A.$$eval(J('.painel-tabela tbody tr'), (trs) => trs.length);
  ok(linhas === N + 1, `tabela do Painel mostra ${linhas} contas (${N} alunos + instrutora)`);
  ok(alunos.filter((u) => u.turma === 'Manhã').length === Math.ceil(N / 2) && alunos.some((u) => u.crianca), 'turmas Manhã/Tarde e alunos crianças guardados');
  // Repetido e senha curta são recusados
  const campos = A.locator(J('.painel-form input.campo'));
  await campos.nth(0).fill(NOMES[0]); await campos.nth(2).fill('9999'); await A.click(J('.painel-form .botao:has-text("Cadastrar")')); await A.waitForTimeout(400);
  ok(/já existe/i.test(await A.textContent(J('.painel-form .login-erro'))), 'nome repetido é recusado');
  await campos.nth(0).fill('');
  await A.screenshot({ path: foto('carga-01-cadastros.png') });

  // A instrutora cria uma aula pela tela (Criar aulas) para a turma toda fazer.
  await A.click(J('[data-aba="criar"]')); await A.waitForTimeout(400);
  await A.click(J('[data-acao="nova-aula"]')); await A.waitForTimeout(300);
  await A.fill(J('[data-campo="titulo-aula"]'), 'Aula da turma toda'); await A.fill(J('[data-campo="descricao-aula"]'), 'Calculadora e pergunta');
  await A.fill(J('.painel-passo[data-passo="0"] [data-campo="texto"]'), 'Hoje todo mundo vai abrir a calculadora.');
  await A.click(J('[data-acao="add-quiz"]')); await A.waitForTimeout(200);
  await A.fill(J('.painel-passo[data-passo="1"] [data-campo="pergunta"]'), 'Quanto é 2 + 2?');
  await A.fill(J('.painel-passo[data-passo="1"] [data-campo="opcao-0"]'), '4'); await A.fill(J('.painel-passo[data-passo="1"] [data-campo="opcao-1"]'), '5');
  await A.check(J('.painel-passo[data-passo="1"] [data-campo="correta-0"]'));
  await A.click(J('[data-acao="add-tarefa"]')); await A.waitForTimeout(200);
  await A.selectOption(J('.painel-passo[data-passo="2"] [data-campo="parametro"]'), 'calculadora');
  await A.fill(J('[data-campo="conclusao-aula"]'), 'Parabéns, turma!');
  await A.click(J('[data-acao="salvar-aula"]')); await A.waitForTimeout(500);
  ok(!!(await A.$(J('.painel-aula[data-aula="Aula da turma toda"]'))), 'instrutora criou a aula da turma pela tela');

  // ---------------- 2) Ligar os 20 computadores de aluno ----------------
  const t0Lig = Date.now();
  const pcs = [];
  for (let lote = 0; lote < N; lote += 5) {
    const abertos = await Promise.all(NOMES.slice(lote, lote + 5).map(async (nome, k) => {
      const i = lote + k; const D = pastaPc(`aluno-${String(i + 1).padStart(2, '0')}`);
      fs.writeFileSync(path.join(D, 'dados', 'sala.json'), JSON.stringify({ modo: 'aluno', servidor: URL, codigo: CODIGO }));
      const pc = await abrir(D, nome); return { ...pc, i, nome, D };
    }));
    pcs.push(...abertos);
    console.log(`   ${T()} ${pcs.length} computadores ligados${memoria()}`);
  }
  ok(pcs.length === N, `${N} computadores de aluno ligados (${((Date.now() - t0Lig) / 1000).toFixed(0)} s)`);

  // ---------------- 3) Todos usam o sistema ao mesmo tempo ----------------
  const contasProntas = barreira(N), emailsEnviados = barreira(N);
  const t0Uso = Date.now();
  const r = await Promise.all(pcs.map(async ({ p, i, nome }) => {
    const res = { nome, etapas: [] };
    const etapa = async (rotulo, f) => { const t = Date.now(); try { await f(); res.etapas.push([rotulo, true, Date.now() - t]); } catch (e) { res.etapas.push([rotulo, false, Date.now() - t, e.message.split('\n')[0].slice(0, 160)]); await p.screenshot({ path: foto(`carga-falha-${i + 1}-${rotulo}.png`) }).catch(() => {}); } };
    await espera(i * 150); // os alunos não chegam todos no mesmo milissegundo
    await etapa('entrar', async () => {
      await p.waitForSelector('.login-usuario', { timeout: 60000 });
      await p.click(`.login-usuario:has(.login-nome:text-is("${nome}"))`);
      if (i === 2) { await p.fill('.login-caixa input', 'errada'); await p.keyboard.press('Enter'); await p.waitForSelector('.login-erro:has-text("incorreta")', { timeout: 20000 }); }
      await p.fill('.login-caixa input', senha(i)); await p.keyboard.press('Enter');
      await p.waitForSelector('#professor .prof-cartao', { timeout: 60000 });
      const quem = await p.evaluate(() => CE.sessao.usuario && CE.sessao.usuario.nome);
      if (quem !== nome) throw new Error('entrou como ' + quem);
    });
    await etapa('boas-vindas', async () => {
      await p.click('#prof-licao [data-acao="comecar"]', { timeout: 30000 }); // "Estou começando" grava o nivelamento pulado
      await p.waitForFunction(() => /Passo 1 de/.test(document.querySelector('#prof-licao').textContent), null, { timeout: 30000 });
      await p.evaluate(() => CE.sessao.atualizarProgresso(() => {})); // espera a gravação do nivelamento await p.evaluate(() => { CE.professor.pararLicao && CE.professor.pararLicao(); CE.janelas.fecharTodas(); });
    });
    await etapa('aula-do-professor', async () => {
      await p.evaluate(() => CE.janelas.abrir('aulas'));
      await p.click('.janela[data-app="aulas"] [data-nivel="professor"]', { timeout: 30000 });
      await p.click('.janela[data-app="aulas"] [data-licao^="prof-"] .botao', { timeout: 30000 });
      const id = await p.evaluate(() => CE.LICOES_EXTRAS[0].id);
      await seguirAula(p, id);
      await p.evaluate(() => CE.janelas.fecharTodas()); await p.waitForTimeout(300);
      await p.dblclick('.icone[data-icone="calculadora"]');
      if (!(await seguirAula(p, id, 25))) throw new Error('aula não concluiu: ' + ((await p.textContent('#prof-licao')) || '').slice(0, 120));
    });
    await etapa('editor-salvar', async () => {
      await p.evaluate(() => { CE.professor.pararLicao && CE.professor.pararLicao(); CE.janelas.fecharTodas(); CE.janelas.abrir('editor'); });
      await p.click('.janela[data-app="editor"] .editor-pagina', { timeout: 30000 });
      await p.keyboard.type(`Trabalho de ${nome}. Hoje aprendi a usar o computador na rede da escola.`);
      await p.click('.janela[data-app="editor"] [data-comando="salvar"]');
      await p.fill('.dialogo input', `Trabalho de ${nome}`); await p.click('.dialogo .botao:has-text("OK")');
      await p.waitForFunction(() => document.body.textContent.includes('salvo!'), null, { timeout: 30000 });
    });
    await etapa('progresso-digitacao', async () => {
      // Resultado de digitação gravado no progresso (fila de gravação), várias vezes seguidas.
      await p.evaluate(async () => {
        for (let k = 0; k < 5; k++) CE.sessao.atualizarProgresso((pr) => { pr.digitacao = pr.digitacao || {}; pr.digitacao['ex-' + k] = { ppm: 20 + k, acertos: 95, em: Date.now() }; });
        await CE.sessao.atualizarProgresso(() => {});
      });
    });
    await etapa('criar-email', async () => {
      await p.evaluate(() => { CE.janelas.fecharTodas(); CE.janelas.abrir('email'); });
      const E = (s) => `.janela[data-app="email"] ${s}`;
      await p.fill(E('[data-campo="senha"]'), 'abc123', { timeout: 30000 }); await p.fill(E('[data-campo="senha2"]'), 'abc123');
      await p.click(E('[data-acao="criar-conta"]'));
      await p.waitForSelector(E('[data-acao="escrever"]'), { timeout: 30000 });
    });
    await contasProntas();
    await etapa('enviar-emails', async () => {
      const E = (s) => `.janela[data-app="email"] ${s}`;
      // Cada aluno manda para o colega seguinte e todos mandam para a Ana (caixa mais disputada).
      const destinos = [endereco(NOMES[(i + 1) % N])]; if (i !== 0 && (i + 1) % N !== 0) destinos.push(endereco(NOMES[0]));
      for (const para of destinos) {
        await p.click(E('[data-acao="escrever"]'));
        await p.fill(E('[data-campo="para"]'), para); await p.fill(E('[data-campo="assunto"]'), `Oi de ${nome}`);
        await p.fill(E('[data-campo="texto"]'), `Mensagem de ${nome} para ${para}`);
        await p.click(E('[data-acao="enviar"]'));
        await p.waitForSelector(E('[data-acao="escrever"]'), { timeout: 30000 });
      }
    });
    // A Ana fica lendo as mensagens enquanto elas chegam (cada leitura grava a caixa).
    if (i === 0) {
      await etapa('ler-enquanto-chega', async () => {
        const E = (s) => `.janela[data-app="email"] ${s}`;
        for (let k = 0; k < 12; k++) {
          const naoLida = await p.$(E('[data-mensagem].nao-lida')) || await p.$(E('[data-mensagem]'));
          if (naoLida) await naoLida.click().catch(() => {});
          await p.waitForTimeout(700);
          await p.click(E('[data-pasta="entrada"]')).catch(() => {});
        }
      });
    }
    await emailsEnviados();
    return res;
  }));
  const fimUso = Date.now();
  for (const x of r) {
    const ruins = x.etapas.filter((e) => !e[1]);
    ok(!ruins.length, `${x.nome}: ${x.etapas.map((e) => `${e[0]} ${(e[2] / 1000).toFixed(1)}s`).join(', ')}${ruins.length ? ' — FALHOU: ' + ruins.map((e) => `${e[0]}: ${e[3]}`).join(' | ') : ''}`);
  }
  console.log(`   ${T()} uso simultâneo: ${((fimUso - t0Uso) / 1000).toFixed(0)} s; latência do servidor durante o uso: ${resumoLat(t0Uso, fimUso)}`);

  // ---------------- 4) Sala ao vivo, pausa e mensagem para os 20 ----------------
  await A.evaluate(() => { CE.janelas.fecharTodas(); CE.janelas.abrir('instrutor'); }); await A.waitForTimeout(400);
  await A.click(J('[data-aba="sala"]'));
  let online = 0;
  for (let k = 0; k < 30 && online < N; k++) { await A.waitForTimeout(1000); online = (await A.$$(J('[data-aluno-online]'))).length; }
  ok(online === N, `Sala ao vivo mostra ${online} de ${N} alunos conectados`);
  const cartoes = await A.$$eval(J('[data-aluno-online]'), (els) => els.map((e) => e.textContent.replace(/\s+/g, ' ').trim()));
  console.log('   exemplo de cartão:', cartoes[0]);
  await A.screenshot({ path: foto('carga-02-sala-ao-vivo.png') });
  const rola = await A.$eval(J('.painel-sala'), (e) => ({ cabe: e.scrollHeight <= e.clientHeight, rola: getComputedStyle(e).overflowY }));
  await A.$eval(J('.painel-sala'), (e) => { e.scrollTop = e.scrollHeight; }); await A.waitForTimeout(3500);
  const aindaEmBaixo = await A.$eval(J('.painel-sala'), (e) => e.scrollTop > 0);
  const ultimoVisivel = await A.$eval(J(`[data-aluno-online="${NOMES[N - 1]}"]`), (e) => { const r = e.getBoundingClientRect(), j = e.closest('.janela').getBoundingClientRect(); return r.bottom <= j.bottom && r.top >= j.top; }).catch(() => false);
  ok((rola.cabe || rola.rola === 'auto') && (rola.cabe || (aindaEmBaixo && ultimoVisivel)), `Sala ao vivo com ${N} cartões: dá para rolar até o último e a atualização não volta para o topo`);
  await A.screenshot({ path: foto('carga-02b-sala-rolada.png') });

  const t0Pausa = Date.now();
  await A.click(J('[data-acao="pausar-sala"]'));
  const pausados = await Promise.all(pcs.map(({ p }) => p.waitForSelector('#tela-pausa', { timeout: 30000 }).then(() => Date.now() - t0Pausa).catch(() => null)));
  ok(pausados.every((x) => x !== null), `pausa chegou em ${pausados.filter((x) => x !== null).length}/${N} telas (a última em ${(Math.max(...pausados.filter((x) => x !== null)) / 1000).toFixed(1)} s)`);
  // Teclado bloqueado durante a pausa
  await pcs[Math.min(5, N - 1)].p.keyboard.type('abc');
  await pcs[0].p.screenshot({ path: foto('carga-03-pausa.png') });
  await A.click(J('[data-acao="pausar-sala"]'));
  const liberados = await Promise.all(pcs.map(({ p }) => p.waitForSelector('#tela-pausa', { state: 'detached', timeout: 30000 }).then(() => true).catch(() => false)));
  ok(liberados.every(Boolean), `as ${liberados.filter(Boolean).length} telas foram liberadas`);
  await A.click(J('[data-acao="mensagem-sala"]')); await A.fill('.dialogo input', 'Abram o Editor de Texto.'); await A.click('.dialogo .botao:has-text("OK")');
  await A.waitForTimeout(300);
  await A.click(J('[data-acao="mensagem-sala"]')); await A.fill('.dialogo input', 'Turma, salvem tudo: a aula acaba em 5 minutos!'); await A.click('.dialogo .botao:has-text("OK")');
  const receberam = await Promise.all(pcs.map(({ p }) => p.waitForFunction(() => document.querySelectorAll('[data-mensagem-sala]').length >= 2, null, { timeout: 30000 })
    .then(async () => { const t = await p.$$eval('[data-mensagem-sala]', (els) => els.map((e) => e.textContent).join(' | ')); return /Editor/.test(t) && /5 minutos/.test(t); }).catch(() => false)));
  ok(receberam.every(Boolean), `duas mensagens seguidas da instrutora chegaram as duas em ${receberam.filter(Boolean).length}/${N} computadores`);
  await pcs[0].p.screenshot({ path: foto('carga-04-mensagem.png') });

  // ---------------- 4b) "Não entendi", onde a turma trava, relatório e liberar aulas com a turma inteira ----------------
  const metade = Math.ceil(N / 2);
  const idPrimeira = await A.evaluate(() => CE.LICOES[0].id);
  const pedidos = await Promise.all(pcs.map(async ({ p, i }) => {
    try {
      for (let k = 0; k < 3 && await p.$('.sala-mensagem .botao'); k++) await p.click('.sala-mensagem >> nth=-1 >> .botao', { timeout: 3000 }).catch(() => {});
      await p.evaluate((id) => { CE.janelas.fecharTodas(); return CE.professor.comecarLicao(id); }, idPrimeira);
      await p.waitForSelector('#prof-licao [data-acao="nao-entendi"]', { timeout: 30000 });
      if (i % 2 === 0) { // metade da turma não entendeu o primeiro passo
        await p.click('#prof-licao [data-acao="nao-entendi"]');
        await p.waitForSelector('#prof-licao .prof-dica:not([hidden])', { timeout: 10000 });
      }
      return true;
    } catch (e) { return e.message.split('\n')[0]; }
  }));
  let pedindo = 0;
  for (let k = 0; k < 20 && pedindo !== metade; k++) { await A.waitForTimeout(1000); pedindo = Number(await A.getAttribute(J('[data-pedindo-ajuda]'), 'data-pedindo-ajuda').catch(() => 0)); }
  const ordem = await A.$$eval(J('[data-aluno-online]'), (els) => els.map((e) => e.classList.contains('pediu-ajuda')));
  ok(pedidos.every((x) => x === true) && pedindo === metade && ordem.slice(0, metade).every(Boolean) && !ordem.slice(metade).some(Boolean),
    `${metade} alunos apertaram "🙋 Não entendi": a Sala ao vivo mostra "${pedindo} pedindo ajuda", com eles primeiro e em destaque${pedidos.some((x) => x !== true) ? ' — ' + pedidos.filter((x) => x !== true).join(' | ') : ''}`);
  await A.screenshot({ path: foto('carga-05-nao-entendi.png') });
  await A.click(J('[data-aba="trava"]'));
  const trava = await A.waitForSelector(J(`[data-trava="${idPrimeira}|0"]`), { timeout: 30000 }).then((e) => e.$$eval('td', (tds) => tds.map((td) => td.textContent))).catch(() => null);
  ok(trava && trava[2].startsWith(String(metade)) && trava[3] === String(metade), `Onde a turma trava: o passo 1 da primeira aula com ${trava ? trava[2].match(/^\d+/)[0] : '?'} alunos e ${trava ? trava[3] : '?'} pedidos de ajuda`);
  await A.screenshot({ path: foto('carga-06-onde-trava.png') });
  await A.click(J('[data-aba="certificados"]'));
  await A.click(J('[data-acao="ver-relatorio"]'), { timeout: 30000 });
  await A.waitForSelector('#area-impressao .pagina.relatorio', { timeout: 30000 });
  const linhasRel = await A.$$eval('#area-impressao .pagina.relatorio:first-child tbody tr', (l) => l.map((tr) => [...tr.children].map((td) => td.textContent)));
  ok(linhasRel.length === N && linhasRel.every((c) => Number(c[2]) === 1) && linhasRel.filter((c) => c[c.length - 1] === '1').length === metade,
    `relatório da turma: ${linhasRel.length} alunos, todos com presença hoje, e os ${metade} pedidos de ajuda`);
  await A.screenshot({ path: foto('carga-07-relatorio.png') });
  await A.click('#area-impressao [data-acao="fechar-impressao"]');
  // Liberar o Nível 2 para a turma da manhã pelo Painel (o resto continua em sequência)
  await A.click(J('[data-aba="alunos"]'));
  await A.click(J(`tr:has(td:text-is("${NOMES[0]}")) [data-acao="liberar-aulas"]`), { timeout: 30000 });
  await A.check('.painel-liberar [data-liberar="nivel:n2"]'); await A.check('.painel-liberar [data-campo="liberar-turma"]');
  await A.click('.painel-liberar [data-acao="salvar-liberacao"]');
  await A.waitForSelector('.painel-liberar', { state: 'detached', timeout: 30000 });
  const manha = NOMES.map((_, i) => i < N / 2);
  const veem = await Promise.all(pcs.map(({ p }) => p.evaluate(async () => CE.curso.liberada(CE.LICOES.find((l) => l.nivel === 'n2'), await CE.sessao.progresso())).catch((e) => e.message)));
  ok(veem.every((v, i) => v === manha[i]), `instrutora liberou o Nível 2 para a turma da manhã: ${veem.filter((v) => v === true).length} alunos da manhã veem, os da tarde não`);

  // ---------------- 5) Sair e entrar de novo: os dados continuam lá ----------------
  const voltas = await Promise.all(pcs.map(async ({ p, i, nome }) => {
    try {
      for (let k = 0; k < 3 && await p.$('.sala-mensagem .botao'); k++) await p.click('.sala-mensagem >> nth=-1 >> .botao', { timeout: 3000 }).catch(() => {});
      if (i === 4) { // manda um e-mail e sai na mesma hora: a saída espera a gravação e a entrega
        const E = (s) => `.janela[data-app="email"] ${s}`;
        await p.evaluate(() => { CE.janelas.fecharTodas(); CE.janelas.abrir('email'); });
        await p.click(E('[data-acao="escrever"]'), { timeout: 30000 });
        await p.fill(E('[data-campo="para"]'), endereco(NOMES[5 % N])); await p.fill(E('[data-campo="assunto"]'), 'Última antes de sair'); await p.fill(E('[data-campo="texto"]'), 'Mandei e saí na hora.');
        await p.click(E('[data-acao="enviar"]'));
      }
      await p.evaluate(() => CE.sairDoSistema());
      await p.click(`.login-usuario:has(.login-nome:text-is("${nome}"))`, { timeout: 30000 });
      await p.fill('.login-caixa input', senha(i)); await p.keyboard.press('Enter');
      await p.waitForSelector('#professor .prof-cartao', { timeout: 60000 });
      await p.waitForTimeout(1500);
      if (await p.$('[data-mensagem-sala]')) throw new Error('a mensagem já vista apareceu de novo depois de entrar');
      const meus = await p.evaluate(async () => (await CE.sessao.arquivos()).map((a) => a.nome));
      const pr = await p.evaluate(async () => CE.sessao.progresso());
      const outro = await p.evaluate(async (alvo) => { try { await CE.api.chamar('dados:ler', 'arquivos:' + alvo); return 'LEU'; } catch (e) { return e.message; } }, alunos.find((u) => u.nome === NOMES[(i + 1) % N]).id);
      return { nome, ok: meus.includes(`Trabalho de ${nome}`) && meus.length === 1 && Object.values(pr.licoes || {}).some((l) => l.concluida) && /negado/i.test(outro), meus, outro };
    } catch (e) { await p.screenshot({ path: foto(`carga-volta-${i + 1}.png`) }).catch(() => {}); return { nome, ok: false, erro: e.message.split('\n')[0] }; }
  }));
  const ruinsVolta = voltas.filter((v) => !v.ok);
  ok(!ruinsVolta.length, `os ${N} alunos saíram e entraram de novo: cada um vê só o próprio trabalho e a própria aula feita, e não lê o dos colegas${ruinsVolta.length ? ' — ' + JSON.stringify(ruinsVolta).slice(0, 600) : ''}`);

  // ---------------- 6) Conferir o disco do computador do instrutor ----------------
  await espera(1500);
  const pasta = path.join(DI, 'dados'); const arqs = fs.readdirSync(pasta);
  const tmp = arqs.filter((f) => f.endsWith('.tmp'));
  let invalidos = 0; for (const f of arqs.filter((f) => f.endsWith('.json'))) { try { JSON.parse(fs.readFileSync(path.join(pasta, f), 'utf8')); } catch { invalidos++; } }
  ok(!tmp.length && !invalidos, `disco do instrutor: ${arqs.length} arquivos, nenhum .tmp esquecido, nenhum JSON corrompido`);
  const ler = (k) => { try { return JSON.parse(fs.readFileSync(path.join(pasta, k + '.json'), 'utf8')); } catch { return null; } };
  const semProgresso = [], semArquivo = [], vazamento = [], semDigitacao = [];
  for (const u of alunos) {
    const pr = ler(`progresso-${u.id}`);
    if (!pr || !Object.entries(pr.licoes || {}).some(([k, l]) => k.startsWith('prof-') && l.concluida) || !pr.nivelamento) semProgresso.push(u.nome);
    if (!pr || Object.keys(pr.digitacao || {}).filter((k) => k.startsWith('ex-')).length !== 5) semDigitacao.push(u.nome);
    const lista = ler(`arquivos-${u.id}`) || [];
    if (!lista.some((a) => a.nome === `Trabalho de ${u.nome}` && a.conteudo.includes(`Trabalho de ${u.nome}`))) semArquivo.push(u.nome);
    if (lista.some((a) => NOMES.some((n) => n !== u.nome && (a.nome + a.conteudo).includes(n)))) vazamento.push(u.nome);
  }
  ok(!semProgresso.length, `progresso dos ${N} alunos guardado no instrutor (aula do professor + nivelamento)${semProgresso.length ? ' — faltou: ' + semProgresso.join(', ') : ''}`);
  const hoje = new Date(); const dia = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
  const semFrequencia = [], liberacaoErrada = [];
  alunos.forEach((u) => {
    const pr = ler(`progresso-${u.id}`) || {};
    if (!(pr.frequencia && pr.frequencia[dia] && pr.frequencia[dia].entradas === 2)) semFrequencia.push(`${u.nome} ${JSON.stringify(pr.frequencia)}`);
    if (!!(pr.liberadas && pr.liberadas['nivel:n2']) !== (u.turma === 'Manhã')) liberacaoErrada.push(u.nome);
  });
  ok(!semFrequencia.length, `frequência: as 2 entradas de hoje de cada aluno foram guardadas${semFrequencia.length ? ' — ' + semFrequencia.join(', ').slice(0, 300) : ''}`);
  ok(!liberacaoErrada.length, `o Nível 2 liberado continua só para a manhã depois de todos saírem, entrarem e gravarem${liberacaoErrada.length ? ' — errado: ' + liberacaoErrada.join(', ') : ''}`);
  ok(!semDigitacao.length, `5 gravações seguidas de digitação de cada aluno: nenhuma perdida${semDigitacao.length ? ' — faltou: ' + semDigitacao.join(', ') : ''}`);
  ok(!semArquivo.length, `trabalho de cada aluno guardado no instrutor${semArquivo.length ? ' — faltou: ' + semArquivo.join(', ') : ''}`);
  ok(!vazamento.length, `nenhum arquivo de um aluno foi parar na pasta de outro${vazamento.length ? ' — ' + vazamento.join(', ') : ''}`);
  // E-mails: cada um recebeu do colega anterior; a Ana recebeu de todos.
  const caixaDe = (n) => ler(`email-${alunos.find((u) => u.nome === n).id}`) || { mensagens: [] };
  const faltando = [];
  NOMES.forEach((n, i) => {
    const anterior = NOMES[(i - 1 + N) % N];
    const recebidas = caixaDe(n).mensagens.filter((m) => m.pasta !== 'enviados' && /^Oi de /.test(m.assunto));
    const esperados = i === 0 ? NOMES.slice(1) : [anterior];
    const de = new Set(recebidas.map((m) => m.deNome));
    esperados.forEach((e) => { if (!de.has(e)) faltando.push(`${e} → ${n}`); });
  });
  const totalRecebidas = NOMES.reduce((s, n) => s + caixaDe(n).mensagens.filter((m) => m.pasta !== 'enviados' && /^Oi de /.test(m.assunto)).length, 0);
  const totalEnviadas = NOMES.reduce((s, n) => s + caixaDe(n).mensagens.filter((m) => m.pasta === 'enviados' && /^Oi de /.test(m.assunto)).length, 0);
  ok(!faltando.length, `e-mails entre os alunos: ${totalEnviadas} enviados, ${totalRecebidas} recebidos; a Ana recebeu ${caixaDe(NOMES[0]).mensagens.filter((m) => /^Oi de /.test(m.assunto) && m.pasta !== 'enviados').length} de ${N - 1}${faltando.length ? ' — PERDIDOS: ' + faltando.join(', ') : ''}`);
  const ultimaEnviada = caixaDe(NOMES[4]).mensagens.some((m) => m.pasta === 'enviados' && m.assunto === 'Última antes de sair');
  const ultimaRecebida = caixaDe(NOMES[5 % N]).mensagens.some((m) => m.pasta === 'entrada' && m.assunto === 'Última antes de sair');
  ok(ultimaEnviada && ultimaRecebida, `e-mail enviado logo antes de sair: guardado nos Enviados (${ultimaEnviada}) e entregue ao colega (${ultimaRecebida})`);
  const duplicadas = NOMES.filter((n) => { const ids = caixaDe(n).mensagens.map((m) => m.id); return new Set(ids).size !== ids.length; });
  ok(!duplicadas.length, `nenhuma mensagem duplicada nas caixas${duplicadas.length ? ' — ' + duplicadas.join(', ') : ''}`);
  // Nada foi gravado nos computadores dos alunos
  const locais = pcs.flatMap(({ D }) => fs.readdirSync(path.join(D, 'dados')).filter((f) => f !== 'sala.json'));
  ok(!locais.length, `nenhum dado ficou nos computadores dos alunos${locais.length ? ': ' + locais.join(', ') : ''}`);

  // ---------------- 7) Imprevistos no meio da aula ----------------
  // 7a) A instrutora fecha o programa e abre de novo: os alunos continuam dentro e salvando.
  await A.evaluate(() => { CE.janelas.fecharTodas(); CE.janelas.abrir('instrutor'); }); await A.waitForTimeout(400);
  await A.click(J('[data-aba="sala"]')); await A.waitForTimeout(300); await A.click(J('[data-acao="pausar-sala"]'));
  const pausaAntes = await Promise.all(pcs.map(({ p }) => p.waitForSelector('#tela-pausa', { timeout: 30000 }).then(() => true).catch(() => false)));
  await I.app.close(); await espera(2000);
  const t0Solta = Date.now();
  const soltas = await Promise.all(pcs.map(({ p }) => p.waitForSelector('#tela-pausa', { state: 'detached', timeout: 60000 }).then(() => Date.now() - t0Solta).catch(() => null)));
  ok(pausaAntes.every(Boolean) && soltas.every((x) => x !== null), `instrutora pausou e fechou o programa: a pausa saiu sozinha nos ${soltas.filter((x) => x !== null).length} computadores (em até ${(Math.max(...soltas.filter((x) => x !== null)) / 1000).toFixed(0)} s)`);
  const salvarAgora = (rotulo) => Promise.all(pcs.map(({ p, nome }) => p.evaluate(async ([n, r]) => { try { await CE.sessao.salvarArquivo({ nome: `${r} ${n}`, tipo: 'documento', conteudo: '<div>ok</div>' }); return 'ok'; } catch (e) { return e.message; } }, [nome, rotulo])));
  const semInstrutor = await salvarAgora('Sem instrutor');
  ok(semInstrutor.every((x) => /Sem conexão/.test(x)), `com o programa da instrutora fechado, os ${N} computadores avisam "Sem conexão" ao salvar${semInstrutor.some((x) => !/Sem conexão/.test(x)) ? ' — ' + [...new Set(semInstrutor)].join(' | ').slice(0, 300) : ''}`);
  const I2 = await abrir(DI, 'instrutor (reaberto)'); const A2 = I2.p;
  await A2.click('.login-usuario:has(.login-nome:text-is("Professora Rita"))', { timeout: 30000 }); await A2.fill('.login-caixa input', '1234'); await A2.keyboard.press('Enter');
  await A2.waitForSelector('#professor .prof-cartao', { timeout: 30000 });
  const depoisReinicio = await salvarAgora('Depois do reinício');
  ok(depoisReinicio.every((x) => x === 'ok'), `programa da instrutora aberto de novo: os ${N} alunos continuam dentro e salvando, sem entrar de novo${depoisReinicio.some((x) => x !== 'ok') ? ' — ' + [...new Set(depoisReinicio)].join(' | ') : ''}`);
  // 7b) O Bruno entra no computador da Carla: o computador dele sai da conta e explica o porquê.
  const pcB = pcs[1], pcC = pcs[2];
  await pcC.p.evaluate(() => CE.sairDoSistema());
  await pcC.p.click(`.login-usuario:has(.login-nome:text-is("${NOMES[1]}"))`, { timeout: 30000 }); await pcC.p.fill('.login-caixa input', senha(1)); await pcC.p.keyboard.press('Enter');
  await pcC.p.waitForSelector('#professor .prof-cartao', { timeout: 30000 });
  const avisoB = await pcB.p.waitForSelector('[data-sessao-perdida]', { timeout: 25000 }).then((e) => e.textContent()).catch(() => '');
  ok(/outro computador/.test(avisoB) && await pcB.p.isVisible('.login-usuario'), `o Bruno entrou em outro computador: o primeiro volta para a entrada com o aviso "${avisoB.replace(/\s+/g, ' ').slice(0, 90)}"`);
  await pcB.p.screenshot({ path: foto('carga-05-outro-computador.png') });
  // 7c) A instrutora remove o Tiago pelo Painel: o computador dele sai na hora.
  await A2.evaluate(() => { CE.janelas.fecharTodas(); CE.janelas.abrir('instrutor'); }); await A2.waitForTimeout(500);
  await A2.click(J('[data-aba="alunos"]'));
  const ultimo = NOMES[N - 1];
  await A2.click(J(`.painel-tabela tr:has(td:text-is("${ultimo}")) button:has-text("Remover")`), { timeout: 15000 }); await A2.click('.dialogo .botao:has-text("Sim")');
  const avisoT = await pcs[N - 1].p.waitForSelector('[data-sessao-perdida]', { timeout: 25000 }).then((e) => e.textContent()).catch(() => '');
  ok(/removida/.test(avisoT), `${ultimo} removido pelo Painel: o computador dele sai da conta — "${avisoT.replace(/\s+/g, ' ').slice(0, 80)}"`);
  const nomesNaEntrada = await pcs[N - 1].p.$$eval('.login-usuario .login-nome', (els) => els.map((e) => e.textContent)).catch(() => []);
  ok(!nomesNaEntrada.includes(ultimo), `e ${ultimo} não aparece mais na tela de entrada`);
  await I2.app.close().catch(() => {});

  sondando = false;
  console.log(`   latência no teste todo: ${resumoLat(0, Date.now())}; pedidos da sonda que falharam: ${falhasSonda.length}${falhasSonda.length ? ' ' + falhasSonda.slice(0, 3).join(' | ') : ''}`);
  const marcos = { cadastros: t0Cad, ligar: t0Lig, uso: t0Uso, fimUso };
  console.log('   respostas mais lentas: ' + [...latencias].sort((x, y) => y.ms - x.ms).slice(0, 5).map((l) => `${l.ms.toFixed(0)} ms em ${((l.t - inicio) / 1000).toFixed(0)}s`).join(', ') + ' | marcos: ' + Object.entries(marcos).map(([k, v]) => `${k} ${((v - inicio) / 1000).toFixed(0)}s`).join(', '));
  console.log(`   tempo total ${T()}${memoria()}; capturas de tela em ${TELAS}`);
  const errosUnicos = [...new Set(erros)];
  ok(!errosUnicos.length, `nenhum erro de JavaScript nas ${N + 1} telas${errosUnicos.length ? ':\n     ' + errosUnicos.slice(0, 15).join('\n     ') : ''}`);
  console.log('FALHAS', falhas);
  await Promise.all(pcs.map((x) => x.app.close().catch(() => {})));
  // Os perfis do Electron ocupam espaço: ficam só os dados e as capturas de tela.
  for (const { D } of pcs) fs.rmSync(path.join(D, 'perfil'), { recursive: true, force: true, maxRetries: 5 });
  fs.rmSync(path.join(DI, 'perfil'), { recursive: true, force: true, maxRetries: 5 });
  process.exit(process.exitCode || 0);
})().catch(async (e) => { console.error('ERRO NO TESTE:', e); console.error('Dados e capturas de tela desta rodada em', RAIZ); process.exit(1); });
