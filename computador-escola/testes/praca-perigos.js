// Eventos urgentes interativos no mapa da Praça Escola: as regras, sem tela e sem rede, com um relógio de mentira
// (o teste inteiro leva 1 ou 2 segundos). Confere o fogo se alastrando (a lata de lixo, o poste de luz, os Bombeiros),
// a enchente subindo (a areia da obra, o caminhão da Defesa Civil, a barreira de sacos), as árvores caindo na chuva
// forte (o aviso à Defesa Civil, a equipe que tira a árvore, o caminho que nunca fecha de vez) e os colegas de
// demonstração ajudando pelo mapa.
// Uso: node testes/praca-perigos.js   (ou npm run teste:perigos)
const path = require('path');
const APP = path.join(__dirname, '..', 'app', 'js');
const criarPraca = require(path.join(APP, 'praca-regras'));
const M = require(path.join(APP, 'praca-mapa'));
let falhas = 0;
const ok = (c, m) => { console.log((c ? '✔ ' : '✘ ') + m); if (!c) falhas++; };
const erroDe = (f) => { try { f(); return ''; } catch (e) { return e.message; } };
let agora = new Date(2026, 10, 16, 10, 0, 0).getTime();
const praca = criarPraca({ relogio: () => agora });
const prof = { id: 'p', nome: 'Prof', papel: 'instrutor', turma: '' };
const a = { id: 'a', nome: 'Ana', papel: 'aluno', turma: 'T' }, b = { id: 'b', nome: 'Bia', papel: 'aluno', turma: 'T' };
const sinc = (u, eu) => praca.sincronizar(u, eu || {}, 0);
const passar = (ms, passo = 1000) => { for (let t = 0; t < ms; t += passo) { agora += Math.min(passo, ms - t); sinc(a); sinc(b); } };
sinc(a, { x: 18, y: 16 }); sinc(b, { x: 18, y: 16 });

// ================= Incêndio =================
let r = praca.iniciarEmergencia(prof, 'incendio');
ok(r.status === 'ativo' && r.perigo === 15 && r.focos.length === 1 && r.focos[0].id === 'lixeira' && r.focos[0].forca === 2.7, `começa só na lata de lixo (perigo ${r.perigo}%, força ${r.focos[0].forca})`);
passar(9000);
r = sinc(a).emergencia;
const poste = r.focos.find((f) => f.id === 'poste');
ok(poste && poste.eletrico && poste.forca > 0, `em 8 s o fogo pula para o poste de luz (força ${poste && poste.forca})`);
ok(r.perigo > 15, `o fogo cresce sozinho (${r.perigo}%)`);
passar(26000);
r = sinc(a).emergencia;
ok(r.focos.filter((f) => f.forca > 0).length >= 3, `sem ninguém ajudando, o fogo se espalha: ${r.focos.filter((f) => f.forca > 0).map((f) => f.id).join(', ')}`);
// Balde: longe não dá; no poste não pode; do lado de um foco, apaga um pouco.
praca.acaoEmergencia(a, 'pegar', { x: 16, y: 13 });
ok(/mais perto do fogo/.test(erroDe(() => praca.acaoEmergencia(a, 'entregar', { x: 3, y: 3 }))), 'longe do fogo, a água não vai');
ok(/poste de luz, não/.test(erroDe(() => praca.acaoEmergencia(a, 'entregar', { x: 24, y: 13, foco: 'poste' }))), 'água no poste: recusado (água conduz eletricidade)');
const alvo = r.focos.filter((f) => f.forca > 0 && !f.eletrico).sort((x, y) => y.forca - x.forca)[0];
const [ax, ay] = M.pertoDoPonto(alvo.x, alvo.y)[0];
const antes = alvo.forca;
const depois = praca.acaoEmergencia(a, 'entregar', { x: ax, y: ay, foco: alvo.id }).emergencia.focos.find((f) => f.id === alvo.id).forca;
ok(depois < antes, `um balde ${alvo.nome}: força ${antes} → ${depois}`);
// Ligar 193: os Bombeiros vêm de caminhão e apagam o poste primeiro.
const lig = praca.acaoEmergencia(b, 'ligar', { resposta: '193' });
ok(lig.certo && lig.emergencia.bombeiros && !lig.emergencia.bombeiros.chegou, 'ligou 193: os Bombeiros estão a caminho');
passar(17000);
r = sinc(a).emergencia;
ok(r.bombeiros.chegou && r.bloqueios.tiles.some(([x, y]) => x === 26 && y === 14), 'os Bombeiros chegaram (o caminhão fica na rua do lado da praça)');
ok((r.focos.find((f) => f.id === 'poste') || {}).forca === 0, 'os Bombeiros apagaram o poste');
// A turma apaga o resto, foco por foco.
let voltas = 0;
while (r.status === 'ativo' && voltas++ < 200) {
  const f = r.focos.filter((x) => x.forca > 0 && !x.eletrico)[0];
  if (!f) { passar(1000); r = sinc(a).emergencia; continue; }
  const [x, y] = M.pertoDoPonto(f.x, f.y)[0];
  for (const u of [a, b]) {
    try { praca.acaoEmergencia(u, 'pegar', { x: 16, y: 13 }); agora += 1300; r = praca.acaoEmergencia(u, 'entregar', { x, y, foco: f.id }).emergencia; } catch (e) { agora += 500; r = sinc(a).emergencia; }
    if (r.status !== 'ativo') break;
  }
}
ok(r.status === 'salvo', `a turma apagou todos os focos (${voltas} voltas): ${r.status}`);
passar(16000);

