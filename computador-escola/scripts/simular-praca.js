// Simulação de uma Hora da Praça (15 minutos) com 13 alunos e 1 tutor, usando o MESMO motor da Praça Escola que roda
// no computador do instrutor (app/js/praca-regras.js), segundo a segundo, com um relógio de mentira. Cada aluno tem um
// jeito de ser (a rápida, o endividado, a vendedora, o que cai em golpe...). O que só acontece no computador do aluno
// (a prova das vagas, o banco, as contas do mês) segue as mesmas regras do programa (carteira.js e praca.js).
// Tudo vira uma gravação (JSON) para assistir no replay.
// Uso: node scripts/simular-praca.js saida.json [replay.html]
const fs = require('fs');
const path = require('path');
const APP = path.join(__dirname, '..', 'app', 'js');
const criarPraca = require(path.join(APP, 'praca-regras'));
const M = require(path.join(APP, 'praca-mapa'));
const NOV = require(path.join(APP, 'praca-novela'));

const INICIO = new Date(2026, 10, 16, 19, 45, 0).getTime(); // aula da noite: a Hora da Praça vai das 19h45 às 20h00
let agora = INICIO;
const TICK = 300;               // passo da simulação (ms)
const DURACAO = 15 * 60000;
const t = () => Math.round((agora - INICIO) / 1000); // segundos desde o começo
const TURMA = 'Turma da Noite';

// ---------- Personagens ----------
const PERFIS = [
  ['ana', 'Ana', '🐱', 'Rápida e organizada: poupa, paga em dia e ajuda os colegas.'],
  ['bruno', 'Bruno', '🐶', 'Pegou empréstimo e está com o nome sujo: hoje quer se acertar.'],
  ['carla', 'Carla', '🌻', 'Vendedora nata: abre a barraca de bolo na feira.'],
  ['davi', 'Davi', '😎', 'Distraído: clica antes de ler e cai em golpe.'],
  ['elza', 'Elza', '👵', 'Primeira vez na praça, devagar e com medo de errar.'],
  ['fabio', 'Fábio', '🧢', 'Bagunceiro: fala o que não deve e fica olhando o fogo.'],
  ['graca', 'Graça', '🌺', 'Detetive: corre atrás das pistas da novela.'],
  ['helio', 'Hélio', '🎣', 'Veio do interior: cuida da cidade e da coleta seletiva.'],
  ['iara', 'Iara', '🦜', 'Também é nova: digita muito bem.'],
  ['jorge', 'Jorge', '🙂', 'Bom de conta: quer a promoção de fiscal de caixa.'],
  ['katia', 'Kátia', '💁', 'Monitora da turma: ajuda quem está perdido.'],
  ['luis', 'Luís', '👷', 'Calmo na emergência: sabe os números de socorro.'],
  ['marta', 'Marta', '🦋', 'Gosta de comprar: compra na feira e paga boleto sem conferir.'],
];
const alunos = PERFIS.map(([id, nome, avatar]) => ({ id, nome, avatar, papel: 'aluno', turma: TURMA }));
const tutor = { id: 'tutor', nome: 'Prof. Rita', avatar: '👩‍🏫', papel: 'instrutor', turma: '' };
const porId = Object.fromEntries(alunos.map((a) => [a.id, a]));

// ---------- O dinheiro de cada aluno (as regras do banco do programa) ----------
const TAXA = { poupanca: 0.005, aplicacao: 0.01, emprestimo: 0.02 };
const faixa = (s) => (s >= 700 ? { nome: 'Bom pagador', limite: 250, taxa: 0.015 } : s >= 400 ? { nome: 'Regular', limite: 150, taxa: 0.02 } : { nome: 'Baixo', limite: 60, taxa: 0.03 });
const c2 = (v) => Math.round(v * 100) / 100;
const fin = {};
const iniciar = (id, carteira, conta, poupanca, divida, score, extra = {}) => { fin[id] = { carteira, conta, poupanca, divida, taxa: divida ? 0.02 : 0, score, contas: [], cracha: null, cargos: {}, contratacoes: 0, ...extra }; };
iniciar('ana', 40, 60, 80, 0, 640, { contratacoes: 2, cargos: { recepcao: 92 }, cracha: '📞' });
iniciar('bruno', 5, 10, 0, 118.5, 380, { atrasada: { id: 'ct-7-aluguel', nome: 'Aluguel', valor: 15, icone: '🏠' } });
iniciar('carla', 30, 25, 0, 0, 520);
iniciar('davi', 25, 40, 0, 0, 500);
iniciar('elza', 0, 0, 0, 0, 500);
iniciar('fabio', 15, 20, 0, 0, 470);
iniciar('graca', 35, 30, 20, 0, 560);
iniciar('helio', 20, 30, 0, 0, 520);
iniciar('iara', 0, 0, 0, 0, 500);
iniciar('jorge', 25, 35, 0, 0, 600, { contratacoes: 1, cargos: { caixa: 80 }, cracha: '🛒' });
iniciar('katia', 50, 70, 100, 0, 760);
iniciar('luis', 20, 30, 0, 0, 540);
iniciar('marta', 30, 25, 0, 0, 500);
const resumoFin = (id) => { const f = fin[id]; return { conta: c2(f.conta), poupanca: c2(f.poupanca), divida: c2(f.divida), score: f.score, sujo: !!f.atrasada, atrasadas: f.atrasada ? 1 : 0 }; };
const mudarScore = (id, d) => { fin[id].score = Math.max(0, Math.min(1000, fin[id].score + d)); };

// ---------- O motor da praça ----------
const praca = criarPraca({
  relogio: () => agora, ler: () => ({ dias: 8 }),
  alunos: () => alunos.map((a) => ({ id: a.id, nome: a.nome, turma: a.turma, avatar: a.avatar })),
  moedas: (id) => (fin[id] ? fin[id].carteira : null),
});

// ---------- A gravação ----------
const eventos = [];
const log = (quem, tipo, texto, extra = {}) => eventos.push({ t: t(), quem, tipo, texto, ...extra });
const quadros = [];
let desdeTutor = 0;
const vistos = new Set();

