// Praça Escola: as regras ficam aqui, num lugar só. O computador do instrutor usa no servidor da sala
// (src/canais.js) e o modo de teste no navegador usa em app/js/api.js, com colegas de demonstração.
// Cada computador avisa onde está o boneco do aluno (umas duas vezes por segundo, com a praça aberta na tela)
// e recebe de volta quem está na praça, o que foi dito e o que o instrutor mudou. Quem está onde e a conversa
// ficam só na memória; o mural, a votação e as escolhas do instrutor ficam guardados no disco do instrutor.
// A tarefa do dia de cada prédio e a novela da cidade (textos e respostas em praca-novela.js) também ficam aqui.
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica(require('./praca-mapa'), require('./praca-novela'));
  else { raiz.CE = raiz.CE || {}; raiz.CE.pracaRegras = fabrica(raiz.CE.pracaMapa, raiz.CE.pracaNovela); }
})(typeof self !== 'undefined' ? self : this, function (mapa, nov) {
  const FRASES = ['Oi, pessoal! 👋', 'Bom dia!', 'Boa tarde!', 'Vamos jogar?', 'Obrigado!', 'Preciso de ajuda', 'Parabéns! 👏', 'Até amanhã!'];
  const SAIU = 15000;          // sem notícias do computador por 15 s: a pessoa saiu da praça
  const MAO = 90000;           // a mão levantada (🙋) abaixa sozinha depois de um minuto e meio
  const MAX_EVENTOS = 300;
  const MAX_RECADOS = 60;
  const ESPERA_FALA = 1000;    // entre uma fala e outra da mesma pessoa
  const ESPERA_RECADO = 20000; // entre um recado e outro no mural
  const CONVITE = 3 * 60000;   // o "venham para a praça" do instrutor vale por 3 minutos
  const BONUS_DESAFIO = 40;    // moedas para o cofre quando a turma completa o desafio da semana de um lugar
  const PISTA_BOT = 45000;     // no modo de teste, um colega de demonstração acha uma pista a cada 45 s
  // Eventos urgentes: o perigo começa em 50% e cresce sozinho; cada ajuda o diminui (ligar vale o dobro).
  const PERIGO_INICIAL = 50, CRESCE = 0.3;  // % e % por segundo
  const ESPERA_ENTREGA = 1200;  // entre duas entregas da mesma pessoa
  const MOSTRA_FIM = 15000;     // o resultado do evento fica na tela por 15 s
  // Eventos especiais (comprados com moedas) e Hora da Praça.
  const CONTAGEM = 20000;       // o evento especial começa 20 s depois de comprado (dá tempo de ir para o coreto)
  const FIM_ESPECIAL = 15000;   // o resultado fica na tela por 15 s
  const DICA_TESOURO = 45000;   // na caça ao tesouro, uma dica do Professor Virtual a cada 45 s
  const MAX_DOACAO = 500;
  const PROFESSOR = { id: 'professor-virtual', nome: 'Professor Virtual', avatar: '👨‍🏫', papel: 'professor' };
  const DIAS_PADRAO = [1, 2, 3, 4, 5];
  const horaValida = (t) => /^([01]\d|2[0-3]):[0-5]\d$/.test(String(t));
  // O horário das aulas: a que horas cada aula termina (pode ter mais de uma por dia) e em que dias da semana.
  function horarioValido(h) {
    h = h && typeof h === 'object' ? h : {};
    const fins = [...new Set((Array.isArray(h.fins) ? h.fins : []).map(String).filter(horaValida))].sort().slice(0, 6);
    const dias = Array.isArray(h.dias) ? [...new Set(h.dias.map(Number).filter((d) => Number.isInteger(d) && d >= 0 && d <= 6))].sort() : DIAS_PADRAO.slice();
    return { ativo: h.ativo !== false, fins, dias, antes: 15 };
  }
  const OPCOES = [
    { id: 'quadra', emoji: '🏀', nome: 'Quadra de esportes' },
    { id: 'horta', emoji: '🥬', nome: 'Aumentar a horta' },
    { id: 'biblioteca', emoji: '📚', nome: 'Biblioteca nova' },
  ];
  // Palavrões viram asteriscos (e o instrutor pode deixar alguém só ouvindo).
  const PROIBIDAS = ['porra', 'caralho', 'merda', 'bosta', 'puta', 'puto', 'fdp', 'pqp', 'vtnc', 'vsf', 'arrombado', 'arrombada',
    'otário', 'otario', 'otária', 'otaria', 'imbecil', 'idiota', 'babaca', 'vagabundo', 'vagabunda', 'desgraçado', 'desgraçada', 'cuzão', 'viado'];
  const LETRA = 'a-zà-öø-ÿ0-9';
  const FILTRO = new RegExp(`(^|[^${LETRA}])(${PROIBIDAS.join('|')})(?=[^${LETRA}]|$)`, 'gi');
  const limpo = (t) => t.replace(FILTRO, (m, antes, palavra) => antes + '*'.repeat(palavra.length));
  const texto = (v, n) => String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, n);
  const LINHAS = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
  const venceu = (t, s) => LINHAS.find((l) => l.every((k) => t[k] === s)) || null;
  const ehInstrutor = (u) => !!u && u.papel === 'instrutor';
  const exigirInstrutor = (u) => { if (!ehInstrutor(u)) throw new Error('Apenas o instrutor pode fazer isso.'); };
  const arred = (v) => Math.round(Number(v) * 100) / 100;
  const sortear = (l) => l[Math.floor(Math.random() * l.length)];
  const novaVotacao = () => ({ opcoes: OPCOES.map((o) => ({ ...o })), votos: {}, encerrada: false, vencedor: null });
  const tabuleiroNovo = () => Array(9).fill(null);

  // Jogada do computador no jogo da velha: ganha se puder, senão bloqueia, senão o meio, senão um canto.
  function jogadaDoComputador(tab, eu) {
    const outro = eu === 'X' ? 'O' : 'X';
    const livres = tab.map((v, i) => (v ? null : i)).filter((i) => i != null);
    const tenta = (s) => livres.find((i) => { const t = tab.slice(); t[i] = s; return venceu(t, s); });
    let j = tenta(eu);
    if (j == null) j = tenta(outro);
    if (j == null && tab[4] == null) j = 4;
    if (j == null) { const cantos = [0, 2, 6, 8].filter((k) => tab[k] == null); j = cantos.length && Math.random() < 0.7 ? sortear(cantos) : sortear(livres); }
    return j;
  }

  function criarPraca({ ler = () => null, salvar = () => {}, relogio = () => Date.now(), demonstracao = false, alunos = () => [], moedas = () => null } = {}) {
    // O que fica no disco do instrutor só é lido quando alguém usa a praça pela primeira vez: o programa monta os
    // canais antes de saber em que pasta ficam os dados.
    let lido = null;
    const dados = () => {
      if (!lido) {
        lido = normal(ler());
        if (demonstracao && !Object.keys(lido.votacao.votos).length) Object.assign(lido.votacao.votos, { 'demo-ana': 'biblioteca', 'demo-carla': 'quadra', 'demo-davi': 'quadra', 'demo-fatima': 'horta', 'demo-jorge': 'biblioteca', 'demo-lia': 'biblioteca' });
        // No modo de teste, a turma de demonstração já começou o primeiro capítulo e algumas tarefas da semana.
        if (demonstracao && !lido.novela['Demonstração']) lido.novela['Demonstração'] = { atual: 'barco', abertoEm: relogio(), achados: { 'barco-bilhete': ['demo-ana', 'demo-carla'], 'barco-email': ['demo-lia'] }, resolvido: false, revelado: false, feitos: [] };
        if (demonstracao && !lido.tarefas['Demonstração']) lido.tarefas['Demonstração'] = { semana: nov.semana(relogio()), conta: { horta: 3, estacao: 2, escola: 1 }, selos: [] };
        if (demonstracao && !lido.loja['Demonstração']) {
          lido.loja['Demonstração'] = {
            festa: { juntado: 60, doadores: { 'demo-ana': 30, 'demo-lia': 30 } }, tesouro: { juntado: 90, doadores: { 'demo-lia': 50, 'demo-carla': 40 } },
            bingo: { juntado: 120, doadores: { 'demo-ana': 60, 'demo-bruno': 30, 'demo-davi': 30 } }, brigada: { juntado: 50, doadores: { 'demo-fatima': 20, 'demo-jorge': 30 } },
          };
        }
      }
      return lido;
    };
    const pessoas = new Map(); // id -> { id, nome, avatar, papel, turma, monitor, x, y, esq, andando, mao, em, bot }
    const eventos = [];
    let ultimoEvento = 0;
    let chamada = null;
    const ultimaFala = new Map(), ultimoRecado = new Map();
    let mesa = { X: null, O: null, tab: tabuleiroNovo(), vez: 'X', vencedor: null, linha: null, jogadaEm: 0 };
    let avaliouDemo = false;

    function normal(g) {
      g = g && typeof g === 'object' ? g : {};
      const v = g.votacao && Array.isArray(g.votacao.opcoes) && g.votacao.votos && typeof g.votacao.votos === 'object' ? g.votacao : novaVotacao();
      return {
        aberta: g.aberta !== false, soFrases: !!g.soFrases,
        silenciados: Array.isArray(g.silenciados) ? g.silenciados.map(String) : [],
        recados: Array.isArray(g.recados) ? g.recados.slice(0, MAX_RECADOS) : [],
        votacao: v, versao: Number(g.versao) || 1,
        // A cidade que cresce: os módulos que cada aluno concluiu (o computador dele avisa) e os prédios já acesos.
        modulos: g.modulos && typeof g.modulos === 'object' ? g.modulos : {},
        abertos: g.abertos && typeof g.abertos === 'object' ? g.abertos : {},
        // A tarefa do dia de cada lugar: quem fez hoje (por aluno) e o desafio da semana (por turma).
        feitas: g.feitas && typeof g.feitas === 'object' ? g.feitas : {},
        tarefas: g.tarefas && typeof g.tarefas === 'object' ? g.tarefas : {},
        bonus: Number(g.bonus) || 0,
        // A novela da cidade de cada turma: o capítulo aberto, quem achou cada pista e os capítulos já revelados.
        novela: g.novela && typeof g.novela === 'object' ? g.novela : {},
        // Hora da Praça: a turma é chamada para a praça 15 minutos antes de cada aula acabar.
        horario: horarioValido(g.horario),
        // A vaquinha de cada turma para os eventos especiais: quanto já juntou e quem deu.
        loja: g.loja && typeof g.loja === 'object' ? g.loja : {},
      };
    }
    function gravar() {
      dados().versao = (dados().versao || 0) + 1;
      try { salvar(dados()); } catch { /* sem disco: continua valendo na memória */ }
    }
    function evento(e) {
      const ev = { id: Math.max(relogio(), ultimoEvento + 1), em: relogio(), ...e };
      ultimoEvento = ev.id;
      eventos.push(ev);
      if (eventos.length > MAX_EVENTOS) eventos.shift();
      return ev;
    }
    const quem = (p) => ({ id: p.id, nome: p.nome, avatar: p.avatar, papel: p.papel });
    const publica = (p, agora) => ({
      id: p.id, nome: p.nome, avatar: p.avatar, papel: p.papel, turma: p.turma, monitor: !!p.monitor,
      x: p.x, y: p.y, esq: !!p.esq, andando: !!p.andando, mao: !!(p.mao && agora - p.mao < MAO), bot: !!p.bot,
      carga: emerg && emerg.status === 'ativo' && emerg.carregando[p.id] ? nov.EMERGENCIAS[emerg.tipo].levar.levando : null,
      ...casaDe(p.id),
    });

    // ---------- A cidade cresce com a turma ----------
    // Cada prédio acende quando metade da turma conclui o módulo ligado a ele (praca-mapa.js: CIDADE). Uma vez aceso,
    // fica aceso. A casa de cada aluno fica pronta no primeiro módulo e ganha um enfeite por nível ou curso concluído.
    const MODULOS_DEMO = {
      'demo-ana': ['n1-computador', 'n1-teclado', 'n1-internet', 'n1-seguranca', 'n1-prova', 'n2-email'],
      'demo-carla': ['n1-computador', 'n1-teclado', 'n1-internet', 'n1-seguranca'],
      'demo-davi': ['n1-computador', 'n1-teclado', 'n1-internet'],
      'demo-bruno': ['n1-computador', 'n1-teclado', 'n1-internet'],
      'demo-fatima': ['n1-computador', 'n1-teclado'],
      'demo-jorge': ['n1-computador'],
      'demo-lia': ['n1-computador', 'n1-teclado', 'n1-internet', 'n1-seguranca', 'n1-prova', 'n2-email', 'n2-servicos', 'n2-gov', 'n2-prova', 'cel-final'],
    };
    // No modo de teste no navegador, quem usa a praça e os colegas de demonstração são uma turma só.
    // (um nome de turma que é também nome interno de objeto, como "constructor", ganha um prefixo)
    const RESERVADOS = ['__proto__', 'constructor', 'prototype', 'hasOwnProperty', 'toString', 'valueOf'];
    const seguro = (t) => (RESERVADOS.includes(t) ? `turma ${t}` : t);
    const turmaDe = (u) => (demonstracao ? 'Demonstração' : seguro(String((u && u.turma) || '')));
    const MOEDAS_DEMO = { 'demo-ana': 145, 'demo-carla': 90, 'demo-davi': 60, 'demo-bruno': 75, 'demo-fatima': 40, 'demo-jorge': 20, 'demo-lia': 260 };
    function moedasDe(id) {
      if (demonstracao && MOEDAS_DEMO[id] != null) return MOEDAS_DEMO[id];
      try { const v = moedas(id); return v == null || !Number.isFinite(Number(v)) ? null : Number(v); } catch { return null; }
    }
    let cacheAlunos = null, cacheAlunosEm = 0;
    function todosAlunos() {
      if (!cacheAlunos || relogio() - cacheAlunosEm > 5000) {
        let lista = [];
        try { lista = (alunos() || []).filter((a) => a && a.papel !== 'instrutor').map((a) => ({ id: String(a.id), nome: texto(a.nome, 40), avatar: texto(a.avatar, 16) || '🙂', turma: turmaDe(a) })); } catch { /* sem lista */ }
        if (demonstracao) lista = lista.concat(bots.map((b) => ({ id: b.id, nome: b.nome, avatar: b.avatar, turma: b.turma })));
        cacheAlunos = lista; cacheAlunosEm = relogio();
      }
      return cacheAlunos;
    }
    const listaDe = (id) => (dados().modulos[id] && dados().modulos[id].lista) || (demonstracao && MODULOS_DEMO[id]) || [];
    function casaDe(id) {
      const l = listaDe(id);
      return { casa: l.includes(mapa.CASA_PRONTA), enfeites: mapa.ENFEITES.filter((e) => l.includes(e.modulo)).map((e) => e.emoji).join('') };
    }
    function contar(turma) {
      const daTurma = todosAlunos().filter((a) => a.turma === turma);
      const precisa = Math.max(1, Math.ceil(daTurma.length / 2));
      const lugares = mapa.CIDADE.map((c) => ({ ...c, feitos: daTurma.filter((a) => listaDe(a.id).includes(c.modulo)).length }));
      return { daTurma, precisa, lugares };
    }
    // Acende o que chegou lá; com "anunciar", a praça inteira fica sabendo.
    function avaliar(turma, anunciar) {
      const { daTurma, precisa, lugares } = contar(turma);
      const abertos = dados().abertos[turma] || [];
      const novos = daTurma.length ? lugares.filter((l) => l.feitos >= precisa && !abertos.includes(l.lugar)) : [];
      if (novos.length) {
        dados().abertos[turma] = [...abertos, ...novos.map((l) => l.lugar)];
        gravar();
        if (anunciar) {
          for (const l of novos) {
            evento({ tipo: 'cidade', lugar: l.lugar, turma, texto: `🎉 A turma${turma ? ' ' + turma : ''} acendeu ${l.artigo} ${l.lugar === 'rio' ? 'Cais do Rio Madeira' : (mapa.porLugar[l.lugar] || {}).nome}! Metade da turma já concluiu o módulo ${l.titulo}.` });
          }
        }
      }
      return dados().abertos[turma] || [];
    }
    // O instrutor vê a turma que está na praça agora (ou a que ele escolher).
    function turmaPadrao() {
      const conta = new Map();
      for (const p of pessoas.values()) if (p.papel !== 'instrutor') conta.set(turmaDe(p), (conta.get(turmaDe(p)) || 0) + 1);
      const maior = [...conta].sort((a, b) => b[1] - a[1])[0];
      if (maior) return maior[0];
      const primeiro = todosAlunos()[0];
      return primeiro ? primeiro.turma : '';
    }
    const turmaVista = (usuario, pedida) => (ehInstrutor(usuario) && !demonstracao ? (typeof pedida === 'string' ? seguro(pedida) : turmaPadrao()) : turmaDe(usuario));
    const alunosDa = (turma) => todosAlunos().filter((a) => a.turma === turma).length;

    // ---------- O que cada lugar faz: a tarefa do dia e o desafio da semana ----------
    // Cada aluno faz a tarefa de cada lugar uma vez por dia (pode treinar de novo, mas só a primeira conta). Quando
    // metade da turma fez a tarefa de um lugar na semana, o lugar ganha a ⭐ e o cofre ganha moedas.
    const EM = { o: 'no', a: 'na', os: 'nos', as: 'nas' };
    const artigoDe = (lugar) => (mapa.CIDADE.find((c) => c.lugar === lugar) || { artigo: lugar === 'escola' ? 'a' : 'o' }).artigo;
    const nomeDe = (lugar) => (lugar === 'rio' ? 'Cais do Rio Madeira' : (mapa.porLugar[lugar] || {}).nome || lugar);
    const noLugar = (lugar) => `${EM[artigoDe(lugar)] || 'em'} ${nomeDe(lugar)}`;
    const lugarAceso = (turma, lugar) => !mapa.CIDADE.some((c) => c.lugar === lugar) || (dados().abertos[turma] || []).includes(lugar);
    const metaTarefa = (turma) => Math.max(3, Math.ceil(alunosDa(turma) / 2));
    function semanaDa(turma) {
      const s = nov.semana(relogio());
      let t = dados().tarefas[turma];
      if (!t || t.semana !== s) t = dados().tarefas[turma] = { semana: s, conta: {}, selos: [] };
      return t;
    }
    function infoTarefa(usuario, turma, lugar) {
      const L = nov.TAREFAS[lugar];
      const sem = semanaDa(turma);
      return {
        lugar, titulo: L.titulo, tarefa: nov.publica(nov.tarefaDoDia(lugar, relogio())), aceso: lugarAceso(turma, lugar),
        feitaHoje: ((dados().feitas[usuario.id] || {})[lugar]) === nov.dia(relogio()),
        semana: { feitas: sem.conta[lugar] || 0, meta: metaTarefa(turma), selo: sem.selos.includes(lugar) },
      };
    }

    // ---------- A novela da cidade ----------
    // O instrutor abre um capítulo; as pistas ficam nos lugares do mapa e cada pista é uma tarefa. O mistério está
    // resolvido quando todas as pistas foram achadas e a turma juntou tantas pistas quanto o número de alunos (cada
    // aluno acha cada pista uma vez). Aí o instrutor revela o final no coreto.
    const metaNovela = (turma) => Math.max(3, alunosDa(turma));
    function contarNovela(n) {
      const cap = nov.porCapitulo[n.atual];
      const quantos = (p) => (n.achados[p.id] || []).length;
      return { cap, total: cap.pistas.reduce((s, p) => s + quantos(p), 0), todas: cap.pistas.every((p) => quantos(p) > 0) };
    }
    function conferirNovela(turma, n) {
      if (n.resolvido) return;
      const { cap, total, todas } = contarNovela(n);
      if (todas && total >= metaNovela(turma)) {
        n.resolvido = true;
        evento({ tipo: 'novela', turma, texto: `🔎 A turma juntou todas as pistas de “${cap.titulo}”! O final vai ser revelado no coreto.` });
      }
    }
    // O pouco que vai em toda sincronização: onde ainda tem pista para mim e se o final já saiu.
    function resumoNovela(usuario, turma) {
      const n = dados().novela[turma];
      if (!n || !n.atual || !nov.porCapitulo[n.atual]) return null;
      const { cap, total } = contarNovela(n);
      const achei = (p) => (n.achados[p.id] || []).includes(usuario.id);
      return {
        id: cap.id, titulo: cap.titulo, aberto: n.abertoEm, total, meta: metaNovela(turma), resolvido: !!n.resolvido, revelado: !!n.revelado, participei: cap.pistas.some(achei),
        faltam: cap.pistas.filter((p) => !achei(p)).map((p) => ({ id: p.id, lugar: p.lugar, titulo: p.titulo })),
      };
    }
    const mesaPublica = () => ({ X: mesa.X, O: mesa.O, tab: mesa.tab.slice(), vez: mesa.vez, vencedor: mesa.vencedor, linha: mesa.linha });
    function precisaDe(usuario) {
      const p = pessoas.get(usuario.id);
      if (!p) throw new Error('Entre na praça primeiro.');
      return p;
    }
    function podeFalar(usuario) {
      if (!dados().aberta && !ehInstrutor(usuario)) throw new Error('A praça está fechada agora.');
      if (dados().silenciados.includes(usuario.id)) throw new Error('O instrutor pediu para você ficar só ouvindo por enquanto.');
    }
    // Quem não manda notícias há 15 s saiu (fechou a janela, desligou o computador...).
    function limparAusentes(agora) {
      for (const [id, p] of pessoas) if (!p.bot && agora - p.em > SAIU) { pessoas.delete(id); levantar(id); }
    }
    function chegada() {
      const ocupados = new Set([...pessoas.values()].map((p) => `${Math.round(p.x)},${Math.round(p.y)}`));
      return mapa.CHEGADA.find(([x, y]) => !ocupados.has(`${x},${y}`)) || sortear(mapa.PRACA);
    }

    // ---------- A mesa do jogo da velha (dois alunos, cada um no seu computador) ----------
    function recomecar() { mesa.tab = tabuleiroNovo(); mesa.vez = 'X'; mesa.vencedor = null; mesa.linha = null; mesa.jogadaEm = relogio(); }
    function levantar(id) {
      let saiu = false;
      for (const lado of ['X', 'O']) if (mesa[lado] && mesa[lado].id === id) { mesa[lado] = null; saiu = true; }
      if (saiu) recomecar(); // partida pela metade não vale: a mesa espera outro jogador
    }
    function jogarNaMesa(lado, k) {
      mesa.tab[k] = lado; mesa.jogadaEm = relogio();
      const linha = venceu(mesa.tab, lado);
      if (linha) {
        mesa.vencedor = lado; mesa.linha = linha;
        const ganhou = mesa[lado], perdeu = mesa[lado === 'X' ? 'O' : 'X'];
        evento({ tipo: 'sistema', texto: `${ganhou.nome} ganhou de ${perdeu.nome} no jogo da velha! 🎉`, vitoria: ganhou.id });
      } else if (mesa.tab.every(Boolean)) {
        mesa.vencedor = 'velha';
        evento({ tipo: 'sistema', texto: `Deu velha entre ${mesa.X.nome} e ${mesa.O.nome}.` });
      } else mesa.vez = lado === 'X' ? 'O' : 'X';
    }

    // ---------- Eventos urgentes (emergências da cidade) ----------
    // Ficam só na memória. O instrutor dispara; o perigo cresce sozinho e cada ajuda o diminui. Se o perigo zerar, a
    // turma venceu; se chegar a 100% ou o tempo acabar, desta vez a cidade sofreu (e a turma tenta de novo outro dia).
    // Cada ajuda vale mais quando a turma é pequena: com 20 alunos na praça, cada um ajuda um pouco.
    // O mapa acompanha o evento: no incêndio, o fogo pula de coisa em coisa e cada balde vai num foco (o poste de luz
    // só os Bombeiros apagam); na enchente, a água sobe fileira por fileira; na chuva forte, árvores caem na rua.
    let emerg = null;
    const unidade = () => 15 / emerg.pessoas;
    const LIMITE_FOGO = 18, FORCA_MAX = 3;       // a soma da força dos focos que vale 100% de perigo; o máximo de cada foco
    const ESPALHA = 12000, PRIMEIRO_PULO = 8000; // o fogo pula para outra coisa a cada 12 s (o primeiro pulo em 8 s)
    const SOCORRO = 15000;                       // os Bombeiros (193) e a Defesa Civil (199) chegam 15 s depois da ligação
    const JATO = 6000, AGUA_BOMBEIROS = 0.5;     // depois de apagar o poste, os Bombeiros jogam água num foco a cada 6 s
    const QUEDA_PRIMEIRA = 8000, QUEDA = 15000, MAX_QUEDAS = 5;  // chuva forte: uma árvore cai a cada 15 s
    const EQUIPE_CHEGA = 7000, EQUIPE_TIRA = 7000;              // a equipe da Defesa Civil chega 7 s depois do aviso
    const PERIGO_ARVORE = 0.15;                  // % por segundo a mais para cada árvore caída que ninguém avisou
    const FILEIRAS_ENCHENTE = 9;                 // com 100% de perigo, a água sobe 9 fileiras (até a calçada da praça)
    const VALE_BOT = 0.2;                        // a ajuda de um colega de demonstração vale só um pouco (quem faz a diferença é você)
    const linhaDaAgua = (perigo) => 27 - (perigo / 100) * FILEIRAS_ENCHENTE;
    const em = (nome) => nome.replace(/^o /, 'no ').replace(/^a /, 'na ').replace(/^os /, 'nos ').replace(/^as /, 'nas ');
    const focosAcesos = () => emerg.focos.filter((f) => f.forca > 0);

    // O que o evento fecha no mapa: árvore caída, fio no chão, os caminhões e (na enchente) as fileiras alagadas.
    function bloqueiosDoEvento() {
      if (!emerg || emerg.status !== 'ativo') return { tiles: [], agua: null };
      const tiles = [];
      for (const q of emerg.quedas) if (!q.removida) { tiles.push(...q.tiles); if (q.fio) tiles.push(q.fio); }
      if (emerg.bombeiros && emerg.bombeiros.chegou) tiles.push(...mapa.CAMINHAO_BOMBEIROS);
      if (emerg.caminhao && emerg.caminhao.chegou) tiles.push(...mapa.CAMINHAO_AREIA);
      return { tiles, agua: emerg.tipo === 'rio' ? linhaDaAgua(emerg.perigo) : null };
    }
    // (o nível da água vai arredondado, igual ao que os computadores dos alunos recebem)
    const aplicarBloqueios = () => { const b = bloqueiosDoEvento(); mapa.definirBloqueios(b.tiles, b.agua == null ? null : Math.round(b.agua * 100) / 100); };
    // Onde se pega a ajuda: na enchente, a praia alaga primeiro (a areia vem da obra e, depois do 199, do caminhão).
    const fontesDeAreia = () => ['obra', ...(emerg.caminhao && emerg.caminhao.chegou ? ['caminhao'] : []), ...(Math.ceil(linhaDaAgua(emerg.perigo)) > 26 ? ['areia'] : [])];
    const fontesDe = (def) => (emerg.tipo === 'rio' ? fontesDeAreia() : [def.levar.pegar]);

    // ----- Incêndio: os focos de fogo (a soma da força deles é o perigo) -----
    function recalcularFogo() {
      emerg.perigo = Math.min(100, (focosAcesos().reduce((s, f) => s + f.forca, 0) * 100) / LIMITE_FOGO);
    }
    function apagarUmPouco(f, quanto, agora) {
      f.forca = Math.max(0, f.forca - quanto);
      if (f.forca < 0.05) { f.forca = 0; f.apagouEm = agora; }
      recalcularFogo();
    }
    // Para onde o fogo pula: o poste, se estiver perto; se não, uma das coisas mais perto que ainda não queimaram.
    function proximoAQueimar(o) {
      const ja = new Set(emerg.focos.map((f) => f.id));
      const dist = (c) => Math.hypot(c.x - o.x, c.y - o.y);
      const livres = mapa.INFLAMAVEIS.filter((c) => !ja.has(c.id));
      const poste = livres.find((c) => c.eletrico && dist(c) <= 3.2);
      if (poste) return poste;
      const perto = livres.filter((c) => !c.eletrico && dist(c) <= 5.5).sort((a, b) => dist(a) - dist(b)).slice(0, 3);
      return perto.length ? sortear(perto) : null;
    }
    // O fogo pula de um foco para a coisa do lado, levando um pouco da força (o total só muda quando o perigo muda).
    function pularFogo(agora, origem, leva) {
      const origens = origem ? [origem] : focosAcesos().filter((f) => !f.eletrico).sort((a, b) => b.forca - a.forca);
      for (const o of origens) {
        const c = proximoAQueimar(o);
        if (!c) continue;
        const passa = Math.min(c.eletrico ? 1 : leva, Math.max(0, o.forca - 0.5));
        const f = { id: c.id, nome: c.nome, x: c.x, y: c.y, eletrico: !!c.eletrico, forca: passa, desde: agora, apagouEm: 0 };
        o.forca -= passa;
        emerg.focos.push(f);
        evento({ tipo: 'emergencia-mapa', emergencia: 'incendio', texto: c.eletrico ? `⚡ O fogo chegou ${em(c.nome)}! Água no poste, não: isso é com os Bombeiros (193).` : `🔥 O fogo pulou para ${c.nome}!` });
        return f;
      }
      return null;
    }
    // O fogo cresce nos focos acesos (o do poste não cresce); quando todos estão no máximo, pula para outra coisa.
    function crescerFogo(quanto, agora) {
      let resto = quanto;
      for (let volta = 0; volta < 6 && resto > 1e-9; volta++) {
        const abertos = focosAcesos().filter((f) => !f.eletrico && f.forca < FORCA_MAX);
        if (!abertos.length) {
          const f = pularFogo(agora, null, 0);
          if (!f) break;
          const add = Math.min(resto, (f.eletrico ? 1 : FORCA_MAX) - f.forca);
          f.forca += add; resto -= add;
          continue;
        }
        const parte = resto / abertos.length;
        for (const f of abertos) { const add = Math.min(parte, FORCA_MAX - f.forca); f.forca += add; resto -= add; }
      }
      recalcularFogo();
    }
    function atualizarFogo(agora, dt) {
      // Cada foco aceso cresce sozinho (emerg.cresce de força por segundo): fogo grande cresce mais rápido.
      crescerFogo(emerg.cresce * dt * focosAcesos().filter((f) => !f.eletrico).length, agora);
      if (agora >= emerg.pulaEm) {
        emerg.pulaEm = agora + ESPALHA;
        const origem = sortear(focosAcesos().filter((f) => !f.eletrico && f.forca >= 1));
        if (origem) pularFogo(agora, origem, 0.6);
      }
      const b = emerg.bombeiros;
      if (b && !b.chegou && agora >= b.chegaEm) {
        b.chegou = true; b.jatoEm = b.chegaEm + 1500;
        evento({ tipo: 'emergencia-mapa', emergencia: 'incendio', texto: '🚒 Os Bombeiros chegaram! Primeiro eles cuidam do poste; a turma continua com os baldes.' });
      }
      while (b && b.chegou && agora >= b.jatoEm) {
        b.jatoEm += JATO;
        const acesos = focosAcesos();
        if (!acesos.length) break;
        const poste = acesos.find((f) => f.eletrico);
        const alvo = poste || acesos.sort((x, y) => y.forca - x.forca)[0];
        b.alvo = alvo.id;
        apagarUmPouco(alvo, poste ? 99 : AGUA_BOMBEIROS, agora);
        if (poste) evento({ tipo: 'emergencia-mapa', emergencia: 'incendio', texto: '⚡ Os Bombeiros desligaram a energia e apagaram o fogo do poste.' });
      }
      // A mangueira já fica apontada para o próximo fogo (o poste primeiro, depois o maior).
      if (b && b.chegou) {
        const acesos = focosAcesos();
        const prox = acesos.find((f) => f.eletrico) || acesos.sort((x, y) => y.forca - x.forca)[0];
        b.alvo = prox ? prox.id : null;
      }
      recalcularFogo();
    }
    // O balde vai no foco escolhido (ou no mais perto, se não disse qual), desde que o boneco esteja do lado dele.
    function focoParaAgua(id, x, y) {
      const dist = (f) => Math.hypot(f.x - x, f.y - y);
      const alcance = mapa.PERTO_DO_FOCO + 0.4;
      const acesos = focosAcesos();
      if (id) { const f = acesos.find((g) => g.id === id); return f && dist(f) <= alcance ? f : null; }
      return acesos.filter((f) => dist(f) <= alcance).sort((a, b) => (a.eletrico - b.eletrico) || dist(a) - dist(b))[0] || null;
    }

    // ----- Chuva forte: as árvores que caem na rua -----
    const distDaQueda = (q, x, y) => Math.min(...[...q.tiles, q.arvore].map(([a, b]) => Math.hypot(a - x, b - y)));
    function derrubarArvore(agora) {
      aplicarBloqueios();
      const usadas = new Set(emerg.quedas.map((q) => q.arvore.join(',')));
      let candidatas = mapa.QUEDAS.filter((c) => !usadas.has(c.arvore.join(',')) && c.tiles.every(([x, y]) => mapa.andavel(x, y)));
      for (let tentativa = 0; tentativa < 12 && candidatas.length; tentativa++) {
        // As que caem na rua (ou na calçada) têm mais chance; e nunca pode fechar o caminho para um lugar.
        let sorte = Math.random() * candidatas.reduce((s, c) => s + (c.naRua ? 3 : 1), 0), c = candidatas[candidatas.length - 1];
        for (const x of candidatas) { sorte -= x.naRua ? 3 : 1; if (sorte <= 0) { c = x; break; } }
        candidatas = candidatas.filter((x) => x !== c);
        const fio = c.fio && Math.random() < 0.35 && mapa.andavel(c.fio[0], c.fio[1]) ? c.fio : null;
        if (!mapa.tudoAlcancavel(new Set([...c.tiles, ...(fio ? [fio] : [])].map(([x, y]) => y * mapa.W + x)))) continue;
        const q = { id: `${c.id}-${agora}`, arvore: c.arvore, tiles: c.tiles, fio, ipe: c.ipe, palmeira: c.palmeira, onde: ondeFica(c.tiles[0][0], c.tiles[0][1]),
          caiuEm: agora, avisadaEm: 0, por: null, equipe: false, removida: false };
        emerg.quedas.push(q);
        evento({ tipo: 'emergencia-mapa', emergencia: 'chuva', texto: `🌳 Uma árvore caiu ${q.onde}!${fio ? ' ⚡ E derrubou um fio: ninguém chega perto!' : ''} Avisem a Defesa Civil (199).` });
        aplicarBloqueios();
        return q;
      }
      return null;
    }
    function atualizarQuedas(agora) {
      for (const q of emerg.quedas) {
        if (q.removida || !q.avisadaEm) continue;
        if (!q.equipe && agora >= q.avisadaEm + EQUIPE_CHEGA) q.equipe = true;
        if (agora >= q.avisadaEm + EQUIPE_CHEGA + EQUIPE_TIRA) {
          q.removida = true;
          evento({ tipo: 'emergencia-mapa', emergencia: 'chuva', texto: `👷 A Defesa Civil tirou a árvore caída ${q.onde}.` });
        }
      }
      if (agora >= emerg.quedaEm) {
        emerg.quedaEm = agora + QUEDA;
        if (emerg.quedas.filter((q) => !q.removida).length < MAX_QUEDAS) derrubarArvore(agora);
      }
    }
    function avisarQueda(q, p, agora) {
      q.avisadaEm = agora; q.por = p.nome;
      evento({ tipo: 'emergencia-ajuda', de: quem(p), texto: `📞 ${p.nome} avisou a Defesa Civil (199): árvore caída ${q.onde}.` });
    }

    // ----- O socorro: Bombeiros (193) no incêndio e o caminhão de areia da Defesa Civil (199) na enchente -----
    function chamarSocorro(agora) {
      if (emerg.tipo === 'incendio' && !emerg.bombeiros) {
        emerg.bombeiros = { chegaEm: agora + SOCORRO, chegou: false, jatoEm: 0, alvo: null };
        evento({ tipo: 'emergencia-mapa', emergencia: 'incendio', texto: '🚒 Os Bombeiros estão a caminho: chegam em 15 segundos!' });
      }
      if (emerg.tipo === 'rio' && !emerg.caminhao) {
        emerg.caminhao = { chegaEm: agora + SOCORRO, chegou: false };
        evento({ tipo: 'emergencia-mapa', emergencia: 'rio', texto: '🚚 A Defesa Civil está trazendo areia para a Avenida do Rio: chega em 15 segundos!' });
      }
    }

    function atualizarEmergencia(agora) {
      if (!emerg || emerg.status !== 'ativo') return;
      const dt = Math.max(0, (agora - emerg.atualizadoEm) / 1000);
      emerg.atualizadoEm = agora;
      if (emerg.tipo === 'incendio') atualizarFogo(agora, dt);
      else {
        const semAviso = emerg.tipo === 'chuva' ? emerg.quedas.filter((q) => !q.removida && !q.avisadaEm).length : 0;
        emerg.perigo = Math.min(100, emerg.perigo + (emerg.cresce + PERIGO_ARVORE * semAviso) * dt);
        if (emerg.tipo === 'chuva') atualizarQuedas(agora);
        if (emerg.tipo === 'rio' && emerg.caminhao && !emerg.caminhao.chegou && agora >= emerg.caminhao.chegaEm) {
          emerg.caminhao.chegou = true;
          evento({ tipo: 'emergencia-mapa', emergencia: 'rio', texto: '🚚 A Defesa Civil chegou com areia na Avenida do Rio: agora a areia está do lado da barreira!' });
        }
      }
      if (emerg.perigo >= 100 || agora >= emerg.fim) terminarEmergencia(false, agora);
      else if (emerg.perigo <= 0) terminarEmergencia(true, agora);
      aplicarBloqueios();
    }
    function terminarEmergencia(salvo, agora) {
      const def = nov.EMERGENCIAS[emerg.tipo];
      emerg.status = salvo ? 'salvo' : 'perdido';
      emerg.terminouEm = agora;
      if (salvo) emerg.perigo = 0;
      const participantes = Object.keys(emerg.ajudas).filter((id) => emerg.ajudas[id].aluno);
      evento({ tipo: 'emergencia-fim', emergencia: emerg.tipo, idEmergencia: emerg.id, salvo, participantes, texto: `${salvo ? def.salvo : def.perdido} ${def.licao}` });
      aplicarBloqueios();
    }
    // Uma ajuda: no incêndio, a água vai no foco (ou no maior, se a ajuda não foi num foco); nos outros, o perigo baixa.
    function ajudar(quem, quanto, foco) {
      const agora = relogio();
      if (emerg.tipo === 'incendio') {
        const alvo = foco || focosAcesos().filter((f) => !f.eletrico).sort((a, b) => b.forca - a.forca)[0];
        if (alvo) apagarUmPouco(alvo, (quanto * LIMITE_FOGO) / 100, agora);
      } else emerg.perigo = Math.max(0, emerg.perigo - quanto);
      const a = emerg.ajudas[quem.id] = emerg.ajudas[quem.id] || { nome: quem.nome, vezes: 0, aluno: quem.papel !== 'instrutor' };
      a.vezes++;
      if (emerg.perigo <= 0) terminarEmergencia(true, agora);
    }
    function abrirEmergencia(tipo, agora) {
      const def = nov.EMERGENCIAS[tipo];
      const alunosNaPraca = [...pessoas.values()].filter((x) => x.papel !== 'instrutor').length;
      emerg = {
        id: Math.max(agora, emerg ? emerg.id + 1 : 0), tipo, inicio: agora, fim: agora + def.duracao, atualizadoEm: agora,
        perigo: Number.isFinite(def.inicio) ? def.inicio : PERIGO_INICIAL, cresce: Number.isFinite(def.cresce) ? def.cresce : CRESCE,
        pessoas: Math.max(2, alunosNaPraca), ajudas: {}, carregando: {}, ultimaEntrega: {}, ligou: new Set(), respondeu: new Set(), status: 'ativo', terminouEm: 0,
        focos: [], pulaEm: agora + PRIMEIRO_PULO, bombeiros: null, caminhao: null, sacos: 0, quedas: [], quedaEm: agora + QUEDA_PRIMEIRA,
      };
      if (tipo === 'incendio') {
        // Começa na lata de lixo; se o perigo inicial for maior que o máximo dela, o fogo já pulou para o lado.
        const c = mapa.INFLAMAVEIS[0], total = (emerg.perigo * LIMITE_FOGO) / 100;
        emerg.focos.push({ id: c.id, nome: c.nome, x: c.x, y: c.y, eletrico: false, forca: Math.min(FORCA_MAX, total), desde: agora, apagouEm: 0 });
        if (total > FORCA_MAX) crescerFogo(total - FORCA_MAX, agora);
        recalcularFogo();
      }
      if (!dados().aberta) { dados().aberta = true; gravar(); }
      evento({ tipo: 'emergencia', emergencia: tipo, idEmergencia: emerg.id, texto: `🚨 ${def.titulo} ${def.alerta}` });
      aplicarBloqueios();
    }
    function resumoEmergencia(usuario, agora) {
      if (!emerg || (emerg.status !== 'ativo' && agora - emerg.terminouEm > MOSTRA_FIM)) return null;
      const meu = emerg.ajudas[usuario.id];
      const b = bloqueiosDoEvento();
      const r = {
        id: emerg.id, tipo: emerg.tipo, status: emerg.status, perigo: Math.ceil(emerg.perigo - 1e-6), fim: emerg.fim, agora,
        carregando: !!emerg.carregando[usuario.id], ligou: emerg.ligou.has(usuario.id), respondeu: emerg.respondeu.has(usuario.id),
        minhasAjudas: meu ? meu.vezes : 0, ajudantes: Object.keys(emerg.ajudas).length,
        bloqueios: { tiles: b.tiles, agua: b.agua == null ? null : Math.round(b.agua * 100) / 100 },
      };
      if (emerg.tipo === 'incendio') {
        r.focos = emerg.focos.map((f) => ({ id: f.id, nome: f.nome, x: f.x, y: f.y, eletrico: f.eletrico, forca: Math.round(f.forca * 10) / 10 }));
        r.bombeiros = emerg.bombeiros ? { chega: emerg.bombeiros.chegaEm, chegou: emerg.bombeiros.chegou, alvo: emerg.bombeiros.alvo } : null;
      } else if (emerg.tipo === 'rio') {
        r.agua = Math.round(linhaDaAgua(emerg.perigo) * 100) / 100;
        r.sacos = emerg.sacos;
        r.caminhao = emerg.caminhao ? { chega: emerg.caminhao.chegaEm, chegou: emerg.caminhao.chegou } : null;
        r.fontes = fontesDeAreia();
      } else if (emerg.tipo === 'chuva') {
        r.quedas = emerg.quedas.filter((q) => !q.removida).map((q) => ({ id: q.id, arvore: q.arvore, tiles: q.tiles, fio: q.fio, ipe: q.ipe, palmeira: q.palmeira, onde: q.onde,
          avisada: !!q.avisadaEm, por: q.por, equipe: q.equipe }));
      }
      return r;
    }

    // ---------- Hora da Praça ----------
    // 15 minutos antes de cada aula acabar, a praça abre e o Professor Virtual chama todo mundo (quem está fora
    // recebe o convite pela presença). O instrutor também pode testar na hora.
    let horaManual = null, horaAnunciada = null;
    const falaProfessor = (texto, extra = {}) => evento({ tipo: 'professor', de: PROFESSOR, texto, ...extra });
    function janelaDaHora(agora) {
      if (horaManual && agora < horaManual.fimEm) return horaManual;
      const h = dados().horario;
      if (!h.ativo || !h.fins.length) return null;
      const d = new Date(agora);
      if (!h.dias.includes(d.getDay())) return null;
      for (const fim of h.fins) {
        const [hh, mm] = fim.split(':').map(Number);
        const fimEm = new Date(d.getFullYear(), d.getMonth(), d.getDate(), hh, mm).getTime();
        if (agora >= fimEm - h.antes * 60000 && agora < fimEm) return { id: `hora-${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}-${fim}`, fim, fimEm };
      }
      return null;
    }
    function verificarHora(agora) {
      const j = janelaDaHora(agora);
      if (j && j.id !== horaAnunciada) {
        horaAnunciada = j.id;
        if (!dados().aberta) { dados().aberta = true; gravar(); }
        const min = Math.max(1, Math.round((j.fimEm - agora) / 60000));
        falaProfessor(`⏰ Faltam ${min} minutos para acabar a aula: hora da Praça Escola! Façam a tarefa do dia nos prédios, procurem as pistas da novela e juntem moedas para um evento especial.`, { hora: j.id });
      }
      return j;
    }
    // A próxima Hora da Praça (para o instrutor conferir o horário).
    function proximaHora(agora) {
      const h = dados().horario;
      if (!h.ativo || !h.fins.length || !h.dias.length) return null;
      for (let k = 0; k < 8; k++) {
        const d = new Date(agora + k * 86400000);
        if (!h.dias.includes(d.getDay())) continue;
        for (const fim of h.fins) {
          const [hh, mm] = fim.split(':').map(Number);
          const inicio = new Date(d.getFullYear(), d.getMonth(), d.getDate(), hh, mm).getTime() - h.antes * 60000;
          if (inicio + h.antes * 60000 > agora) return inicio;
        }
      }
      return null;
    }

    // ---------- Eventos especiais (a vaquinha da turma e o Professor Virtual conduzindo) ----------
    let especial = null;
    const fila = []; // eventos já comprados esperando o de agora terminar
    const lojaDa = (turma) => (dados().loja[turma] = dados().loja[turma] || {});
    function comecarEspecial(tipo, turma, agora) {
      const def = nov.ESPECIAIS[tipo];
      if ((especial && especial.status !== 'fim') || (emerg && emerg.status === 'ativo')) {
        fila.push({ tipo, turma });
        falaProfessor(`🎟️ ${def.emoji} ${def.nome} está na fila: começa assim que terminar o evento de agora.`);
        return;
      }
      especial = { id: Math.max(agora, especial ? especial.id + 1 : 0), tipo, turma, status: 'contagem', comeca: agora + CONTAGEM, fim: 0, terminouEm: 0 };
      if (!dados().aberta) { dados().aberta = true; gravar(); }
      falaProfessor(`🎟️ ${def.emoji} ${def.nome}: começa em 20 segundos no coreto! ${def.abertura}`, { especial: tipo, idEspecial: especial.id });
    }
    function embaralhar(lista) {
      const l = lista.slice();
      for (let i = l.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [l[i], l[j]] = [l[j], l[i]]; }
      return l;
    }
    // Baús espalhados pela cidade (nas ruas e na praça), longe uns dos outros.
    function escolherBaus(n) {
      const escolhidos = [];
      for (const [x, y] of embaralhar([...mapa.RUAS, ...mapa.PRACA])) {
        if (escolhidos.every((b) => Math.hypot(b.x - x, b.y - y) >= 5)) escolhidos.push({ x, y, por: null });
        if (escolhidos.length >= n) break;
      }
      return escolhidos;
    }
    const PERTO_DE = [['escola', 'perto da Escola'], ['fonte', 'perto da fonte'], ['coreto', 'perto do coreto'], ['banco', 'perto do Banco'], ['correios', 'perto dos Correios'],
      ['prefeitura', 'perto da Prefeitura'], ['posto', 'perto do Posto de Saúde'], ['feira', 'perto da Feira'], ['horta', 'perto da horta'], ['estacao', 'perto da Estação'],
      ['empregos', 'perto da Agência de Empregos'], ['lote', 'perto do Lote da turma'], ['sua-casa', 'na Rua da Turma'], ['rio', 'perto do cais']];
    function ondeFica(x, y) {
      let melhor = PERTO_DE[0], menor = Infinity;
      for (const par of PERTO_DE) {
        const L = mapa.porLugar[par[0]];
        if (!L) continue;
        const [lx, ly, w, h] = L.r;
        const d = Math.hypot(lx + w / 2 - x, ly + h / 2 - y);
        if (d < menor) { menor = d; melhor = par; }
      }
      return melhor[1];
    }
    const cartelaDe = (id) => {
      if (!especial || especial.tipo !== 'bingo') return null;
      if (!especial.cartelas[id]) {
        const def = nov.ESPECIAIS.bingo;
        especial.cartelas[id] = embaralhar(Array.from({ length: def.numeros }, (_, k) => k + 1)).slice(0, def.porCartela).sort((a, b) => a - b);
      }
      return especial.cartelas[id];
    };
    function terminarEspecial(agora, texto) {
      especial.status = 'fim';
      especial.terminouEm = agora;
      falaProfessor(texto || nov.ESPECIAIS[especial.tipo].fim, { fimEspecial: especial.tipo, idEspecial: especial.id });
    }
    function atualizarEspecial(agora) {
      if (especial && especial.status === 'fim' && agora - especial.terminouEm > FIM_ESPECIAL) especial = null;
      if (!especial || especial.status === 'fim') {
        if (fila.length && !(emerg && emerg.status === 'ativo') && (!especial || agora - especial.terminouEm > FIM_ESPECIAL)) { const f = fila.shift(); especial = null; comecarEspecial(f.tipo, f.turma, agora); }
        return;
      }
      const def = nov.ESPECIAIS[especial.tipo];
      if (especial.status === 'contagem') {
        // Um evento urgente começou durante a contagem: o especial espera ele acabar (e aí conta os 20 s de novo).
        if (emerg && emerg.status === 'ativo') { especial.esperando = true; especial.comeca = Math.max(especial.comeca, agora + CONTAGEM); return; }
        especial.esperando = false;
        if (agora < especial.comeca) return;
        especial.status = 'ativo';
        especial.fim = agora + (def.duracao || 0);
        if (especial.tipo === 'festa') especial.palmas = 0;
        if (especial.tipo === 'tesouro') { especial.baus = escolherBaus(def.baus); especial.ultimaDica = agora; }
        if (especial.tipo === 'bingo') { especial.ordem = embaralhar(Array.from({ length: def.numeros }, (_, k) => k + 1)); especial.sorteados = []; especial.cartelas = {}; especial.proximo = agora + 3000; especial.vencedor = null; }
        if (especial.tipo === 'brigada') {
          // O treino de brigada é um evento urgente surpresa, conduzido pelo Professor Virtual.
          abrirEmergencia(sortear(Object.keys(nov.EMERGENCIAS)), agora);
          especial.status = 'fim'; especial.terminouEm = agora - FIM_ESPECIAL;
          return;
        }
        falaProfessor(`${def.emoji} Começou: ${def.nome}!`, { especial: especial.tipo, idEspecial: especial.id, comecou: true });
        return;
      }
      if (especial.tipo === 'bingo') {
        while (!especial.vencedor && agora >= especial.proximo && especial.ordem.length) {
          const n = especial.ordem.shift();
          especial.sorteados.push(n);
          especial.proximo += def.intervalo;
          falaProfessor(`🎱 Número ${n}!`, { bingo: n, idEspecial: especial.id });
        }
        if (!especial.vencedor && !especial.ordem.length && agora >= especial.proximo + 15000) terminarEspecial(agora, 'Saíram todos os números e ninguém gritou BINGO. Fim do bingo!');
        return;
      }
      if (especial.tipo === 'tesouro' && agora - especial.ultimaDica > DICA_TESOURO) {
        especial.ultimaDica = agora;
        const falta = especial.baus.find((b) => !b.por);
        if (falta) falaProfessor(`🧭 Dica: ainda tem baú ${ondeFica(falta.x, falta.y)}.`);
      }
      if (agora >= especial.fim) terminarEspecial(agora);
    }
    // Na caça ao tesouro, quem chega num baú primeiro fica com ele (o computador do instrutor confere pela posição).
    function checarBaus(p) {
      if (!especial || especial.status !== 'ativo' || especial.tipo !== 'tesouro' || p.papel === 'instrutor') return;
      especial.baus.forEach((b, k) => {
        if (b.por || Math.hypot(b.x - p.x, b.y - p.y) > 0.9) return;
        b.por = { id: p.id, nome: p.nome };
        const achados = especial.baus.filter((x) => x.por).length;
        evento({ tipo: 'tesouro', de: quem(p), idEspecial: especial.id, bau: k, texto: `🎁 ${p.nome} achou um baú! (${achados} de ${especial.baus.length})` });
        if (achados === especial.baus.length) terminarEspecial(relogio(), '🎉 Todos os baús foram achados! Parabéns, turma: vocês conhecem a cidade inteira.');
      });
    }
    function resumoEspecial(usuario, agora) {
      if (!especial) return null;
      const r = { id: especial.id, tipo: especial.tipo, status: especial.status, comeca: especial.comeca, fim: especial.fim, agora, esperando: !!especial.esperando };
      if (especial.tipo === 'festa') r.palmas = especial.palmas || 0;
      if (especial.tipo === 'tesouro' && especial.baus) { r.baus = especial.baus.map((b) => ({ x: b.x, y: b.y, achado: !!b.por })); r.achados = especial.baus.filter((b) => b.por).length; }
      if (especial.tipo === 'bingo' && especial.sorteados) {
        r.sorteados = especial.sorteados.slice();
        r.cartela = especial.status === 'ativo' && usuario.papel !== 'instrutor' ? cartelaDe(usuario.id) : (especial.cartelas[usuario.id] || null);
        r.vencedor = especial.vencedor;
      }
      return r;
    }
    function infoLoja(usuario) {
      const turma = turmaVista(usuario);
      const loja = lojaDa(turma);
      return {
        turma,
        eventos: Object.values(nov.ESPECIAIS).map((e) => {
          const v = loja[e.id] || { juntado: 0, doadores: {} };
          return { id: e.id, emoji: e.emoji, nome: e.nome, descricao: e.descricao, preco: e.preco, juntado: Number(v.juntado) || 0, meu: Number((v.doadores || {})[usuario.id]) || 0, doadores: Object.keys(v.doadores || {}).length };
        }),
        especial: resumoEspecial(usuario, relogio()),
      };
    }

    // ---------- Colegas de demonstração (só no modo de teste no navegador) ----------
    const bots = [];
    const pendentes = []; // falas dos colegas de demonstração que saem daqui a pouco
    let ultimoMovimento = relogio(), ultimaConversaBot = 0, ultimaPistaBot = relogio();
    const AJUDANTES = new Set(['demo-ana', 'demo-carla', 'demo-davi']);
    const FALAS_BOT = {
      colega: ['Bom dia, turma!', 'Alguém viu a missão da semana?', 'Terminei a aula de planilha! 📊', 'Vamos no bingo hoje?', 'Que calor, hein! ☀️', 'Quem me ensina a mandar e-mail?'],
      'demo-lia': ['Precisa de ajuda? Aperte 🙋!', 'Hoje já ajudei 2 colegas 💁'],
      'demo-bruno': ['Alguém joga jogo da velha comigo?', 'Tô esperando um desafiante! ❌⭕'],
      'demo-fatima': ['Sua vez, Jorge!', 'Essa pedra é minha!'], 'demo-jorge': ['Bati! 🎉', 'Hum… passo a vez.'],
    };
    if (demonstracao) {
      const base = { papel: 'aluno', turma: 'Demonstração', bot: true, mao: 0, esq: false, andando: false };
      [
        { id: 'demo-ana', nome: 'Ana', avatar: '🐱', x: 13, y: 15, anda: 'praca' },
        { id: 'demo-carla', nome: 'Carla', avatar: '🌻', x: 20, y: 15, anda: 'praca' },
        { id: 'demo-davi', nome: 'Davi', avatar: '😎', x: 11, y: 10, anda: 'ruas' },
        { id: 'demo-bruno', nome: 'Bruno', avatar: '🐶', x: 13, y: 13, parado: true },
        { id: 'demo-fatima', nome: 'Fátima', avatar: '🐼', x: 20, y: 13, parado: true },
        { id: 'demo-jorge', nome: 'Jorge', avatar: '🙂', x: 22, y: 13, parado: true },
        { id: 'demo-lia', nome: 'Lia', avatar: '💁', x: 19, y: 12, anda: 'praca', monitor: true },
      ].forEach((b) => { const p = { ...base, ...b, caminho: [], proxima: relogio() + 1500 + Math.random() * 3000, em: relogio() }; bots.push(p); pessoas.set(p.id, p); });
      mesa.O = quem(pessoas.get('demo-bruno'));
    }
    const falaBot = (b, t, depois = 0) => pendentes.push({ em: relogio() + depois, b, t });
    function moverBots(agora) {
      const dt = Math.min(1, Math.max(0, (agora - ultimoMovimento) / 1000));
      ultimoMovimento = agora;
      for (const fala of pendentes.splice(0).filter((f) => { if (f.em <= agora) return true; pendentes.push(f); return false; })) {
        evento({ tipo: 'fala', de: quem(fala.b), texto: fala.t, x: fala.b.x, y: fala.b.y });
      }
      for (const b of bots) {
        b.em = agora;
        // Árvore caiu ou a água subiu onde o colega estava: ele sai dali (e acha outro caminho).
        if (!mapa.andavel(Math.round(b.x), Math.round(b.y))) { [b.x, b.y] = mapa.maisPerto(b.x, b.y); b.caminho = []; }
        if (b.caminho.length) {
          let passo = 2.3 * dt;
          while (passo > 0 && b.caminho.length) {
            const [tx, ty] = b.caminho[0];
            if (!mapa.andavel(tx, ty)) { b.caminho = []; break; }
            const dx = tx - b.x, dy = ty - b.y, d = Math.hypot(dx, dy);
            if (dx) b.esq = dx < 0;
            if (d <= passo) { b.x = tx; b.y = ty; b.caminho.shift(); passo -= d; } else { b.x = arred(b.x + (dx / d) * passo); b.y = arred(b.y + (dy / d) * passo); passo = 0; }
          }
          b.andando = b.caminho.length > 0;
          if (!b.caminho.length && b.vaiAjudar) { falaBot(b, 'Oi! Vim te ajudar 💁 Me mostra onde travou?', 200); b.vaiAjudar = null; b.proxima = agora + 9000; }
          continue;
        }
        b.andando = false;
        if (emerg && emerg.status === 'ativo' && AJUDANTES.has(b.id)) { missaoDoBot(b, agora); continue; }
        if (agora < b.proxima) continue;
        const falas = FALAS_BOT[b.id] || FALAS_BOT.colega;
        const conversar = agora - ultimaConversaBot > 7000 && Math.random() < (b.parado ? 0.35 : 0.25);
        if (conversar) { ultimaConversaBot = agora; evento({ tipo: 'fala', de: quem(b), texto: sortear(falas), x: b.x, y: b.y }); }
        else if (!b.parado) {
          const c = mapa.caminho([Math.round(b.x), Math.round(b.y)], [sortear(b.anda === 'ruas' ? mapa.RUAS : mapa.PRACA)]);
          if (c) b.caminho = c;
        }
        b.proxima = agora + (b.parado ? 9000 + Math.random() * 9000 : 2500 + Math.random() * 4500);
      }
      // Os colegas de demonstração também investigam: de tempos em tempos um deles acha uma pista do capítulo.
      const nDemo = dados().novela['Demonstração'];
      if (nDemo && nDemo.atual && !nDemo.resolvido && agora - ultimaPistaBot > PISTA_BOT) {
        ultimaPistaBot = agora;
        const cap = nov.porCapitulo[nDemo.atual];
        const opcoes = [];
        for (const p of cap.pistas) for (const b of bots) if (!(nDemo.achados[p.id] || []).includes(b.id)) opcoes.push([p, b]);
        if (opcoes.length) {
          const [p, b] = sortear(opcoes);
          (nDemo.achados[p.id] = nDemo.achados[p.id] || []).push(b.id);
          evento({ tipo: 'novela', turma: 'Demonstração', texto: `🔎 ${b.nome} achou a pista “${p.titulo}” (${noLugar(p.lugar)}).` });
          conferirNovela('Demonstração', nDemo);
          gravar();
        }
      }
      atualizarEspecial(agora);
      for (const b of bots) checarBaus(b);
      if (especial && especial.status === 'ativo' && especial.tipo === 'festa' && Math.random() < 0.3) especial.palmas = (especial.palmas || 0) + 1;
      // Num evento urgente, os colegas de demonstração ajudam também, andando pelo mapa (devagar: quem está na praça faz a diferença).
      atualizarEmergencia(agora);
      // O Bruno joga quando é a vez dele (e devolve a revanche).
      const bruno = pessoas.get('demo-bruno');
      if (bruno && mesa.O && mesa.O.id === bruno.id && mesa.X && !mesa.vencedor && mesa.vez === 'O' && agora - mesa.jogadaEm > 700) {
        jogarNaMesa('O', jogadaDoComputador(mesa.tab, 'O'));
        if (mesa.vencedor === 'O') falaBot(bruno, 'Ganhei! Mais uma? 😄', 300);
        else if (mesa.vencedor === 'X') falaBot(bruno, 'Boa! Revanche?', 300);
        else if (mesa.vencedor === 'velha') falaBot(bruno, 'Deu velha! 🤝', 300);
      }
    }
    // O que um colega de demonstração faz no evento urgente quando chega onde ia: pega, leva, joga água, avisa.
    function irBot(b, metas) {
      const c = mapa.caminho([Math.round(b.x), Math.round(b.y)], metas);
      if (c && c.length) { b.caminho = c; return true; }
      return false;
    }
    function missaoDoBot(b, agora) {
      if (agora < (b.missaoEm || 0)) return;
      b.missaoEm = agora + 500;
      const def = nov.EMERGENCIAS[emerg.tipo];
      const levando = !!emerg.carregando[b.id];
      const ajudou = (texto, foco) => {
        emerg.carregando[b.id] = false;
        b.missaoEm = agora + 2500; // respira um pouco antes da próxima viagem
        if ((emerg.ajudas[b.id] || { vezes: 0 }).vezes % 3 === 0) evento({ tipo: 'emergencia-ajuda', de: quem(b), texto });
        ajudar(b, unidade() * VALE_BOT, foco);
      };
      if (emerg.tipo === 'chuva') {
        const q = emerg.quedas.find((x) => !x.removida && !x.avisadaEm);
        if (q) {
          if (distDaQueda(q, b.x, b.y) <= 2.5) { avisarQueda(q, b, agora); ajudar(b, unidade() * VALE_BOT); return; }
          if (irBot(b, q.tiles.flatMap(([x, y]) => mapa.pertoDoPonto(x, y, 2.4)))) return;
        }
      }
      if (!levando) {
        const zonas = fontesDe(def);
        if (zonas.some((z) => mapa.pertoDaZona(z, b.x, b.y, 1.5))) { emerg.carregando[b.id] = true; b.missaoEm = agora + 800; return; }
        irBot(b, zonas.flatMap((z) => mapa.ZONAS[z] || []));
        return;
      }
      if (emerg.tipo === 'incendio') {
        const dist = (f) => Math.hypot(f.x - b.x, f.y - b.y);
        const f = focosAcesos().filter((x) => !x.eletrico).sort((x, y) => dist(x) - dist(y))[0];
        if (!f) return;
        if (dist(f) <= mapa.PERTO_DO_FOCO) { ajudou(`${b.nome} jogou água ${em(f.nome)}.`, f); return; }
        irBot(b, mapa.pertoDoPonto(f.x, f.y));
        return;
      }
      const alvo = def.levar.entregar;
      if (mapa.pertoDaZona(alvo, b.x, b.y, 2)) { if (emerg.tipo === 'rio') emerg.sacos++; ajudou(`${b.nome} ${def.levar.feito}.`); return; }
      const metas = alvo === 'barreira' ? mapa.ZONAS.barreira.flatMap(([x, y]) => [[x, y], [x, y - 1], [x, y - 2]]) : mapa.ZONAS[alvo];
      irBot(b, metas);
    }
    const pertoDe = (p, raio) => bots.filter((b) => !b.parado && b.id !== 'demo-lia' && Math.hypot(b.x - p.x, b.y - p.y) < raio);
    const tem = (t, ...palavras) => palavras.some((w) => new RegExp(`(^|[^${LETRA}])${w}([^${LETRA}]|$)`, 'i').test(t));
    function responderBots(p, t) {
      const perto = pertoDe(p, 7);
      if (tem(t, 'oi', 'olá', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'e aí', 'pessoal')) { if (perto.length) falaBot(sortear(perto), `Oi, ${p.nome}! 👋`, 900); }
      else if (tem(t, 'jogar', 'jogo')) falaBot(pessoas.get('demo-bruno'), 'Eu jogo! Vem pra mesa do jogo da velha ❌⭕', 900);
      else if (tem(t, 'ajuda', 'socorro')) monitoraVem(p);
      else if (tem(t, 'obrigado', 'obrigada', 'valeu')) { if (perto.length) falaBot(sortear(perto), 'De nada! 😊', 900); }
      else if (tem(t, 'tchau', 'até amanhã', 'até mais')) { if (perto.length) falaBot(sortear(perto), 'Até amanhã! 👋', 900); }
    }
    function monitoraVem(p) {
      const lia = pessoas.get('demo-lia');
      if (!lia) return;
      const c = mapa.caminho([Math.round(lia.x), Math.round(lia.y)], mapa.vizinhos(Math.round(p.x), Math.round(p.y)));
      if (c && c.length) { lia.caminho = c; lia.vaiAjudar = p.id; }
      else if (c) falaBot(lia, 'Oi! Vim te ajudar 💁 Me mostra onde travou?', 400);
    }

    return {
      // Chamado de meio em meio segundo por quem está com a praça aberta: "eu estou aqui" e "o que mudou?".
      sincronizar(usuario, eu = {}, desde = 0, extra = {}) {
        const agora = relogio();
        limparAusentes(agora);
        if (demonstracao) moverBots(agora);
        let p = pessoas.get(usuario.id);
        const novo = !p;
        if (novo) {
          const [x, y] = chegada();
          p = { id: usuario.id, x, y, esq: false, andando: false, mao: 0, entrouEm: agora };
          pessoas.set(usuario.id, p);
        } else if (eu && Number.isFinite(Number(eu.x)) && Number.isFinite(Number(eu.y))) {
          p.x = Math.min(mapa.W - 1, Math.max(0, arred(eu.x))); p.y = Math.min(mapa.H - 1, Math.max(0, arred(eu.y)));
          p.esq = !!eu.esq; p.andando = !!eu.andando;
        }
        Object.assign(p, { nome: texto(usuario.nome, 40), avatar: texto(usuario.avatar, 16) || '🙂', papel: usuario.papel, turma: usuario.turma || '', monitor: !!(extra && extra.monitor), em: agora });
        if (p.mao && agora - p.mao > MAO) p.mao = 0;
        const d = Number(desde) || 0;
        const turma = turmaVista(usuario, eu && eu.turma);
        if (demonstracao && !avaliouDemo) { avaliouDemo = true; avaliar('Demonstração', false); }
        atualizarEmergencia(agora);
        atualizarEspecial(agora);
        checarBaus(p);
        const hora = verificarHora(agora);
        return {
          agora, novo, eu: { x: p.x, y: p.y },
          cidade: { turma, abertos: (dados().abertos[turma] || []).slice(), selos: semanaDa(turma).selos.slice() },
          novela: resumoNovela(usuario, turma),
          emergencia: resumoEmergencia(usuario, agora),
          especial: resumoEspecial(usuario, agora),
          hora: hora ? { id: hora.id, fimEm: hora.fimEm, agora } : null,
          aberta: dados().aberta, soFrases: dados().soFrases, silenciado: dados().silenciados.includes(usuario.id),
          silenciados: ehInstrutor(usuario) ? dados().silenciados.slice() : undefined,
          chamada: chamada && agora - chamada.em < CONVITE ? { id: chamada.id, em: chamada.em } : null,
          pessoas: [...pessoas.values()].map((x) => publica(x, agora)),
          eventos: d ? eventos.filter((e) => e.id > d) : eventos.slice(-12),
          ultimo: ultimoEvento, versao: dados().versao, mesa: mesaPublica(),
        };
      },
      sair(usuario) { pessoas.delete(usuario.id); levantar(usuario.id); return true; },
      // O computador do aluno avisa os módulos que ele concluiu (só os que importam para a cidade).
      informarModulos(usuario, lista) {
        if (ehInstrutor(usuario)) return this.cidade(usuario);
        const validos = [...new Set((Array.isArray(lista) ? lista : []).map(String))].filter((m) => mapa.MODULOS_DA_CIDADE.includes(m)).sort();
        const antes = dados().modulos[usuario.id];
        const turma = turmaDe(usuario);
        if (!antes || antes.turma !== turma || (antes.lista || []).join() !== validos.join()) {
          dados().modulos[usuario.id] = { turma, lista: validos, em: relogio() };
          gravar();
        }
        avaliar(turma, true);
        return this.cidade(usuario);
      },
      // Como está a cidade da turma: o que já acendeu e quanto falta para cada prédio.
      cidade(usuario, pedida) {
        const turma = turmaVista(usuario, pedida);
        const abertos = avaliar(turma, true);
        const { daTurma, precisa, lugares } = contar(turma);
        const meus = listaDe(usuario.id);
        return {
          turma, alunos: daTurma.length, precisa,
          turmas: ehInstrutor(usuario) ? [...new Set(todosAlunos().map((a) => a.turma))].sort() : undefined,
          lugares: lugares.map((l) => ({ lugar: l.lugar, modulo: l.modulo, titulo: l.titulo, feitos: l.feitos, aberto: abertos.includes(l.lugar), euFiz: meus.includes(l.modulo) })),
          // A Rua da Turma: o terreno de cada aluno, que vira casa e ganha enfeites com os cursos que ele termina.
          rua: daTurma.map((a) => ({ id: a.id, nome: a.nome, avatar: a.avatar, ...casaDe(a.id), moedas: ehInstrutor(usuario) || a.id === usuario.id ? moedasDe(a.id) : undefined }))
            .sort((a, b) => (b.id === usuario.id) - (a.id === usuario.id) || String(a.nome).localeCompare(String(b.nome), 'pt-BR')),
          ...casaDe(usuario.id),
        };
      },
      // ---------- Tarefa do dia ----------
      tarefa(usuario, lugar) {
        if (!nov.temTarefa(lugar)) throw new Error('Este lugar não tem tarefa.');
        return infoTarefa(usuario, turmaVista(usuario), lugar);
      },
      fazerTarefa(usuario, lugar, resposta) {
        if (!nov.temTarefa(lugar)) throw new Error('Este lugar não tem tarefa.');
        const turma = turmaVista(usuario);
        if (!ehInstrutor(usuario) && !lugarAceso(turma, lugar)) throw new Error('Este lugar ainda está em obra: a tarefa dele começa quando a turma acender o prédio.');
        const t = nov.tarefaDoDia(lugar, relogio());
        const certo = nov.conferir(t, resposta);
        let contou = false;
        if (certo && !ehInstrutor(usuario)) {
          const hoje = nov.dia(relogio());
          const minhas = dados().feitas[usuario.id] = dados().feitas[usuario.id] || {};
          if (minhas[lugar] !== hoje) {
            minhas[lugar] = hoje; contou = true;
            const sem = semanaDa(turma);
            sem.conta[lugar] = (sem.conta[lugar] || 0) + 1;
            if (sem.conta[lugar] >= metaTarefa(turma) && !sem.selos.includes(lugar)) {
              sem.selos.push(lugar);
              dados().bonus += BONUS_DESAFIO;
              evento({ tipo: 'desafio', lugar, turma, texto: `⭐ A turma${turma ? ' ' + turma : ''} completou o desafio da semana ${noLugar(lugar)}: +${BONUS_DESAFIO} moedas no cofre!` });
            }
            gravar();
          }
        }
        return { certo, explica: certo ? t.explica : null, contou, dia: nov.dia(relogio()), ...infoTarefa(usuario, turma, lugar) };
      },
      // Moedas que os desafios da semana já deram ao cofre (somadas às das aulas).
      bonus() { return dados().bonus || 0; },

      // ---------- Novela da cidade ----------
      novela(usuario, pedida) {
        const turma = turmaVista(usuario, pedida);
        const n = dados().novela[turma];
        const feitos = (n && n.feitos) || [];
        let atual = null;
        if (n && n.atual && nov.porCapitulo[n.atual]) {
          const { cap, total } = contarNovela(n);
          const achei = (p) => (n.achados[p.id] || []).includes(usuario.id);
          atual = {
            id: cap.id, emoji: cap.emoji, titulo: cap.titulo, abertura: cap.abertura, total, meta: metaNovela(turma), aberto: n.abertoEm,
            resolvido: !!n.resolvido, revelado: !!n.revelado, participei: cap.pistas.some(achei),
            final: n.revelado ? cap.final : null, moral: n.revelado ? cap.moral : null,
            pistas: cap.pistas.map((p) => ({ id: p.id, lugar: p.lugar, titulo: p.titulo, achados: (n.achados[p.id] || []).length, euAchei: achei(p), tarefa: nov.publica(p.tarefa) })),
          };
        }
        return {
          turma, atual,
          capitulos: nov.CAPITULOS.map((c) => ({ id: c.id, emoji: c.emoji, titulo: c.titulo, feito: feitos.includes(c.id), atual: !!(atual && atual.id === c.id) })),
          turmas: ehInstrutor(usuario) ? [...new Set(todosAlunos().map((a) => a.turma))].sort() : undefined,
        };
      },
      abrirCapitulo(usuario, id, pedida) {
        exigirInstrutor(usuario);
        const cap = nov.porCapitulo[id];
        if (!cap) throw new Error('Capítulo desconhecido.');
        const turma = turmaVista(usuario, pedida);
        const antes = dados().novela[turma] || {};
        dados().novela[turma] = { atual: id, abertoEm: relogio(), achados: {}, resolvido: false, revelado: false, feitos: antes.feitos || [] };
        gravar();
        evento({ tipo: 'novela', turma, texto: `📖 Novo capítulo da novela da cidade: “${cap.titulo}”. As pistas estão nos lugares marcados com 🔎.` });
        return this.novela(usuario, turma);
      },
      resolverPista(usuario, pistaId, resposta) {
        const p = nov.porPista[pistaId];
        if (!p) throw new Error('Pista desconhecida.');
        const turma = turmaVista(usuario);
        const n = dados().novela[turma];
        if (!n || n.atual !== p.capitulo) throw new Error('Esta pista não é do capítulo de agora.');
        const certo = nov.conferir(p.tarefa, resposta);
        let contou = false;
        if (certo && !ehInstrutor(usuario)) {
          const lista = n.achados[p.id] = n.achados[p.id] || [];
          if (!lista.includes(usuario.id)) {
            lista.push(usuario.id); contou = true;
            conferirNovela(turma, n);
            gravar();
          }
        }
        return { certo, explica: certo ? p.tarefa.explica : null, contou, novela: this.novela(usuario) };
      },
      revelarFinal(usuario, pedida) {
        exigirInstrutor(usuario);
        const turma = turmaVista(usuario, pedida);
        const n = dados().novela[turma];
        if (!n || !n.atual) throw new Error('Nenhum capítulo está aberto.');
        if (!n.resolvido) throw new Error('A turma ainda não juntou as pistas deste capítulo.');
        if (!n.revelado) {
          const cap = nov.porCapitulo[n.atual];
          n.revelado = true;
          n.feitos = [...new Set([...(n.feitos || []), cap.id])];
          gravar();
          const participantes = [...new Set(cap.pistas.flatMap((p) => n.achados[p.id] || []))];
          evento({ tipo: 'final', turma, capitulo: cap.id, aberto: n.abertoEm, emoji: cap.emoji, titulo: cap.titulo, texto: cap.final, moral: cap.moral, participantes });
        }
        return this.novela(usuario, turma);
      },

      falar(usuario, t0) {
        const p = precisaDe(usuario);
        podeFalar(usuario);
        const t = texto(t0, 80);
        if (!t) throw new Error('Escreva alguma coisa.');
        if (dados().soFrases && !ehInstrutor(usuario) && !FRASES.includes(t)) throw new Error('Agora só valem as frases prontas (o instrutor escolheu assim).');
        const agora = relogio();
        if (agora - (ultimaFala.get(usuario.id) || 0) < ESPERA_FALA) throw new Error('Calma: espere um pouquinho para falar de novo.');
        ultimaFala.set(usuario.id, agora);
        const ev = evento({ tipo: 'fala', de: quem(p), texto: limpo(t), x: p.x, y: p.y });
        if (demonstracao) responderBots(p, ev.texto);
        return ev;
      },
      gesto(usuario, tipo) {
        const p = precisaDe(usuario);
        if (tipo === 'baixar') { p.mao = 0; return true; }
        podeFalar(usuario);
        if (!['acenar', 'aplaudir', 'ajuda'].includes(tipo)) throw new Error('Gesto desconhecido.');
        if (tipo === 'ajuda') p.mao = relogio();
        if (tipo !== 'ajuda' && especial && especial.status === 'ativo' && especial.tipo === 'festa') especial.palmas = (especial.palmas || 0) + 1;
        const ev = evento({ tipo: 'gesto', gesto: tipo, de: quem(p), x: p.x, y: p.y });
        if (demonstracao) {
          if (tipo === 'ajuda') monitoraVem(p);
          else if (tipo === 'acenar') { const perto = pertoDe(p, 7); if (perto.length) falaBot(sortear(perto), '👋', 700); }
        }
        return ev;
      },
      megafone(usuario, t0) {
        exigirInstrutor(usuario);
        const t = texto(t0, 120);
        if (!t) throw new Error('Escreva o recado do megafone.');
        return evento({ tipo: 'megafone', de: { id: usuario.id, nome: usuario.nome, avatar: usuario.avatar, papel: usuario.papel }, texto: limpo(t) });
      },
      configurar(usuario, c = {}) {
        exigirInstrutor(usuario);
        if (typeof c.aberta === 'boolean' && c.aberta !== dados().aberta) {
          dados().aberta = c.aberta;
          evento({ tipo: 'sistema', texto: c.aberta ? 'O instrutor abriu a praça. Recreio!' : 'O instrutor fechou a praça.' });
        }
        if (typeof c.soFrases === 'boolean' && c.soFrases !== dados().soFrases) {
          dados().soFrases = c.soFrases;
          evento({ tipo: 'sistema', texto: c.soFrases ? 'Agora a conversa é só com frases prontas.' : 'A conversa está livre de novo.' });
        }
        gravar();
        return { aberta: dados().aberta, soFrases: dados().soFrases };
      },
      // "Todo mundo para a praça": quem está na praça vai para perto da fonte; quem não está recebe o convite.
      chamar(usuario) {
        exigirInstrutor(usuario);
        if (!dados().aberta) { dados().aberta = true; gravar(); }
        chamada = { id: Math.max(relogio(), chamada ? chamada.id + 1 : 0), em: relogio() };
        evento({ tipo: 'megafone', de: { id: usuario.id, nome: usuario.nome, avatar: usuario.avatar, papel: usuario.papel }, texto: 'Todo mundo para a praça, perto da fonte!' });
        return chamada;
      },
      convite(usuario) {
        const agora = relogio();
        const p = pessoas.get(usuario.id);
        if (p && agora - p.em < 5000) return null; // já está na praça
        atualizarEmergencia(agora);
        if (emerg && emerg.status === 'ativo') {
          const def = nov.EMERGENCIAS[emerg.tipo];
          return { id: 'emergencia-' + emerg.id, emergencia: { tipo: emerg.tipo, emoji: def.emoji, titulo: def.titulo } };
        }
        const hora = verificarHora(agora);
        if (hora && dados().aberta) return { id: hora.id, hora: { fimEm: hora.fimEm, agora, minutos: Math.max(1, Math.round((hora.fimEm - agora) / 60000)) } };
        if (!chamada || agora - chamada.em > CONVITE || !dados().aberta) return null;
        return { id: chamada.id };
      },
      // ---------- Hora da Praça ----------
      horario(usuario) {
        const agora = relogio();
        return { ...dados().horario, proxima: proximaHora(agora), agora, agoraNaPraca: !!janelaDaHora(agora) };
      },
      configurarHorario(usuario, h) {
        exigirInstrutor(usuario);
        dados().horario = horarioValido(h);
        gravar();
        return this.horario(usuario);
      },
      testarHora(usuario) {
        exigirInstrutor(usuario);
        const agora = relogio();
        horaManual = { id: 'hora-teste-' + agora, fim: 'teste', fimEm: agora + dados().horario.antes * 60000 };
        verificarHora(agora);
        return this.horario(usuario);
      },

      // ---------- Eventos especiais ----------
      loja(usuario) { atualizarEspecial(relogio()); return infoLoja(usuario); },
      // O aluno dá moedas para a vaquinha (as moedas saem da carteira dele, no computador dele).
      doar(usuario, id, valor) {
        if (ehInstrutor(usuario)) throw new Error('O instrutor começa os eventos especiais de graça, pelo coreto.');
        if (!nov.temEspecial(id)) throw new Error('Evento desconhecido.');
        const v = Math.floor(Number(valor));
        if (!Number.isFinite(v) || v < 1 || v > MAX_DOACAO) throw new Error('Valor de doação inválido.');
        const turma = turmaVista(usuario);
        const loja = lojaDa(turma);
        const item = loja[id] = loja[id] || { juntado: 0, doadores: {} };
        item.juntado = (Number(item.juntado) || 0) + v;
        item.doadores = item.doadores || {};
        item.doadores[usuario.id] = (Number(item.doadores[usuario.id]) || 0) + v;
        const def = nov.ESPECIAIS[id];
        let comprou = false;
        if (item.juntado >= def.preco) {
          item.juntado -= def.preco;
          item.doadores = {};
          comprou = true;
          evento({ tipo: 'sistema', texto: `🎟️ A turma${turma ? ' ' + turma : ''} juntou as moedas e comprou: ${def.emoji} ${def.nome}!` });
          comecarEspecial(id, turma, relogio());
        }
        gravar();
        return { comprou, ...infoLoja(usuario) };
      },
      iniciarEspecial(usuario, id) {
        exigirInstrutor(usuario);
        if (!nov.temEspecial(id)) throw new Error('Evento desconhecido.');
        comecarEspecial(id, turmaVista(usuario), relogio());
        return infoLoja(usuario);
      },
      encerrarEspecial(usuario) {
        exigirInstrutor(usuario);
        const agora = relogio();
        fila.length = 0;
        if (especial && especial.status !== 'fim') terminarEspecial(agora, 'O instrutor encerrou o evento especial.');
        return infoLoja(usuario);
      },
      // BINGO! O computador do instrutor confere a cartela com os números sorteados.
      bingo(usuario) {
        const agora = relogio();
        atualizarEspecial(agora);
        if (!especial || especial.tipo !== 'bingo' || especial.status !== 'ativo') throw new Error('Não tem bingo acontecendo agora.');
        if (especial.vencedor) throw new Error(`O bingo já tem vencedor: ${especial.vencedor.nome}.`);
        const cartela = especial.cartelas[usuario.id];
        if (!cartela) throw new Error('Você não tem cartela neste bingo.');
        const faltam = cartela.filter((n) => !especial.sorteados.includes(n));
        if (faltam.length) throw new Error(`Ainda falta${faltam.length === 1 ? '' : 'm'} ${faltam.length} número${faltam.length === 1 ? '' : 's'} da sua cartela. Confira com calma!`);
        especial.vencedor = { id: usuario.id, nome: usuario.nome };
        const def = nov.ESPECIAIS.bingo;
        terminarEspecial(agora, `🎉 BINGO! ${usuario.nome} completou a cartela e ganhou ${def.premio} moedas!`);
        especial.vencedorEvento = true;
        evento({ tipo: 'bingo-ganhou', de: { id: usuario.id, nome: usuario.nome }, idEspecial: especial.id, texto: `🎱 ${usuario.nome} ganhou o bingo!` });
        return resumoEspecial(usuario, agora);
      },

      // ---------- Eventos urgentes ----------
      iniciarEmergencia(usuario, tipo) {
        exigirInstrutor(usuario);
        if (!nov.temEmergencia(tipo)) throw new Error('Evento desconhecido.');
        const agora = relogio();
        atualizarEmergencia(agora);
        if (emerg && emerg.status === 'ativo') throw new Error('Já tem um evento acontecendo. Encerre esse antes de começar outro.');
        abrirEmergencia(tipo, agora);
        return resumoEmergencia(usuario, agora);
      },
      encerrarEmergencia(usuario) {
        exigirInstrutor(usuario);
        const agora = relogio();
        atualizarEmergencia(agora);
        if (emerg && emerg.status === 'ativo') {
          emerg.status = 'encerrado'; emerg.terminouEm = agora;
          evento({ tipo: 'sistema', texto: 'O instrutor encerrou o evento urgente.' });
          aplicarBloqueios();
        }
        return resumoEmergencia(usuario, agora);
      },
      // A ajuda de cada um: pegar e entregar (andando pelo mapa), ligar para o número certo ou responder a pergunta.
      acaoEmergencia(usuario, acao, dado = {}) {
        const agora = relogio();
        atualizarEmergencia(agora);
        if (!emerg || emerg.status !== 'ativo') throw new Error('Não tem nenhum evento urgente acontecendo agora.');
        const p = precisaDe(usuario);
        const def = nov.EMERGENCIAS[emerg.tipo];
        if (dado && Number.isFinite(Number(dado.x)) && Number.isFinite(Number(dado.y))) {
          p.x = Math.min(mapa.W - 1, Math.max(0, arred(dado.x))); p.y = Math.min(mapa.H - 1, Math.max(0, arred(dado.y))); p.em = agora;
        }
        let certo = true, explica = null;
        if (acao === 'pegar') {
          if (!fontesDe(def).some((z) => mapa.pertoDaZona(z, p.x, p.y, 2))) {
            throw new Error(emerg.tipo === 'rio' ? `Chegue mais perto da areia: no monte da obra (Lote da turma)${emerg.caminhao && emerg.caminhao.chegou ? ' ou no caminhão da Defesa Civil' : ''}.` : 'Chegue mais perto para pegar.');
          }
          emerg.carregando[usuario.id] = true;
        } else if (acao === 'entregar') {
          if (!emerg.carregando[usuario.id]) throw new Error('Primeiro pegue a ajuda no lugar certo.');
          let foco = null;
          if (emerg.tipo === 'incendio') {
            foco = focoParaAgua(dado && typeof dado.foco === 'string' ? dado.foco : null, p.x, p.y);
            if (!foco) throw new Error('Chegue mais perto do fogo para jogar a água.');
            if (foco.eletrico) throw new Error('⚡ Água no poste de luz, não! Água conduz eletricidade. O fogo do poste é com os Bombeiros (193).');
          } else if (!mapa.pertoDaZona(def.levar.entregar, p.x, p.y, 2)) throw new Error('Chegue mais perto para entregar.');
          if (agora - (emerg.ultimaEntrega[usuario.id] || 0) < ESPERA_ENTREGA) throw new Error('Calma: uma entrega de cada vez.');
          emerg.ultimaEntrega[usuario.id] = agora;
          emerg.carregando[usuario.id] = false;
          if (emerg.tipo === 'rio') emerg.sacos++;
          ajudar(quem(p), unidade(), foco);
        } else if (acao === 'avisar') {
          if (emerg.tipo !== 'chuva') throw new Error('Não tem árvore caída para avisar.');
          const vivas = emerg.quedas.filter((q) => !q.removida);
          const id = dado && typeof dado.queda === 'string' ? dado.queda : null;
          const q = id ? vivas.find((x) => x.id === id) : vivas.filter((x) => !x.avisadaEm).sort((a, b) => distDaQueda(a, p.x, p.y) - distDaQueda(b, p.x, p.y))[0];
          if (!q) throw new Error('Não tem árvore caída para avisar aqui.');
          if (distDaQueda(q, p.x, p.y) > 3.2) throw new Error('Chegue mais perto da árvore caída (sem encostar, que pode ter fio).');
          if (q.avisadaEm) throw new Error(`A Defesa Civil já foi avisada${q.por ? ' por ' + q.por : ''}: a equipe está vindo.`);
          avisarQueda(q, p, agora);
          ajudar(quem(p), unidade());
        } else if (acao === 'ligar' || acao === 'pergunta') {
          const feitos = acao === 'ligar' ? emerg.ligou : emerg.respondeu;
          certo = nov.conferirEmergencia(emerg.tipo, acao, dado && dado.resposta);
          explica = certo ? def[acao].explica : null;
          if (certo && !feitos.has(usuario.id)) {
            feitos.add(usuario.id);
            if (acao === 'ligar') {
              evento({ tipo: 'emergencia-ajuda', de: quem(p), texto: `📞 ${p.nome}: ${def.ligar.titulo.toLowerCase()} (${def.ligar.resposta === '76800000' ? 'CEP enviado' : def.ligar.resposta}).` });
              chamarSocorro(agora);
            } else if (emerg.tipo === 'incendio') emerg.pulaEm += 6000; // área isolada: o fogo demora mais para pular
            // No incêndio, quem apaga é o balde e os Bombeiros (que a ligação chamou): a ajuda conta, sem apagar na hora.
            ajudar(quem(p), emerg.tipo === 'incendio' ? 0 : acao === 'ligar' ? 2 * unidade() : unidade());
          }
        } else throw new Error('Ajuda desconhecida.');
        return { certo, explica, emergencia: resumoEmergencia(usuario, agora) };
      },
      silenciar(usuario, id, sim) {
        exigirInstrutor(usuario);
        const alvo = String(id || '');
        dados().silenciados = dados().silenciados.filter((x) => x !== alvo);
        if (sim && alvo) dados().silenciados.push(alvo);
        gravar();
        return dados().silenciados.slice();
      },
      mural() { return { recados: dados().recados.slice(), versao: dados().versao }; },
      recado(usuario, t0) {
        const p = precisaDe(usuario);
        podeFalar(usuario);
        if (dados().soFrases && !ehInstrutor(usuario)) throw new Error('Agora só valem as frases prontas: o mural está só para leitura.');
        const t = texto(t0, 100);
        if (!t) throw new Error('Escreva o recado.');
        const agora = relogio();
        if (!ehInstrutor(usuario) && agora - (ultimoRecado.get(usuario.id) || 0) < ESPERA_RECADO) throw new Error('Espere um pouquinho para pregar outro recado.');
        ultimoRecado.set(usuario.id, agora);
        const ultimo = dados().recados[0];
        const r = { id: Math.max(agora, ultimo ? ultimo.id + 1 : 0), em: agora, de: { id: p.id, nome: p.nome, avatar: p.avatar }, texto: limpo(t) };
        dados().recados = [r, ...dados().recados].slice(0, MAX_RECADOS);
        gravar();
        evento({ tipo: 'recado', de: quem(p), texto: r.texto, x: p.x, y: p.y });
        return this.mural();
      },
      apagarRecado(usuario, id) {
        exigirInstrutor(usuario);
        dados().recados = dados().recados.filter((r) => r.id !== Number(id));
        gravar();
        return this.mural();
      },
      votacao(usuario) {
        const v = dados().votacao;
        const valores = Object.values(v.votos);
        return {
          opcoes: v.opcoes.map((o) => ({ ...o, votos: valores.filter((x) => x === o.id).length })),
          meu: v.votos[usuario.id] || null, encerrada: !!v.encerrada, vencedor: v.vencedor || null, total: valores.length,
        };
      },
      votar(usuario, opcao) {
        const v = dados().votacao;
        if (v.encerrada) throw new Error('A votação já terminou.');
        if (opcao == null) delete v.votos[usuario.id];
        else if (!v.opcoes.some((o) => o.id === opcao)) throw new Error('Essa opção não está na votação.');
        else v.votos[usuario.id] = opcao;
        gravar();
        return this.votacao(usuario);
      },
      encerrarVotacao(usuario) {
        exigirInstrutor(usuario);
        const v = dados().votacao;
        const r = this.votacao(usuario);
        if (!r.total) throw new Error('Ninguém votou ainda.');
        const vencedor = r.opcoes.reduce((a, b) => (b.votos > a.votos ? b : a));
        v.encerrada = true; v.vencedor = vencedor.id;
        gravar();
        evento({ tipo: 'megafone', de: { id: usuario.id, nome: usuario.nome, avatar: usuario.avatar, papel: usuario.papel }, texto: `A turma escolheu: ${vencedor.emoji} ${vencedor.nome}! A obra começa quando o cofre chegar lá.` });
        return this.votacao(usuario);
      },
      novaVotacao(usuario) {
        exigirInstrutor(usuario);
        dados().votacao = novaVotacao();
        gravar();
        return this.votacao(usuario);
      },
      mesa(usuario, acao, k) {
        const p = precisaDe(usuario);
        const lado = mesa.X && mesa.X.id === p.id ? 'X' : mesa.O && mesa.O.id === p.id ? 'O' : null;
        if (acao === 'sentar') {
          if (lado) return mesaPublica();
          if (!dados().aberta && !ehInstrutor(usuario)) throw new Error('A praça está fechada agora.');
          const livre = !mesa.X ? 'X' : !mesa.O ? 'O' : null;
          if (!livre) throw new Error(`A mesa está ocupada: ${mesa.X.nome} e ${mesa.O.nome} estão jogando. Espere a partida acabar.`);
          mesa[livre] = quem(p);
          recomecar();
          return mesaPublica();
        }
        if (acao === 'levantar') { if (lado) levantar(p.id); return mesaPublica(); }
        if (acao === 'jogar') {
          if (!lado) throw new Error('Sente na mesa para jogar.');
          if (!mesa.X || !mesa.O) throw new Error('Espere alguém sentar do outro lado da mesa.');
          if (mesa.vencedor) throw new Error('A partida acabou. Clique em "Jogar de novo".');
          if (mesa.vez !== lado) throw new Error('Agora é a vez do outro jogador.');
          const i = Number(k);
          if (!Number.isInteger(i) || i < 0 || i > 8 || mesa.tab[i]) throw new Error('Essa casa já está marcada. Escolha outra.');
          jogarNaMesa(lado, i);
          return mesaPublica();
        }
        if (acao === 'nova') {
          if (!lado) throw new Error('Sente na mesa para jogar.');
          if (mesa.vencedor) recomecar();
          return mesaPublica();
        }
        throw new Error('Pedido desconhecido.');
      },
      // Para os testes e para o painel: quantas pessoas de verdade estão na praça agora.
      quantos() { return [...pessoas.values()].filter((p) => !p.bot).length; },
    };
  }
  criarPraca.FRASES = FRASES;
  criarPraca.jogadaDoComputador = jogadaDoComputador;
  criarPraca.venceu = venceu;
  return criarPraca;
});
