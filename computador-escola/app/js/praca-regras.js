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

  function criarPraca({ ler = () => null, salvar = () => {}, relogio = () => Date.now(), demonstracao = false, alunos = () => [] } = {}) {
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
        id: cap.id, total, meta: metaNovela(turma), resolvido: !!n.resolvido, revelado: !!n.revelado, participei: cap.pistas.some(achei),
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

    // ---------- Colegas de demonstração (só no modo de teste no navegador) ----------
    const bots = [];
    const pendentes = []; // falas dos colegas de demonstração que saem daqui a pouco
    let ultimoMovimento = relogio(), ultimaConversaBot = 0, ultimaPistaBot = relogio();
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
        if (b.caminho.length) {
          let passo = 2.3 * dt;
          while (passo > 0 && b.caminho.length) {
            const [tx, ty] = b.caminho[0];
            const dx = tx - b.x, dy = ty - b.y, d = Math.hypot(dx, dy);
            if (dx) b.esq = dx < 0;
            if (d <= passo) { b.x = tx; b.y = ty; b.caminho.shift(); passo -= d; } else { b.x = arred(b.x + (dx / d) * passo); b.y = arred(b.y + (dy / d) * passo); passo = 0; }
          }
          b.andando = b.caminho.length > 0;
          if (!b.caminho.length && b.vaiAjudar) { falaBot(b, 'Oi! Vim te ajudar 💁 Me mostra onde travou?', 200); b.vaiAjudar = null; b.proxima = agora + 9000; }
          continue;
        }
        b.andando = false;
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
      // O Bruno joga quando é a vez dele (e devolve a revanche).
      const bruno = pessoas.get('demo-bruno');
      if (bruno && mesa.O && mesa.O.id === bruno.id && mesa.X && !mesa.vencedor && mesa.vez === 'O' && agora - mesa.jogadaEm > 700) {
        jogarNaMesa('O', jogadaDoComputador(mesa.tab, 'O'));
        if (mesa.vencedor === 'O') falaBot(bruno, 'Ganhei! Mais uma? 😄', 300);
        else if (mesa.vencedor === 'X') falaBot(bruno, 'Boa! Revanche?', 300);
        else if (mesa.vencedor === 'velha') falaBot(bruno, 'Deu velha! 🤝', 300);
      }
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
        return {
          agora, novo, eu: { x: p.x, y: p.y },
          cidade: { turma, abertos: (dados().abertos[turma] || []).slice(), selos: semanaDa(turma).selos.slice() },
          novela: resumoNovela(usuario, turma),
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
          rua: daTurma.map((a) => ({ id: a.id, nome: a.nome, avatar: a.avatar, ...casaDe(a.id) }))
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
        return { certo, explica: certo ? t.explica : null, contou, ...infoTarefa(usuario, turma, lugar) };
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
            id: cap.id, emoji: cap.emoji, titulo: cap.titulo, abertura: cap.abertura, total, meta: metaNovela(turma),
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
          evento({ tipo: 'final', turma, emoji: cap.emoji, titulo: cap.titulo, texto: cap.final, moral: cap.moral, participantes });
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
        if (!chamada || agora - chamada.em > CONVITE || !dados().aberta) return null;
        const p = pessoas.get(usuario.id);
        if (p && agora - p.em < 5000) return null; // já está na praça
        return { id: chamada.id };
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
