// Teste do Restaurante do Digão com o programa de verdade (Electron), num computador:
//  • na Praça Escola, o prédio da lanchonete se chama "Restaurante do Digão"; clicando nele, o boneco vai até a porta e
//    aparece "Jogar", com o crédito à Molleindustria (licença CC BY-NC-SA 3.0);
//  • a janela abre o jogo (o Flash roda com o Ruffle, sem internet, num quadro com regra de segurança própria) e o jogo
//    desenha na tela; os créditos ficam embaixo; dá para passar da abertura, chegar ao menu e começar um jogo novo;
//  • minimizada, a janela pausa o jogo; de volta, continua; fechada, o jogo some; sem erros na tela.
// Uso: npm run teste:restaurante (no Linux sem tela: xvfb-run -a npm run teste:restaurante)
const { _electron: electron } = require('playwright-core');
const fs = require('fs'); const os = require('os'); const path = require('path');
const EXE = require('electron');
const APP = path.join(__dirname, '..');
const RAIZ = fs.mkdtempSync(path.join(os.tmpdir(), 'computador-escola-teste-restaurante-'));
const TELAS = path.join(RAIZ, 'telas');
const foto = (nome) => path.join(TELAS, nome);
let falhas = 0;
const ok = (c, m) => { console.log((c ? '✔ ' : '✘ ') + m); if (!c) { falhas++; process.exitCode = 1; } };
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const erros = [];
fs.mkdirSync(TELAS, { recursive: true });
const J = (app, s) => `.janela[data-app="${app}"] ${s}`;
const Z = (s) => J('praca', s);
const R = (s) => J('restaurante', s);
const ate = async (f, ms = 8000) => { const fim = Date.now() + ms; while (Date.now() < fim) { if (await f().catch(() => false)) return true; await espera(250); } return false; };

