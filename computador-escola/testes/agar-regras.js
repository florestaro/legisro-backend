// Teste rápido das regras do Agar da Turma (app/js/agar-regras.js), sem abrir o programa: um relógio de mentira e
// um sorteio sempre igual. Confere andar, comer a comida, dividir, soltar massa, o vírus, comer um colega, os robôs,
// as arenas separadas por turma, a arena fechada pelo instrutor, quem some e o instrutor assistindo.
//   node testes/agar-regras.js   (ou npm run teste:agar-regras)
const criarAgar = require('../app/js/agar-regras');

let falhas = 0;
const ok = (c, m) => { console.log((c ? '✔ ' : '✘ ') + m); if (!c) { falhas++; process.exitCode = 1; } };
const lanca = (f) => { try { f(); return null; } catch (e) { return e.message; } };
// Sorteio sempre igual (mulberry32).
function semente(a) { return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

let t = 1_000_000;
const agar = criarAgar(() => t, semente(42));
const ana = { id: 'a1', nome: 'Ana Souza', papel: 'aluno', turma: 'Manhã', avatar: '👧' };
const bruno = { id: 'b2', nome: 'Bruno Lima', papel: 'aluno', turma: 'Manhã', avatar: '👦' };
const carla = { id: 'c3', nome: 'Carla Dias', papel: 'aluno', turma: 'Tarde', avatar: '👩' };
const rita = { id: 'p0', nome: 'Professora Rita', papel: 'instrutor', turma: '', avatar: '👩‍🏫' };
const andar = (ms, quem = [], dados = () => ({})) => { for (let i = 0; i < ms / 100; i++) { t += 100; for (const u of quem) agar.jogar(u, dados(u)); } };
const arena = (turma) => agar._arena(turma);
const jogador = (turma, u) => arena(turma).jogadores.get('u:' + u.id);

// ---------- Entrar ----------
ok(/Entre no sistema/.test(lanca(() => agar.entrar(null))), 'sem ninguém no sistema, não entra');
let v = agar.entrar(ana);
ok(v.eu.vivo && v.eu.massa === 20, 'a Ana entra viva, com massa 20');
ok(v.f.length > 20 && v.f.length < 800, `ela recebe só a comida que aparece na tela dela (${v.f.length})`);
andar(500, [ana]);
ok(arena('Manhã').jogadores.size === 10, 'os robôs completam a arena até 10 bolinhas');
andar(2000, [ana]);
ok([...arena('Manhã').jogadores.values()].filter((p) => p.robo).every((p) => p.vivo), 'os robôs nascem (um de cada vez, em 2 s) e andam');
const est = agar.estado(ana);
ok(est.aberta && est.dentro && est.gente.length === 1 && est.gente[0].nome === 'Ana', 'o estado mostra a Ana dentro (só o primeiro nome)');

// ---------- Andar ----------
let a = jogador('Manhã', ana);
const x0 = a.celulas[0].x, y0 = a.celulas[0].y;
const paraDireita = () => ({ x: Math.min(2990, x0 + 600), y: y0, vw: 800, vh: 500 });
andar(1000, [ana], paraDireita);
ok(a.celulas[0].x - x0 > 150, `a bolinha vai atrás do mouse (andou ${Math.round(a.celulas[0].x - x0)} pontos em 1 s)`);
const fora = agar.jogar(ana, { x: 99999, y: -5000 });
ok(a.alvoX === 3000 && a.alvoY === 0 && fora.eu.vivo, 'mouse fora da arena: o alvo fica na borda');

// ---------- Comer a comida ----------
a.celulas = [{ id: 9001, x: 1500, y: 1500, m: 20, vx: 0, vy: 0, juntar: 0 }];
a.alvoX = 1500; a.alvoY = 1500;
for (let i = 0; i < 5; i++) arena('Manhã').comida.push({ x: 1500 + i, y: 1500, m: 1, c: 0, vx: 0, vy: 0 });
andar(200, [ana], () => ({ x: 1500, y: 1500 }));
ok(a.celulas[0].m >= 25 - 0.01, `comendo a comida do chão, cresce (${a.celulas[0].m.toFixed(1)})`);

// ---------- Dividir e soltar massa ----------
a.celulas[0].m = 100;
agar.jogar(ana, { x: 1800, y: 1500, dividir: true });
andar(100, [ana], () => ({ x: 1800, y: 1500 }));
ok(a.celulas.length === 2 && Math.abs(a.celulas[0].m - a.celulas[1].m) < 2, 'Espaço: a bolinha divide em duas metades');
ok(a.celulas.some((c) => c.x > 1530), 'o pedaço novo sai voando na direção do mouse');
const conta1 = agar.jogar(ana, { x: 1800, y: 1500, dividir: true }); // logo em seguida: espera um pouco
ok(conta1.eu.vivo, 'apertar Espaço sem parar não quebra nada');
a.celulas = [{ id: 9002, x: 1500, y: 1500, m: 100, vx: 0, vy: 0, juntar: 0 }];
const comidaAntes = arena('Manhã').comida.length;
t += 200; agar.jogar(ana, { x: 1800, y: 1500, soltar: true }); andar(100, [ana], () => ({ x: 1500, y: 1500 }));
const solta = arena('Manhã').comida.filter((f) => f.m === 12);
ok(solta.length === 1 && a.celulas[0].m < 90 && arena('Manhã').comida.length >= comidaAntes, `W: solta 14 de massa e sai uma bolinha de 12 (massa agora ${a.celulas[0].m.toFixed(0)})`);
ok(solta[0].c < 0, 'a massa solta tem a cor de quem soltou');

// ---------- Comer um colega ----------
agar.entrar(bruno);
const b = jogador('Manhã', bruno);
ok(arena('Manhã').jogadores.size === 10, 'o Bruno entra e um robô sai (continua com 10 bolinhas)');
// Tira os robôs de perto e põe os dois no mesmo lugar: a Ana bem maior.
for (const p of arena('Manhã').jogadores.values()) if (p.robo) p.celulas.forEach((c) => { c.x = 200; c.y = 200; });
a.celulas = [{ id: 9003, x: 2500, y: 2500, m: 200, vx: 0, vy: 0, juntar: 0 }];
b.celulas = [{ id: 9004, x: 2505, y: 2500, m: 20, vx: 0, vy: 0, juntar: 0 }];
andar(200, [ana, bruno], () => ({ x: 2500, y: 2500 }));
const vb = agar.jogar(bruno, { x: 2500, y: 2500 });
ok(!vb.eu.vivo && vb.eu.comidoPor && vb.eu.comidoPor.nome === 'Ana', 'a Ana (bem maior) come o Bruno: ele vê "comido pela Ana"');
ok(a.comeu === 1 && a.celulas[0].m > 215, 'a Ana fica com a massa do Bruno e conta 1 colega comido');
ok(!agar.jogar(bruno, { dividir: true }).eu.vivo, 'quem foi comido não divide nem anda');
const vb2 = agar.entrar(bruno);
ok(vb2.eu.vivo && vb2.eu.massa === 20, 'o Bruno nasce de novo com "Jogar de novo"');
// Quase do mesmo tamanho: ninguém come ninguém.
a.celulas = [{ id: 9005, x: 2000, y: 2000, m: 110, vx: 0, vy: 0, juntar: 0 }];
b.celulas = [{ id: 9006, x: 2004, y: 2000, m: 100, vx: 0, vy: 0, juntar: 0 }];
andar(200, [ana, bruno], () => ({ x: 2002, y: 2000 }));
ok(a.vivo && b.vivo && b.celulas.length >= 1, 'quase do mesmo tamanho (110 e 100): ninguém come ninguém');

// ---------- Vírus ----------
const vir = arena('Manhã').virus[0];
a.celulas = [{ id: 9007, x: vir.x, y: vir.y, m: 400, vx: 0, vy: 0, juntar: 0 }];
andar(100, [ana], () => ({ x: vir.x, y: vir.y }));
ok(a.celulas.length > 4, `grande em cima do vírus: estoura em ${a.celulas.length} pedaços`);
ok(arena('Manhã').virus.length >= 8, 'nasce outro vírus no lugar');

// ---------- Turmas separadas ----------
const vc = agar.entrar(carla);
ok(vc.turma === 'Tarde' && !vc.p.some((x) => x[0] === 'u:a1' || x[0] === 'u:b2'), 'a Carla (Tarde) fica na arena dela: não vê a Ana nem o Bruno');

// ---------- O instrutor ----------
ok(/Apenas o instrutor/.test(lanca(() => agar.configurar(ana, { aberta: false }))), 'aluno não fecha a arena');
const vr = agar.entrar(rita, { turma: 'Manhã', assistir: true });
ok(vr.eu.espectador && !vr.eu.vivo && vr.f.length >= 700, `a professora assiste a arena inteira da Manhã (${vr.f.length} comidas na tela)`);
ok(vr.p.some((x) => x[0] === 'u:a1'), 'assistindo, ela vê a Ana');
const er = agar.estado(rita);
ok(er.salas.length === 2 && er.salas.find((s) => s.turma === 'Manhã').gente === 2, 'a professora vê as arenas das duas turmas (Manhã com 2 alunos)');
agar.configurar(rita, { robos: false }); andar(100, [ana, bruno, rita]);
ok(![...arena('Manhã').jogadores.values()].some((p) => p.robo), 'robôs desligados: só gente na arena');
agar.configurar(rita, { robos: true }); andar(100, [ana, bruno, rita]);
ok([...arena('Manhã').jogadores.values()].filter((p) => p.robo).length === 8, 'robôs ligados de novo: 8 robôs + 2 alunos');
// Os robôs são fracos de propósito: não caçam aluno e, grandes demais, encolhem.
andar(2500, [ana, bruno, rita]);
const robo = [...arena('Manhã').jogadores.values()].find((p) => p.robo && p.vivo);
for (const p of arena('Manhã').jogadores.values()) if (p !== robo && p !== a) p.celulas.forEach((c) => { c.x = 2900; c.y = 2900; });
robo.celulas = [{ id: 9101, x: 600, y: 600, m: 120, vx: 0, vy: 0, juntar: 0 }];
a.celulas = [{ id: 9102, x: 760, y: 600, m: 20, vx: 0, vy: 0, juntar: 0 }];
let perseguiu = false;
for (let i = 0; i < 30; i++) { t += 100; agar.jogar(ana, { x: 760, y: 600 }); agar.jogar(bruno, {}); agar.jogar(rita, {}); if (Math.hypot(robo.alvoX - a.celulas[0].x, robo.alvoY - a.celulas[0].y) < 5) perseguiu = true; }
ok(!perseguiu, 'o robô não corre atrás da Ana (pequena, bem do lado dele)');
robo.celulas = [{ id: 9103, x: 1500, y: 300, m: 1000, vx: 0, vy: 0, juntar: 0 }];
andar(10000, [ana, bruno, rita]);
ok(!robo.vivo || massaDoRobo(robo) < 950, `robô grandão (1.000) encolhe sozinho, mesmo comendo no caminho (${Math.round(massaDoRobo(robo))} em 10 s)`);
function massaDoRobo(p) { return p.celulas.reduce((s, c) => s + c.m, 0); }
agar.configurar(rita, { aberta: false });
const fechada = agar.jogar(ana, {});
ok(fechada.fora && fechada.fechada, 'a professora fecha a arena: a Ana sai e vê "fechada"');
ok(/fechada/.test(lanca(() => agar.entrar(ana))), 'com a arena fechada, aluno não entra');
ok(agar.jogar(rita, {}).eu.espectador, 'a professora continua assistindo');
agar.configurar(rita, { aberta: true });
ok(agar.entrar(ana).eu.vivo, 'arena aberta de novo: a Ana volta');

// ---------- Quem some e a arena vazia ----------
agar.entrar(bruno);
for (let i = 0; i < 20; i++) { t += 1000; agar.jogar(ana, {}); agar.jogar(rita, {}); }
ok(!jogador('Manhã', bruno), 'o Bruno ficou 15 s sem dar sinal (fechou sem sair): saiu da arena');
agar.sair(ana); agar.sair(rita); agar.sair(carla);
t += 61000; agar.estado(ana); t += 1000; agar.estado(ana);
ok(!arena('Manhã') && !arena('Tarde'), 'sem ninguém por 1 minuto, as arenas somem (os robôs param)');

// ---------- Desempenho: uma turma de 20 jogando ----------
const turma20 = Array.from({ length: 20 }, (_, i) => ({ id: 'x' + i, nome: `Aluno ${i}`, papel: 'aluno', turma: 'Noite', avatar: '🙂' }));
turma20.forEach((u) => agar.entrar(u));
const inicio = process.hrtime.bigint();
let maior = 0;
for (let i = 0; i < 100; i++) { t += 100; for (const u of turma20) { const r = agar.jogar(u, { x: 1500 + Math.sin(i + u.id.length) * 900, y: 1500, vw: 900, vh: 500, dividir: i % 25 === 0 }); maior = Math.max(maior, JSON.stringify(r).length); } }
const ms = Number(process.hrtime.bigint() - inicio) / 1e6;
ok(ms < 2500, `20 alunos, 10 vezes por segundo, 10 s de jogo: ${Math.round(ms)} ms no computador do instrutor`);
ok(maior < 30000, `cada resposta é pequena (a maior teve ${(maior / 1024).toFixed(1)} KB)`);
ok(![...agar._arena('Noite').jogadores.values()].some((p) => p.robo), 'com 20 alunos, não entra robô');

console.log(falhas ? `FALHAS ${falhas}` : 'FALHAS 0');