// ---------- As pessoas no mapa ----------
const gente = [tutor, ...alunos].map((u, k) => {
  const [x, y] = M.CHEGADA[k % M.CHEGADA.length];
  return { u, x, y, caminho: [], entra: u === tutor ? 0 : 4 + k * 3, dentro: false, esperaAte: 0, plano: null, carga: null, fala: null, falaAte: 0, mao: false, ultimo: {} };
});
const G = Object.fromEntries(gente.map((g) => [g.u.id, g]));
const pos = (g) => [Math.round(g.x), Math.round(g.y)];
function rota(g, metas) {
  const c = M.caminho(pos(g), metas);
  if (c === null) return false;
  g.caminho = c;
  return true;
}
const entradas = (lugar) => (M.porLugar[lugar].entradas && M.porLugar[lugar].entradas.length ? M.porLugar[lugar].entradas : [[M.porLugar[lugar].r[0], M.porLugar[lugar].r[1] + M.porLugar[lugar].r[3]]]);
const sinc = (g) => {
  const eu = { x: g.x, y: g.y, esq: false, andando: g.caminho.length > 0, cracha: g.u.papel === 'aluno' ? fin[g.u.id].cracha : null };
  if (g.u.papel === 'aluno') eu.fin = resumoFin(g.u.id);
  const r = praca.sincronizar(g.u, eu, g.u === tutor ? desdeTutor : 0);
  g.ultimo = r;
  return r;
};
const dizer = (g, texto) => {
  try { praca.falar(g.u, texto); g.fala = texto; g.falaAte = agora + 4000; } catch (e) { log(g.u.id, 'aviso', `🔇 ${g.u.nome} tentou falar, mas: ${e.message}`); }
};
// Uma ação do aluno no motor: dá certo, ou vira um aviso na gravação (como a mensagem que ele veria na tela).
function tentar(g, f, rotulo) {
  try { return f(); } catch (e) { if (!/Não tem nenhum evento urgente|Chegue mais perto do fogo|uma entrega de cada vez/.test(e.message)) log(g.u.id, 'aviso', `${g.u.nome}: ${rotulo ? rotulo + ': ' : ''}${e.message}`); return null; }
}
const hora = () => { const d = G.tutor.ultimo.dia; if (!d) return 8; return 8 + 10 * Math.max(0, Math.min(1, (agora - d.inicio) / d.duracao)); };
const vagaDaHora = () => NOV.VAGAS.find((v) => hora() >= v.de && hora() < v.ate) || null;
const hhmm = () => { const h = hora(); return `${Math.floor(h)}:${String(Math.floor((h % 1) * 60)).padStart(2, '0')}`; };

// ---------- O que cada um faz (um "roteiro" por pessoa, que reage ao que acontece) ----------
const ir = (metas) => ({ ir: metas });
const esperar = (ms) => ({ esperar: ms });
function* andarAte(g, lugarOuPontos) {
  const metas = typeof lugarOuPontos === 'string' ? entradas(lugarOuPontos) : lugarOuPontos;
  yield ir(metas);
}
function salario(id, v, nota) {
  const f = fin[id];
  const destaque = (vagaDaHora() || {}).id === v.id;
  const passou = nota >= 60;
  const g = G[id];
  log(id, 'vaga', `${g.u.nome} fez a prova de ${v.titulo} (${NOV.PROVAS[v.prova]}): nota ${nota}.${passou ? '' : ' Ainda não foi desta vez.'}`, { nota });
  if (!passou) return 0;
  const valor = Math.round(v.salario * (nota / 100) * (destaque ? 1.5 : 1)) + (nota >= 90 ? 10 : 0);
  let desconto = 0;
  if (f.divida > 0) { desconto = c2(Math.min(f.divida, valor * 0.5)); f.divida = c2(f.divida - desconto); if (f.divida <= 0.004) { f.divida = 0; mudarScore(id, 50); log(id, 'dinheiro', `🎉 ${g.u.nome} quitou o empréstimo! (+50 no nome)`); } }
  f.conta = c2(f.conta + valor - desconto);
  const primeira = !f.cargos[v.id];
  f.cargos[v.id] = Math.max(nota, f.cargos[v.id] || 0); f.contratacoes++; f.cracha = v.emoji;
  log(id, 'dinheiro', `💼 ${g.u.nome} foi contratado(a) como ${v.titulo.replace(/ \(promoção\)$/, '')}${destaque ? ' (vaga em destaque: +50%)' : ''}: salário de ${valor} moedas${desconto ? `, ${desconto} foram direto para a dívida do empréstimo` : ''}. Crachá ${v.emoji} no boneco.`, { valor });
  if (primeira) for (const p of NOV.VAGAS.filter((x) => x.requer === v.id)) log(id, 'vaga', `🔓 Promoção liberada para ${g.u.nome}: ${p.titulo}.`);
  return valor;
}
const vaga = (id) => NOV.VAGAS.find((v) => v.id === id) || (id === 'vaga-camara' ? criadas[0] : criadas.find((v) => v.id === id));
const criadas = [];
function pagarConta(id, conta) {
  const f = fin[id], g = G[id];
  if (conta.falso) {
    f.conta = c2(f.conta - conta.valor); mudarScore(id, -30); conta.paga = true;
    log(id, 'golpe', `😱 ${g.u.nome} pagou o boleto falso de "${conta.benef}" (${conta.valor} moedas). O dinheiro foi para o golpista e o nome caiu 30 pontos.`);
    return;
  }
  const multa = conta.atraso ? c2(conta.valor * 0.1) : 0;
  if (f.conta < conta.valor + multa) { log(id, 'aviso', `${g.u.nome} tentou pagar a ${conta.nome.toLowerCase()}, mas não tinha saldo na conta.`); return; }
  f.conta = c2(f.conta - conta.valor - multa); conta.paga = true; mudarScore(id, multa ? 10 : 25);
  log(id, 'dinheiro', `${conta.icone} ${g.u.nome} pagou a ${conta.nome.toLowerCase()} (${c2(conta.valor + multa)} moedas${multa ? ', com multa de 10% por atraso' : ', em dia'}). Nome: ${f.score} pontos.`);
}
function recusarConta(id, conta) {
  conta.recusada = true; fin[id].carteira += 5; mudarScore(id, 15);
  log(id, 'golpe', `🛡️ ${G[id].u.nome} conferiu quem recebe e viu que o boleto pelo WhatsApp era falso: apertou "É golpe" (+5 moedas, +15 no nome).`);
}
const contaDe = (id, falso) => fin[id].contas.find((c) => !!c.falso === !!falso && !c.paga && !c.recusada);