// ================= Poste sem Bombeiros: não dá para vencer só com balde =================
praca.iniciarEmergencia(prof, 'incendio');
passar(9000);
voltas = 0; r = sinc(a).emergencia;
while (voltas++ < 60) {
  const f = r.focos.filter((x) => x.forca > 0 && !x.eletrico)[0];
  if (!f) break;
  const [x, y] = M.pertoDoPonto(f.x, f.y)[0];
  try { praca.acaoEmergencia(a, 'pegar', { x: 16, y: 13 }); agora += 1300; r = praca.acaoEmergencia(a, 'entregar', { x, y, foco: f.id }).emergencia; } catch (e) { agora += 400; r = sinc(a).emergencia; }
}
r = sinc(a).emergencia;
ok(r.status === 'ativo' && r.focos.filter((f) => f.forca > 0).every((f) => f.eletrico) && r.perigo > 0, `só com balde, o poste continua pegando fogo (perigo ${r.perigo}%): precisa dos Bombeiros`);
passar(10000);
ok(sinc(a).emergencia.perigo === r.perigo, 'só o poste aceso: o fogo não cresce, mas também não apaga');
praca.encerrarEmergencia(prof);
passar(16000);

// ================= Enchente =================
r = praca.iniciarEmergencia(prof, 'rio');
ok(r.perigo === 50 && r.agua === 22.5 && r.fontes.join() === 'obra', `a enchente começa com a água na fileira ${r.agua} (praia, trilhos e feira debaixo d’água): areia só na obra`);
ok(!M.andavel(6, 23) && !M.andavel(20, 26) && M.andavel(6, 22), 'a feira de baixo e a praia alagaram (não dá para andar); a fileira de cima ainda não');
ok(/monte da obra/.test(erroDe(() => praca.acaoEmergencia(a, 'pegar', { x: 18, y: 26 }))), 'na praia alagada não tem areia: a areia está no monte da obra');
praca.acaoEmergencia(a, 'pegar', { x: 32, y: 4 });
const saco = praca.acaoEmergencia(a, 'entregar', { x: 20, y: 21 }).emergencia;
ok(saco.sacos === 1 && saco.perigo < 50 && saco.agua > 22.5, `um saco na barreira: a água desce (fileira ${saco.agua}, ${saco.perigo}%)`);
praca.acaoEmergencia(b, 'ligar', { resposta: '199' });
passar(16000);
r = sinc(a).emergencia;
ok(r.caminhao && r.caminhao.chegou && r.fontes.includes('caminhao'), 'ligou 199: o caminhão da Defesa Civil chegou com areia na avenida');
praca.acaoEmergencia(a, 'pegar', { x: 16, y: 19 });
const doCaminhao = praca.acaoEmergencia(a, 'entregar', { x: 16, y: 21 }).emergencia;
ok(doCaminhao.sacos === 2, 'areia do caminhão, do lado da barreira');
passar(60000);
r = sinc(a).emergencia;
ok(r.agua < doCaminhao.agua - 1, `sem mais sacos, a água volta a subir (fileira ${doCaminhao.agua} → ${r.agua})`);
praca.encerrarEmergencia(prof);
ok(M.andavel(6, 23) && M.andavel(6, 24), 'o instrutor encerrou: o mapa volta ao normal');
passar(16000);

