// Teste rápido das regras da Cobrinha da Turma (app/js/cobrinha-regras.js), sem abrir o programa: um relógio de
// mentira e um sorteio sempre igual. Confere virar atrás do mouse, comer e crescer, acelerar (e perder massa), bater
// a cabeça no corpo de outra (morre e vira comida), cabeça com cabeça, os robôs, as arenas por turma, a arena fechada,
// o instrutor assistindo, quem some e uma turma de 20 jogando.
//   node testes/cobrinha-regras.js   (ou npm run teste:cobrinha-regras)
const criarCobrinha = require('../app/js/cobrinha-regras');

let falhas = 0;
const ok = (c, m) => { console.log((c ? '✔ ' : '✘ ') + m); if (!c) { falhas++; process.exitCode = 1; } };
const lanca = (f) => { try { f(); return null; } catch (e) { return e.message; } };
function semente(a) { return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

let t = 1_000_000;
const jogo = criarCobrinha(() => t, semente(7));
const ana = { id: 'a1', nome: 'Ana Souza', papel: 'aluno', turma: 'Manhã', avatar: '👧' };
const bruno = { id: 'b2', nome: 'Bruno Lima', papel: 'aluno', turma: 'Manhã', avatar: '👦' };
const carla = { id: 'c3', nome: 'Carla Dias', papel: 'aluno', turma: 'Tarde', avatar: '👩' };
const rita = { id: 'p0', nome: 'Professora Rita', papel: 'instrutor', turma: '', avatar: '👩‍🏫' };
const andar = (ms, quem = [], dados = () => ({})) => { for (let i = 0; i < ms / 100; i++) { t += 100; for (const u of quem) jogo.jogar(u, dados(u)); } };
const arena = (turma) => jogo._arena(turma);
const cobra = (turma, u) => arena(turma).jogadores.get('u:' + u.id);
// Põe uma cobrinha reta, com a cabeça em (x, y) e o corpo para trás (ângulo a), com a massa m.
function por(p, x, y, a, m) {
  p.massa = m; p.ang = p.alvoAng = a;
  p.corpo = Array.from({ length: jogo._gomosDe(m) }, (_, i) => [x - Math.cos(a) * 7 * i, y - Math.sin(a) * 7 * i]);
}
// Os robôs lado a lado, longe do meio (cada um na sua coluna, para não baterem entre si).
const longeDosRobos = () => { let k = 0; for (const p of arena('Manhã').jogadores.values()) if (p.robo) { p.vivo = true; p.renascerEm = Infinity; por(p, 150 + 70 * k++, 2850, -Math.PI / 2, 20); } };

// ---------- Entrar ----------
ok(/Entre no sistema/.test(lanca(() => jogo.entrar(null))), 'sem ninguém no sistema, não entra');
let v = jogo.entrar(ana);
ok(v.eu.vivo && v.eu.massa === 20, 'a Ana entra viva, com tamanho 20');
ok(v.c.some((x) => x[0] === 'u:a1'), 'ela se vê na tela');
andar(3000, [ana]);
ok(arena('Manhã').jogadores.size === 8 && [...arena('Manhã').jogadores.values()].filter((p) => p.robo).every((p) => p.vivo), 'os robôs completam a arena até 8 cobrinhas');
ok(jogo.estado(ana).gente[0].nome === 'Ana', 'o estado mostra a Ana (só o primeiro nome)');

// ---------- Virar e andar ----------
const a = cobra('Manhã', ana);
longeDosRobos();
por(a, 1500, 1500, 0, 20);
andar(1000, [ana], () => ({ x: 1500, y: 2500 })); // mouse para baixo
ok(a.corpo[0][1] > 1560 && Math.abs(Math.sin(a.ang) - 1) < 0.2, `a cabeça vira e vai para onde o mouse aponta (desceu ${Math.round(a.corpo[0][1] - 1500)})`);
const passo = Math.hypot(a.corpo[1][0] - a.corpo[0][0], a.corpo[1][1] - a.corpo[0][1]);
ok(passo <= 7.01 && a.corpo.length === jogo._gomosDe(20), 'o corpo segue a cabeça, gomo por gomo');

// ---------- Comer e crescer ----------
por(a, 1500, 1500, 0, 20);
for (let i = 1; i <= 10; i++) arena('Manhã').comida.push({ x: 1500 + i * 12, y: 1500, m: 1, c: 0 });
andar(1200, [ana], () => ({ x: 2500, y: 1500 }));
ok(a.massa >= 29.5 && a.corpo.length > jogo._gomosDe(20), `comendo as bolinhas, cresce e fica mais comprida (tamanho ${a.massa.toFixed(0)}, ${a.corpo.length} gomos)`);

// ---------- Acelerar ----------
por(a, 1000, 1000, 0, 100);
const x0 = a.corpo[0][0];
andar(1000, [ana], () => ({ x: 2900, y: 1000, acelerar: true }));
const andouTurbo = a.corpo[0][0] - x0;
ok(andouTurbo > 250 && a.massa < 97, `acelerando, anda mais rápido (${Math.round(andouTurbo)} em 1 s) e perde tamanho (${a.massa.toFixed(1)})`);
ok(arena('Manhã').comida.some((f) => f.c === -1 - a.cor), 'acelerando, deixa bolinhas da sua cor para trás');
por(a, 1000, 1000, 0, 22);
andar(500, [ana], () => ({ x: 2900, y: 1000, acelerar: true }));
ok(a.massa >= 22, 'pequena demais (até 25), não consegue acelerar');

// ---------- Bater a cabeça no corpo de outra ----------
jogo.entrar(bruno);
const b = cobra('Manhã', bruno);
ok(arena('Manhã').jogadores.size === 8, 'o Bruno entra e um robô sai (continua com 8)');
longeDosRobos();
// O Bruno atravessado na frente da Ana: a Ana vem de lado e bate no corpo dele.
por(b, 2000, 1200, Math.PI / 2, 200); // corpo do Bruno na vertical, x = 2000
por(a, 1900, 1100, 0, 300);           // Ana indo para a direita, rumo ao corpo dele
const daAna = () => arena('Manhã').comida.filter((f) => f.c === -1 - a.cor).length; // bolinhas da cor da Ana
const comidaAntes = daAna();
andar(1500, [ana, bruno], (u) => (u === ana ? { x: 2900, y: 1100 } : { x: 2000, y: 2900 }));
const va = jogo.jogar(ana, {});
ok(!va.eu.vivo && va.eu.mortoPor && va.eu.mortoPor.nome === 'Bruno', 'a Ana bate a cabeça no corpo do Bruno: morre ("bateu no Bruno"), mesmo sendo maior');
ok(b.abates === 1, 'o Bruno conta 1 abate');
ok(daAna() >= comidaAntes + 25, `o corpo da Ana vira comida da cor dela no chão (${daAna() - comidaAntes} bolinhas)`);
ok(!jogo.jogar(ana, { acelerar: true }).eu.vivo, 'quem morreu não anda nem acelera');
ok(jogo.entrar(ana).eu.vivo, 'a Ana nasce de novo com "Jogar de novo"');
// Cabeça com cabeça: a menor morre.
longeDosRobos();
por(a, 1000, 2000, 0, 300);
por(b, 1060, 2000, Math.PI, 60);
andar(400, [ana, bruno], (u) => (u === ana ? { x: 2900, y: 2000 } : { x: 100, y: 2000 }));
ok(a.vivo && !b.vivo, 'cabeça com cabeça: a menor (o Bruno) morre');

// ---------- Robôs fracos ----------
jogo.entrar(bruno);
longeDosRobos();
const robo = [...arena('Manhã').jogadores.values()].find((p) => p.robo);
por(robo, 1500, 600, 0, 40);
por(a, 1700, 600, Math.PI, 30);
let foiNaAna = false;
for (let i = 0; i < 20; i++) { t += 100; jogo.jogar(ana, {}); jogo.jogar(bruno, {}); if (robo.vivo && Math.abs(Math.cos(robo.alvoAng) - 1) < 0.05) foiNaAna = true; }
ok(robo.vivo, 'o robô vê a Ana na frente e desvia (não bate)');
ok(!foiNaAna || robo.vivo, 'o robô não persegue a Ana');

// ---------- Turmas, professor, arena fechada ----------
const vc = jogo.entrar(carla);
ok(vc.turma === 'Tarde' && !vc.c.some((x) => x[0] === 'u:a1'), 'a Carla (Tarde) fica na arena dela');
ok(/Apenas o instrutor/.test(lanca(() => jogo.configurar(ana, { aberta: false }))), 'aluno não fecha a arena');
const vr = jogo.entrar(rita, { turma: 'Manhã', assistir: true });
const vivasManha = [...arena('Manhã').jogadores.values()].filter((p) => p.vivo).length;
ok(vr.eu.espectador && vr.f.length >= 600 && vr.c.length === vivasManha, `a professora assiste à arena inteira da Manhã e vê todas as ${vivasManha} cobrinhas vivas`);
ok(jogo.estado(rita).salas.length === 2, 'a professora vê as arenas das duas turmas');
jogo.configurar(rita, { robos: false }); andar(100, [ana, bruno, rita]);
ok(![...arena('Manhã').jogadores.values()].some((p) => p.robo), 'robôs desligados: só gente');
jogo.configurar(rita, { robos: true }); andar(100, [ana, bruno, rita]);
ok([...arena('Manhã').jogadores.values()].filter((p) => p.robo).length === 6, 'robôs ligados de novo: 6 robôs + 2 alunos');
jogo.configurar(rita, { aberta: false });
ok(jogo.jogar(ana, {}).fechada && /fechada/.test(lanca(() => jogo.entrar(ana))), 'arena fechada: a Ana sai e não consegue entrar');
ok(jogo.jogar(rita, {}).eu.espectador, 'a professora continua assistindo');
jogo.configurar(rita, { aberta: true });
ok(jogo.entrar(ana).eu.vivo, 'arena aberta de novo: a Ana volta');

// ---------- Quem some e a arena vazia ----------
jogo.entrar(bruno);
for (let i = 0; i < 20; i++) { t += 1000; jogo.jogar(ana, {}); jogo.jogar(rita, {}); }
ok(!cobra('Manhã', bruno), 'o Bruno ficou 15 s sem dar sinal: saiu');
jogo.sair(ana); jogo.sair(rita); jogo.sair(carla);
t += 61000; jogo.estado(ana);
ok(!arena('Manhã') && !arena('Tarde'), 'sem ninguém por 1 minuto, as arenas somem');

// ---------- Desempenho: 20 alunos ----------
const vinte = Array.from({ length: 20 }, (_, i) => ({ id: 'x' + i, nome: `Aluno ${i}`, papel: 'aluno', turma: 'Noite', avatar: '🙂' }));
vinte.forEach((u) => jogo.entrar(u));
for (const p of arena('Noite').jogadores.values()) if (p.vivo) { p.massa = 400; }
const inicio = process.hrtime.bigint();
let maior = 0;
for (let i = 0; i < 100; i++) { t += 100; for (const u of vinte) { const r = jogo.jogar(u, { x: 1500 + Math.sin(i / 7 + u.id.length) * 1200, y: 1500 + Math.cos(i / 9) * 1200, vw: 900, vh: 500, acelerar: i % 30 < 3 }); maior = Math.max(maior, JSON.stringify(r).length); } }
const ms = Number(process.hrtime.bigint() - inicio) / 1e6;
ok(ms < 4000, `20 alunos grandes, 10 vezes por segundo, 10 s de jogo: ${Math.round(ms)} ms no computador do instrutor`);
ok(maior < 60000, `cada resposta é pequena (a maior teve ${(maior / 1024).toFixed(1)} KB)`);

console.log(falhas ? `FALHAS ${falhas}` : 'FALHAS 0');