function* prova(g, idVaga, nota, duracao) {
  const v = vaga(idVaga);
  log(g.u.id, 'vaga', `${g.u.nome} se candidatou a ${v.titulo}: começou a prova (${NOV.PROVAS[v.prova]}).`);
  yield esperar(duracao);
  salario(g.u.id, v, nota);
}
function* tarefa(g, lugar, erraPrimeiro) {
  yield* andarAte(g, lugar);
  const tt = NOV.tarefaDoDia(lugar, agora);
  const certa = tt.tipo === 'digitar' ? (tt.numero ? String(tt.resposta) : tt.modelo) : tt.certa;
  yield esperar(6000);
  if (erraPrimeiro && tt.tipo !== 'digitar') {
    tentar(g, () => praca.fazerTarefa(g.u, lugar, (certa + 1) % (tt.opcoes || tt.itens).length));
    log(g.u.id, 'tarefa', `${g.u.nome} errou a tarefa do dia ${NOV.TAREFAS[lugar] ? `"${NOV.TAREFAS[lugar].titulo}"` : ''} e leu a dica: "Ainda não".`);
    yield esperar(5000);
  }
  const r = tentar(g, () => praca.fazerTarefa(g.u, lugar, certa), `Tarefa ${lugar}`);
  if (r && r.certo) { if (r.contou) fin[g.u.id].carteira += 5; log(g.u.id, 'tarefa', `✅ ${g.u.nome} fez a tarefa do dia "${NOV.TAREFAS[lugar].titulo}"${r.contou ? ' (+5 moedas)' : ''}.`); }
}
function* pista(g, idPista) {
  const p = NOV.porPista[idPista];
  yield* andarAte(g, p.lugar);
  yield esperar(5000);
  const tt = p.tarefa;
  const certa = tt.tipo === 'digitar' ? tt.modelo : tt.certa;
  const r = tentar(g, () => praca.resolverPista(g.u, idPista, certa), 'Pista');
  if (r && r.contou) { fin[g.u.id].carteira += 10; log(g.u.id, 'novela', `🔎 ${g.u.nome} achou a pista "${p.titulo}" (+10 moedas).`); }
}
function* coletarLixo(g, vezes) {
  for (let k = 0; k < vezes; k++) {
    const itens = (g.ultimo.coleta && g.ultimo.coleta.itens) || [];
    if (!itens.length) { yield esperar(4000); continue; }
    const i = itens.slice().sort((a, b) => Math.hypot(a.x - g.x, a.y - g.y) - Math.hypot(b.x - g.x, b.y - g.y))[0];
    yield ir(M.pertoDoPonto(i.x, i.y));
    const r = tentar(g, () => praca.coletar(g.u, 'pegar', { item: i.id, x: g.x, y: g.y }));
    if (!r) continue;
    g.carga = '🗑️';
    const lixeira = Object.keys(M.porLugar).find((id) => M.porLugar[id].coleta === r.item.tipo);
    const L = M.porLugar[lixeira];
    yield ir(M.pertoDoPonto(L.r[0], L.r[1]));
    const j = tentar(g, () => praca.coletar(g.u, 'jogar', { lixeira, x: g.x, y: g.y }));
    g.carga = null;
    if (j && j.certo) { fin[g.u.id].carteira += 2; log(g.u.id, 'coleta', `♻️ ${g.u.nome} separou ${r.item.nome} na lixeira certa (+2 moedas).`); }
    yield esperar(1500);
  }
}
function* passear(g, voltas) {
  const lugares = ['coreto', 'mural', 'horta', 'estacao', 'correios', 'banco', 'posto', 'escola'];
  for (let k = 0; k < voltas; k++) { yield* andarAte(g, lugares[(k * 3 + g.u.id.length) % lugares.length]); yield esperar(3000); }
}

// O que fazer num incêndio: os que ajudam enchem o balde e jogam no fogo; os curiosos ficam olhando.
const REACAO = { luis: 9000, katia: 14000, ana: 16000, helio: 21000, graca: 25000, jorge: 30000, bruno: 34000, marta: 38000, carla: 42000, fabio: 6000, davi: 10000 };
function* brigada(g, papel) {
  yield esperar(REACAO[g.u.id] || 10000); // cada um demora um pouco para perceber o alarme
  const e0 = g.ultimo.emergencia;
  if (!e0 || e0.status !== 'ativo') return;
  if (papel === 'ligar') {
    const r = tentar(g, () => praca.acaoEmergencia(g.u, 'ligar', { resposta: '193' }));
    if (r && r.certo) dizer(g, 'Liguei 193! Os Bombeiros estão vindo!');
  }
  if (papel === 'pergunta') {
    const def = NOV.EMERGENCIAS.incendio;
    tentar(g, () => praca.acaoEmergencia(g.u, 'pergunta', { resposta: String(def.pergunta.certa) }));
    dizer(g, 'Pessoal, afastem-se do fogo!');
    log(g.u.id, 'emergencia', `📣 ${g.u.nome} respondeu certo e afastou os curiosos: o fogo demora mais para pular.`);
  }
  if (papel === 'curioso') {
    if (e0 && e0.focos) { const f = e0.focos.find((x) => x.forca > 0) || e0.focos[0]; yield ir(M.pertoDoPonto(f.x, f.y)); }
    dizer(g, 'Nossa, olha o fogo! 😮');
    log(g.u.id, 'emergencia', `👀 ${g.u.nome} ficou parado olhando o fogo (curioso atrapalha os bombeiros).`);
    while (G.tutor.ultimo.emergencia && G.tutor.ultimo.emergencia.status === 'ativo') yield esperar(2000);
    return;
  }
  // balde
  let viagens = 0;
  for (let volta = 0; volta < 40; volta++) {
    const e = g.ultimo.emergencia;
    if (!e || e.status !== 'ativo') break;
    yield ir(entradas('fonte'));
    const p = tentar(g, () => praca.acaoEmergencia(g.u, 'pegar', { x: g.x, y: g.y }));
    if (!p) { yield esperar(800); continue; }
    g.carga = '💧';
    yield esperar(1200);
    const e2 = g.ultimo.emergencia;
    if (!e2 || e2.status !== 'ativo') { g.carga = null; break; }
    const focos = e2.focos.filter((f) => f.forca > 0 && !f.eletrico).sort((a, b) => Math.hypot(a.x - g.x, a.y - g.y) - Math.hypot(b.x - g.x, b.y - g.y));
    if (!focos.length) { yield esperar(1500); continue; }
    const f = focos[volta % Math.min(2, focos.length)];
    yield ir(M.pertoDoPonto(f.x, f.y));
    const r = tentar(g, () => praca.acaoEmergencia(g.u, 'entregar', { x: g.x, y: g.y, foco: f.id }));
    g.carga = null;
    if (r) viagens++;
  }
  if (viagens) log(g.u.id, 'emergencia', `🪣 ${g.u.nome} levou ${viagens} balde${viagens > 1 ? 's' : ''} de água até o fogo.`);
}

