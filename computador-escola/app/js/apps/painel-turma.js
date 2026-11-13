// Painel do Instrutor, aba "🏁 Gincana, missão e jornal": as três coisas que movimentam a turma.
//  • Gincana ao vivo: abre o programa da gincana e mostra o resultado da última.
//  • Missão da semana: o instrutor escolhe a missão (ou deixa automática) e vê quem já cumpriu.
//  • Jornal da turma: lê as matérias que os alunos mandaram, aprova ou pede para melhorar, monta o jornal com os
//    destaques da semana (medalhas, certificados, recorde no teclado, missão e gincana) e fecha a edição.
window.CE = window.CE || {};

(function () {
  const alunosDe = (usuarios, turma) => usuarios.filter((u) => u.papel === 'aluno' && (!turma || u.turma === turma))
    .sort((a, b) => ((a.turma || '') + a.nome).localeCompare((b.turma || '') + b.nome));
  const turmasDe = (usuarios) => [...new Set(usuarios.filter((u) => u.papel === 'aluno').map((u) => u.turma).filter(Boolean))].sort();
  const comProgresso = (alunos) => Promise.all(alunos.map(async (usuario) => ({ usuario, progresso: await CE.sessao.progresso(usuario.id) })));
  const data = (em) => new Date(em).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  const SITUACAO = { enviada: ['⏳', 'Esperando você ler'], aprovada: ['✅', 'Aprovada (vai no jornal)'], recusada: ['✏️', 'Pediu para melhorar'] };

  // ---------- Gincana ----------
  async function gincana() {
    const [atual, ultima] = await Promise.all([CE.api.chamar('gincana:estado').catch(() => null), CE.api.chamar('gincana:ultima').catch(() => null)]);
    const aberta = atual && atual.fase !== 'fim';
    return CE.el('section', { class: 'pt-secao', 'data-secao-turma': 'gincana' },
      CE.el('h3', {}, '🏆 Gincana ao vivo'),
      CE.el('p', {}, 'Perguntas sorteadas das aulas e tarefas práticas no computador, com placar ao vivo (dá para mostrar no projetor). Os alunos recebem o convite na tela em poucos segundos.'),
      aberta ? CE.el('p', { class: 'pt-aviso', 'data-gincana-aberta': '' }, `🔴 Tem uma gincana aberta agora: "${atual.titulo}" (${atual.participantes.length} aluno(s)).`) : '',
      CE.el('button', { class: 'botao', 'data-acao': 'abrir-programa-gincana', onclick: () => CE.janelas.abrir('gincana') }, aberta ? '🏆 Voltar para a gincana' : '🏆 Abrir a Gincana'),
      ultima && ultima.podio ? CE.el('div', { class: 'pt-ultima', 'data-ultima-gincana': ultima.titulo },
        CE.el('strong', {}, `Última gincana: ${ultima.titulo} (${data(ultima.em)}, ${ultima.participantes} aluno(s))`),
        CE.el('div', {}, ultima.podio.map((p, i) => `${['🥇', '🥈', '🥉'][i]} ${p.nome} (${p.pontos} pts)`).join('   ')),
        ultima.equipes && ultima.equipes.length ? CE.el('div', {}, `👑 Equipe campeã: ${ultima.equipes[0].nome} com ${ultima.equipes[0].pontos} pontos`) : '') : '');
  }

  // ---------- Missão da semana ----------
  async function missao(alunos, redesenhar) {
    await CE.missao.atualizar(); // outra pessoa pode ter trocado a missão (dois computadores de instrutor)
    const escola = await CE.escola.ler().catch(() => ({}));
    const semana = CE.missao.semana().id;
    const escolhida = escola.missao && escola.missao.id && (!escola.missao.semana || escola.missao.semana === semana) ? escola.missao.id : '';
    const exemplos = [1, 2, 3].map((n) => `${CE.missao.NOMES_NIVEL[n]}: ${CE.missao.automatica(n).icone} ${CE.missao.automatica(n).titulo}`).join(' · ');
    const grupos = Object.entries({ n1: 'Iniciante', n2: 'Intermediário', cel: 'Curso de Celular', n3: 'Avançado', cri: 'Criação digital', n4: 'Profissional', n5: 'Assistente Administrativo' });
    const seletor = CE.el('select', { class: 'campo painel-seletor', 'data-campo': 'missao-semana', onchange: async () => {
      await CE.api.chamar('escola:missao', { id: seletor.value, semana });
      await CE.missao.atualizar();
      const m = CE.missao.atual();
      CE.emitir('instrutor:missao', { missao: seletor.value || 'automatica', titulo: m.titulo });
      CE.avisar(`🎯 Missão da semana: ${m.titulo}. Os alunos veem no próximo login (ou ao clicar no 🎯 da barra).`);
      redesenhar();
    } },
    CE.el('option', { value: '' }, '🔄 Automática: cada aluno recebe uma missão do nível dele (muda toda segunda)'),
    ...grupos.map(([nivel, nome]) => CE.el('optgroup', { label: `Para todos — ${nome}` }, ...CE.MISSOES.filter((m) => m.nivel === nivel).map((m) => CE.el('option', { value: m.id }, `${m.icone} ${m.titulo}`)))));
    seletor.value = escolhida;
    const atual = CE.missao.escolhida();
    const linhas = alunos.map(({ usuario, progresso }) => {
      const s = CE.missao.situacao(progresso);
      return CE.el('tr', { 'data-aluno-missao': usuario.nome, 'data-cumpriu': s.feita ? 'sim' : 'nao', 'data-missao-aluno': s.missao.id },
        CE.el('td', {}, `${usuario.avatar || ''} ${usuario.nome}`), CE.el('td', {}, usuario.turma || '—'),
        CE.el('td', {}, `${s.missao.icone} ${s.missao.titulo}`),
        CE.el('td', {}, s.feita ? `✅ Cumpriu (${data(s.em)})` : s.missao.contar > 1 && s.contador ? `⏳ ${s.contador} de ${s.missao.contar}` : '—'),
        CE.el('td', { class: 'num' }, String(CE.missao.cumpridas(progresso))));
    });
    const cumpriram = alunos.filter(({ progresso }) => CE.missao.situacao(progresso).feita).length;
    return CE.el('section', { class: 'pt-secao', 'data-secao-turma': 'missao' },
      CE.el('h3', {}, '🎯 Missão da semana'),
      CE.el('p', {}, 'Um desafio curto que vale para a semana toda. O computador confere sozinho quando o aluno cumpre, pelo que ele fez de verdade (e comemora).'),
      CE.el('label', {}, 'Missão desta semana', seletor),
      CE.el('p', { class: 'ft-dica' }, atual ? `Para todos: ${atual.icone} ${atual.titulo}. 💡 ${atual.dica}` : `Automática nesta semana — ${exemplos}...`),
      CE.el('p', { 'data-missao-total': String(cumpriram) }, `${cumpriram} de ${alunos.length} aluno(s) já cumpriram.`),
      alunos.length ? CE.el('table', { class: 'painel-tabela' },
        CE.el('thead', {}, CE.el('tr', {}, ...['Aluno', 'Turma', 'Missão desta semana', 'Situação', 'Missões cumpridas'].map((t) => CE.el('th', {}, t)))),
        CE.el('tbody', {}, ...linhas)) : CE.el('p', {}, 'Nenhum aluno nesta turma.'));
  }

  // ---------- Monitores da turma ----------
  function monitores(alunos) {
    const linhas = alunos.map(({ usuario, progresso }) => {
      const ritmo = CE.ritmo ? CE.ritmo.NIVEIS[CE.ritmo.classificar(progresso)] : null;
      const caixa = CE.el('input', { type: 'checkbox', 'data-monitor': usuario.nome, checked: progresso.monitor ? true : null, onchange: async () => {
        try {
          await CE.api.chamar('monitor:definir', [usuario.id], caixa.checked);
          CE.emitir('instrutor:monitor', { aluno: usuario.nome, monitor: caixa.checked });
          CE.avisar(caixa.checked ? `💁 ${usuario.nome} agora é monitor(a) da turma (vale a partir do próximo login).` : `${usuario.nome} não é mais monitor(a).`);
        } catch (e) { CE.avisar('⚠️ ' + e.message); caixa.checked = !caixa.checked; }
      } });
      return CE.el('tr', { 'data-aluno-monitor': usuario.nome },
        CE.el('td', {}, CE.el('label', { class: 'pc-check' }, caixa, CE.el('span', {}, `${usuario.avatar || ''} ${usuario.nome}`))),
        CE.el('td', {}, usuario.turma || '—'), CE.el('td', {}, ritmo ? `${ritmo.icone} ${ritmo.rotulo}` : '—'),
        CE.el('td', { class: 'num', 'data-ajudas-aluno': String(progresso.ajudas || 0) }, String(progresso.ajudas || 0)));
    });
    return CE.el('section', { class: 'pt-secao', 'data-secao-turma': 'monitores' },
      CE.el('h3', {}, '💁 Monitores da turma'),
      CE.el('p', {}, 'Marque alunos que vão bem (os 🚀 avançados, por exemplo) para ajudar os colegas que apertam "🙋 Não entendi". O monitor vê os pedidos no 💁 da barra de tarefas, avisa que vai ajudar (o colega recebe o aviso) e marca quando ajudou. Funciona na rede da sala.'),
      alunos.length ? CE.el('table', { class: 'painel-tabela' },
        CE.el('thead', {}, CE.el('tr', {}, ...['Monitor', 'Turma', 'Ritmo', 'Ajudas dadas'].map((t) => CE.el('th', {}, t)))),
        CE.el('tbody', {}, ...linhas)) : CE.el('p', {}, 'Nenhum aluno nesta turma.'));
  }

  // ---------- Jornal da turma ----------
  async function jornal(todos, redesenhar) {
    const j = await CE.api.chamar('jornal:listar');
    const materias = [...j.materias].sort((a, b) => ['enviada', 'aprovada', 'recusada'].indexOf(a.status) - ['enviada', 'aprovada', 'recusada'].indexOf(b.status) || a.em - b.em);
    const aprovadas = j.materias.filter((m) => m.status === 'aprovada');
    const mudar = (m, status) => async () => {
      try {
        await CE.api.chamar('jornal:status', m.id, status);
        CE.emitir('instrutor:jornal', { acao: status, titulo: m.titulo });
        redesenhar();
      } catch (e) { CE.avisar('⚠️ ' + e.message); }
    };
    const cartao = (m) => {
      const [icone, texto] = SITUACAO[m.status] || ['', m.status];
      const leitura = CE.el('div', { class: 'pt-leitura jn-texto', hidden: true, html: CE.jornal.limpar(m.html) });
      return CE.el('div', { class: `pt-materia ${m.status}`, 'data-materia': m.titulo, 'data-status': m.status },
        CE.el('div', { class: 'pt-materia-topo' },
          CE.el('div', {}, CE.el('b', {}, m.titulo), CE.el('small', {}, ` — por ${m.autor}${m.turma ? ` (turma ${m.turma})` : ''}, ${data(m.em)}`)),
          CE.el('span', { class: 'pt-status' }, `${icone} ${texto}`)),
        CE.el('div', { class: 'pt-materia-acoes' },
          CE.el('button', { class: 'botao secundario pequeno', 'data-acao': 'ler-materia', onclick: () => { leitura.hidden = !leitura.hidden; } }, '👁️ Ler'),
          m.status !== 'aprovada' ? CE.el('button', { class: 'botao pequeno', 'data-acao': 'aprovar-materia', onclick: mudar(m, 'aprovada') }, '✅ Aprovar') : '',
          m.status !== 'recusada' ? CE.el('button', { class: 'botao secundario pequeno', 'data-acao': 'recusar-materia', onclick: mudar(m, 'recusada') }, '✏️ Pedir para melhorar') : '',
          m.status !== 'enviada' ? CE.el('button', { class: 'botao secundario pequeno', 'data-acao': 'voltar-materia', onclick: mudar(m, 'enviada') }, '↩️ Desfazer') : ''),
        leitura);
    };
    const montar = CE.el('button', { class: 'botao', 'data-acao': 'montar-jornal', onclick: async () => {
      const [escola, ultima, comTodos] = await Promise.all([CE.escola.ler(), CE.api.chamar('gincana:ultima').catch(() => null), comProgresso(todos)]);
      const destaques = CE.jornal.destaques(comTodos, ultima);
      const paginas = CE.jornal.paginas({ jornal: j, escola, destaques, materias: aprovadas });
      CE.imprimir({ titulo: `📰 Jornal da Turma — edição nº ${j.edicao}`, paginas, nomeArquivo: `jornal-da-turma-${j.edicao}.pdf` });
      CE.emitir('instrutor:jornal', { acao: 'montou', edicao: j.edicao, materias: aprovadas.length, destaques: destaques.length });
    } }, `🖨️ Montar o jornal (${aprovadas.length} matéria(s) aprovada(s))`);
    const fechar = CE.el('button', { class: 'botao secundario', 'data-acao': 'fechar-edicao', disabled: !aprovadas.length || null, onclick: async () => {
      if (!await CE.confirmar(`Fechar a edição nº ${j.edicao}? As ${aprovadas.length} matéria(s) aprovada(s) ficam como publicadas, as que pediu para melhorar saem e as que faltam ler passam para a edição nº ${j.edicao + 1}. (Imprima ou salve o jornal antes!)`)) return;
      try {
        await CE.api.chamar('jornal:nova-edicao');
        CE.emitir('instrutor:jornal', { acao: 'fechou', edicao: j.edicao });
        CE.avisar(`📰 Edição nº ${j.edicao} fechada. Começou a edição nº ${j.edicao + 1}.`);
        redesenhar();
      } catch (e) { CE.avisar('⚠️ ' + e.message); }
    } }, `📦 Fechar a edição nº ${j.edicao}`);
    const pendentes = j.materias.filter((m) => m.status === 'enviada').length;
    return CE.el('section', { class: 'pt-secao', 'data-secao-turma': 'jornal' },
      CE.el('h3', {}, `📰 Jornal da turma — edição nº ${j.edicao}`),
      CE.el('p', {}, 'Os alunos escrevem no Editor de Texto e clicam em "📰 Jornal". Você lê, aprova ou pede para melhorar e monta o jornal para imprimir ou salvar em PDF. Os destaques da semana (medalhas, certificados, recorde no teclado, missão e gincana) entram sozinhos.'),
      CE.el('div', { class: 'painel-sala-acoes' }, montar, fechar),
      CE.el('p', { 'data-jornal-pendentes': String(pendentes) }, pendentes ? `⏳ ${pendentes} matéria(s) esperando você ler.` : 'Nenhuma matéria esperando leitura.'),
      materias.length ? CE.el('div', { class: 'pt-materias' }, ...materias.map(cartao)) : CE.el('p', { class: 'ft-dica' }, 'Ainda não chegou nenhuma matéria nesta edição.'),
      j.publicadas.length ? CE.el('p', { class: 'ft-dica' }, `Já publicadas: ${j.publicadas.length} matéria(s) em ${new Set(j.publicadas.map((m) => m.edicao)).size} edição(ões).`) : '');
  }

  async function tela(estado, redesenhar) {
    const usuarios = await CE.api.chamar('usuarios:listar');
    const todos = alunosDe(usuarios, '');
    const alunos = await comProgresso(alunosDe(usuarios, estado.turma));
    const seletor = CE.el('select', { class: 'campo painel-seletor', 'data-campo': 'turma', onchange: () => { estado.turma = seletor.value; redesenhar(); } },
      CE.el('option', { value: '' }, 'Todas as turmas'), ...turmasDe(usuarios).map((t) => CE.el('option', { value: t }, `Turma ${t}`)));
    seletor.value = estado.turma || '';
    return CE.el('div', { class: 'painel-turma' },
      CE.el('div', { class: 'painel-sala-acoes' }, CE.el('strong', {}, '🏁 Gincana, missão e jornal'), seletor),
      await gincana(),
      await missao(alunos, redesenhar),
      monitores(alunos),
      await jornal(todos, redesenhar));
  }

  CE.painelTurma = { tela };
})();