// ================= Chuva forte: árvores caindo =================
praca.iniciarEmergencia(prof, 'chuva');
passar(9000);
r = sinc(a).emergencia;
ok(r.quedas.length === 1 && r.quedas[0].tiles.length === 2, `em 8 s cai a primeira árvore (${r.quedas[0] && r.quedas[0].onde})`);
const q = r.quedas[0];
ok(q.tiles.every(([x, y]) => !M.andavel(x, y)) && M.tudoAlcancavel(new Set()), 'o tronco fecha a rua, mas ainda dá para chegar em todos os lugares');
const longeDaArvore = q.tiles[0][1] > 15 ? [18, 2] : [18, 26];
ok(/mais perto da árvore/.test(erroDe(() => praca.acaoEmergencia(a, 'avisar', { x: longeDaArvore[0], y: longeDaArvore[1], queda: q.id }))), 'longe da árvore não dá para avisar');
const [vx, vy] = M.pertoDoPonto(q.tiles[0][0], q.tiles[0][1], 2.4).sort((p1, p2) => Math.hypot(p2[0] - q.tiles[0][0], p2[1] - q.tiles[0][1]) - Math.hypot(p1[0] - q.tiles[0][0], p1[1] - q.tiles[0][1]))[0];
const perigoAntes = sinc(a).emergencia.perigo;
const av = praca.acaoEmergencia(a, 'avisar', { x: vx, y: vy, queda: q.id }).emergencia;
ok(av.quedas[0].avisada && av.quedas[0].por === 'Ana' && av.perigo < perigoAntes, `a Ana avisou a Defesa Civil (199) de longe (sem encostar): perigo ${perigoAntes}% → ${av.perigo}%`);
ok(/já foi avisada/.test(erroDe(() => praca.acaoEmergencia(b, 'avisar', { x: vx, y: vy, queda: q.id }))), 'a mesma árvore não se avisa duas vezes');
passar(8000);
ok(sinc(a).emergencia.quedas.find((x) => x.id === q.id).equipe, 'a equipe da Defesa Civil chegou na árvore');
passar(7000);
ok(!sinc(a).emergencia.quedas.find((x) => x.id === q.id) && q.tiles.every(([x, y]) => M.andavel(x, y)), 'a equipe tirou a árvore: a rua abriu de novo');
passar(60000);
r = sinc(a).emergencia;
ok(r.quedas.length >= 3 && M.tudoAlcancavel(new Set()), `com o tempo caem mais árvores (${r.quedas.length} na rua), sem nunca fechar o caminho de um lugar`);
ok(r.perigo >= 60, `árvore caída sem aviso deixa o temporal mais perigoso (${r.perigo}%)`);
praca.encerrarEmergencia(prof);
ok(r.quedas.every((x) => x.tiles.every(([tx, ty]) => M.andavel(tx, ty))), 'encerrou: as árvores saem do caminho');
passar(16000);

// ================= Colegas de demonstração ajudando no mapa =================
const demo = criarPraca({ relogio: () => agora, demonstracao: true });
const eu = { id: 'eu', nome: 'Eu', papel: 'aluno', turma: 'Demonstração' };
demo.sincronizar(eu, { x: 18, y: 16 }, 0);
demo.iniciarEmergencia(prof, 'incendio');
let viuBalde = false, ajudaram = 0;
for (let k = 0; k < 40; k++) {
  agora += 1000;
  const s = demo.sincronizar(eu, { x: 18, y: 16 }, 0);
  if (s.pessoas.some((x) => x.bot && x.carga === '💧')) viuBalde = true;
  ajudaram = s.eventos.filter((e) => e.tipo === 'emergencia-ajuda').length;
}
ok(viuBalde, 'no modo de teste, os colegas andam até a fonte e carregam o balde 💧 (aparece em cima do boneco)');
ok(ajudaram > 0, 'e jogam água nos focos (a conversa conta quem ajudou)');
demo.encerrarEmergencia(prof);

console.log(falhas ? `FALHAS ${falhas}` : 'FALHAS 0');
process.exitCode = falhas ? 1 : 0;