// Caça ao tesouro: cada um vai ao baú mais perto que ainda não foi achado.
function* cacarBaus(g) {
  for (let k = 0; k < 14; k++) {
    const es = g.ultimo.especial;
    if (!es || es.tipo !== 'tesouro' || es.status === 'fim') return;
    if (es.status !== 'ativo') { yield esperar(1500); continue; }
    const livres = (es.baus || []).filter((b) => !b.achado);
    if (!livres.length) return;
    const b = livres.sort((a, c) => Math.hypot(a.x - g.x, a.y - g.y) - Math.hypot(c.x - g.x, c.y - g.y))[(g.u.id.length) % Math.min(2, livres.length)];
    const alvo = [Math.round(b.x), Math.round(b.y)];
    yield ir([alvo]);
    if (Math.hypot(g.x - b.x, g.y - b.y) > 0.9) { yield ir(M.vizinhos(alvo[0], alvo[1])); yield ir([alvo]); }
    yield esperar(900);
  }
}

// ---------- Os roteiros de cada aluno ----------
const ROTEIROS = {
  *ana(g) {
    dizer(g, 'Boa noite, turma! 👋');
    yield* tarefa(g, 'horta');
    yield* prova(g, 'recepcao', 94, 40000);
    yield* andarAte(g, 'banco');
    pagarConta('ana', contaDe('ana'));
    recusarConta('ana', contaDe('ana', true));
    fin.ana.poupanca = c2(fin.ana.poupanca + 30); fin.ana.conta = c2(fin.ana.conta - 30);
    log('ana', 'dinheiro', '🐷 Ana guardou 30 moedas na poupança (rende 0,5% ao dia).');
    yield* andarAte(g, 'feira');
    yield* comprar(g, 'carla');
    yield* pista(g, 'barco-email');
    yield* passear(g, 6);
  },
  *bruno(g) {
    dizer(g, 'Hoje eu limpo meu nome!');
    yield* andarAte(g, 'empregos');
    yield* prova(g, 'caixa', 76, 60000);
    yield* andarAte(g, 'banco');
    const f = fin.bruno;
    const a = f.atrasada; const multa = c2(a.valor * 0.1);
    if (f.conta >= a.valor + multa) { f.conta = c2(f.conta - a.valor - multa); f.atrasada = null; mudarScore('bruno', 10); log('bruno', 'dinheiro', `🏠 Bruno pagou o aluguel atrasado com multa (${c2(a.valor + multa)} moedas): o nome ficou LIMPO de novo. Nome: ${f.score} pontos.`); }
    pagarConta('bruno', contaDe('bruno'));
    recusarConta('bruno', contaDe('bruno', true));
    yield* tarefa(g, 'correios', true);
    yield* pista(g, 'barco-telegrama');
    yield* passear(g, 6);
  },
  *carla(g) {
    yield* andarAte(g, 'feira');
    const r = tentar(g, () => praca.abrirBarraca(g.u, { produto: 'Bolo de macaxeira', emoji: '🍰', preco: 6, estoque: 8 }));
    if (r) { dizer(g, 'Olha o bolo de macaxeira! Só 6 moedas!'); log('carla', 'feira', '🧺 Carla abriu a barraca: 🍰 Bolo de macaxeira, 6 moedas, 8 no estoque.'); }
    yield esperar(70000);
    dizer(g, 'Quem vai querer bolo? Tá quentinho!');
    yield esperar(60000);
    pagarConta('carla', contaDe('carla'));
    recusarConta('carla', contaDe('carla', true));
    yield* prova(g, 'auxiliar', 82, 60000);
    yield* andarAte(g, 'feira');
    yield* passear(g, 6);
  },
  *davi(g) {
    dizer(g, 'E aí, pessoal!');
    yield* andarAte(g, 'empregos');
    yield* prova(g, 'recepcao', 45, 40000);
    yield* prova(g, 'recepcao', 72, 40000);
    pagarConta('davi', contaDe('davi', true));
    yield* pista(g, 'barco-bilhete');
    yield* passear(g, 10);
  },
  *elza(g) {
    log('elza', 'entrevista', '👨‍💼 Primeiro acesso da Elza: o recrutador (Professor Virtual) abriu a entrevista de emprego.');
    yield esperar(95000);
    const e = tentar(g, () => praca.entrevista(g.u, { nome: 'Elza Pereira da Silva', idade: 61, experiencia: 'Fui merendeira de escola por 20 anos', fortes: ['Pontual', 'Paciente', 'Caprichosa'], melhorar: ['Usar o mouse', 'Digitar', 'Mandar e-mail'], motivo: 'Quero voltar a trabalhar e falar com meus netos pelo computador' }));
    if (e) { fin.elza.carteira += 20; log('elza', 'entrevista', '🤝 Elza terminou a entrevista: aprovada, bem-vinda à cidade (+20 moedas).'); }
    dizer(g, 'Consegui! 😊');
    g.mao = true; log('elza', 'ajuda', '🙋 Elza levantou a mão: não sabe onde ficam as vagas.');
    yield esperar(25000);
    g.mao = false;
    yield* prova(g, 'auxiliar', 54, 90000);
    yield* prova(g, 'auxiliar', 71, 80000);
    pagarConta('elza', contaDe('elza'));
    yield* passear(g, 4);
  },
  *fabio(g) {
    dizer(g, 'Fala, galera!');
    yield* passear(g, 2);
    yield esperar(20000);
    dizer(g, 'Esse jogo é coisa de idiota');
    log('fabio', 'aviso', '🙊 Fábio falou um palavrão: a praça trocou por asteriscos.');
    yield esperar(30000);
    yield* tarefa(g, 'estacao', true);
    yield* passear(g, 10);
  },
  *graca(g) {
    yield esperar(16000);
    yield* pista(g, 'barco-bilhete');
    yield* pista(g, 'barco-email');
    yield* pista(g, 'barco-telegrama');
    tentar(g, () => praca.recado(g.u, 'O barco do Seu Bené foi o Zeca que levou! Procurem no Spam 😉'));
    log('graca', 'novela', '📌 Graça pregou um recado no mural sobre a novela.');
    yield* prova(g, 'vaga-camara', 88, 45000);
    yield* passear(g, 8);
  },
  *helio(g) {
    yield* coletarLixo(g, 3);
    recusarConta('helio', contaDe('helio', true));
    yield* tarefa(g, 'rio');
    yield* pista(g, 'barco-bilhete');
    yield* coletarLixo(g, 3);
    yield* passear(g, 8);
  },
  *iara(g) {
    log('iara', 'entrevista', '👨‍💼 Primeiro acesso da Iara: entrevista de emprego.');
    yield esperar(70000);
    const e = tentar(g, () => praca.entrevista(g.u, { nome: 'Iara Nogueira', idade: 24, experiencia: 'Atendente de loja', fortes: ['Digito rápido', 'Comunicativa', 'Aprendo fácil'], melhorar: ['Falar em público', 'Planilha', 'Chegar no horário'], motivo: 'Quero um emprego de escritório' }));
    if (e) { fin.iara.carteira += 20; log('iara', 'entrevista', '🤝 Iara terminou a entrevista (+20 moedas).'); }
    yield* andarAte(g, 'empregos');
    yield* prova(g, 'datilografo', 96, 30000);
    yield* prova(g, 'escrevente', 91, 40000);
    pagarConta('iara', contaDe('iara'));
    yield* pista(g, 'barco-telegrama');
    yield* passear(g, 8);
  },
  *jorge(g) {
    yield* andarAte(g, 'empregos');
    yield esperar(150000);
    yield* prova(g, 'caixa', 100, 50000);
    yield* prova(g, 'fiscal', 86, 55000);
    pagarConta('jorge', contaDe('jorge'));
    recusarConta('jorge', contaDe('jorge', true));
    yield* pista(g, 'barco-email');
    yield* andarAte(g, 'feira');
    const r = tentar(g, () => praca.abrirBarraca(g.u, { produto: 'Suco de cupuaçu', emoji: '🥤', preco: 4, estoque: 10 }));
    if (r) { dizer(g, 'Suco de cupuaçu geladinho!'); log('jorge', 'feira', '🧺 Jorge abriu a barraca: 🥤 Suco de cupuaçu, 4 moedas.'); }
    yield esperar(60000);
    yield* passear(g, 6);
  },
  *katia(g) {
    yield* tarefa(g, 'posto');
    // Monitora: vai até a Elza quando ela levanta a mão.
    while (!G.elza.mao && t() < 200) yield esperar(1000);
    if (G.elza.mao) {
      yield ir(M.pertoDoPonto(G.elza.x, G.elza.y));
      dizer(g, 'Elza, as vagas ficam no botão 💼 Vagas, lá em cima!');
      log('katia', 'ajuda', '💁 Kátia (monitora) foi até a Elza e mostrou onde ficam as vagas.');
    }
    yield* coletarLixo(g, 2);
    pagarConta('katia', contaDe('katia'));
    recusarConta('katia', contaDe('katia', true));
    yield* pista(g, 'barco-bilhete');
    yield* passear(g, 8);
  },
  *luis(g) {
    yield* tarefa(g, 'estacao');
    yield* pista(g, 'barco-telegrama');
    pagarConta('luis', contaDe('luis'));
    yield* prova(g, 'caixa', 68, 60000);
    yield* passear(g, 8);
  },
  *marta(g) {
    yield esperar(30000);
    pagarConta('marta', contaDe('marta', true));
    dizer(g, 'Paguei a conta de água com desconto, que bom!');
    yield* andarAte(g, 'feira');
    yield* comprar(g, 'carla');
    yield* pista(g, 'barco-bilhete');
    yield* pista(g, 'barco-email');
    yield* passear(g, 8);
  },
};
function* comprar(g, dono) {
  const b = (praca.feira(g.u).barracas || []).find((x) => x.id === dono);
  if (!b) { log(g.u.id, 'aviso', `${g.u.nome} foi à feira, mas a barraca de ${porId[dono].nome} ainda não abriu.`); return; }
  yield esperar(3000);
  if (fin[g.u.id].carteira < b.preco) { log(g.u.id, 'aviso', `${g.u.nome} quis comprar ${b.produto}, mas não tinha moedas na carteira (Pix recusado).`); return; }
  const r = tentar(g, () => praca.comprar(g.u, { barraca: b.id, preco: b.preco }));
  if (r) { fin[g.u.id].carteira -= b.preco; log(g.u.id, 'feira', `📱 ${g.u.nome} conferiu o nome (${b.dono}) e pagou ${b.preco} moedas por Pix: ${b.emoji} ${b.produto}. Comprovante na tela.`); dizer(g, 'Hum, que delícia!'); }
}

