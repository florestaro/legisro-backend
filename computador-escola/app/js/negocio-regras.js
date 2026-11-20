// "Do Campo ao Balcão": o jogo de gerenciar uma hamburgueria com a cadeia inteira (roça, pasto, frigorífico,
// transporte, lanchonete e escritório). As regras ficam aqui, num lugar só: o computador do instrutor usa no
// servidor da sala (src/canais.js) e o modo de teste no navegador usa em app/js/api.js.
//
// O mundo anda sozinho: os dias passam (à noite, mais rápido), a seca chega, o capim cresce e acaba, o boi engorda
// ou emagrece, o estoque vence e os clientes chegam conforme o preço, a fama, a fila e a propaganda. Os alunos só
// decidem. Cada aluno cuida de uma ou mais FUNÇÕES (14 no total); a função sem dono é feita pela IA, de um jeito
// simples e mediano. O Professor Virtual narra: avisa antes, explica o que deu errado e dá dicas conforme o nível.
//
// Modos: "turma" (uma empresa só, cada um num setor, conversando entre si) e "cada um" (cada aluno com a sua empresa,
// mexendo em tudo, como no jogo antigo). O instrutor escolhe o nível (o termômetro, de 1 a 10) e pode mexer nele
// durante a partida: muda a velocidade, os eventos, as dicas, a validade do estoque e se a empresa pode falir.
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica();
  else { raiz.CE = raiz.CE || {}; raiz.CE.negocioRegras = fabrica(); }
})(typeof self !== 'undefined' ? self : this, function () {
  // ---------- As funções (na ordem da cadeia: assim, quando se juntam, ficam juntas as que conversam mais) ----------
  const FUNCOES = [
    { id: 'agricultor', nome: 'Agricultor(a)', icone: '🌾', setor: 'Roça', faz: 'Planta e colhe o milho, guarda a silagem para a seca, irriga e nunca queima.' },
    { id: 'pecuarista', nome: 'Pecuarista', icone: '🐄', setor: 'Pasto', faz: 'Cuida do rebanho: troca o piquete (rodízio do pasto), põe silagem no cocho, compra bezerros.' },
    { id: 'veterinario', nome: 'Veterinário(a)', icone: '💉', setor: 'Pasto', faz: 'Vacina, trata o boi doente e faz a guia (GTA) para o boi pronto viajar.' },
    { id: 'logistica', nome: 'Logística', icone: '🚚', setor: 'Transporte', faz: 'Marca as viagens do caminhão (pasto → frigorífico → lanchonete) e põe combustível.' },
    { id: 'frigorifico', nome: 'Frigorífico', icone: '🏭', setor: 'Frigorífico', faz: 'Transforma o boi em hambúrguer, cuida da câmara fria, da validade e da higiene.' },
    { id: 'compras', nome: 'Compras', icone: '📦', setor: 'Escritório', faz: 'Compra pão, queijo e embalagem e confere os boletos (cuidado com o boleto falso).' },
    { id: 'chapeiro', nome: 'Chapeiro(a)', icone: '🔥', setor: 'Lanchonete', faz: 'Monta os lanches na chapa: cada lanche montado atende um cliente da fila.' },
    { id: 'caixa', nome: 'Caixa', icone: '🧾', setor: 'Lanchonete', faz: 'Atende a fila digitando os pedidos: cada pedido certo atende um cliente.' },
    { id: 'gerente', nome: 'Gerente da lanchonete', icone: '🍔', setor: 'Lanchonete', faz: 'Decide o preço, abre e fecha a loja e faz promoção.' },
    { id: 'marketing', nome: 'Marketing', icone: '📣', setor: 'Escritório', faz: 'Faz propaganda (honesta ou enganosa) e responde às avaliações dos clientes.' },
    { id: 'rh', nome: 'RH', icone: '👷', setor: 'Escritório', faz: 'Contrata e treina atendentes, paga a hora extra e cuida do ânimo da equipe.' },
    { id: 'qualidade', nome: 'Qualidade e meio ambiente', icone: '🌳', setor: 'Escritório', faz: 'Apaga foco de queimada, cuida do alvará e recebe a fiscalização.' },
    { id: 'financeiro', nome: 'Financeiro', icone: '💰', setor: 'Escritório', faz: 'Paga as contas no prazo, pega e paga empréstimo e acompanha o caixa.' },
    { id: 'diretor', nome: 'Diretor(a) geral', icone: '👑', setor: 'Diretoria', faz: 'Vê o painel inteiro, define a meta do dia e ajuda nas decisões difíceis.' },
  ];
  const IDS = FUNCOES.map((f) => f.id);
  const porId = Object.fromEntries(FUNCOES.map((f) => [f.id, f]));
  // A campanha: cada fase põe mais setores nas mãos da turma (o resto, a IA faz).
  const FASES = [
    { n: 1, nome: 'Fase 1: a lanchonete', funcoes: ['gerente', 'caixa', 'chapeiro', 'compras'] },
    { n: 2, nome: 'Fase 2: + frigorífico e transporte', funcoes: ['gerente', 'caixa', 'chapeiro', 'compras', 'frigorifico', 'logistica'] },
    { n: 3, nome: 'Fase 3: + pasto e veterinário', funcoes: ['gerente', 'caixa', 'chapeiro', 'compras', 'frigorifico', 'logistica', 'pecuarista', 'veterinario'] },
    { n: 4, nome: 'Fase 4: + roça e a seca', funcoes: ['gerente', 'caixa', 'chapeiro', 'compras', 'frigorifico', 'logistica', 'pecuarista', 'veterinario', 'agricultor'] },
    { n: 5, nome: 'Fase 5: a cadeia completa', funcoes: IDS.slice() },
  ];
  const NIVEIS = [{ id: 'facil', nome: 'Fácil', nivel: 2 }, { id: 'medio', nome: 'Médio', nivel: 5 }, { id: 'dificil', nome: 'Difícil', nivel: 8 }];
  const nomeNivel = (n) => (n <= 3 ? 'Fácil' : n <= 6 ? 'Médio' : 'Difícil');
  // O termômetro (1 a 10): tudo o que muda com o nível.
  function params(nivel) {
    const n = Math.max(1, Math.min(10, Math.round(Number(nivel) || 5)));
    return {
      nivel: n,
      msPorDia: (150 - n * 9) * 1000,                 // 1 dia do jogo: de 2 min 21 s (nível 1) a 1 min (nível 10)
      eventosPorDia: 0.25 + n * 0.15,                  // sorteio de eventos
      validade: n <= 3 ? 99 : n <= 6 ? 5 : 3,          // dias até o hambúrguer vencer (no fácil, não vence)
      dicas: n <= 3 ? 'todas' : n <= 7 ? 'importantes' : 'urgentes',
      dilemas: n >= 4, desmatar: n >= 6, jeitinho: n >= 8,
      falencia: n >= 7,
      avisaEventos: n <= 4,                            // no fácil, o evento é anunciado na véspera
      doenca: 0.004 * n,                               // chance por hora de um boi sem vacina adoecer (x24 por dia)
      iaAtraso: n <= 3 ? 1 : 3,                        // de quantas em quantas horas a IA mexe nos setores sem dono
    };
  }
  const ITENS_PEDIDO = [
    ['hamburgueres', '🍔 Hambúrgueres'], ['bois', '🐂 Bois prontos'], ['silagem', '🌽 Silagem (t)'], ['viagem', '🚚 Viagem do caminhão'],
    ['insumos', '🍞 Pão, queijo e embalagem'], ['verba', '💵 Verba (R$)'], ['atendentes', '👷 Atendentes'], ['outro', '💬 Outro'],
  ];
  const EVENTOS = {
    seca_forte: { titulo: '☀️ Seca forte', texto: 'Sol forte e nada de chuva: o capim e o milho quase não crescem por 3 dias.', dias: 3 },
    queimada: { titulo: '🔥 Foco de queimada', texto: 'Uma queimada do vizinho chegou na cerca! A Qualidade precisa apagar o foco em até 6 horas.' },
    doenca: { titulo: '🤒 Doença no rebanho', texto: 'Alguns bois ficaram doentes: o Veterinário precisa tratar logo (o boi vacinado resiste).' },
    br364: { titulo: '🚧 BR-364 fechada', texto: 'A estrada fechou por 1 dia: o caminhão não consegue ir do pasto ao frigorífico.', dias: 1 },
    falta_luz: { titulo: '⚡ Falta de luz', texto: 'Caiu a energia: a lanchonete fecha por 4 horas e a câmara fria esquenta (os lotes perdem 1 dia de validade).' },
    fiscalizacao: { titulo: '📋 Fiscalização sanitária', texto: 'A Vigilância Sanitária está chegando: confere a higiene e se há hambúrguer vencido.' },
    avaliacao_ruim: { titulo: '⭐ Avaliação ruim', texto: 'Um cliente deu 1 estrela na internet. O Marketing precisa responder com educação em até 6 horas.' },
    concorrente: { titulo: '🏪 Concorrente novo', texto: 'Abriu uma hamburgueria do lado: menos clientes por 3 dias.', dias: 3 },
    feriado: { titulo: '🎉 Feriado', texto: 'Feriado amanhã: o movimento dobra o dia inteiro!' },
    jogo_brasil: { titulo: '⚽ Jogo do Brasil', texto: 'Jogo do Brasil hoje à noite: das 18h às 21h o movimento triplica!' },
    boleto_falso: { titulo: '🎣 Boleto suspeito', texto: 'Chegou um boleto de fornecedor com dados estranhos. Confira antes de pagar!' },
    combustivel_caro: { titulo: '⛽ Combustível mais caro', texto: 'O diesel subiu: abastecer o caminhão custa 50% a mais por 3 dias.', dias: 3 },
    protesto: { titulo: '✊ Protesto na porta', texto: 'Um grupo da cidade está protestando na porta da lanchonete: vêm menos clientes. Conversem com eles (Marketing ou Diretor) e resolvam o motivo!' },
    boicote: { titulo: '🚫 Boicote', texto: 'A cidade combinou de não comprar da empresa por 1 dia: os clientes caem pela metade.', dias: 1 },
  };
  // Os grupos da cidade: cada um fica de olho num jeito de a empresa agir. A pressão sobe com o que a empresa faz
  // de errado e desce sozinha com o tempo; em 50 eles reclamam, em 80 protestam na porta e em 100 fazem boicote.
  const GRUPOS = {
    ambiente: { nome: 'Ambientalistas', icone: '🌳', cartaz: 'Salve a floresta!', para: 'qualidade', causa: 'mata derrubada, queimada e pasto pelado' },
    saude: { nome: 'Consumidores', icone: '🩺', cartaz: 'Comida segura!', para: 'marketing', causa: 'comida vencida, sujeira e propaganda enganosa' },
    trabalho: { nome: 'Sindicato dos trabalhadores', icone: '👷', cartaz: 'Respeito ao trabalhador!', para: 'rh', causa: 'equipe desanimada, demissão, hora extra e salário atrasado' },
    vizinhos: { nome: 'Vizinhos', icone: '🏘️', cartaz: 'Fila na calçada não!', para: 'gerente', causa: 'fila enorme na calçada e bagunça na porta' },
  };
  const POSTOS = { caixa: { nome: 'Caixa', icone: '🧾' }, chapa: { nome: 'Chapa', icone: '🔥' }, salao: { nome: 'Salão', icone: '🧹' } };
  const NOMES_BOIS = ['Pintado', 'Malhado', 'Trovão', 'Valente', 'Estrela', 'Chuvisco', 'Pipoca', 'Cacau', 'Fubá', 'Paçoca', 'Tição', 'Baio', 'Faísca', 'Coroado', 'Sereno',
    'Cometa', 'Café', 'Biscoito', 'Pirata', 'Tufão', 'Canela', 'Jatobá', 'Ipê', 'Boto', 'Tucumã', 'Açaí', 'Pequi', 'Murici', 'Bacuri', 'Caju', 'Guaraná', 'Cupuaçu'];
  const NOMES_EQUIPE = [['Caio', '👨'], ['Rita', '👩'], ['Davi', '👨'], ['Gabi', '👩'], ['Hugo', '👨'], ['Íris', '👩'], ['Léo', '👨'], ['Mel', '👩'], ['Nando', '👨'], ['Olga', '👵'],
    ['Téo', '👨'], ['Kátia', '👩'], ['Paulo', '👴'], ['Lia', '👩'], ['Fábio', '👨'], ['Duda', '👧']];
  const ROTAS = { pasto_frig: { nome: 'Pasto → Frigorífico', horas: 6 }, frig_loja: { nome: 'Frigorífico → Lanchonete', horas: 2 } };
  // Movimento da lanchonete por hora (clientes com a fama em 60 e o preço de R$ 18).
  const MOVIMENTO = { 10: 6, 11: 18, 12: 30, 13: 22, 14: 8, 15: 6, 16: 6, 17: 10, 18: 22, 19: 30, 20: 26, 21: 12 };
  const LANCHES_POR_BOI = 600;
  const PRECO_REF = 18;
  const CARDAPIO = ['X-Burguer', 'X-Salada', 'X-Bacon', 'X-Tudo', 'Burguer duplo', 'Batata frita', 'Suco de cupuaçu', 'Suco de acerola'];
  const RECEITAS = [['Pão', 'Carne', 'Queijo', 'Pão'], ['Pão', 'Carne', 'Queijo', 'Alface', 'Tomate', 'Pão'], ['Pão', 'Carne', 'Bacon', 'Queijo', 'Pão'], ['Pão', 'Carne', 'Carne', 'Queijo', 'Pão']];
  const PALAVROES = /(^|[^a-zà-ú])(porra|caralho|merda|bosta|puta|puto|fdp|vsf|desgraça|idiota|burro|otário|otario)(?=$|[^a-zà-ú])/gi;
  const limpo = (t) => String(t || '').replace(PALAVROES, (m, antes, p) => antes + '*'.repeat(p.length)).trim().slice(0, 200);
  const lim = (v, a, b) => Math.max(a, Math.min(b, v));
  const arred = (v, c = 0) => Math.round(v * 10 ** c) / 10 ** c;
  const embaralhar = (l, acaso) => l.map((v) => [acaso(), v]).sort((a, b) => a[0] - b[0]).map(([, v]) => v);

  // Reparte as funções ativas entre n alunos (em pedaços seguidos da cadeia); com mais alunos que funções, os que
  // sobram viram a segunda pessoa da lanchonete (caixa, chapeiro...).
  function repartir(funcoes, n) {
    const lista = IDS.filter((f) => funcoes.includes(f));
    if (!n || !lista.length) return [];
    if (n >= lista.length) {
      const grupos = lista.map((f) => [f]);
      const extras = ['caixa', 'chapeiro', 'gerente', 'compras', 'logistica', 'pecuarista'].filter((f) => lista.includes(f));
      for (let i = lista.length; i < n; i++) grupos.push([extras.length ? extras[(i - lista.length) % extras.length] : lista[i % lista.length]]);
      return grupos;
    }
    const grupos = [];
    let ini = 0;
    for (let i = 0; i < n; i++) { const fim = Math.round(((i + 1) * lista.length) / n); grupos.push(lista.slice(ini, fim)); ini = fim; }
    return grupos;
  }

  return function criarNegocio(relogio = () => Date.now(), acaso = Math.random) {
    let partida = null;
    let ultimoId = 0;
    const novoId = (p) => `${p}${++ultimoId}`;

    // ---------- Uma empresa nova ----------
    function novaEmpresa(nome, membros) {
      const nomes = { bois: 0, equipe: 0 };
      const bois = [];
      for (let i = 0; i < 14; i++) bois.push(novoBoi(nomes, arred(12.5 + acaso() * 5, 1), i % 3 !== 0));
      const equipe = [novoAtendente(nomes, 'caixa'), novoAtendente(nomes, 'chapa')];
      return {
        nomes,
        id: novoId('e'), nome, membros: membros || [], falida: false,
        caixa: 30000, emprestimo: 0, fama: 60, moral: 70, natureza: 80,
        roca: { talhoes: [0, 1, 2, 3].map((i) => ({ estado: i < 2 ? 'crescendo' : 'vazio', cresc: i === 0 ? 60 : i === 1 ? 20 : 0, prontoH: 0, foco: false })), silagem: 30, irrigacao: false },
        pasto: { piquetes: [[80, 95], [60, 80], [45, 60], [70, 90]].map(([c, f]) => ({ capim: c, foco: false, novo: false, fert: f, reformaAte: 0 })), ativo: 0, bois, cocho: false, gta: 0, embargoAte: 0, compradosHoje: 0 },
        frig: { bois: 0, arrobas: 0, carne: 900, lotes: [{ qtd: 500, vence: 4 }], producao: 400, higiene: true },
        caminhao: { viagem: null, combustivel: 80 },
        loja: { lotes: [{ qtd: 450, vence: 4 }], pao: 600, queijo: 600, embalagem: 600, preco: 18, aberta: true, atendentes: equipe.length, equipe, fila: 0, promocao: false, fechadaAte: 0, horaExtraAte: 0, treino: 0 },
        escritorio: { contas: [], compras: [], marketing: null, avaliacoes: [], alvara: 0, meta: '', propinaEm: 0, ibamaEm: 0, procon: 0, processoEm: 0 },
        hoje: { vendas: 0, clientes: 0, perdidos: 0, faltou: 0, custos: 0 },
        vozes: { ambiente: 0, saude: 0, trabalho: 0, vizinhos: 0 }, semanas: [],
        dias: [], total: { vendas: 0, custos: 0, clientes: 0, perdidos: 0 },
        pedidos: [], conversa: [], avisos: [], dilemas: [], eventos: [],
        ultimosAvisos: {}, stats: {},
      };
    }
    function novoBoi(nomes, peso, vacinado) {
      const k = nomes.bois++, base = NOMES_BOIS[k % NOMES_BOIS.length], volta = Math.floor(k / NOMES_BOIS.length);
      return { id: novoId('b'), nome: volta ? `${base} ${volta + 1}` : base, peso, doente: false, vacinado: !!vacinado, doenteH: 0, separado: false };
    }
    function novoAtendente(nomes, posto) {
      const k = nomes.equipe++, [nome, icone] = NOMES_EQUIPE[k % NOMES_EQUIPE.length];
      return { id: novoId('t'), nome: k >= NOMES_EQUIPE.length ? `${nome} ${Math.floor(k / NOMES_EQUIPE.length) + 1}` : nome, icone, posto, ajuste: 0, base: Math.round((acaso() - 0.5) * 20), elogioDia: 0 };
    }
    const agoraJogo = () => (partida ? partida.horas : 0);
    const diaDe = (h) => Math.floor(h / 24) + 1;
    const horaDe = (h) => Math.floor(h) % 24;
    const temPartida = () => { if (!partida) throw new Error('O professor ainda não abriu o jogo.'); return partida; };
    function estacao(dia, total = partida.dias) {
      const f = (dia - 1) / Math.max(1, total);
      return f < 0.25 ? 'chuva' : f < 0.8 ? 'seca' : 'chuva';
    }
    const inicioSeca = () => Math.floor(partida.dias * 0.25) + 1;
    const fimSeca = () => Math.floor(partida.dias * 0.8) + 1;
    const ativa = (e, nome) => e.eventos.some((v) => v.tipo === nome && v.ate > agoraJogo());
    const custo = (e, valor, motivo) => { e.caixa -= valor; e.hoje.custos += valor; e.total.custos += valor; if (motivo) registrar(e, motivo); };
    function registrar(e, texto, para) { e.avisos.push({ id: novoId('a'), texto, para: para || null, nivel: 'info', em: agoraJogo() }); if (e.avisos.length > 60) e.avisos.splice(0, e.avisos.length - 60); }
    // O Professor Virtual: avisa (sem repetir o mesmo aviso antes de "intervalo" horas)
    function avisar(e, chave, para, texto, nivel = 'importante', intervalo = 12) {
      const p = params(partida.nivel);
      if (p.dicas === 'urgentes' && nivel !== 'urgente') return;
      if (p.dicas === 'importantes' && nivel === 'dica') return;
      const ult = e.ultimosAvisos[chave];
      if (ult != null && agoraJogo() - ult < intervalo) return;
      e.ultimosAvisos[chave] = agoraJogo();
      e.avisos.push({ id: novoId('a'), texto, para: para || null, nivel, em: agoraJogo(), professor: true });
      if (e.avisos.length > 60) e.avisos.splice(0, e.avisos.length - 60);
    }
    const humano = (e, funcao) => partida.ativas.includes(funcao) && (partida.modo === 'cada' || e.membros.some((m) => (partida.funcoesDe[m] || []).includes(funcao)));
    const estoqueLoja = (e) => e.loja.lotes.reduce((s, l) => s + l.qtd, 0);
    const estoqueFrig = (e) => e.frig.lotes.reduce((s, l) => s + l.qtd, 0);
    // Prontos para viajar: com 18 arrobas, ou separados pelo Pecuarista com 15 ou mais (rendem menos hambúrguer).
    const prontos = (e) => e.pasto.bois.filter((b) => !b.doente && (b.peso >= 18 || (b.separado && b.peso >= 15))).sort((a, b) => (b.separado - a.separado) || (b.peso - a.peso));
    const animoDe = (e, t) => Math.round(lim(e.moral + t.base + t.ajuste, 0, 100));
    function capacidadeDe(e, t) { return (10 + e.loja.treino * 2) * (0.7 + 0.5 * animoDe(e, t) / 100); }
    // Quantos clientes por hora a lanchonete atende: o caixa registra e a chapa faz; o mais lento manda (o gargalo).
    function capacidadeLoja(e) {
      let cx = 0, ch = 0;
      for (const t of e.loja.equipe) { if (t.posto === 'caixa') cx += capacidadeDe(e, t); else if (t.posto === 'chapa') ch += capacidadeDe(e, t); }
      // quem sobra num posto ajuda o outro só de vez em quando; sozinho(s) num posto só, fazem tudo devagar
      const base = cx > 0 && ch > 0 ? 2 * Math.min(cx, ch) + 0.35 * Math.abs(cx - ch) : (cx + ch) * 0.7;
      const gargalo = cx > 0 && ch > 0 ? (cx < ch * 0.7 ? 'caixa' : ch < cx * 0.7 ? 'chapa' : null) : cx > 0 ? 'chapa' : ch > 0 ? 'caixa' : null;
      return { total: base, caixa: cx, chapa: ch, gargalo };
    }
    const noSalao = (e) => e.loja.equipe.filter((t) => t.posto === 'salao').length;
    function pressao(e, grupo, v) { e.vozes[grupo] = lim(e.vozes[grupo] + v, 0, 100); }
    const protestando = (e, grupo, h = agoraJogo()) => e.eventos.some((x) => x.tipo === 'protesto' && x.grupo === grupo && !x.resolvido && h >= x.em && h < x.ate);
    function tirarDosLotes(lotes, qtd) { // FIFO: o mais velho primeiro; devolve os vencidos que saíram
      let resta = qtd, vencidos = 0;
      lotes.sort((a, b) => a.vence - b.vence);
      for (const l of lotes) { if (!resta) break; const q = Math.min(l.qtd, resta); l.qtd -= q; resta -= q; if (l.vence < diaDe(agoraJogo())) vencidos += q; }
      for (let i = lotes.length - 1; i >= 0; i--) if (lotes[i].qtd <= 0) lotes.splice(i, 1);
      return { tirou: qtd - resta, vencidos };
    }
    function novoEvento(e, tipo, extra = {}) {
      const d = EVENTOS[tipo]; if (!d) throw new Error('Evento desconhecido.');
      const h = agoraJogo();
      const ev = { id: novoId('v'), tipo, titulo: d.titulo, texto: d.texto, em: h, ate: h + (d.dias || 1) * 24, ...extra };
      if (tipo === 'queimada') {
        const ondes = [...e.pasto.piquetes.map((p, i) => ['piquete', i]).filter(([, i]) => !e.pasto.piquetes[i].foco), ...e.roca.talhoes.map((t, i) => ['talhao', i]).filter(([, i]) => !e.roca.talhoes[i].foco)];
        if (!ondes.length) return null;
        const [onde, i] = ondes[Math.floor(acaso() * ondes.length)];
        (onde === 'piquete' ? e.pasto.piquetes[i] : e.roca.talhoes[i]).foco = true;
        Object.assign(ev, { onde, i, ate: h + 6, texto: `${d.texto} (${onde === 'piquete' ? `piquete ${i + 1} do pasto` : `talhão ${i + 1} da roça`})` });
      }
      if (tipo === 'doenca') {
        const alvo = embaralhar(e.pasto.bois.filter((b) => !b.doente), acaso).sort((a, b) => a.vacinado - b.vacinado).slice(0, 3);
        alvo.forEach((b, k) => { if (!b.vacinado || k === 0) { b.doente = true; b.doenteH = 0; } });
      }
      if (tipo === 'falta_luz') { e.loja.fechadaAte = Math.max(e.loja.fechadaAte, h + 4); for (const l of [...e.loja.lotes, ...e.frig.lotes]) l.vence -= 1; ev.ate = h + 4; }
      if (tipo === 'fiscalizacao') { ev.ate = h + 3; }
      if (tipo === 'avaliacao_ruim') { e.escritorio.avaliacoes.push({ id: novoId('r'), estrelas: 1, texto: 'Demorou demais e o lanche veio frio. Não volto mais!', respondida: false, em: h, prazo: h + 6 }); }
      if (tipo === 'feriado') { ev.em = (diaDe(h)) * 24; ev.ate = ev.em + 24; }
      if (tipo === 'jogo_brasil') { const d0 = (diaDe(h) - 1) * 24; ev.em = d0 + 18; ev.ate = d0 + 21; if (horaDe(h) >= 21) { ev.em += 24; ev.ate += 24; } }
      if (tipo === 'protesto' || tipo === 'boicote') {
        const grupo = GRUPOS[extra.grupo] ? extra.grupo : Object.keys(GRUPOS).sort((a, b) => e.vozes[b] - e.vozes[a])[0];
        const gr = GRUPOS[grupo];
        Object.assign(ev, { grupo, titulo: `${d.titulo}: ${gr.icone} ${gr.nome}`, texto: tipo === 'protesto' ? `${gr.icone} ${gr.nome} na porta com cartazes ("${gr.cartaz}"), por causa de ${gr.causa}. Menos clientes até alguém conversar com eles (Marketing ou Diretor) ou por 6 horas.` : `${gr.icone} ${gr.nome} pediram para a cidade não comprar da empresa hoje (${gr.causa}). Os clientes caem pela metade.`, ate: h + (tipo === 'protesto' ? 6 : 24) });
        if (tipo === 'protesto') e.vozes[grupo] = Math.max(e.vozes[grupo], 80);
      }
      if (tipo === 'boleto_falso') e.escritorio.contas.push({ id: novoId('c'), nome: 'Fornecedor "Pão Bom" (boleto novo, CNPJ diferente)', valor: 4800, vence: diaDe(h) + 1, paga: false, falsa: true });
      e.eventos.push(ev);
      if (e.eventos.length > 40) e.eventos.splice(0, e.eventos.length - 40);
      e.avisos.push({ id: novoId('a'), texto: `${d.titulo}: ${ev.texto}`, para: null, nivel: 'urgente', em: h, evento: true });
      return ev;
    }
    function novoDilema(e, tipo) {
      if (e.dilemas.some((d) => d.tipo === tipo && !d.escolha)) return;
      const DIL = {
        desmatar: { para: 'qualidade', titulo: '🌳 Derrubar a mata?', texto: 'O pasto está fraco. Um vizinho sugere derrubar 10 hectares de mata para abrir pasto novo. A lei manda guardar a reserva legal da Amazônia.', opcoes: [['derrubar', 'Derrubar a mata (pasto novo na hora)'], ['nao', 'Não derrubar: fazer rodízio e silagem']] },
        racao_barata: { para: 'pecuarista', titulo: '🌽 Ração barata sem nota?', texto: 'Um vendedor oferece 10 t de ração pela metade do preço, sem nota fiscal e sem dizer de onde vem.', opcoes: [['barata', 'Comprar a barata (R$ 500)'], ['nota', 'Comprar com nota (R$ 1.500)'], ['nenhuma', 'Não comprar']] },
        carne_vencida: { para: 'frigorifico', titulo: '🥩 Lote vencido', texto: 'Um lote de hambúrguer venceu. Mandar para a lanchonete assim mesmo? Ninguém vai perceber...', opcoes: [['usar', 'Mandar assim mesmo'], ['descartar', 'Jogar fora (perde o lote)']] },
        hora_extra: { para: 'rh', titulo: '⏰ Hora extra', texto: 'A equipe trabalhou 3 horas a mais no pico. Pagar a hora extra?', opcoes: [['pagar', 'Pagar (R$ 600)'], ['nao', 'Não pagar']] },
        jeitinho: { para: 'qualidade', titulo: '🤝 O "jeitinho"', texto: 'O fiscal achou problema e diz que, por R$ 2.000 "por fora", esquece a multa.', opcoes: [['aceitar', 'Aceitar o jeitinho'], ['recusar', 'Recusar e pagar a multa certa']] },
      };
      const d = DIL[tipo]; if (!d) return;
      e.dilemas.push({ id: novoId('d'), tipo, para: d.para, titulo: d.titulo, texto: d.texto, opcoes: d.opcoes.map(([id, rotulo]) => ({ id, rotulo })), em: agoraJogo(), prazo: agoraJogo() + 8, escolha: null });
    }
    function resolverDilema(e, d, escolha, quem) {
      d.escolha = escolha; d.por = quem || 'IA';
      const h = agoraJogo();
      if (d.tipo === 'desmatar') {
        if (escolha === 'derrubar') { e.pasto.piquetes.push({ capim: 100, foco: false, novo: true, fert: 70, reformaAte: 0 }); e.natureza = lim(e.natureza - 35, 0, 100); pressao(e, 'ambiente', 35); e.escritorio.ibamaEm = h + 36; registrar(e, '🪓 A mata foi derrubada para pasto novo. A natureza sentiu (e o solo da Amazônia, sem a floresta, cansa rápido).'); }
        else { e.natureza = lim(e.natureza + 5, 0, 100); pressao(e, 'ambiente', -10); registrar(e, '🌳 A mata ficou em pé. Rodízio do pasto, reforma e silagem resolvem.'); }
      } else if (d.tipo === 'racao_barata') {
        if (escolha === 'barata') { custo(e, 500); e.roca.silagem += 10; if (acaso() < 0.6) e.escritorio.racaoRuimEm = h + 24; }
        else if (escolha === 'nota') { custo(e, 1500); e.roca.silagem += 10; }
      } else if (d.tipo === 'carne_vencida') {
        const vencidos = e.frig.lotes.filter((l) => l.vence < diaDe(h));
        if (escolha === 'usar') { for (const l of vencidos) { e.loja.lotes.push({ qtd: l.qtd, vence: l.vence }); l.qtd = 0; } e.escritorio.vencidaNaLoja = true; }
        else for (const l of vencidos) l.qtd = 0;
        e.frig.lotes = e.frig.lotes.filter((l) => l.qtd > 0);
      } else if (d.tipo === 'hora_extra') {
        if (escolha === 'pagar') { custo(e, 600); e.moral = lim(e.moral + 10, 0, 100); pressao(e, 'trabalho', -10); }
        else { e.moral = lim(e.moral - 25, 0, 100); pressao(e, 'trabalho', 30); if (params(partida.nivel).falencia) e.escritorio.processoEm = h + 48; }
      } else if (d.tipo === 'jeitinho') {
        if (escolha === 'aceitar') { custo(e, 2000); e.escritorio.propinaEm = h + 24; }
        else { custo(e, 3000, '🧾 Multa da fiscalização paga do jeito certo. Honestidade conta pontos com a cidade.'); e.fama = lim(e.fama + 5, 0, 100); }
      }
    }

    // ---------- A IA: faz as funções sem dono (simples e mediana) ----------
    function ia(e, h) {
      const p = params(partida.nivel);
      if (Math.floor(h) % p.iaAtraso) return;
      const faz = (f) => { try { f(); } catch (erro) { /* recusou (sem dinheiro, estrada fechada...): tenta de novo depois */ } };
      const seca = estacao(diaDe(h)) === 'seca';
      if (!humano(e, 'agricultor')) {
        e.roca.talhoes.forEach((t, i) => { if (t.estado === 'pronto') faz(() => acoes.agricultor.colher(e, { talhao: i })); else if (t.estado === 'vazio' && e.caixa > 3000 && (!seca || e.roca.irrigacao)) faz(() => acoes.agricultor.plantar(e, { talhao: i })); });
        if (seca && !e.roca.irrigacao && e.caixa > 12000) e.roca.irrigacao = true;
      }
      if (!humano(e, 'pecuarista')) {
        const pq = e.pasto.piquetes;
        const nota = (x) => (x.foco || x.reformaAte > h ? -1 : x.capim + x.fert * 0.3);
        if (pq[e.pasto.ativo].capim < 20) { const melhor = pq.reduce((m, x, i) => (nota(x) > nota(pq[m]) ? i : m), 0); if (nota(pq[melhor]) >= 0) e.pasto.ativo = melhor; }
        const cansado = pq.findIndex((x, i) => i !== e.pasto.ativo && x.fert < 35 && !(x.reformaAte > h) && !x.foco);
        if (cansado >= 0 && e.caixa > 12000) faz(() => acoes.pecuarista.reformar(e, { i: cansado }));
        e.pasto.cocho = pq[e.pasto.ativo].capim < 20 && e.roca.silagem > 0;
        if (e.pasto.bois.length < 10 && e.caixa > 15000 && h > e.pasto.embargoAte && diaDe(h) < partida.dias - 8) faz(() => acoes.pecuarista.comprar(e, { qtd: 5 }));
      }
      if (!humano(e, 'veterinario')) {
        if (e.pasto.bois.some((b) => !b.vacinado) && e.caixa > 2000) faz(() => acoes.veterinario.vacinar(e, {}));
        if (e.pasto.bois.some((b) => b.doente)) faz(() => acoes.veterinario.tratar(e, {}));
        if (prontos(e).length > e.pasto.gta) faz(() => acoes.veterinario.gta(e, {}));
      }
      if (!humano(e, 'logistica') && !e.caminhao.viagem) {
        if (e.caminhao.combustivel < 30) faz(() => acoes.logistica.abastecer(e, {}));
        const nBois = Math.min(6, e.pasto.gta, prontos(e).length);
        if (estoqueFrig(e) >= 200 && estoqueLoja(e) < 500) faz(() => acoes.logistica.viajar(e, { rota: 'frig_loja', qtd: Math.min(1500, estoqueFrig(e)) }));
        else if (nBois >= 2 && e.frig.carne < 1200) faz(() => acoes.logistica.viajar(e, { rota: 'pasto_frig', qtd: nBois }));
      }
      if (!humano(e, 'frigorifico')) {
        if (e.frig.bois > 0) faz(() => acoes.frigorifico.abater(e, { qtd: e.frig.bois }));
        if (e.frig.lotes.some((l) => l.vence < diaDe(h))) faz(() => acoes.frigorifico.descartar(e, {}));
        e.frig.higiene = true;
      }
      if (!humano(e, 'compras')) {
        if (Math.min(e.loja.pao, e.loja.queijo, e.loja.embalagem) < 350 && !e.escritorio.compras.some((c) => !c.chegou)) faz(() => acoes.compras.comprar(e, { qtd: 800 }));
        for (const c of e.escritorio.contas) if (c.falsa && !c.paga && !c.recusada) c.recusada = true;
      }
      if (!humano(e, 'gerente')) {
        e.loja.aberta = true; if (e.loja.preco < 14 || e.loja.preco > 24) e.loja.preco = 18;
        // reparte a equipe: metade no caixa, metade na chapa; quem sobra (número ímpar) vai para o salão
        const eq = e.loja.equipe, sal = eq.length >= 3 && eq.length % 2 ? 1 : 0, cx = Math.ceil((eq.length - sal) / 2);
        eq.forEach((t, i) => { t.posto = i < sal ? 'salao' : i < sal + cx ? 'caixa' : 'chapa'; });
      }
      if (!humano(e, 'marketing')) for (const a of e.escritorio.avaliacoes) if (!a.respondida && h - a.em >= 3) faz(() => acoes.marketing.responder(e, { id: a.id, resposta: 'educada' }));
      if (!humano(e, 'rh') && horaDe(h) === 9) {
        const ontem = e.dias[e.dias.length - 1];
        if (ontem && ontem.perdidos > 40 && e.loja.atendentes < 5 && e.caixa > 8000) faz(() => acoes.rh.contratar(e, {}));
        const triste = e.loja.equipe.slice().sort((a, b) => animoDe(e, a) - animoDe(e, b))[0];
        if (triste && animoDe(e, triste) < 40 && e.caixa > 3000) faz(() => acoes.rh.elogiar(e, { id: triste.id }));
      }
      if (!humano(e, 'marketing') && !humano(e, 'diretor')) for (const ev of e.eventos) if (ev.tipo === 'protesto' && !ev.resolvido && h < ev.ate && h - ev.em >= 2) faz(() => acoes.marketing.dialogar(e, { grupo: ev.grupo }));
      if (!humano(e, 'qualidade')) {
        for (const ev of e.eventos) if (ev.tipo === 'queimada' && !ev.resolvido && h - ev.em >= 3) faz(() => acoes.qualidade.combater(e, { id: ev.id }));
        if (e.escritorio.alvara && e.escritorio.alvara - diaDe(h) <= 1) faz(() => acoes.qualidade.alvara(e, {}));
        e.loja.lotes.filter((l) => l.vence < diaDe(h)).forEach((l) => { l.qtd = 0; });
      }
      if (!humano(e, 'financeiro')) {
        for (const c of e.escritorio.contas) if (!c.paga && !c.recusada && !c.falsa && c.vence <= diaDe(h)) faz(() => acoes.financeiro.pagar(e, { id: c.id }));
        if (e.caixa < 0 && e.emprestimo < 30000) faz(() => acoes.financeiro.emprestimo(e, { valor: 10000 }));
      }
      for (const d of e.dilemas) if (!d.escolha && !humano(e, d.para) && !humano(e, 'diretor')) {
        const certa = { desmatar: 'nao', racao_barata: 'nota', carne_vencida: 'descartar', hora_extra: 'pagar', jeitinho: 'recusar' }[d.tipo];
        if (h - d.em >= 2) resolverDilema(e, d, certa, null);
      }
    }

    // ---------- As ações de cada função (as mesmas para o aluno e para a IA) ----------
    const acoes = {
      agricultor: {
        plantar(e, { talhao }) {
          const t = e.roca.talhoes[talhao]; if (!t) throw new Error('Talhão não existe.');
          if (t.estado !== 'vazio') throw new Error('Esse talhão não está vazio.');
          if (t.foco) throw new Error('Esse talhão está pegando fogo!');
          custo(e, 600); Object.assign(t, { estado: 'crescendo', cresc: 0 });
        },
        colher(e, { talhao }) {
          const t = e.roca.talhoes[talhao]; if (!t || t.estado !== 'pronto') throw new Error('O milho desse talhão ainda não está pronto.');
          custo(e, 200); e.roca.silagem = arred(e.roca.silagem + (t.passou ? 4 : 8), 1); Object.assign(t, { estado: 'vazio', cresc: 0, passou: false });
        },
        irrigar(e, { ligar }) { e.roca.irrigacao = !!ligar; },
      },
      pecuarista: {
        piquete(e, { i }) {
          const q = e.pasto.piquetes[i]; if (!q) throw new Error('Piquete não existe.');
          if (q.foco) throw new Error('Esse piquete está pegando fogo!');
          if (q.reformaAte > agoraJogo()) throw new Error('Esse piquete está em reforma: o capim novo ainda está nascendo.');
          e.pasto.ativo = i;
        },
        // Reforma do pasto cansado: adubo, calcário e semente; o piquete fica 1 dia sem gado e o solo volta a ficar forte.
        reformar(e, { i }) {
          const q = e.pasto.piquetes[i]; if (!q) throw new Error('Piquete não existe.');
          if (i === e.pasto.ativo) throw new Error('Tire o rebanho desse piquete antes de reformar.');
          if (q.reformaAte > agoraJogo()) throw new Error('Esse piquete já está em reforma.');
          if (q.fert >= 85) throw new Error('O solo desse piquete ainda está bom: não precisa reformar.');
          custo(e, 2500); q.reformaAte = agoraJogo() + 24; pressao(e, 'ambiente', -15);
        },
        // Separar um boi para o frigorífico: vai primeiro no caminhão (com 15 arrobas ou mais já pode ir, mas rende menos).
        separar(e, { id }) {
          const b = e.pasto.bois.find((x) => x.id === id); if (!b) throw new Error('Esse boi não está no pasto.');
          if (!b.separado && b.doente) throw new Error(`O ${b.nome} está doente: precisa ser tratado antes.`);
          if (!b.separado && b.peso < 15) throw new Error(`O ${b.nome} tem só ${arred(b.peso, 1)} arrobas: ainda é magro demais (mínimo 15).`);
          b.separado = !b.separado;
        },
        cocho(e, { ligar }) { if (ligar && e.roca.silagem <= 0) throw new Error('Não tem silagem guardada.'); e.pasto.cocho = !!ligar; },
        comprar(e, { qtd }) {
          const n = lim(Math.round(Number(qtd) || 1), 1, 10);
          if (agoraJogo() < e.pasto.embargoAte) throw new Error('O pasto está embargado pelo IBAMA: não pode comprar gado agora.');
          if (e.pasto.bois.length + n > 40) throw new Error('O pasto não aguenta mais que 40 bois.');
          custo(e, n * 2200);
          for (let i = 0; i < n; i++) e.pasto.bois.push(novoBoi(e.nomes, 12, false));
        },
        racao(e) { novoDilema(e, 'racao_barata'); },
      },
      veterinario: {
        vacinar(e, { id } = {}) { const l = e.pasto.bois.filter((b) => !b.vacinado && (!id || b.id === id)); if (!l.length) throw new Error(id ? 'Esse boi já está vacinado.' : 'Todo o rebanho já está vacinado.'); custo(e, l.length * 40); l.forEach((b) => { b.vacinado = true; }); },
        tratar(e, { id } = {}) { const d = e.pasto.bois.filter((b) => b.doente && (!id || b.id === id)); if (!d.length) throw new Error('Nenhum boi doente.'); custo(e, d.length * 150); d.forEach((b) => { b.doente = false; b.doenteH = 0; }); },
        gta(e) { const n = prontos(e).length - e.pasto.gta; if (n <= 0) throw new Error('Não há boi pronto sem guia.'); custo(e, n * 20); e.pasto.gta += n; },
      },
      logistica: {
        viajar(e, { rota, qtd }) {
          const r = ROTAS[rota]; if (!r) throw new Error('Rota desconhecida.');
          if (e.caminhao.viagem) throw new Error('O caminhão já está viajando.');
          if (e.caminhao.combustivel < 15) throw new Error('Sem combustível: abasteça antes.');
          if (rota === 'pasto_frig' && ativa(e, 'br364')) throw new Error('A BR-364 está fechada hoje.');
          let carga, arrobas = 0, nomes = null;
          if (rota === 'pasto_frig') {
            const n = lim(Math.round(Number(qtd) || 0), 1, 6);
            const lista = prontos(e).slice(0, Math.min(n, e.pasto.gta));
            if (!lista.length) throw new Error(prontos(e).length ? 'Os bois prontos ainda não têm a guia (GTA) do Veterinário.' : 'Não há boi pronto (18 arrobas) no pasto.');
            e.pasto.bois = e.pasto.bois.filter((b) => !lista.includes(b)); e.pasto.gta -= lista.length; carga = lista.length;
            arrobas = arred(lista.reduce((s, b) => s + b.peso, 0), 1); nomes = lista.map((b) => b.nome);
          } else {
            const n = lim(Math.round(Number(qtd) || 0), 1, 1500);
            if (!estoqueFrig(e)) throw new Error('A câmara fria do frigorífico está vazia.');
            const lotes = []; let resta = n;
            e.frig.lotes.sort((a, b) => a.vence - b.vence);
            for (const l of e.frig.lotes) { if (!resta) break; const q = Math.min(l.qtd, resta); lotes.push({ qtd: q, vence: l.vence }); l.qtd -= q; resta -= q; }
            e.frig.lotes = e.frig.lotes.filter((l) => l.qtd > 0); carga = lotes;
          }
          e.caminhao.combustivel -= 15;
          e.caminhao.viagem = { rota, carga, sai: agoraJogo(), chega: agoraJogo() + r.horas, ...(rota === 'pasto_frig' ? { arrobas, nomes } : {}) };
        },
        abastecer(e) { custo(e, Math.round((100 - e.caminhao.combustivel) * 8 * (ativa(e, 'combustivel_caro') ? 1.5 : 1))); e.caminhao.combustivel = 100; },
      },
      frigorifico: {
        abater(e, { qtd }) {
          const n = lim(Math.round(Number(qtd) || e.frig.bois), 1, e.frig.bois || 1); if (!e.frig.bois) throw new Error('Não chegou boi no frigorífico.');
          const media = e.frig.arrobas / e.frig.bois || 18; // o boi mais leve rende menos hambúrguer
          e.frig.bois -= n; e.frig.arrobas = Math.max(0, arred(e.frig.arrobas - n * media, 1)); e.frig.carne += Math.round(n * LANCHES_POR_BOI * Math.min(1.1, media / 18)); custo(e, n * 150);
        },
        producao(e, { qtd }) { e.frig.producao = lim(Math.round(Number(qtd) || 0), 0, 1200); },
        higiene(e, { ligar }) { e.frig.higiene = !!ligar; },
        descartar(e) { const v = e.frig.lotes.filter((l) => l.vence < diaDe(agoraJogo())); if (!v.length) throw new Error('Não há lote vencido.'); e.frig.lotes = e.frig.lotes.filter((l) => !v.includes(l)); },
      },
      compras: {
        comprar(e, { qtd }) { const n = lim(Math.round(Number(qtd) || 0), 100, 3000); custo(e, n * 3); e.escritorio.compras.push({ id: novoId('p'), qtd: n, chega: agoraJogo() + 14, chegou: false }); },
        recusar(e, { id }) { const c = e.escritorio.contas.find((x) => x.id === id); if (!c) throw new Error('Conta não encontrada.'); c.recusada = true; if (c.falsa) registrar(e, '🛡️ Compras recusou o boleto falso. Golpe evitado!'); },
      },
      chapeiro: { lanche(e) { return atenderNaMao(e, 'chapeiro'); } },
      caixa: { atender(e) { return atenderNaMao(e, 'caixa'); } },
      gerente: {
        // Mudar alguém de posto: caixa (registra), chapa (faz o lanche) ou salão (cuida da fila e da limpeza)
        posto(e, { id, posto }) {
          const t = e.loja.equipe.find((x) => x.id === id); if (!t) throw new Error('Essa pessoa não trabalha aqui.');
          if (!POSTOS[posto]) throw new Error('Escolha caixa, chapa ou salão.');
          t.posto = posto;
        },
        preco(e, { valor }) { e.loja.preco = lim(arred(Number(valor) || PRECO_REF, 1), 8, 40); },
        abrir(e, { aberta }) { e.loja.aberta = !!aberta; },
        promocao(e, { ligar }) { e.loja.promocao = !!ligar; },
      },
      marketing: {
        campanha(e, { tipo }) {
          if (tipo !== 'honesta' && tipo !== 'enganosa') throw new Error('Escolha a campanha.');
          custo(e, tipo === 'honesta' ? 1200 : 600);
          e.escritorio.marketing = { tipo, ate: agoraJogo() + 72 };
          if (tipo === 'enganosa' && acaso() < 0.6) e.escritorio.procon = agoraJogo() + 24;
        },
        dialogar(e, { grupo }) { return dialogar(e, grupo); },
        responder(e, { id, resposta }) {
          const a = e.escritorio.avaliacoes.find((x) => x.id === id); if (!a) throw new Error('Avaliação não encontrada.');
          if (a.respondida) throw new Error('Essa avaliação já foi respondida.');
          a.respondida = resposta === 'educada' ? 'educada' : 'grossa';
          e.fama = lim(e.fama + (a.respondida === 'educada' ? 6 : -12), 0, 100); pressao(e, 'saude', a.respondida === 'educada' ? -5 : 10);
        },
      },
      rh: {
        contratar(e, { posto } = {}) {
          if (e.loja.equipe.length >= 8) throw new Error('A lanchonete não cabe mais atendentes.');
          const c = capacidadeLoja(e), onde = POSTOS[posto] ? posto : c.caixa <= c.chapa ? 'caixa' : 'chapa';
          custo(e, 400); const t = novoAtendente(e.nomes, onde); e.loja.equipe.push(t); e.loja.atendentes = e.loja.equipe.length;
          registrar(e, `👋 ${t.nome} foi contratado(a) para ${POSTOS[onde].nome.toLowerCase() === 'salão' ? 'o salão' : `a ${POSTOS[onde].nome.toLowerCase()}`}.`);
          return { id: t.id, nome: t.nome };
        },
        demitir(e, { id } = {}) {
          if (e.loja.equipe.length <= 1) throw new Error('A lanchonete precisa de pelo menos 1 atendente.');
          const t = id ? e.loja.equipe.find((x) => x.id === id) : e.loja.equipe.slice().sort((a, b) => animoDe(e, a) - animoDe(e, b))[0];
          if (!t) throw new Error('Essa pessoa não trabalha aqui.');
          custo(e, 800); e.loja.equipe = e.loja.equipe.filter((x) => x !== t); e.loja.atendentes = e.loja.equipe.length;
          e.moral = lim(e.moral - 8, 0, 100); pressao(e, 'trabalho', 12);
          registrar(e, `📤 ${t.nome} foi demitido(a). A equipe ficou abalada.`);
        },
        // Elogiar alguém (com um bônus e a medalha de destaque): o ânimo dessa pessoa sobe bastante; uma vez por dia.
        elogiar(e, { id } = {}) {
          const t = e.loja.equipe.find((x) => x.id === id); if (!t) throw new Error('Essa pessoa não trabalha aqui.');
          const dia = diaDe(agoraJogo());
          if (t.elogioDia === dia) throw new Error(`${t.nome} já foi elogiado(a) hoje.`);
          custo(e, 150); t.elogioDia = dia; t.ajuste = Math.min(40, t.ajuste + 25); e.moral = lim(e.moral + 2, 0, 100);
        },
        treinar(e) { custo(e, 700); e.loja.treino = Math.min(3, e.loja.treino + 1); e.moral = lim(e.moral + 6, 0, 100); pressao(e, 'trabalho', -8); },
        horaExtra(e) { custo(e, 300); e.loja.horaExtraAte = agoraJogo() + 2; e.moral = lim(e.moral + 2, 0, 100); },
        folga(e) { custo(e, 500); e.moral = lim(e.moral + 12, 0, 100); pressao(e, 'trabalho', -8); },
      },
      qualidade: {
        combater(e, { id }) {
          const ev = e.eventos.find((x) => x.id === id && x.tipo === 'queimada' && !x.resolvido) || e.eventos.find((x) => x.tipo === 'queimada' && !x.resolvido);
          if (!ev) throw new Error('Não há foco de queimada.');
          ev.resolvido = true; custo(e, 300);
          (ev.onde === 'piquete' ? e.pasto.piquetes[ev.i] : e.roca.talhoes[ev.i]).foco = false;
        },
        alvara(e) { custo(e, 800); e.escritorio.alvara = diaDe(agoraJogo()) + 15; },
        desmatar(e) { novoDilema(e, 'desmatar'); },
      },
      financeiro: {
        pagar(e, { id }) {
          const c = e.escritorio.contas.find((x) => x.id === id); if (!c || c.paga) throw new Error('Conta não encontrada.');
          if (c.recusada) throw new Error('Essa conta foi recusada.');
          const multa = c.vence < diaDe(agoraJogo()) ? Math.round(c.valor * 0.1) : 0;
          custo(e, c.valor + multa); c.paga = true;
          if (c.falsa) { registrar(e, '🎣 Caiu no golpe: o boleto era falso e o dinheiro foi para um golpista. Sempre confira o CNPJ e o fornecedor!'); e.fama = lim(e.fama - 3, 0, 100); }
          if (c.tipo === 'salarios') c.atrasoAvisado = true;
        },
        emprestimo(e, { valor }) { const v = lim(Math.round(Number(valor) || 10000), 1000, 50000); if (e.emprestimo + v > 60000) throw new Error('O banco não empresta mais que R$ 60.000.'); e.emprestimo += v; e.caixa += v; },
        quitar(e, { valor }) { const v = Math.min(e.emprestimo, lim(Math.round(Number(valor) || e.emprestimo), 1, 1e9)); if (!v) throw new Error('Não há empréstimo.'); if (e.caixa < v) throw new Error('Não tem dinheiro para pagar agora.'); e.caixa -= v; e.emprestimo -= v; },
      },
      diretor: { meta(e, { texto }) { e.escritorio.meta = limpo(texto).slice(0, 120); }, dialogar(e, { grupo }) { return dialogar(e, grupo); } },
    };
    // Conversar com um grupo da cidade: uma reunião (R$ 500) acalma o protesto, mas se o motivo continuar, eles voltam.
    function dialogar(e, grupo) {
      const gr = GRUPOS[grupo]; if (!gr) throw new Error('Com qual grupo?');
      if (e.vozes[grupo] < 30 && !protestando(e, grupo)) throw new Error(`${gr.nome} estão tranquilos agora.`);
      custo(e, 500); pressao(e, grupo, -30);
      for (const ev of e.eventos) if (ev.tipo === 'protesto' && ev.grupo === grupo && !ev.resolvido) { ev.resolvido = true; ev.ate = Math.min(ev.ate, agoraJogo()); }
      registrar(e, `🤝 Reunião com ${gr.icone} ${gr.nome}: a empresa ouviu e prometeu melhorar (${gr.causa}). Se nada mudar, eles voltam!`);
      return { grupo };
    }
    // Caixa e chapeiro "na mão": cada pedido digitado (ou lanche montado) atende um cliente da fila.
    function atenderNaMao(e, quem) {
      if (!e.loja.aberta || agoraJogo() < e.loja.fechadaAte) throw new Error('A lanchonete está fechada.');
      if (e.loja.fila < 1) throw new Error('Não tem ninguém na fila agora.');
      if (estoqueLoja(e) < 1 || e.loja.pao < 1 || e.loja.queijo < 1 || e.loja.embalagem < 1) throw new Error('Faltam ingredientes na lanchonete!');
      e.loja.fila -= 1;
      vender(e, 1);
      e.fama = lim(e.fama + 0.15, 0, 100);
      return { atendido: quem };
    }
    function vender(e, n) {
      const t = tirarDosLotes(e.loja.lotes, n);
      e.loja.pao -= t.tirou; e.loja.queijo -= t.tirou; e.loja.embalagem -= t.tirou;
      const preco = e.loja.preco * (e.loja.promocao ? 0.85 : 1);
      e.caixa += t.tirou * preco; e.hoje.vendas += t.tirou * preco; e.total.vendas += t.tirou * preco;
      e.hoje.clientes += t.tirou; e.total.clientes += t.tirou;
      if (t.vencidos > 0 && acaso() < Math.min(0.9, t.vencidos / 30)) passouMal(e);
      return t.tirou;
    }
    function passouMal(e) {
      if (e.escritorio.passouMalEm && agoraJogo() - e.escritorio.passouMalEm < 24) return;
      e.escritorio.passouMalEm = agoraJogo();
      e.fama = lim(e.fama - 25, 0, 100);
      e.loja.fechadaAte = Math.max(e.loja.fechadaAte, agoraJogo() + 24);
      custo(e, 5000); pressao(e, 'saude', 40);
      e.avisos.push({ id: novoId('a'), texto: '🤢 Um cliente passou mal com hambúrguer vencido! A Vigilância Sanitária fechou a lanchonete por 1 dia e multou em R$ 5.000.', para: null, nivel: 'urgente', em: agoraJogo(), professor: true });
    }

    // ---------- Uma hora do jogo (o mundo anda) ----------
    function hora(e) {
      if (e.falida) return;
      const h = agoraJogo(), dia = diaDe(h), hh = horaDe(h), p = params(partida.nivel);
      const seca = estacao(dia) === 'seca', forte = ativa(e, 'seca_forte');
      // Roça
      for (const t of e.roca.talhoes) {
        if (t.foco) continue;
        if (t.estado === 'crescendo') {
          let v = 100 / (4 * 24);
          if (seca) v *= e.roca.irrigacao ? 0.9 : 0.25;
          if (forte) v *= 0.4;
          t.cresc += v;
          if (t.cresc >= 100) { t.estado = 'pronto'; t.cresc = 100; t.prontoH = h; }
        } else if (t.estado === 'pronto' && h - t.prontoH > 48 && !t.passou) t.passou = true;
      }
      if (e.roca.irrigacao) custo(e, 8);
      // Pasto: o capim cresce (muito na chuva, quase nada na seca) e o rebanho come o do piquete ativo
      const pq = e.pasto.piquetes, ativo = pq[e.pasto.ativo] || pq[0];
      // O solo (fertilidade): o capim cresce menos e chega a menos no solo cansado. Pisoteado no pelado, cansa;
      // descansando (sem gado), recupera devagar; a reforma devolve a força de uma vez.
      const nBois = e.pasto.bois.length;
      pq.forEach((x, i) => {
        if (x.reformaAte && h >= x.reformaAte) { x.reformaAte = 0; x.fert = Math.min(100, x.fert + 50); x.capim = Math.max(x.capim, 35); registrar(e, `🌱 A reforma do piquete ${i + 1} terminou: solo forte e capim novo.`); }
        if (x.foco) return;
        const teto = 30 + 0.7 * x.fert;
        if (x.capim < teto) x.capim = Math.min(teto, x.capim + (seca ? 0.06 : 0.45) * (forte ? 0.3 : 1) * (0.3 + 0.7 * x.fert / 100) * (x.reformaAte ? 0.5 : 1));
        if (i === e.pasto.ativo && nBois) {
          if (x.capim < 15) x.fert -= 0.35 * (x.novo ? 1.6 : 1) * Math.max(0.5, nBois / 14);
          if (nBois > 24) x.fert -= 0.012 * (nBois - 24);
          if (x.capim >= 40) x.fert += 0.02;
        } else x.fert += seca ? 0.03 : 0.12;
        x.fert = lim(x.fert, 5, 100);
        if (x.fert < 30 && !x.degradado) { x.degradado = true; e.natureza = lim(e.natureza - 5, 0, 100); pressao(e, 'ambiente', 10); e.avisos.push({ id: novoId('a'), texto: `🏜️ O solo do piquete ${i + 1} cansou (pasto degradado): o capim quase não volta. Tire o gado e faça a reforma (adubo e semente).`, para: 'pecuarista', nivel: 'urgente', em: h, professor: true }); }
        else if (x.fert >= 50 && x.degradado) x.degradado = false;
      });
      let comeu = Math.min(ativo.capim, nBois * 0.07);
      ativo.capim -= comeu;
      let alimentados = nBois ? Math.min(nBois, Math.floor(comeu / 0.07 + 1e-6)) : 0;
      if (alimentados < nBois && e.pasto.cocho && e.roca.silagem > 0) {
        const precisa = (nBois - alimentados) * 0.02, usa = Math.min(precisa, e.roca.silagem);
        e.roca.silagem = arred(e.roca.silagem - usa, 2);
        alimentados += Math.floor(usa / 0.02 + 1e-6);
      }
      if (ativo.capim <= 0.5 && nBois) { e.natureza = lim(e.natureza - 0.15, 0, 100); }
      e.pasto.bois.forEach((b, i) => {
        if (b.doente) { b.doenteH++; b.peso = arred(b.peso - 0.03, 2); if (b.doenteH > 48) b.morto = true; return; }
        b.peso = arred(Math.min(20, b.peso + (i < alimentados ? 0.03 : -0.025)), 2);
        if (!b.vacinado && acaso() < p.doenca / 6) { b.doente = true; b.doenteH = 0; }
      });
      const mortos = e.pasto.bois.filter((b) => b.morto).length;
      if (mortos) { e.pasto.bois = e.pasto.bois.filter((b) => !b.morto); e.avisos.push({ id: novoId('a'), texto: `💀 ${mortos} boi(s) doente(s) morreram sem tratamento.`, para: 'veterinario', nivel: 'urgente', em: h, professor: true }); }
      if (e.escritorio.racaoRuimEm && h >= e.escritorio.racaoRuimEm) { e.escritorio.racaoRuimEm = 0; e.pasto.bois.slice(0, 3).forEach((b) => { b.doente = true; b.doenteH = 0; }); e.avisos.push({ id: novoId('a'), texto: '🤒 A ração barata sem nota estava ruim: 3 bois ficaram doentes.', para: 'pecuarista', nivel: 'urgente', em: h, professor: true }); }
      // Caminhão
      const v = e.caminhao.viagem;
      if (v && h >= v.chega) {
        if (v.rota === 'pasto_frig') { e.frig.bois += v.carga; e.frig.arrobas = arred((e.frig.arrobas || 0) + (v.arrobas || v.carga * 18), 1); }
        else for (const l of v.carga) e.loja.lotes.push(l);
        e.caminhao.viagem = null;
        registrar(e, v.rota === 'pasto_frig' ? `🚚 Chegaram ${v.carga} boi(s) no frigorífico.` : `🚚 Chegaram ${v.carga.reduce((s, l) => s + l.qtd, 0)} hambúrgueres na lanchonete.`);
      }
      // Frigorífico: produz hambúrguer com a carne (a câmara fria guarda até a validade)
      if (e.frig.carne > 0 && e.frig.producao > 0) {
        const q = Math.min(e.frig.carne, Math.round(e.frig.producao / 24));
        if (q > 0) { e.frig.carne -= q; e.frig.lotes.push({ qtd: q, vence: dia + p.validade }); custo(e, q * 0.4); }
        const juntos = {}; for (const l of e.frig.lotes) juntos[l.vence] = (juntos[l.vence] || 0) + l.qtd;
        e.frig.lotes = Object.entries(juntos).map(([vence, qtd]) => ({ qtd, vence: Number(vence) }));
      }
      if (e.frig.higiene) custo(e, 4);
      // Compras chegando
      for (const c of e.escritorio.compras) if (!c.chegou && h >= c.chega) { c.chegou = true; e.loja.pao += c.qtd; e.loja.queijo += c.qtd; e.loja.embalagem += c.qtd; registrar(e, `📦 Chegaram ${c.qtd} pães, queijos e embalagens.`); }
      // Lanchonete
      const aberta = e.loja.aberta && h >= e.loja.fechadaAte && !ativa(e, 'greve') && MOVIMENTO[hh] != null;
      if (MOVIMENTO[hh] != null && !aberta && e.loja.fila) { e.hoje.perdidos += e.loja.fila; e.loja.fila = 0; }
      if (aberta) {
        let fator = (0.4 + e.fama / 100) * lim((26 - e.loja.preco * (e.loja.promocao ? 0.85 : 1)) / 8, 0.15, 1.6);
        const m = e.escritorio.marketing; if (m && h < m.ate) fator *= m.tipo === 'honesta' ? 1.25 : 1.4;
        if (ativa(e, 'concorrente')) fator *= 0.75;
        const protestos = e.eventos.filter((x) => x.tipo === 'protesto' && !x.resolvido && h >= x.em && h < x.ate).length;
        if (protestos) fator *= Math.pow(0.75, Math.min(2, protestos));
        if (e.eventos.some((x) => x.tipo === 'boicote' && h >= x.em && h < x.ate)) fator *= 0.5;
        if (e.eventos.some((x) => x.tipo === 'feriado' && h >= x.em && h < x.ate)) fator *= 2;
        if (e.eventos.some((x) => x.tipo === 'jogo_brasil' && h >= x.em && h < x.ate)) fator *= 3;
        if ((dia % 7 === 6) || (dia % 7 === 0)) fator *= 1.3; // sábado e domingo
        const chegam = Math.max(0, Math.round(MOVIMENTO[hh] * fator * (0.85 + acaso() * 0.3)));
        const cap = capacidadeLoja(e);
        const capacidade = Math.round(cap.total * (h < e.loja.horaExtraAte ? 1.5 : 1));
        const querem = e.loja.fila + chegam;
        const tem = Math.min(estoqueLoja(e), e.loja.pao, e.loja.queijo, e.loja.embalagem);
        const atende = Math.min(querem, capacidade, tem);
        vender(e, atende);
        const sobram = querem - atende;
        e.loja.fila = Math.min(15 + 5 * noSalao(e), sobram);
        const perdidos = sobram - e.loja.fila;
        e.hoje.perdidos += perdidos;
        if (tem < querem && atende < capacidade) e.hoje.faltou += querem - atende;
        e.fama = lim(e.fama + (atende ? 0.25 : 0) + noSalao(e) * 0.05 - perdidos * 0.04 - (e.loja.preco > 24 ? 0.15 : 0), 0, 100);
        if (e.loja.fila >= 12) pressao(e, 'vizinhos', 0.7);
        if (cap.gargalo && sobram > capacidade * 0.5) avisar(e, 'gargalo', 'gerente', cap.gargalo === 'chapa' ? `🔥 A chapa não dá conta às ${hh}h: tem mais gente no caixa do que na chapa (o pedido fica esperando o lanche). Gerente: equilibre caixa e chapa; quem sobrar pode cuidar do salão!` : `🧾 O caixa não dá conta às ${hh}h: tem mais gente na chapa do que no caixa (a chapa fica esperando pedido). Gerente: equilibre caixa e chapa; quem sobrar pode cuidar do salão!`, 'importante', 8);
        if (sobram > capacidade) e.moral = lim(e.moral - 0.6, 0, 100);
        if (tem < querem && tem < capacidade) avisar(e, 'faltou', null, `🍔 Faltou ${estoqueLoja(e) < 1 ? 'hambúrguer' : 'pão, queijo ou embalagem'} na lanchonete às ${hh}h: os clientes foram embora. Frigorífico, Logística e Compras: combinem a reposição!`, 'urgente', 6);
        else if (sobram > capacidade * 0.8 && e.loja.atendentes < 4) avisar(e, 'fila', 'rh', `🧍 Fila grande na lanchonete às ${hh}h: falta atendente. RH: contrate ou pague hora extra; Caixa e Chapeiro: atendam na mão!`, 'importante', 8);
      }
      // A equipe: o ânimo de cada um anda junto com o da equipe; o elogio passa devagar; muito triste, pede as contas.
      for (const t of e.loja.equipe) t.ajuste += t.ajuste > 0 ? -Math.min(t.ajuste, 0.4) : Math.min(-t.ajuste, 0.4);
      const tristes = e.loja.equipe.filter((t) => animoDe(e, t) < 12);
      if (tristes.length && e.loja.equipe.length > 1 && acaso() < 0.04) {
        const t = tristes[0]; e.loja.equipe = e.loja.equipe.filter((x) => x !== t); e.loja.atendentes = e.loja.equipe.length; pressao(e, 'trabalho', 8);
        e.avisos.push({ id: novoId('a'), texto: `🚪 ${t.nome} pediu demissão: estava muito desanimado(a). RH: elogie, dê folga e treine a equipe antes que outros saiam.`, para: 'rh', nivel: 'urgente', em: h, professor: true });
      }
      // As vozes da cidade: a pressão sobe com o que vai mal e desce sozinha; em 80, protesto; em 100, boicote.
      if (e.natureza < 50) pressao(e, 'ambiente', ((50 - e.natureza) / 50) * 0.8);
      if (!e.frig.higiene) pressao(e, 'saude', 0.4);
      if (e.escritorio.vencidaNaLoja) pressao(e, 'saude', 0.5);
      if (e.moral < 40) pressao(e, 'trabalho', ((40 - e.moral) / 40) * 0.8);
      if (noSalao(e)) pressao(e, 'vizinhos', -0.3 * noSalao(e));
      for (const k of Object.keys(GRUPOS)) {
        const gr = GRUPOS[k];
        if (!protestando(e, k, h)) pressao(e, k, -0.25);
        // boicote: só se protestaram e ninguém conversou com eles (e no máximo um a cada 2 dias)
        const semResposta = e.eventos.some((x) => x.tipo === 'protesto' && x.grupo === k && !x.resolvido && h - x.em < 24);
        if (e.vozes[k] >= 100 && semResposta && !e.eventos.some((x) => x.tipo === 'boicote' && x.grupo === k && h - x.em < 48)) { novoEvento(e, 'boicote', { grupo: k }); e.vozes[k] = 50; e.fama = lim(e.fama - 10, 0, 100); }
        else if (e.vozes[k] >= 80 && !protestando(e, k, h) && !e.eventos.some((x) => x.tipo === 'protesto' && x.grupo === k && h - x.em < 24)) novoEvento(e, 'protesto', { grupo: k });
        else if (e.vozes[k] >= 50) avisar(e, `voz-${k}`, gr.para, `${gr.icone} ${gr.nome} estão reclamando (${gr.causa}). Se não melhorar, vão protestar na porta!`, 'importante', 24);
        if (protestando(e, k, h)) pressao(e, k, 0.3);
      }
      // Escritório: contas, marketing enganoso, IBAMA, processos, propina
      if (e.escritorio.procon && h >= e.escritorio.procon) { e.escritorio.procon = 0; custo(e, 6000); pressao(e, 'saude', 25); e.fama = lim(e.fama - 20, 0, 100); e.avisos.push({ id: novoId('a'), texto: '📢 O PROCON multou a propaganda enganosa ("100% natural" não era verdade): R$ 6.000 e a fama caiu.', para: 'marketing', nivel: 'urgente', em: h, professor: true }); }
      if (e.escritorio.ibamaEm && h >= e.escritorio.ibamaEm) { e.escritorio.ibamaEm = 0; custo(e, 8000); if (p.falencia) e.pasto.embargoAte = h + 48; e.fama = lim(e.fama - 10, 0, 100); e.avisos.push({ id: novoId('a'), texto: `🛰️ O satélite viu a mata derrubada: o IBAMA multou em R$ 8.000${p.falencia ? ' e embargou o pasto por 2 dias' : ''}.`, para: 'qualidade', nivel: 'urgente', em: h, professor: true }); }
      if (e.escritorio.processoEm && h >= e.escritorio.processoEm) { e.escritorio.processoEm = 0; custo(e, 3000); e.avisos.push({ id: novoId('a'), texto: '⚖️ Processo trabalhista: a hora extra que não foi paga custou R$ 3.000 na Justiça.', para: 'rh', nivel: 'urgente', em: h, professor: true }); }
      if (e.escritorio.propinaEm && h >= e.escritorio.propinaEm) { e.escritorio.propinaEm = 0; custo(e, 15000); e.fama = lim(e.fama - 40, 0, 100); e.avisos.push({ id: novoId('a'), texto: '🚓 O "jeitinho" foi descoberto: corrupção é crime. Multa de R$ 15.000 e a fama da empresa despencou.', para: null, nivel: 'urgente', em: h, professor: true }); }
      if (e.escritorio.vencidaNaLoja && acaso() < 0.25 && estoqueLoja(e)) { e.escritorio.vencidaNaLoja = false; passouMal(e); }
      for (const a of e.escritorio.avaliacoes) if (!a.respondida && !a.perdeu && h > a.prazo) { a.perdeu = true; e.fama = lim(e.fama - 10, 0, 100); }
      for (const ev of e.eventos) {
        if (ev.tipo === 'queimada' && !ev.resolvido && !ev.espalhou && h >= ev.ate) {
          ev.espalhou = true; e.natureza = lim(e.natureza - 15, 0, 100); pressao(e, 'ambiente', 20);
          const alvo = ev.onde === 'piquete' ? e.pasto.piquetes[ev.i] : e.roca.talhoes[ev.i];
          alvo.foco = false; if (ev.onde === 'piquete') { alvo.capim = 0; alvo.fert = Math.max(5, alvo.fert - 25); } else Object.assign(alvo, { estado: 'vazio', cresc: 0 });
          e.avisos.push({ id: novoId('a'), texto: `🔥 Ninguém apagou o foco: a queimada destruiu o ${ev.onde === 'piquete' ? `piquete ${ev.i + 1}` : `talhão ${ev.i + 1}`} e a natureza sofreu.`, para: 'qualidade', nivel: 'urgente', em: h, professor: true });
        }
        if (ev.tipo === 'fiscalizacao' && !ev.feito && h >= ev.ate) {
          ev.feito = true;
          const vencidos = [...e.loja.lotes, ...e.frig.lotes].some((l) => l.vence < dia);
          const alvara = e.escritorio.alvara >= dia;
          if (e.frig.higiene && !vencidos && alvara) { e.fama = lim(e.fama + 4, 0, 100); registrar(e, '✅ A fiscalização aprovou: higiene em dia, nada vencido e alvará válido.'); }
          else if (p.jeitinho) novoDilema(e, 'jeitinho');
          else { custo(e, 3000); pressao(e, 'saude', 20); e.loja.fechadaAte = Math.max(e.loja.fechadaAte, h + 4); e.avisos.push({ id: novoId('a'), texto: `📋 Reprovado na fiscalização (${[!e.frig.higiene && 'sem higiene', vencidos && 'produto vencido', !alvara && 'alvará vencido'].filter(Boolean).join(', ')}): multa de R$ 3.000 e loja fechada por 4 horas.`, para: 'qualidade', nivel: 'urgente', em: h, professor: true }); }
        }
      }
      if (e.moral <= 10 && !ativa(e, 'greve')) { e.eventos.push({ id: novoId('v'), tipo: 'greve', titulo: '✊ Greve', texto: 'A equipe está desanimada demais e parou: a lanchonete fica fechada por 1 dia.', em: h, ate: h + 24 }); e.moral = 35; e.avisos.push({ id: novoId('a'), texto: '✊ Greve! A equipe parou por 1 dia. RH: folga, treino e salário em dia evitam isso.', para: 'rh', nivel: 'urgente', em: h, professor: true }); }
      // Dicas e avisos do Professor Virtual
      const dSeca = inicioSeca() - dia;
      if (dSeca > 0 && dSeca <= 3) { avisar(e, 'seca-roca', 'agricultor', `☀️ A seca chega em ${dSeca} dia(s): plante agora e guarde silagem (o capim quase não cresce na seca).`, 'importante', 20); avisar(e, 'seca-pasto', 'pecuarista', `☀️ A seca chega em ${dSeca} dia(s): na seca o capim quase não cresce. Combine silagem com a Roça.`, 'dica', 20); }
      if (ativo.capim < 20 && nBois) avisar(e, 'capim', 'pecuarista', `🐄 O capim do piquete ${e.pasto.ativo + 1} está acabando: troque de piquete ou ligue o cocho com silagem.`, ativo.capim < 5 ? 'urgente' : 'importante', 8);
      if (e.pasto.bois.some((b) => b.doente)) avisar(e, 'doente', 'veterinario', '🤒 Tem boi doente no pasto: trate logo (sem tratamento, ele morre em 2 dias).', 'urgente', 6);
      if (prontos(e).length > e.pasto.gta) avisar(e, 'gta', 'veterinario', `🐂 ${prontos(e).length - e.pasto.gta} boi(s) pronto(s) sem guia (GTA): sem a guia o caminhão não leva.`, 'dica', 12);
      if (e.pasto.gta >= 2 && !e.caminhao.viagem) avisar(e, 'levar-bois', 'logistica', `🚚 ${e.pasto.gta} boi(s) pronto(s) com guia esperando o caminhão no pasto.`, 'importante', 10);
      if (estoqueFrig(e) >= 300 && estoqueLoja(e) < 300 && !e.caminhao.viagem) avisar(e, 'levar-hamb', 'logistica', '🚚 A lanchonete está acabando o hambúrguer e o frigorífico tem estoque: hora de uma viagem!', 'importante', 6);
      if (e.frig.bois > 0) avisar(e, 'abater', 'frigorifico', `🏭 Chegaram ${e.frig.bois} boi(s): processe para virar hambúrguer.`, 'dica', 6);
      if (p.validade < 99 && e.frig.lotes.some((l) => l.vence === dia)) avisar(e, 'vence-frig', 'frigorifico', '⏳ Tem lote na câmara fria que vence hoje: mande para a lanchonete antes!', 'importante', 12);
      if (p.validade < 99 && e.frig.lotes.some((l) => l.vence < dia)) { avisar(e, 'vencido', 'frigorifico', '🗑️ Tem lote vencido na câmara fria: jogue fora (vencido não pode ir para o cliente).', 'importante', 10); if (p.dilemas) novoDilema(e, 'carne_vencida'); }
      if (Math.min(e.loja.pao, e.loja.queijo, e.loja.embalagem) < 250 && !e.escritorio.compras.some((c) => !c.chegou)) avisar(e, 'insumos', 'compras', '🍞 Pão, queijo ou embalagem acabando: o fornecedor leva 14 horas para entregar. Compre já!', 'importante', 10);
      for (const c of e.escritorio.contas) if (!c.paga && !c.recusada && c.vence - dia <= 1) avisar(e, `conta-${c.id}`, 'financeiro', `🧾 A conta "${c.nome}" (R$ ${c.valor.toLocaleString('pt-BR')}) vence ${c.vence <= dia ? 'hoje' : 'amanhã'}.${c.falsa ? ' Confira se o boleto é de verdade!' : ''}`, c.vence < dia ? 'urgente' : 'importante', 12);
      if (e.moral < 30) avisar(e, 'moral', 'rh', '😞 A equipe está desanimada: dê uma folga, treine ou pague a hora extra (abaixo de 10, eles param).', 'importante', 12);
      if (e.caixa < 3000) avisar(e, 'caixa', 'financeiro', `💸 Pouco dinheiro no caixa (R$ ${Math.round(e.caixa).toLocaleString('pt-BR')}): segure os gastos ou peça empréstimo.`, e.caixa < 0 ? 'urgente' : 'importante', 12);
      if (e.natureza < 40) avisar(e, 'natureza', 'qualidade', '🌳 A natureza está sofrendo (pasto pelado, queimada, desmatamento): faça rodízio do pasto e apague os focos.', 'importante', 24);
      if (p.desmatar && seca && e.pasto.piquetes.every((x) => x.capim < 25) && !e.dilemas.some((d) => d.tipo === 'desmatar')) novoDilema(e, 'desmatar');
      if (p.dilemas && hh === 22 && e.hoje.clientes > 220 && dia - (e.escritorio.horaExtraDia || -9) >= 4 && acaso() < 0.5) { e.escritorio.horaExtraDia = dia; novoDilema(e, 'hora_extra'); }
      // A IA faz as funções sem dono
      ia(e, h);
      // Falência (só no difícil)
      if (p.falencia && e.caixa < -15000) {
        e.falida = true;
        e.avisos.push({ id: novoId('a'), texto: '🏚️ A empresa faliu: o caixa ficou abaixo de -R$ 15.000.', para: null, nivel: 'urgente', em: h, professor: true });
      } else if (!p.falencia && e.caixa < -5000) { e.emprestimo += 10000; e.caixa += 10000; registrar(e, '🏦 O banco emprestou R$ 10.000 automaticamente (nos níveis fácil e médio a empresa não vai à falência).'); }
    }
    // Virada do dia: fecha o dia, contas novas, eventos sorteados
    function viradaDoDia(e, diaQueAcabou) {
      const p = params(partida.nivel);
      const lucro = e.hoje.vendas - e.hoje.custos;
      e.dias.push({ dia: diaQueAcabou, vendas: Math.round(e.hoje.vendas), custos: Math.round(e.hoje.custos), lucro: Math.round(lucro), clientes: e.hoje.clientes, perdidos: e.hoje.perdidos, caixa: Math.round(e.caixa), fama: Math.round(e.fama), moral: Math.round(e.moral), natureza: Math.round(e.natureza) });
      let resumo = `📅 Fim do dia ${diaQueAcabou}: ${e.hoje.clientes} lanches vendidos, ${e.hoje.perdidos} clientes foram embora, ${lucro >= 0 ? 'lucro' : 'prejuízo'} de R$ ${Math.abs(Math.round(lucro)).toLocaleString('pt-BR')}.`;
      if (e.hoje.faltou > 20) resumo += ' Faltou hambúrguer: o caminhão precisa trazer antes do almoço.';
      else if (e.hoje.perdidos > 40) resumo += ' Muita fila: mais atendentes ou atender na mão.';
      e.avisos.push({ id: novoId('a'), texto: resumo, para: null, nivel: 'dia', em: agoraJogo(), professor: true });
      e.total.perdidos += e.hoje.perdidos;
      // Reunião dos sócios: o balanço da semana (o que entrou, o que saiu, o que sobrou e se melhorou)
      if (diaQueAcabou % 7 === 0) {
        const sem = e.dias.slice(-7), ent = sem.reduce((s, d) => s + d.vendas, 0), sai = sem.reduce((s, d) => s + d.custos, 0), ant = e.semanas[e.semanas.length - 1];
        const b = { semana: e.semanas.length + 1, entrou: ent, saiu: sai, sobrou: ent - sai, clientes: sem.reduce((s, d) => s + d.clientes, 0), perdidos: sem.reduce((s, d) => s + d.perdidos, 0) };
        e.semanas.push(b);
        const R = (v) => `R$ ${Math.abs(Math.round(v)).toLocaleString('pt-BR')}`;
        e.avisos.push({ id: novoId('a'), texto: `📊 Reunião dos sócios (semana ${b.semana}): entraram ${R(ent)}, saíram ${R(sai)}, ${b.sobrou >= 0 ? 'sobraram' : 'faltaram'} ${R(b.sobrou)}.${ant ? (b.sobrou >= ant.sobrou ? ' Melhor que a semana passada: os sócios estão contentes!' : ' Pior que a semana passada: os sócios querem um plano. Conversem sobre o que deu errado.') : ''}`, para: null, nivel: 'dia', em: agoraJogo(), professor: true });
      }
      e.hoje = { vendas: 0, clientes: 0, perdidos: 0, faltou: 0, custos: 0 };
      // Juros do empréstimo (1% ao dia do jogo)
      if (e.emprestimo > 0) custo(e, Math.round(e.emprestimo * 0.01));
      const dia = diaQueAcabou + 1;
      // Contas que chegam (vencem em 2 dias)
      if (dia % 7 === 0) e.escritorio.contas.push({ id: novoId('c'), tipo: 'salarios', nome: 'Salários da semana', valor: 2500 + e.loja.atendentes * 900, vence: dia + 1, paga: false });
      if (dia % 10 === 0) e.escritorio.contas.push({ id: novoId('c'), nome: 'Conta de luz (câmara fria e lanchonete)', valor: 2200, vence: dia + 2, paga: false });
      if (dia % 10 === 5) e.escritorio.contas.push({ id: novoId('c'), nome: 'Aluguel da lanchonete', valor: 3000, vence: dia + 2, paga: false });
      if (dia % 10 === 8) { const fat = e.dias.slice(-10).reduce((s, d) => s + d.vendas, 0); e.escritorio.contas.push({ id: novoId('c'), nome: 'Imposto do Simples Nacional (6% das vendas)', valor: Math.max(200, Math.round(fat * 0.06)), vence: dia + 2, paga: false }); }
      // Conta atrasada: salário atrasado desanima; luz atrasada corta
      for (const c of e.escritorio.contas) {
        if (c.paga || c.recusada || c.falsa || c.vence >= dia) continue;
        if (c.tipo === 'salarios') { e.moral = lim(e.moral - 15, 0, 100); pressao(e, 'trabalho', 25); e.avisos.push({ id: novoId('a'), texto: '😠 O salário atrasou: a equipe está revoltada.', para: 'financeiro', nivel: 'urgente', em: agoraJogo(), professor: true }); }
        if (/luz/i.test(c.nome) && dia - c.vence >= 2 && !c.cortou) { c.cortou = true; novoEvento(e, 'falta_luz'); }
      }
      for (const c of e.escritorio.contas) if (c.falsa && !c.paga && !c.recusada && c.vence < dia) c.recusada = true;
      e.escritorio.contas = e.escritorio.contas.filter((c) => !(c.paga || c.recusada) || dia - c.vence < 2);
      // Alvará: o primeiro vence no dia 8
      if (!e.escritorio.alvara) e.escritorio.alvara = 8;
      if (e.escritorio.alvara - dia === 1) avisar(e, 'alvara', 'qualidade', '📄 O alvará de funcionamento vence amanhã: renove (R$ 800).', 'importante', 20);
      // Eventos sorteados
      const n = Math.floor(p.eventosPorDia) + (acaso() < p.eventosPorDia % 1 ? 1 : 0);
      const seca = estacao(dia) === 'seca';
      const possiveis = ['queimada', 'doenca', 'br364', 'falta_luz', 'fiscalizacao', 'avaliacao_ruim', 'concorrente', 'feriado', 'jogo_brasil', 'boleto_falso', 'combustivel_caro']
        .filter((t) => (t !== 'queimada' || seca) && !ativa(e, t));
      if (seca && !ativa(e, 'seca_forte')) possiveis.push('seca_forte');
      for (let k = 0; k < n && possiveis.length; k++) {
        const t = possiveis.splice(Math.floor(acaso() * possiveis.length), 1)[0];
        if (p.avisaEventos && ['feriado', 'fiscalizacao', 'concorrente'].includes(t)) { e.avisos.push({ id: novoId('a'), texto: `📰 Notícia: amanhã tem ${EVENTOS[t].titulo.replace(/^\S+\s/, '').toLowerCase()}. Preparem-se!`, para: null, nivel: 'importante', em: agoraJogo(), professor: true }); e.eventosAmanha = (e.eventosAmanha || []).concat(t); }
        else novoEvento(e, t);
      }
      if (e.eventosAmanhaAntes) for (const t of e.eventosAmanhaAntes) novoEvento(e, t);
      e.eventosAmanhaAntes = e.eventosAmanha || null; e.eventosAmanha = null;
    }
    // O relógio: anda o que passou desde a última vez (cada hora do jogo é um passo; a noite passa 3x mais rápido)
    const pesoHora = (hh) => (hh >= 23 || hh < 6 ? 1 / 3 : 1);
    const somaPesos = Array.from({ length: 24 }, (_, i) => pesoHora(i)).reduce((a, b) => a + b, 0);
    function avancar() {
      if (!partida || partida.estado !== 'rodando') { if (partida) partida.ultimo = relogio(); return; }
      const agora = relogio();
      let ms = Math.max(0, agora - partida.ultimo);
      partida.ultimo = agora;
      let passos = 0;
      while (ms > 0 && passos < 240 && partida.estado === 'rodando') {
        const p = params(partida.nivel);
        const msHora = (p.msPorDia / somaPesos) * pesoHora(horaDe(partida.horas)) / (partida.acelerar ? 2 : 1);
        const falta = (1 - (partida.horas % 1)) * msHora;
        if (ms < falta) { partida.horas += ms / msHora; ms = 0; break; }
        ms -= falta;
        partida.horas = Math.floor(partida.horas) + 1;
        passoDeHora();
        passos++;
      }
    }
    function passoDeHora() {
      const h = partida.horas;
      for (const e of partida.empresas) hora(e);
      if (horaDe(h) === 0) {
        const acabou = diaDe(h) - 1;
        for (const e of partida.empresas) viradaDoDia(e, acabou);
        sugerir();
        if (partida.rodizio && acabou % partida.rodizio === 0 && partida.modo === 'turma') rodar();
        if (acabou >= partida.dias) terminar();
      }
    }
    function pularHoras(n) { for (let i = 0; i < n && partida && partida.estado === 'rodando'; i++) { partida.horas = Math.floor(partida.horas) + 1; passoDeHora(); } }
    // Sugestão do termômetro: tudo verde há 2 dias (subir) ou 2 medidores no vermelho (baixar)
    function sugerir() {
      const e = partida.empresas;
      const med = (x) => [dinheiroMedidor(x.caixa), x.fama, x.moral, x.natureza];
      const verde = e.length && e.every((x) => med(x).every((v) => v >= 65));
      const vermelho = e.some((x) => med(x).filter((v) => v <= 30).length >= 2);
      partida.verdes = verde ? (partida.verdes || 0) + 1 : 0;
      partida.sugestao = partida.verdes >= 2 && partida.nivel < 10 ? 'subir' : vermelho && partida.nivel > 1 ? 'baixar' : null;
    }
    const valorDe = (x) => x.caixa - x.emprestimo + x.pasto.bois.reduce((s, b) => s + b.peso * 170, 0) + (x.frig.arrobas || 0) * 170 + (estoqueLoja(x) + estoqueFrig(x) + x.frig.carne) * 6 + x.roca.silagem * 60;
    const dinheiroMedidor = (c) => Math.round(lim(20 + c / 500, 0, 100));
    function rodar() {
      const ids = partida.participantes.map((p) => p.id);
      const grupos = ids.map((id) => partida.funcoesDe[id] || []);
      grupos.unshift(grupos.pop());
      ids.forEach((id, i) => { partida.funcoesDe[id] = grupos[i]; });
      for (const e of partida.empresas) e.avisos.push({ id: novoId('a'), texto: '🔄 Rodízio! Cada um passou para outra função. Veja o seu novo setor.', para: null, nivel: 'urgente', em: partida.horas, professor: true });
    }
    function terminar() {
      partida.estado = 'fim';
      partida.fimEm = relogio();
      partida.resultado = partida.empresas.map((e) => resultadoDe(e));
    }
    function resultadoDe(e) {
      const medidores = { caixa: dinheiroMedidor(e.caixa), clientes: Math.round(e.fama), equipe: Math.round(e.moral), natureza: Math.round(e.natureza) };
      // O que a empresa vale no fim: o dinheiro, mais os bois e o estoque, menos o empréstimo (começou valendo o mesmo cálculo)
      const lucro = Math.round(valorDe(e) - (e.valorInicial || valorDe(e)));
      return { empresa: e.id, nome: e.nome, lucro, valor: Math.round(valorDe(e)), medidores, saudavel: !e.falida && Object.values(medidores).every((v) => v >= 50), falida: e.falida, clientes: e.total.clientes, perdidos: e.total.perdidos + e.hoje.perdidos, membros: e.membros.slice() };
    }

    // ---------- O que cada um vê ("ninguém vê tudo": cada função vê o seu setor) ----------
    const VE = {
      roca: ['agricultor', 'pecuarista', 'diretor'], pasto: ['pecuarista', 'veterinario', 'agricultor', 'logistica', 'diretor'],
      frig: ['frigorifico', 'logistica', 'diretor'], caminhao: ['logistica', 'frigorifico', 'diretor'],
      loja: ['gerente', 'caixa', 'chapeiro', 'compras', 'rh', 'marketing', 'logistica', 'diretor'],
      escritorio: ['financeiro', 'compras', 'marketing', 'rh', 'qualidade', 'diretor'],
    };
    function visao(e, funcoes, tudo) {
      const ve = (k) => tudo || funcoes.some((f) => VE[k].includes(f));
      const h = agoraJogo(), dia = diaDe(h);
      const meus = (para) => tudo || !para || funcoes.includes(para) || funcoes.includes('diretor');
      return {
        id: e.id, nome: e.nome, falida: e.falida,
        caixa: Math.round(e.caixa), emprestimo: e.emprestimo,
        medidores: { caixa: dinheiroMedidor(e.caixa), clientes: Math.round(e.fama), equipe: Math.round(e.moral), natureza: Math.round(e.natureza) },
        meta: e.escritorio.meta,
        roca: ve('roca') ? { talhoes: e.roca.talhoes.map((t) => ({ estado: t.estado, cresc: Math.round(t.cresc), foco: t.foco, passou: !!t.passou })), silagem: arred(e.roca.silagem, 1), irrigacao: e.roca.irrigacao } : null,
        pasto: ve('pasto') ? { piquetes: e.pasto.piquetes.map((x) => ({ capim: Math.round(x.capim), foco: x.foco, novo: x.novo, solo: Math.round(x.fert), reforma: x.reformaAte > h ? x.reformaAte : 0, degradado: !!x.degradado })), ativo: e.pasto.ativo, cocho: e.pasto.cocho, gta: e.pasto.gta, embargo: e.pasto.embargoAte > h,
          bois: e.pasto.bois.length, prontos: prontos(e).length, doentes: e.pasto.bois.filter((b) => b.doente).length, semVacina: e.pasto.bois.filter((b) => !b.vacinado).length,
          pesoMedio: e.pasto.bois.length ? arred(e.pasto.bois.reduce((s, b) => s + b.peso, 0) / e.pasto.bois.length, 1) : 0, rebanho: e.pasto.bois.map((b) => ({ id: b.id, nome: b.nome, peso: arred(b.peso, 1), doente: b.doente, vacinado: b.vacinado, separado: !!b.separado })), separados: e.pasto.bois.filter((b) => b.separado).length } : null,
        frig: ve('frig') ? { bois: e.frig.bois, arrobas: e.frig.arrobas, carne: e.frig.carne, estoque: estoqueFrig(e), lotes: e.frig.lotes.map((l) => ({ qtd: l.qtd, vence: l.vence, vencido: l.vence < dia })), producao: e.frig.producao, higiene: e.frig.higiene } : null,
        caminhao: ve('caminhao') ? { combustivel: Math.round(e.caminhao.combustivel), viagem: e.caminhao.viagem ? { rota: e.caminhao.viagem.rota, nome: ROTAS[e.caminhao.viagem.rota].nome, sai: e.caminhao.viagem.sai, chega: e.caminhao.viagem.chega, carga: Array.isArray(e.caminhao.viagem.carga) ? `${e.caminhao.viagem.carga.reduce((s, l) => s + l.qtd, 0)} hambúrgueres` : `${e.caminhao.viagem.carga} boi(s)${e.caminhao.viagem.nomes ? ` (${e.caminhao.viagem.nomes.join(', ')})` : ''}` } : null, br364: ativa(e, 'br364') } : null,
        loja: ve('loja') ? { estoque: estoqueLoja(e), lotes: e.loja.lotes.map((l) => ({ qtd: l.qtd, vence: l.vence, vencido: l.vence < dia })), pao: e.loja.pao, queijo: e.loja.queijo, embalagem: e.loja.embalagem, preco: e.loja.preco, aberta: e.loja.aberta, fechadaAte: e.loja.fechadaAte, fechada: h < e.loja.fechadaAte || ativa(e, 'greve'),
          atendentes: e.loja.atendentes, treino: e.loja.treino, equipe: e.loja.equipe.map((t) => ({ id: t.id, nome: t.nome, icone: t.icone, posto: t.posto, animo: animoDe(e, t), elogiado: t.elogioDia === dia })),
          capacidade: Math.round(capacidadeLoja(e).total), gargalo: capacidadeLoja(e).gargalo, salao: noSalao(e), fila: e.loja.fila, promocao: e.loja.promocao, horaExtra: h < e.loja.horaExtraAte, hoje: { ...e.hoje, vendas: Math.round(e.hoje.vendas) } } : null,
        escritorio: ve('escritorio') ? { contas: e.escritorio.contas.filter((c) => !c.paga && !c.recusada).map((c) => ({ id: c.id, nome: c.nome, valor: c.valor, vence: c.vence, suspeita: !!c.falsa })), compras: e.escritorio.compras.filter((c) => !c.chegou).map((c) => ({ qtd: c.qtd, chega: c.chega })),
          marketing: e.escritorio.marketing && h < e.escritorio.marketing.ate ? e.escritorio.marketing : null, avaliacoes: e.escritorio.avaliacoes.filter((a) => !a.respondida && !a.perdeu).map((a) => ({ id: a.id, estrelas: a.estrelas, texto: a.texto, prazo: a.prazo })), alvara: e.escritorio.alvara } : null,
        vozes: Object.fromEntries(Object.keys(GRUPOS).map((k) => [k, Math.round(e.vozes[k])])),
        protestos: e.eventos.filter((x) => (x.tipo === 'protesto' || x.tipo === 'boicote') && !x.resolvido && h >= x.em && h < x.ate).map((x) => ({ id: x.id, tipo: x.tipo, grupo: x.grupo, ate: x.ate })),
        semanas: e.semanas.slice(-4),
        queimadas: e.eventos.filter((x) => x.tipo === 'queimada' && !x.resolvido && !x.espalhou).map((x) => ({ id: x.id, onde: x.onde, i: x.i, ate: x.ate })),
        eventos: e.eventos.filter((x) => x.ate > h && x.em <= h + 24).map((x) => ({ tipo: x.tipo, titulo: x.titulo, texto: x.texto, ate: x.ate })),
        avisos: e.avisos.filter((a) => meus(a.para)).slice(-25),
        dilemas: e.dilemas.filter((d) => !d.escolha && meus(d.para)).map((d) => ({ id: d.id, para: d.para, titulo: d.titulo, texto: d.texto, opcoes: d.opcoes })),
        pedidos: e.pedidos.slice(-30),
        conversa: e.conversa.filter((m) => tudo || !m.para || funcoes.includes(m.para) || m.deFuncoes.some((f) => funcoes.includes(f))).slice(-40),
        dias: e.dias.slice(-30),
        membros: e.membros.map((id) => { const p = partida.participantes.find((x) => x.id === id); return p ? { id, nome: p.nome, avatar: p.avatar, funcoes: partida.funcoesDe[id] || [] } : null; }).filter(Boolean),
      };
    }
    function publica(usuario) {
      if (!partida) return null;
      avancar();
      const instrutor = usuario && usuario.papel === 'instrutor';
      const eu = usuario && partida.participantes.find((p) => p.id === usuario.id);
      const funcoes = eu ? (partida.modo === 'cada' ? partida.ativas.slice() : partida.funcoesDe[eu.id] || []) : [];
      const minha = eu && empresaDe(usuario.id);
      const h = partida.horas, dia = diaDe(h), p = params(partida.nivel);
      const base = {
        id: partida.id, estado: partida.estado, modo: partida.modo, nivel: partida.nivel, nomeNivel: nomeNivel(partida.nivel), dias: partida.dias,
        dia: Math.min(dia, partida.dias), hora: horaDe(h), minuto: Math.floor((h % 1) * 60), horas: h, estacao: estacao(dia), inicioSeca: inicioSeca(), fimSeca: fimSeca(),
        msPorDia: p.msPorDia / (partida.acelerar ? 2 : 1), acelerar: !!partida.acelerar, agora: relogio(), ativas: partida.ativas.slice(), distribuicao: partida.distribuicao, rodizio: partida.rodizio,
        participantes: partida.participantes.map((x) => ({ id: x.id, nome: x.nome, avatar: x.avatar, funcoes: partida.funcoesDe[x.id] || [] })),
        eu: eu ? { funcoes, empresa: minha ? minha.id : null, voto: partida.votos[eu.id] || null } : null,
        empresa: minha ? visao(minha, funcoes, partida.modo === 'cada') : null,
        resultado: partida.estado === 'fim' ? partida.resultado : null,
        livres: partida.distribuicao === 'livre' ? partida.ativas.filter((f) => !Object.values(partida.funcoesDe).some((l) => l.includes(f))) : [],
      };
      if (instrutor) {
        base.instrutor = {
          empresas: partida.empresas.map((e) => ({ ...visao(e, IDS, true), parado: e.membros.filter((id) => relogio() - (partida.ultimaAcao[id] || partida.criadaEm) > 120000) })),
          sugestao: partida.sugestao, votos: Object.values(partida.votos).reduce((c, v) => { c[v] = (c[v] || 0) + 1; return c; }, {}),
          stats: partida.stats,
        };
      }
      return base;
    }
    function empresaDe(id) {
      if (!partida) return null;
      return partida.empresas.find((e) => e.membros.includes(id)) || null;
    }
    const contar = (id, campo) => { if (!id) return; const s = (partida.stats[id] = partida.stats[id] || { acoes: 0, pedidos: 0, atendidos: 0, mensagens: 0, lanches: 0 }); s[campo]++; partida.ultimaAcao[id] = relogio(); };

    // ---------- A API ----------
    return {
      FUNCOES, FASES, NIVEIS, EVENTOS, GRUPOS, POSTOS, ITENS_PEDIDO, ROTAS, CARDAPIO, RECEITAS, params, repartir, nomeNivel,
      // O professor abre o jogo: modo, nível, duração, funções que a turma faz (o resto, a IA), como distribuir e rodízio.
      criar(usuario, c = {}) {
        if (partida && partida.estado !== 'fim') throw new Error('Já tem um jogo aberto. Encerre antes de abrir outro.');
        const ativas = Array.isArray(c.ativas) && c.ativas.length ? IDS.filter((f) => c.ativas.includes(f)) : IDS.slice();
        partida = {
          id: novoId('j'), por: usuario ? usuario.nome : 'Professor', turma: String(c.turma || '').slice(0, 40),
          modo: c.modo === 'cada' ? 'cada' : 'turma', nivel: params(c.nivel).nivel, dias: lim(Math.round(Number(c.dias) || 30), 5, 60),
          ativas, distribuicao: ['sortear', 'escolher', 'livre'].includes(c.distribuicao) ? c.distribuicao : 'sortear',
          rodizio: [0, 3, 5, 10].includes(Number(c.rodizio)) ? Number(c.rodizio) : 0,
          estado: 'espera', horas: 8, ultimo: relogio(), criadaEm: relogio(), acelerar: false,
          participantes: [], funcoesDe: {}, empresas: [], votos: {}, stats: {}, ultimaAcao: {}, sugestao: null, verdes: 0,
        };
        if (partida.modo === 'turma') partida.empresas.push(novaEmpresa('Hamburgueria da Turma', []));
        return publica(usuario);
      },
      // O aluno entra (pelo prédio da lanchonete na Praça ou pelo convite).
      entrar(usuario) {
        temPartida();
        if (!usuario) throw new Error('Entre no sistema primeiro.');
        if (partida.estado === 'fim') throw new Error('O jogo já terminou.');
        if (partida.turma && usuario.papel !== 'instrutor' && usuario.turma !== partida.turma) throw new Error(`Este jogo é da turma ${partida.turma}.`);
        if (!partida.participantes.some((p) => p.id === usuario.id)) {
          if (partida.participantes.length >= 60) throw new Error('O jogo está lotado.');
          partida.participantes.push({ id: usuario.id, nome: usuario.nome, avatar: usuario.avatar || '🙂', papel: usuario.papel });
          if (partida.modo === 'cada') partida.empresas.push(novaEmpresa(`Hamburgueria de ${usuario.nome.split(' ')[0]}`, [usuario.id]));
          else partida.empresas[0].membros.push(usuario.id);
          partida.funcoesDe[usuario.id] = [];
          for (const x of partida.empresas) if (x.valorInicial == null) x.valorInicial = valorDe(x);
          if (partida.estado !== 'espera' && partida.modo === 'turma' && partida.distribuicao === 'sortear') {
            // chegou atrasado: pega uma função livre (ou vira a dupla da lanchonete)
            const ocupadas = new Set(Object.values(partida.funcoesDe).flat());
            const livre = partida.ativas.find((f) => !ocupadas.has(f));
            partida.funcoesDe[usuario.id] = [livre || ['caixa', 'chapeiro'].find((f) => partida.ativas.includes(f)) || partida.ativas[0]];
          }
        }
        partida.ultimaAcao[usuario.id] = relogio();
        return publica(usuario);
      },
      sair(usuario) {
        if (!partida || !usuario) return null;
        partida.participantes = partida.participantes.filter((p) => p.id !== usuario.id);
        delete partida.funcoesDe[usuario.id];
        for (const e of partida.empresas) e.membros = e.membros.filter((id) => id !== usuario.id);
        if (partida.modo === 'cada') partida.empresas = partida.empresas.filter((e) => e.membros.length);
        return publica(usuario);
      },
      // Distribuir as funções: sorteio, escolha do professor (aluno → funções) ou cada um escolhe a sua livre.
      sortear(usuario) {
        temPartida();
        if (partida.modo !== 'turma') return publica(usuario);
        const alunos = embaralhar(partida.participantes.filter((p) => p.papel !== 'instrutor').map((p) => p.id), acaso);
        const quem = alunos.length ? alunos : partida.participantes.map((p) => p.id);
        const grupos = repartir(partida.ativas, quem.length);
        for (const id of Object.keys(partida.funcoesDe)) partida.funcoesDe[id] = [];
        quem.forEach((id, i) => { partida.funcoesDe[id] = grupos[i] || []; });
        return publica(usuario);
      },
      atribuir(usuario, { aluno, funcoes } = {}) {
        temPartida();
        if (!partida.participantes.some((p) => p.id === aluno)) throw new Error('Esse aluno não entrou no jogo.');
        partida.funcoesDe[aluno] = IDS.filter((f) => (funcoes || []).includes(f) && partida.ativas.includes(f));
        return publica(usuario);
      },
      escolherFuncao(usuario, { funcao } = {}) {
        temPartida();
        if (partida.distribuicao !== 'livre') throw new Error('Quem escolhe as funções é o professor.');
        if (!partida.ativas.includes(funcao)) throw new Error('Essa função não está no jogo.');
        if (Object.entries(partida.funcoesDe).some(([id, l]) => id !== usuario.id && l.includes(funcao))) throw new Error('Alguém já pegou essa função.');
        partida.funcoesDe[usuario.id] = [funcao];
        return publica(usuario);
      },
      comecar(usuario) {
        temPartida();
        if (partida.estado !== 'espera') throw new Error('O jogo já começou.');
        if (partida.modo === 'cada' && !partida.empresas.length) throw new Error('Ninguém entrou no jogo ainda.');
        if (partida.modo === 'turma' && partida.distribuicao === 'sortear' && !Object.values(partida.funcoesDe).some((l) => l.length)) this.sortear(usuario);
        partida.estado = 'rodando'; partida.ultimo = relogio();
        for (const e of partida.empresas) e.avisos.push({ id: novoId('a'), texto: `▶️ Começou! Dia 1, 8h, tempo de chuva. A seca chega no dia ${inicioSeca()}. Conversem: o campo demora, planejem com antecedência!`, para: null, nivel: 'urgente', em: partida.horas, professor: true });
        return publica(usuario);
      },
      pausar(usuario, pausa = true) { temPartida(); avancar(); if (partida.estado === 'rodando' && pausa) partida.estado = 'pausado'; else if (partida.estado === 'pausado' && !pausa) { partida.estado = 'rodando'; partida.ultimo = relogio(); } return publica(usuario); },
      acelerar(usuario, sim) { temPartida(); avancar(); partida.acelerar = !!sim; return publica(usuario); },
      pular(usuario, { horas } = {}) {
        temPartida(); avancar();
        if (partida.estado !== 'rodando' && partida.estado !== 'pausado') throw new Error('O jogo não está rodando.');
        const n = horas === 'amanha' ? 24 - horaDe(partida.horas) + 8 : lim(Math.round(Number(horas) || 1), 1, 48);
        const era = partida.estado; partida.estado = 'rodando'; pularHoras(n); if (partida.estado === 'rodando') partida.estado = era; partida.ultimo = relogio();
        return publica(usuario);
      },
      // O termômetro: muda ao vivo, sem reiniciar (e zera a votação da turma).
      nivel(usuario, n) { temPartida(); avancar(); partida.nivel = params(n).nivel; partida.votos = {}; partida.sugestao = null; partida.verdes = 0; for (const e of partida.empresas) e.avisos.push({ id: novoId('a'), texto: `🌡️ O professor mudou o nível para ${partida.nivel} (${nomeNivel(partida.nivel)}).`, para: null, nivel: 'importante', em: partida.horas }); return publica(usuario); },
      evento(usuario, { tipo, empresa } = {}) {
        temPartida(); avancar();
        if (partida.estado === 'espera') throw new Error('Comece o jogo primeiro.');
        const alvos = empresa ? partida.empresas.filter((e) => e.id === empresa) : partida.empresas;
        if (tipo === 'desmatar' || tipo === 'racao_barata' || tipo === 'hora_extra') for (const e of alvos) novoDilema(e, tipo);
        else for (const e of alvos) novoEvento(e, tipo);
        return publica(usuario);
      },
      encerrar(usuario) { temPartida(); avancar(); if (partida.estado !== 'fim') terminar(); return publica(usuario); },
      fechar() { partida = null; return null; },
      votar(usuario, voto) { temPartida(); if (!['facil', 'bom', 'dificil'].includes(voto)) throw new Error('Voto inválido.'); partida.votos[usuario.id] = voto; return publica(usuario); },
      // Uma ação de uma função. O professor pode agir em qualquer função (de qualquer empresa).
      acao(usuario, { funcao, tipo, empresa: idEmpresa, ...dados } = {}) {
        temPartida(); avancar();
        if (partida.estado !== 'rodando' && partida.estado !== 'pausado') throw new Error(partida.estado === 'espera' ? 'O jogo ainda não começou.' : 'O jogo acabou.');
        if (partida.estado === 'pausado') throw new Error('O jogo está pausado (reunião).');
        const instrutor = usuario && usuario.papel === 'instrutor';
        const e = instrutor && idEmpresa ? partida.empresas.find((x) => x.id === idEmpresa) : empresaDe(usuario.id);
        if (!e) throw new Error('Você não está em nenhuma empresa. Entre no jogo.');
        if (e.falida) throw new Error('A empresa faliu.');
        const minhas = partida.modo === 'cada' ? partida.ativas : partida.funcoesDe[usuario.id] || [];
        if (!instrutor && !minhas.includes(funcao)) throw new Error('Essa função não é sua. Peça pela conversa para quem cuida dela!');
        if (tipo === 'dilema') {
          const d = e.dilemas.find((x) => x.id === dados.id && !x.escolha);
          if (!d) throw new Error('Essa decisão já foi tomada.');
          if (!instrutor && d.para !== funcao && funcao !== 'diretor') throw new Error('Essa decisão é de outra função.');
          if (!d.opcoes.some((o) => o.id === dados.escolha)) throw new Error('Escolha uma opção.');
          resolverDilema(e, d, dados.escolha, usuario.nome);
          contar(usuario.id, 'acoes');
          return publica(usuario);
        }
        const f = acoes[funcao] && acoes[funcao][tipo];
        if (!f) throw new Error('Ação desconhecida.');
        const r = f(e, dados);
        contar(usuario.id, funcao === 'caixa' || funcao === 'chapeiro' ? 'lanches' : 'acoes');
        return { ...publica(usuario), resposta: r || null };
      },
      // Pedido interno entre setores (com prazo) e a resposta de quem recebe.
      pedido(usuario, { de, para, item, qtd, prazo, texto } = {}) {
        temPartida(); avancar();
        const e = empresaDe(usuario.id) || (usuario.papel === 'instrutor' && partida.empresas[0]);
        if (!e) throw new Error('Entre no jogo primeiro.');
        if (!porId[para]) throw new Error('Para quem é o pedido?');
        const itens = Object.fromEntries(ITENS_PEDIDO);
        if (!itens[item]) throw new Error('O que você está pedindo?');
        const minhas = partida.modo === 'cada' ? partida.ativas : partida.funcoesDe[usuario.id] || [];
        const origem = porId[de] && (minhas.includes(de) || usuario.papel === 'instrutor') ? de : minhas[0] || 'diretor';
        const p = { id: novoId('q'), de: origem, deNome: usuario.nome, para, item, nomeItem: itens[item], qtd: Math.max(0, Math.round(Number(qtd) || 0)), prazo: Math.max(diaDe(agoraJogo()), Math.round(Number(prazo) || diaDe(agoraJogo()))), texto: limpo(texto).slice(0, 140), status: 'aberto', em: agoraJogo() };
        e.pedidos.push(p); if (e.pedidos.length > 80) e.pedidos.shift();
        contar(usuario.id, 'pedidos');
        return publica(usuario);
      },
      responderPedido(usuario, { id, status } = {}) {
        temPartida(); avancar();
        const e = empresaDe(usuario.id) || (usuario.papel === 'instrutor' && partida.empresas[0]);
        const p = e && e.pedidos.find((x) => x.id === id);
        if (!p) throw new Error('Pedido não encontrado.');
        const minhas = partida.modo === 'cada' ? partida.ativas : partida.funcoesDe[usuario.id] || [];
        if (usuario.papel !== 'instrutor' && !minhas.includes(p.para) && !minhas.includes('diretor')) throw new Error('Esse pedido é para outra função.');
        if (!['aceito', 'recusado', 'feito'].includes(status)) throw new Error('Resposta inválida.');
        p.status = status; p.respondidoPor = usuario.nome; p.respondidoEm = agoraJogo();
        if (status === 'feito') contar(usuario.id, 'atendidos');
        return publica(usuario);
      },
      falar(usuario, { texto, para } = {}) {
        temPartida();
        const e = empresaDe(usuario.id) || (usuario.papel === 'instrutor' && partida.empresas[0]);
        if (!e) throw new Error('Entre no jogo primeiro.');
        const t = limpo(texto); if (!t) throw new Error('Escreva a mensagem.');
        const minhas = partida.modo === 'cada' ? [] : partida.funcoesDe[usuario.id] || [];
        e.conversa.push({ id: novoId('m'), de: usuario.nome, avatar: usuario.avatar || '🙂', deFuncoes: minhas.slice(), professor: usuario.papel === 'instrutor', para: porId[para] ? para : null, texto: t, em: agoraJogo() });
        if (e.conversa.length > 200) e.conversa.shift();
        contar(usuario.id, 'mensagens');
        return publica(usuario);
      },
      estado(usuario) { return publica(usuario); },
      // O convite (para quem ainda não entrou): aparece no computador do aluno.
      convite(usuario) {
        if (!partida || partida.estado === 'fim' || !usuario || usuario.papel === 'instrutor') return null;
        if (partida.turma && usuario.turma !== partida.turma) return null;
        return { id: partida.id, entrou: partida.participantes.some((p) => p.id === usuario.id), por: partida.por, estado: partida.estado };
      },
      resumo() { return partida && partida.estado === 'fim' ? { em: partida.fimEm, dias: partida.dias, nivel: partida.nivel, modo: partida.modo, resultado: partida.resultado, stats: partida.stats } : null; },
      // Para os testes: o relógio "por dentro"
      _partida: () => partida,
    };
  };
});