(async () => {
  const D = path.join(RAIZ, 'pc'); fs.mkdirSync(path.join(D, 'dados'), { recursive: true });
  const app = await electron.launch({ executablePath: EXE, args: ['--no-sandbox', '--disable-gpu', `--user-data-dir=${path.join(D, 'perfil')}`, APP, '--janela'], env: { ...process.env, PORTABLE_EXECUTABLE_DIR: D, CE_SEM_IA: '1' }, timeout: 120000 });
  const p = await app.firstWindow(); await p.setViewportSize({ width: 1366, height: 768 });
  p.on('pageerror', (e) => erros.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error') erros.push(`(console) ${m.text().slice(0, 200)}`); });
  // ---------------- Instrutora entra (primeiro acesso) ----------------
  const c = p.locator('.login-caixa input'); await c.nth(0).fill('Professora Rita'); await c.nth(1).fill('1234'); await c.nth(2).fill('1234');
  await p.click('text=Cadastrar e entrar'); await p.waitForSelector('#professor .prof-cartao', { timeout: 60000 });
  await p.evaluate(() => { if (CE.professor.pararLicao) CE.professor.pararLicao(); CE.janelas.fecharTodas(); });
  ok(fs.existsSync(path.join(APP, 'app', 'jogos', 'restaurante-do-digao', 'LICENCA.txt')), 'o jogo vem com o arquivo de licença (CC BY-NC-SA 3.0, créditos à Molleindustria)');

  // ---------------- Praça → lanchonete → Jogar ----------------
  await p.evaluate(() => CE.janelas.abrir('praca'));
  await p.waitForSelector(Z('.pr-mapa'), { timeout: 20000, state: 'attached' });
  await p.click(Z('.pr-maquete-pular'), { timeout: 8000 }).catch(() => {});
  await p.waitForTimeout(1500);
  await p.evaluate(() => document.querySelectorAll('.janela[data-app="praca"] .pr-dlg-fechar').forEach((b) => b.click()));
  await p.click(Z('[data-acao="cidade-inteira"]')); await p.waitForTimeout(1500);
  ok(await ate(async () => /Restaurante do Digão/.test(await p.evaluate(() => [...document.querySelectorAll('.janela[data-app="praca"] .pr-rotulo')].map((r) => r.textContent).join('|')))), 'na Praça, o prédio da lanchonete se chama "Restaurante do Digão"');
  const caixas = await p.$$eval(Z('.pr-iso[data-lugar="lanchonete"]'), (els) => els.map((e) => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height * 0.62, a: r.width * r.height }; })
    .filter((x) => x.a > 0).sort((a, b) => b.a - a.a)).catch(() => []);
  let porta = false;
  for (const cx of caixas.slice(0, 4)) {
    await p.mouse.click(cx.x, cx.y);
    porta = await p.waitForSelector(Z('[data-opcao="entrar-restaurante"]'), { timeout: 20000 }).then(() => true, () => false);
    if (porta) break;
  }
  if (!porta) { await p.evaluate(() => document.querySelectorAll('.janela[data-app="praca"] .pr-dlg-fechar').forEach((b) => b.click())); }
  ok(porta, 'clicando no prédio, o boneco vai até a porta e aparece "Jogar"');
  ok(porta && /Molleindustria/.test(await p.textContent(Z('.pr-dialogo')).catch(() => '')), 'a porta dá o crédito à Molleindustria e a licença');
  await p.screenshot({ path: foto('restaurante-01-porta.png') });
  if (porta) await p.click(Z('[data-opcao="entrar-restaurante"]')); else await p.evaluate(() => CE.janelas.abrir('restaurante'));

  // ---------------- O jogo abre e desenha ----------------
  const t0 = Date.now();
  const abriu = await p.waitForSelector(R('.rd-app[data-estado="pronto"], .rd-app[data-estado="carregou"]'), { timeout: 90000 }).then(() => true, () => false);
  ok(abriu, `a janela abre o jogo (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
  await p.waitForTimeout(3000);
  ok(/Molleindustria/.test(await p.textContent(R('.rd-creditos')).catch(() => '')), 'os créditos e a licença ficam embaixo do jogo');
  const quadro = p.frames().find((f) => /restaurante-do-digao\/index\.html/.test(f.url()));
  const st = quadro ? await quadro.evaluate(() => { const a = document.querySelector('ruffle-player').ruffle(1); return { pronto: a.readyState, tocando: a.isPlaying, largura: a.metadata && a.metadata.width }; }) : null;
  ok(!!st && st.pronto === 2 && st.tocando && st.largura === 660, `o Ruffle carregou o jogo e está rodando (${JSON.stringify(st)})`);
  // o jogo desenhou de verdade: boa parte do quadro não é só o fundo escuro
  const desenho = async () => {
    const q = await p.$eval(R('.rd-quadro'), (e) => { const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, width: r.width, height: r.height }; });
    const png = await p.screenshot({ clip: q });
    return p.evaluate(async (b64) => {
      const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
      const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height; const g = cv.getContext('2d'); g.drawImage(img, 0, 0);
      const d = g.getImageData(0, 0, cv.width, cv.height).data; let claros = 0, cores = new Set();
      for (let i = 0; i < d.length; i += 16) { if (Math.abs(d[i] - 27) + Math.abs(d[i + 1] - 27) + Math.abs(d[i + 2] - 27) > 60) claros++; cores.add((d[i] >> 4) * 256 + (d[i + 1] >> 4) * 16 + (d[i + 2] >> 4)); }
      return { claros: claros / (d.length / 16), cores: cores.size };
    }, png.toString('base64'));
  };
  const abertura = await desenho();
  ok(abertura.claros > 0.03, `o jogo desenha na tela: a abertura com o logotipo e o aviso (${Math.round(abertura.claros * 100)}% do quadro desenhado)`);
  await p.screenshot({ path: foto('restaurante-02-abertura.png') });
  // passa da abertura, chega ao menu e começa um jogo novo
  const q = await p.$eval(R('.rd-quadro'), (e) => { const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, w: r.width, h: r.height }; });
  const k = Math.min(q.w / 660, q.h / 410), ox = q.l + (q.w - 660 * k) / 2, oy = q.t + (q.h - 410 * k) / 2;
  const noJogo = (x, y) => p.mouse.click(ox + x * k, oy + y * k);
  for (const [x, y] of [[330, 350], [330, 300], [330, 350], [330, 375]]) { await noJogo(x, y); await p.waitForTimeout(2000); }
  const menu = await desenho();
  await p.screenshot({ path: foto('restaurante-03-menu.png') });
  await noJogo(127, 243); await p.waitForTimeout(5000);
  const jogo = await desenho();
  await p.screenshot({ path: foto('restaurante-04-jogo.png') });
  ok(menu.cores > 30 && jogo.cores > 60 && jogo.claros > 0.5, `passa da abertura, chega ao menu e começa um jogo novo (a fazenda aparece: ${jogo.cores} cores)`);
  await noJogo(155, 385); await p.waitForTimeout(3000);
  await p.screenshot({ path: foto('restaurante-05-sede.png') });

  // ---------------- Minimizar pausa; voltar continua; fechar some ----------------
  await p.click(R('[data-acao="minimizar"]'));
  await p.waitForTimeout(800);
  ok(quadro && (await quadro.evaluate(() => document.querySelector('ruffle-player').ruffle(1).isPlaying)) === false, 'minimizada, a janela pausa o jogo (o tempo do jogo não corre escondido)');
  await p.evaluate(() => CE.janelas.abrir('restaurante'));
  await p.waitForTimeout(800);
  ok(quadro && (await quadro.evaluate(() => document.querySelector('ruffle-player').ruffle(1).isPlaying)) === true, 'de volta, o jogo continua');
  await p.click(R('[data-acao="fechar"]'));
  ok(await ate(async () => !(await p.$('.janela[data-app="restaurante"]')) && !p.frames().some((f) => /restaurante-do-digao/.test(f.url()))), 'fechando a janela, o jogo some');
  const relevantes = erros.filter((e) => !/net::ERR|Failed to load resource|ruffle\.js\.map/.test(e));
  ok(!relevantes.length, 'sem erros na tela' + (relevantes.length ? ': ' + relevantes.slice(0, 5).join(' | ') : ''));
  await app.close().catch(() => {});
  console.log(`Capturas de tela: ${TELAS}`);
  console.log(falhas ? `FALHAS ${falhas}` : 'FALHAS 0');
  process.exit(falhas ? 1 : 0);
})().catch(async (e) => { console.error(e); console.log('FALHAS 1'); process.exit(1); });