// Quem faz o que no incêndio
const PAPEL_FOGO = { luis: 'ligar', katia: 'pergunta', fabio: 'curioso', davi: 'curioso', ana: 'balde', helio: 'balde', graca: 'balde', jorge: 'balde', bruno: 'balde', marta: 'balde', carla: 'balde' };
// Quem doa para a caça ao tesouro
const DOACOES = [['ana', 30], ['katia', 40], ['jorge', 20], ['graca', 20], ['iara', 20], ['luis', 15], ['carla', 15]];

// ---------- O roteiro do tutor ----------
const TUTOR = [
  [2, () => { praca.megafone(tutor, 'Boa noite, turma! Começou a Hora da Praça: 15 minutos. Hoje tem novela, vagas e feira!'); log('tutor', 'tutor', '📣 Megafone: "Boa noite, turma! Começou a Hora da Praça: 15 minutos. Hoje tem novela, vagas e feira!"'); }],
  [14, () => { praca.abrirCapitulo(tutor, 'barco', TURMA); log('tutor', 'tutor', '📖 Abriu o capítulo da novela no coreto: "O barco do Seu Bené sumiu". As pistas aparecem com 🔎 no mapa.'); }],
  [40, () => {
    const r = praca.criarVaga(tutor, { titulo: 'Digitador(a) da Câmara', lugar: 'Câmara de Vereadores', prova: 'ditado', texto: 'A sessão da Câmara começa às nove horas da manhã.', salario: 40 });
    const v = r.extras.find((x) => x.titulo.startsWith('Digitador')); if (v) { criadas.push(v); v.id = v.id; }
    log('tutor', 'tutor', '➕ Criou a vaga "Digitador(a) da Câmara" (ditado com o texto dela, salário 40).');
  }],
  [120, () => { const l = praca.entrevistas(tutor); log('tutor', 'tutor', `📋 Abriu as entrevistas da turma: ${l.length} entrevistas (${l.map((e) => e.nome.split(' ')[0]).join(', ')}).`); }],
  [125, () => { if (praca.minhaEntrevista(porId.iara)) { praca.comentarEntrevista(tutor, { id: 'iara', texto: 'Iara, você digita muito bem! Treine falar em público: vai longe.' }); log('tutor', 'tutor', '📨 Mandou retorno de recrutador para a Iara: "Você digita muito bem! Treine falar em público."'); } }],
  [130, () => { if (praca.minhaEntrevista(porId.elza)) { praca.comentarEntrevista(tutor, { id: 'elza', texto: 'Dona Elza, 20 anos de merendeira mostram muita responsabilidade. Vamos treinar o mouse juntos!' }); log('tutor', 'tutor', '📨 Mandou retorno para a Elza: "20 anos de merendeira mostram muita responsabilidade."'); } else log('tutor', 'tutor', '⏳ A Elza ainda está respondendo a entrevista: o retorno fica para depois.'); }],
  [210, () => { if (!praca.minhaEntrevista(porId.elza)) return; praca.comentarEntrevista(tutor, { id: 'elza', texto: 'Dona Elza, 20 anos de merendeira mostram muita responsabilidade. Vamos treinar o mouse juntos!' }); log('tutor', 'tutor', '📨 Mandou retorno de recrutador para a Elza: "20 anos de merendeira mostram muita responsabilidade."'); }],
  [146, () => { praca.silenciar(tutor, 'fabio', true); log('tutor', 'tutor', '🔇 Silenciou o Fábio por causa do palavrão.'); praca.megafone(tutor, 'Respeito na praça, pessoal. Aqui todo mundo está aprendendo.'); log('tutor', 'tutor', '📣 Megafone: "Respeito na praça, pessoal. Aqui todo mundo está aprendendo."'); }],
  [236, () => { praca.silenciar(tutor, 'fabio', false); log('tutor', 'tutor', '🔊 Devolveu a fala ao Fábio.'); }],
  [300, () => { praca.megafone(tutor, 'Lembrete: a conta de luz chegou hoje. Antes de pagar, confiram quem recebe!'); log('tutor', 'tutor', '📣 Megafone: "A conta de luz chegou hoje. Antes de pagar, confiram quem recebe!"'); }],
  [390, () => { praca.iniciarEmergencia(tutor, 'incendio'); log('tutor', 'tutor', '🚨 Disparou o evento urgente: INCÊNDIO na lata de lixo. O alarme tocou na tela de todos.', { marco: 'Incêndio' }); fogo = true; }],
  [560, () => { const loja = praca.loja(porId.ana); log('tutor', 'tutor', '🎟️ Lembrou a turma da vaquinha: a caça ao tesouro custa 150 moedas.'); praca.megafone(tutor, 'Quem quer caça ao tesouro? A vaquinha está no 💰!'); }],
  [740, () => {
    const n = praca.novela(tutor, TURMA).atual;
    if (n && n.resolvido) { praca.revelarFinal(tutor, TURMA); log('tutor', 'tutor', '📖 Revelou o final da novela no coreto: apareceu e foi falado na tela de todos.', { marco: 'Final da novela' }); }
    else log('tutor', 'tutor', `📖 A novela ainda não foi resolvida (${n ? n.total : 0} de ${n ? n.meta : '?'} pistas): o final fica para a próxima aula.`);
  }],
  [800, () => {
    const l = praca.financas(tutor);
    log('tutor', 'tutor', '📊 Abriu o "Dinheiro da turma" para preparar a conversa do fim da aula.', { tabela: l.map((f) => ({ nome: f.nome, conta: f.conta, poupanca: f.poupanca, divida: f.divida, score: f.score, sujo: f.sujo })) });
  }],
  [830, () => { praca.megafone(tutor, 'Pergunta para a roda: quem pagou boleto sem conferir quem recebe?'); log('tutor', 'tutor', '📣 Megafone: "Quem pagou boleto sem conferir quem recebe?"'); }],
  [860, () => { praca.chamar(tutor); log('tutor', 'tutor', '⛲ Chamou todos para perto da fonte, para a conversa final.', { marco: 'Roda final' }); roda = true; }],
  [885, () => { praca.megafone(tutor, 'Fim da Hora da Praça! Ótimo trabalho, turma. Até a próxima aula!'); log('tutor', 'tutor', '📣 Megafone: "Fim da Hora da Praça! Ótimo trabalho, turma."'); }],
];
let fogo = false, roda = false, tesouroIniciado = false;

// ---------- Antes da aula: a turma já fez alguns módulos (a cidade da turma tem lugares acesos) ----------
const MODS = ['n1-computador', 'n1-teclado', 'n1-internet', 'n1-seguranca', 'n2-email'];
alunos.forEach((a, k) => praca.informarModulos(a, k < 9 ? [...MODS, ...(k < 7 ? ['n2-servicos', 'n2-gov'] : [])] : MODS.slice(0, 3)));
// As entrevistas de quem já estava na turma.
for (const a of alunos.filter((x) => !['elza', 'iara'].includes(x.id))) praca.entrevista(a, { nome: a.nome, experiencia: 'Trabalho de casa e bicos', fortes: ['Esforçado(a)'], melhorar: ['Digitar'] });

// ---------- O laço da simulação ----------
let dia = null;
const passo = () => {
  // O tutor
  for (const [quando, f] of TUTOR) if (!f.feito && t() >= quando) { f.feito = true; try { f(); } catch (e) { log('tutor', 'aviso', `Tutor: ${e.message}`); } }
  for (const g of gente) {
    if (!g.dentro) {
      if (t() < g.entra) continue;
      g.dentro = true;
      sinc(g);
      if (g.u !== tutor) {
        log(g.u.id, 'chegou', `${g.u.avatar} ${g.u.nome} entrou na praça.`);
        // O dia novo da cidade: chega a conta do dia (e o boleto falso, de 3 em 3 dias).
        const n = g.ultimo.dia.numero;
        fin[g.u.id].contas.push({ id: `ct-${n}-luz`, nome: 'Conta de luz', icone: '💡', benef: 'Luz da Cidade S.A.', valor: 7 });
        if (n % 3 === 0) fin[g.u.id].contas.push({ id: `ct-${n}-falso`, nome: 'Conta de água (2ª via)', icone: '🚰', benef: 'Águas Pagamentos Rápidos (CPF 123.456.789-00)', valor: 15, falso: true });
        g.plano = ROTEIROS[g.u.id](g);
      } else log('tutor', 'tutor', '👩‍🏫 A tutora entrou na praça. Os botões dela ficam no canto: megafone, chamar todos, fechar, frases prontas, evento urgente e Hora da Praça.');
      if (!dia && g.ultimo.dia) { dia = g.ultimo.dia; log('sistema', 'sistema', `🕗 Começou o dia ${dia.numero} da cidade: em 15 minutos vai das 8h às 18h. Chegou a conta de luz para todos, e um boleto falso pelo WhatsApp.`, { marco: 'Começo' }); }
      continue;
    }
    // Andar
    if (g.caminho.length) { const [x, y] = g.caminho.shift(); g.x = x; g.y = y; }
    else if (g.u !== tutor && agora >= g.esperaAte && g.plano) {
      // Reações: incêndio (troca o roteiro pela brigada, e depois volta), caça ao tesouro e a roda final.
      if (roda && !g.naRoda) { g.naRoda = true; g.plano = (function* () { yield ir(M.RODA); dizer(g, ['Que aula boa!', 'Até a próxima!', 'Aprendi muito hoje.', 'Boa noite, pessoal!'][g.u.id.length % 4]); while (true) yield esperar(5000); })(); }
      else if (fogo && !g.noFogo && PAPEL_FOGO[g.u.id] && g.ultimo.emergencia && g.ultimo.emergencia.status === 'ativo') { g.noFogo = true; const volta = g.plano; g.plano = (function* () { yield* brigada(g, PAPEL_FOGO[g.u.id]); yield* volta; })(); }
      else if (!g.noTesouro && g.ultimo.especial && g.ultimo.especial.tipo === 'tesouro' && g.ultimo.especial.status !== 'fim' && g.u.id !== 'elza') { g.noTesouro = true; const volta = g.plano; g.plano = (function* () { dizer(g, 'Bora achar os baús! 🎁'); yield* cacarBaus(g); yield* volta; })(); }
      const n = g.plano.next();
      if (n.done) g.plano = (function* () { yield* passear(g, 20); })();
      else if (n.value && n.value.ir) { if (!rota(g, n.value.ir)) g.esperaAte = agora + 1000; }
      else if (n.value && n.value.esperar) g.esperaAte = agora + n.value.esperar;
    }
    sinc(g);
    if (g.fala && agora > g.falaAte) g.fala = null;
  }
  // Doações para a caça ao tesouro, depois do incêndio
  if (t() >= 600 && !tesouroIniciado) {
    tesouroIniciado = true;
    for (const [id, v] of DOACOES) {
      if (fin[id].carteira < v) continue;
      const r = tentar(G[id], () => praca.doar(porId[id], 'tesouro', v));
      if (r) { fin[id].carteira -= v; log(id, 'vaquinha', `🎟️ ${porId[id].nome} deu ${v} moedas na vaquinha da caça ao tesouro.${r.comprou ? ' A turma completou as 150 moedas!' : ''}`, r.comprou ? { marco: 'Caça ao tesouro' } : {}); if (r.comprou) break; }
    }
  }
  // Eventos do motor (o que o tutor vê: falas, sistema, coleta, emergência, novela...)
  const r = G.tutor.ultimo;
  for (const e of r.eventos || []) {
    if (vistos.has(e.id)) continue; vistos.add(e.id); desdeTutor = Math.max(desdeTutor, e.id);
    if (e.tipo === 'fala') { const quem = e.de && e.de.id; if (quem && G[quem]) { G[quem].fala = e.texto; G[quem].falaAte = agora + 4000; } log(quem || 'sistema', 'fala', `💬 ${e.de ? e.de.nome : ''}: "${e.texto}"`); }
    else if (e.tipo === 'megafone') { /* já registrado pelo tutor */ }
    else if (e.tipo === 'coleta') { /* já registrado pelo aluno */ }
    else if (e.texto) log(e.de && e.de.id ? e.de.id : 'sistema', e.tipo === 'final' ? 'novela' : /emerg|tesouro|desafio/.test(e.tipo) ? 'motor' : 'sistema', e.tipo === 'final' ? `📖 FINAL DA NOVELA: ${e.texto} Moral: ${e.moral}` : e.texto);
  }
  // Fim do incêndio
  if (fogo && r.emergencia && r.emergencia.status !== 'ativo' && !fogo.fim) {
    fogo = { fim: true };
    const venceu = r.emergencia.status === 'salvo';
    log('sistema', 'emergencia', venceu ? '🎉 O FOGO APAGOU! A turma salvou a praça: moedas e a medalha 🚒 Brigada da praça para quem ajudou.' : '😢 O fogo tomou a praça. A turma tenta de novo na próxima vez.', { marco: venceu ? 'Fogo apagado' : 'Fogo venceu' });
    for (const id of Object.keys(PAPEL_FOGO)) if (PAPEL_FOGO[id] !== 'curioso') fin[id].carteira += venceu ? 15 : 5;
    if (venceu) { try { praca.megafone(tutor, 'Parabéns, brigada! Lembrem: água nunca no fio elétrico, e Bombeiros é 193.'); log('tutor', 'tutor', '📣 Megafone: "Parabéns, brigada! Água nunca no fio elétrico, e Bombeiros é 193."'); } catch (e) { /* segue */ } }
  }
  // Golpe do banco (uma vez no dia da cidade, depois da 1 da tarde)
  if (hora() >= 13 && !passo.golpe) {
    passo.golpe = true;
    fin.davi.conta = c2(fin.davi.conta - 20); mudarScore('davi', -40);
    log('davi', 'golpe', '📱 Chegou um SMS: "Seu empréstimo de 500 moedas foi APROVADO, pague a taxa de 20". Davi pagou: perdeu 20 moedas e o nome caiu 40 pontos.');
    for (const id of ['luis', 'graca', 'bruno']) { fin[id].carteira += 5; mudarScore(id, 10); }
    log('luis', 'golpe', '🛡️ Luís, Graça e Bruno receberam a ligação do "gerente" pedindo transferência para a "conta segura": desligaram e não caíram (+5 moedas cada).');
  }
};

const ALUNOS_E_TUTOR = gente.map((g) => g.u);
let proximoQuadro = 0;
while (agora - INICIO <= DURACAO) {
  passo();
  // Vendas da feira: o dono recebe as moedas na próxima sincronização
  for (const g of gente) for (const v of (g.ultimo && g.ultimo.vendas) || []) {
    if (v.recebida) continue;
    fin[g.u.id].carteira += v.valor;
    praca.vendasRecebidas(g.u, [v.id]);
    log(g.u.id, 'feira', `🪙 ${g.u.nome} recebeu ${v.valor} moedas: ${v.de} comprou ${v.emoji} ${v.produto} na barraca.`);
  }
  if (agora - INICIO >= proximoQuadro) {
    proximoQuadro += 1000;
    const r = G.tutor.ultimo;
    const e = r.emergencia && r.emergencia.status === 'ativo' ? r.emergencia : null;
    const es = r.especial && r.especial.status !== 'fim' ? r.especial : null;
    const nov = praca.novela(tutor, TURMA).atual;
    quadros.push({
      t: t(), h: hhmm(),
      p: gente.map((g) => g.dentro ? [Math.round(g.x * 10) / 10, Math.round(g.y * 10) / 10, g.carga || '', g.fala || '', g.mao ? 1 : 0, g.u.papel === 'aluno' ? (fin[g.u.id].cracha || '') : ''] : null),
      e: e ? { tipo: e.tipo, perigo: Math.round(e.perigo), focos: (e.focos || []).filter((f) => f.forca > 0).map((f) => [f.x, f.y, Math.round(f.forca * 10) / 10, f.eletrico ? 1 : 0]), bombeiros: e.bombeiros ? { chegou: !!e.bombeiros.chegou } : null, fim: e.fimEm ? Math.max(0, Math.round((e.fimEm - agora) / 1000)) : null } : null,
      s: es ? { tipo: es.tipo, status: es.status, baus: (es.baus || []).map((b) => [b.x, b.y, b.achado ? 1 : 0]) } : null,
      n: nov ? { pistas: nov.pistas.map((p) => [p.lugar, p.achados]), total: nov.total, meta: nov.meta, revelado: nov.revelado } : null,
      c: ((r.coleta && r.coleta.itens) || []).map((i) => [i.x, i.y]),
      m: Object.fromEntries(alunos.map((a) => [a.id, [fin[a.id].carteira, c2(fin[a.id].conta), c2(fin[a.id].poupanca), c2(fin[a.id].divida), fin[a.id].score, fin[a.id].atrasada ? 1 : 0]])),
    });
  }
  agora += TICK;
}

// ---------- O mapa (para desenhar o replay) e o resumo ----------
const LETRA = { grama: 'g', lote: 'l', calcada: 'c', rua: 'r', praca: 'p', terra: 't', horta: 'h', plataforma: 'f', trilho: 'k', areia: 'a', pier: 'i', agua: 'w' };
const cidade = praca.cidade(tutor, TURMA);
const saida = {
  turma: TURMA, inicio: '19:45', duracao: 900,
  pessoas: [{ id: tutor.id, nome: tutor.nome, avatar: tutor.avatar, perfil: 'Tutora: conduz a Hora da Praça pelos botões dela.', tutor: true }, ...PERFIS.map(([id, nome, avatar, perfil]) => ({ id, nome, avatar, perfil }))],
  mapa: { W: M.W, H: M.H, chao: M.chao.map((linha) => linha.map((c) => LETRA[c] || 'g').join('')),
    lugares: M.LUGARES.filter((L) => !L.casa || L.id === 'sua-casa').map((L) => ({ id: L.id, nome: L.nome, emoji: L.emoji, r: L.r, area: !!L.area, aceso: !M.MODULOS_DA_CIDADE.length || cidade.lugares.every((x) => x.lugar !== L.id) || cidade.lugares.some((x) => x.lugar === L.id && x.aberto) })) },
  quadros, eventos,
  final: alunos.map((a) => ({ id: a.id, ...resumoFin(a.id), carteira: fin[a.id].carteira, cracha: fin[a.id].cracha, contratacoes: fin[a.id].contratacoes })),
};
fs.writeFileSync(process.argv[2] || 'simulacao-praca.json', JSON.stringify(saida));
// Com um segundo nome de arquivo, sai também o replay para assistir no navegador (a página com os dados dentro).
if (process.argv[3]) {
  const modelo = fs.readFileSync(path.join(__dirname, 'replay-praca.html'), 'utf8');
  fs.writeFileSync(process.argv[3], modelo.replace('/*DADOS*/', () => JSON.stringify(saida).replace(/<\//g, '<\\/')));
}
console.log(`quadros=${quadros.length} eventos=${eventos.length} tamanho=${(JSON.stringify(saida).length / 1024).toFixed(0)}KB`);
const tipos = {}; eventos.forEach((e) => { tipos[e.tipo] = (tipos[e.tipo] || 0) + 1; }); console.log(JSON.stringify(tipos));
console.log(eventos.filter((e) => e.tipo === 'aviso').slice(0, 25).map((e) => `${e.t}s ${e.texto}`).join('\n'));
console.log('marcos:', eventos.filter((e) => e.marco).map((e) => `${e.t}s ${e.marco}`).join(' | '));
