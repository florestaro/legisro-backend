// Painel do Instrutor: "Onde a turma trava", "Certificados e relatório" e "Liberar aulas" fora da sequência.
// (O Painel chama estas telas; o estado — turma escolhida, período... — fica com ele entre uma tela e outra.)
window.CE = window.CE || {};

(function () {
  const alunosDe = (usuarios, turma) => usuarios.filter((u) => u.papel === 'aluno' && (!turma || u.turma === turma))
    .sort((a, b) => (a.turma + a.nome).localeCompare(b.turma + b.nome));
  const turmasDe = (usuarios) => [...new Set(usuarios.filter((u) => u.papel === 'aluno').map((u) => u.turma).filter(Boolean))].sort();
  const comProgresso = (alunos) => Promise.all(alunos.map(async (usuario) => ({ usuario, progresso: await CE.sessao.progresso(usuario.id) })));
  const nomeDoNivel = (id) => { const n = CE.NIVEIS_CURSO.find((x) => x.id === id); return n ? `${n.icone} ${n.nome}` : ''; };

  function seletorTurma(turmas, estado, aoMudar) {
    const s = CE.el('select', { class: 'campo painel-seletor', 'data-campo': 'turma', onchange: () => { estado.turma = s.value; aoMudar(); } },
      CE.el('option', { value: '' }, 'Todas as turmas'), ...turmas.map((t) => CE.el('option', { value: t }, `Turma ${t}`)));
    s.value = estado.turma || '';
    return s;
  }

  // ---------- Onde a turma trava ----------
  async function ondeTrava(estado, redesenhar) {
    const usuarios = await CE.api.chamar('usuarios:listar');
    const alunos = await comProgresso(alunosDe(usuarios, estado.turma));
    const lista = CE.dificuldades.somar(alunos);
    const totais = lista.reduce((t, x) => { Object.keys(t).forEach((k) => { t[k] += x.totais[k]; }); return t; }, { naoEntendi: 0, dica: 0, erro: 0, desistiu: 0 });
    const zerar = CE.el('button', { class: 'botao secundario pequeno', 'data-acao': 'zerar-dificuldades', onclick: async () => {
      if (!await CE.confirmar(`Zerar a contagem de "onde trava" de ${alunos.length} aluno(s)${estado.turma ? ` da turma ${estado.turma}` : ''}? (Bom fazer depois de mudar uma aula.)`)) return;
      await CE.api.chamar('progresso:zerar-dificuldades', alunos.map((a) => a.usuario.id));
      CE.avisar('Contagem zerada.');
      redesenhar();
    } }, '🧹 Zerar contagem');
    const linhas = lista.slice(0, 40).map((x) => CE.el('tr', { 'data-trava': `${x.licao.id}|${x.passo}` },
      CE.el('td', {}, `${x.licao.icone} ${x.licao.titulo}`, CE.el('br'), CE.el('small', {}, x.licao.extra ? '📌 Aula do professor' : nomeDoNivel(x.licao.nivel))),
      CE.el('td', { class: 'painel-trava-passo' }, CE.el('b', {}, `Passo ${x.passo + 1}: `), x.texto),
      CE.el('td', { class: 'painel-celula', title: x.alunos.join(', ') }, CE.el('b', {}, String(x.alunos.length)), CE.el('br'),
        CE.el('small', {}, x.alunos.slice(0, 3).join(', ') + (x.alunos.length > 3 ? ` e mais ${x.alunos.length - 3}` : ''))),
      ...CE.dificuldades.TIPOS.map(([tipo]) => CE.el('td', { class: 'painel-celula' }, x.totais[tipo] ? String(x.totais[tipo]) : '·')),
      CE.el('td', {}, CE.el('button', { class: 'botao secundario pequeno', 'data-acao': 'ver-passo', title: 'Abre a aula neste passo para você ver como está explicado',
        onclick: () => CE.professor.comecarLicao(x.licao.id, { passo: x.passo }) }, '▶ Ver'))));
    return CE.el('div', { class: 'painel-trava' },
      CE.el('div', { class: 'painel-sala-acoes' },
        seletorTurma(turmasDe(usuarios), estado, redesenhar),
        CE.el('span', { class: 'painel-legenda' }, `${alunos.length} aluno(s) · 🙋 ${totais.naoEntendi} · 💡 ${totais.dica} · ❌ ${totais.erro} · 🚪 ${totais.desistiu}`),
        lista.length ? zerar : null),
      CE.el('p', { class: 'painel-legenda' }, 'Os passos em que mais alunos tiveram dificuldade aparecem primeiro. 🙋 apertou "Não entendi" · 💡 ficou parado até a dica aparecer · ❌ errou a pergunta · 🚪 saiu da aula no meio. Só conta o que os alunos fazem (não o instrutor testando).'),
      lista.length
        ? CE.el('table', { class: 'painel-tabela' },
          CE.el('thead', {}, CE.el('tr', {}, ...['Aula', 'Passo', 'Alunos', '🙋', '💡', '❌', '🚪', ''].map((t) => CE.el('th', {}, t)))),
          CE.el('tbody', {}, ...linhas))
        : CE.el('p', { class: 'painel-vazio' }, 'Nenhuma dificuldade registrada ainda. Quando os alunos apertarem "🙋 Não entendi", ficarem parados até a dica aparecer, errarem uma pergunta ou saírem de uma aula no meio, os passos aparecem aqui.'));
  }

  // ---------- Certificados e relatório ----------
  const CARGAS = [['n1', 'Informática Nível 1'], ['n2', 'Informática Nível 2'], ['n3', 'Informática Nível 3'],
    ['digitacao1', 'Digitação Nível 1'], ['digitacao2', 'Digitação Nível 2'], ['digitacao3', 'Digitação Nível 3']];

  async function certificadosERelatorio(estado, redesenhar) {
    const [escola, usuarios] = await Promise.all([CE.escola.ler(), CE.api.chamar('usuarios:listar')]);
    const alunos = await comProgresso(alunosDe(usuarios, estado.turma));
    const cursos = CE.certificados.cursos();

    // Dados da escola (aparecem no certificado)
    const campo = (nome, rotulo, valor, extra = {}) => CE.el('label', { class: 'painel-campo' }, rotulo, CE.el('input', { class: 'campo', 'data-campo': nome, value: valor || '', ...extra }));
    const formEscola = CE.el('div', { class: 'painel-escola' },
      campo('escola-nome', 'Nome da escola ou do projeto', escola.nome, { placeholder: 'Ex.: Escola Municipal Esperança' }),
      campo('escola-cidade', 'Cidade', escola.cidade, { placeholder: 'Ex.: Porto Velho - RO' }),
      campo('escola-responsavel', 'Quem assina', escola.responsavel, { placeholder: 'Nome do instrutor(a) responsável' }),
      campo('escola-cargo', 'Cargo de quem assina', escola.cargo),
      CE.el('div', { class: 'painel-cargas' }, ...CARGAS.map(([k, rotulo]) => campo(`carga-${k}`, `${rotulo} (horas)`, escola.cargas[k], { type: 'number', min: '1', max: '2000' }))));
    const salvarEscola = CE.el('button', { class: 'botao', 'data-acao': 'salvar-escola', onclick: async () => {
      const v = (n) => formEscola.querySelector(`[data-campo="${n}"]`).value;
      const cargas = {}; CARGAS.forEach(([k]) => { cargas[k] = Number(v(`carga-${k}`)); });
      try {
        await CE.escola.salvar({ nome: v('escola-nome'), cidade: v('escola-cidade'), responsavel: v('escola-responsavel'), cargo: v('escola-cargo'), cargas });
        CE.avisar('✅ Dados da escola salvos.');
        redesenhar();
      } catch (e) { CE.avisar(e.message); }
    } }, '💾 Salvar dados da escola');

    // Relatório da turma
    const periodo = CE.el('select', { class: 'campo painel-seletor', 'data-campo': 'periodo', onchange: () => { estado.periodo = periodo.value; } },
      ...CE.relatorio.PERIODOS.map(([id, nome]) => CE.el('option', { value: id }, nome)));
    periodo.value = estado.periodo || 'mes';
    const nomeRelatorio = (ext) => `Relatório ${estado.turma ? 'turma ' + estado.turma : 'todas as turmas'} - ${CE.relatorio.intervalo(periodo.value).nome}.${ext}`;
    const verRelatorio = CE.el('button', { class: 'botao', 'data-acao': 'ver-relatorio', onclick: async () => {
      const d = await CE.relatorio.dados({ turma: estado.turma, periodo: periodo.value });
      CE.imprimir({ titulo: 'Relatório da turma', paginas: CE.relatorio.paginas(d), paisagem: true, nomeArquivo: nomeRelatorio('pdf') });
      CE.emitir('instrutor:relatorio', { turma: estado.turma, periodo: periodo.value, alunos: d.linhas.length });
    } }, '📊 Ver o relatório');
    const planilha = CE.el('button', { class: 'botao secundario', 'data-acao': 'relatorio-csv', onclick: async () => {
      const d = await CE.relatorio.dados({ turma: estado.turma, periodo: periodo.value });
      try {
        const onde = await CE.api.chamar('arquivo:salvar-texto', { nome: nomeRelatorio('csv'), conteudo: CE.relatorio.csv(d), tipo: 'text/csv;charset=utf-8' });
        if (onde) CE.avisar(`📄 Planilha salva${onde.includes('/') || onde.includes('\\') ? ` em ${onde}` : ''}.`);
      } catch (e) { CE.avisar(e.message); }
    } }, '📄 Planilha (CSV)');

    // Certificados
    const imprimirCertificados = async (itens, titulo, nomeArquivo) => {
      const paginas = await CE.certificados.paginas(itens);
      if (!paginas.length) { CE.avisar('Nenhum certificado para imprimir.'); return; }
      CE.imprimir({ titulo, paginas, paisagem: true, nomeArquivo });
      CE.emitir('instrutor:certificados', { quantos: paginas.length });
    };
    const cursoLote = CE.el('select', { class: 'campo painel-seletor', 'data-campo': 'curso-lote', onchange: () => { estado.curso = cursoLote.value; } },
      ...cursos.map((c) => CE.el('option', { value: c.id }, `${c.curso} · ${c.nivel}`)));
    cursoLote.value = estado.curso || cursos[0].id;
    const lote = CE.el('button', { class: 'botao', 'data-acao': 'certificados-turma', onclick: () => {
      const curso = cursos.find((c) => c.id === cursoLote.value);
      const itens = alunos.filter((a) => curso.situacao(a.progresso).conquistado).map((a) => ({ aluno: a.usuario, curso }));
      imprimirCertificados(itens, `Certificados — ${curso.curso} ${curso.nivel}`, `Certificados ${curso.curso} ${curso.nivel}${estado.turma ? ' - turma ' + estado.turma : ''}.pdf`);
    } }, '🖨️ Todos desta turma');
    const linhas = alunos.map(({ usuario, progresso }) => {
      const conquistados = CE.certificados.conquistados(progresso);
      return CE.el('tr', { 'data-aluno-certificados': usuario.nome },
        CE.el('td', {}, `${usuario.avatar} ${usuario.nome}`), CE.el('td', {}, usuario.turma || '—'),
        CE.el('td', { class: 'painel-certificados' }, ...(conquistados.length ? conquistados.map(({ curso, situacao }) => CE.el('button', {
          class: 'botao secundario pequeno', 'data-certificado': curso.id, title: situacao.dispensado ? 'Este nível foi dispensado pelo teste de nivelamento' : `Concluído em ${new Date(situacao.em).toLocaleDateString('pt-BR')}`,
          onclick: () => imprimirCertificados([{ aluno: usuario, curso }], `Certificado de ${usuario.nome}`, `Certificado ${usuario.nome} - ${curso.curso} ${curso.nivel}.pdf`),
        }, `📜 ${curso.curso} ${curso.nivel.split(' — ')[0]}${situacao.dispensado ? ' (nivelamento)' : ''}`)) : [CE.el('small', {}, 'Ainda nenhum')])));
    });

    return CE.el('div', { class: 'painel-certificados-tela' },
      CE.el('section', { class: 'painel-secao' }, CE.el('h3', {}, '🏫 Dados da escola'),
        CE.el('p', { class: 'painel-legenda' }, 'Aparecem no certificado e no relatório. A carga horária de cada curso é a que sai no certificado.'),
        formEscola, salvarEscola),
      CE.el('section', { class: 'painel-secao' }, CE.el('h3', {}, '📊 Relatório da turma'),
        CE.el('p', { class: 'painel-legenda' }, 'Frequência (dias e horas de uso), aulas aprovadas, digitação, certificados, lista de presença e onde a turma mais travou. Dá para imprimir, salvar em PDF ou abrir a planilha no Excel/LibreOffice.'),
        CE.el('div', { class: 'painel-sala-acoes' }, seletorTurma(turmasDe(usuarios), estado, redesenhar), periodo, verRelatorio, planilha)),
      CE.el('section', { class: 'painel-secao' }, CE.el('h3', {}, '📜 Certificados'),
        escola.nome ? null : CE.el('p', { class: 'painel-legenda painel-alerta' }, '⚠️ Preencha o nome da escola acima para ele aparecer no certificado.'),
        CE.el('p', { class: 'painel-legenda' }, 'O aluno ganha o certificado ao terminar todas as aulas de um nível de Informática (com a prova) ou ao passar na prova de um nível de Digitação. Clique para ver, imprimir ou salvar em PDF.'),
        CE.el('div', { class: 'painel-sala-acoes' }, cursoLote, lote),
        alunos.length
          ? CE.el('table', { class: 'painel-tabela' }, CE.el('thead', {}, CE.el('tr', {}, ...['Aluno', 'Turma', 'Certificados conquistados'].map((t) => CE.el('th', {}, t)))), CE.el('tbody', {}, ...linhas))
          : CE.el('p', {}, 'Nenhum aluno nesta turma.')));
  }

  // ---------- Liberar aulas fora da sequência ----------
  async function liberarAulas(usuario, aoMudar) {
    const [progresso, usuarios] = await Promise.all([CE.sessao.progresso(usuario.id), CE.api.chamar('usuarios:listar')]);
    const marcadas = { ...(progresso.liberadas || {}) };
    const caixa = (chave, rotulo, classe = '') => {
      const c = CE.el('input', { type: 'checkbox', 'data-liberar': chave });
      c.checked = !!marcadas[chave];
      c.addEventListener('change', () => { if (c.checked) marcadas[chave] = true; else delete marcadas[chave]; });
      return CE.el('label', { class: 'painel-check ' + classe }, c, ' ', rotulo);
    };
    const niveis = CE.NIVEIS_CURSO.map((n) => CE.el('section', { class: 'liberar-nivel' },
      CE.el('h4', {}, `${n.icone} Informática — ${n.nome}`),
      caixa(`nivel:${n.id}`, 'Liberar o nível inteiro', 'forte'),
      ...CE.MODULOS.filter((m) => m.nivel === n.id).map((m) => {
        const aulas = CE.LICOES.filter((l) => l.modulo === m.id);
        const aberto = marcadas[`modulo:${m.id}`] || aulas.some((l) => marcadas[l.id]);
        return CE.el('details', { class: 'liberar-modulo', open: aberto || null },
          CE.el('summary', {}, `${m.icone} ${m.titulo}`),
          caixa(`modulo:${m.id}`, 'Módulo inteiro', 'forte'),
          ...aulas.map((l) => caixa(l.id, `${l.icone} ${l.titulo}${l.reforco ? ' · reforço' : ''}`)));
      })));
    const digitacao = CE.el('section', { class: 'liberar-nivel' }, CE.el('h4', {}, '⌨️ Digitação'),
      ...CE.DIGITACAO.niveis.map((n) => caixa(`digitacao:${n.id}`, `${n.icone} Nível ${n.nome} inteiro`)));
    const colegas = usuario.turma ? alunosDe(usuarios, usuario.turma) : [usuario];
    await CE.curso.carregarTrilha();
    const trilha = CE.el('select', { 'data-campo': 'trilha-aluno' },
      CE.el('option', { value: '' }, `Igual à da escola (${CE.curso.TRILHAS[CE.curso.trilhaDaEscola()]})`),
      ...Object.entries(CE.curso.TRILHAS).map(([id, nome]) => CE.el('option', { value: id }, nome)));
    trilha.value = progresso.trilha || '';
    const paraTurma = CE.el('input', { type: 'checkbox', 'data-campo': 'liberar-turma' });
    const fundo = CE.el('div', { class: 'dialogo-fundo' }, CE.el('div', { class: 'dialogo largo painel-liberar' },
      CE.el('h3', {}, `🔓 Liberar aulas para ${usuario.nome}`),
      CE.el('p', { class: 'painel-legenda' }, 'Marque o que pode ser feito fora da ordem do curso. O resto continua liberando em sequência (e depois de uma aula liberada, a seguinte abre quando o aluno passar nela).'),
      CE.el('label', { class: 'painel-check' }, '🧭 Trilha deste aluno: ', trilha),
      CE.el('div', { class: 'liberar-lista' }, ...niveis, digitacao),
      usuario.turma && colegas.length > 1 ? CE.el('label', { class: 'painel-check' }, paraTurma, ` Fazer o mesmo para toda a turma ${usuario.turma} (${colegas.length} alunos)`) : null,
      CE.el('div', { class: 'dialogo-botoes' },
        CE.el('button', { class: 'botao secundario', onclick: () => fundo.remove() }, 'Cancelar'),
        CE.el('button', { class: 'botao', 'data-acao': 'salvar-liberacao', onclick: async () => {
          const ids = paraTurma.checked ? colegas.map((u) => u.id) : [usuario.id];
          try {
            await CE.api.chamar('progresso:liberar', ids, marcadas, trilha.value);
            const n = Object.keys(marcadas).length;
            const novaTrilha = trilha.value !== (progresso.trilha || '') ? ` Trilha: ${trilha.value ? CE.curso.TRILHAS[trilha.value] : 'a da escola'}.` : '';
            CE.avisar((n ? `🔓 Liberado para ${ids.length > 1 ? `${ids.length} alunos` : usuario.nome}.` : `As aulas de ${ids.length > 1 ? 'toda a turma' : usuario.nome} seguem a sequência normal.`) + novaTrilha);
            CE.emitir('instrutor:liberou', { alunos: ids.length, itens: Object.keys(marcadas) });
            fundo.remove();
            if (aoMudar) aoMudar();
          } catch (e) { CE.avisar(e.message); }
        } }, '💾 Salvar'))));
    document.body.append(fundo);
  }

  // ---------- Trilha do curso (para a escola toda) ----------
  async function escolhaDaTrilha(redesenhar) {
    await CE.curso.carregarTrilha();
    const atual = CE.curso.trilhaDaEscola();
    const contar = (trilha) => CE.NIVEIS_CURSO.map((n) => `${n.nome} ${CE.LICOES.filter((l) => l.nivel === n.id && (trilha === 'completa' || !l.reforco)).length}`).join(' · ');
    const opcao = (id, rotulo, detalhe) => {
      const r = CE.el('input', { type: 'radio', name: 'trilha-escola', value: id, 'data-trilha': id });
      r.checked = atual === id;
      r.addEventListener('change', async () => {
        try {
          await CE.api.chamar('escola:trilha', id);
          await CE.curso.carregarTrilha();
          CE.avisar(`${CE.curso.TRILHAS[id]} escolhida para a escola. Os alunos veem a mudança na próxima vez que entrarem.`);
          CE.emitir('instrutor:trilha', { trilha: id });
          redesenhar();
        } catch (e) { CE.avisar(e.message); r.checked = false; }
      });
      return CE.el('label', { class: 'painel-check' + (atual === id ? ' forte' : '') }, r, ' ', CE.el('b', {}, rotulo), ` (${detalhe})`);
    };
    const revisao = CE.el('input', { type: 'checkbox', 'data-campo': 'revisao-escola' });
    revisao.checked = CE.revisao.ligada();
    revisao.addEventListener('change', async () => {
      try {
        await CE.api.chamar('escola:revisao', revisao.checked);
        await CE.curso.carregarTrilha();
        CE.avisar(revisao.checked ? '🔁 Revisão rápida ligada: no primeiro login do dia, o aluno responde até 3 perguntas das últimas aulas.' : '🔁 Revisão rápida desligada.');
        CE.emitir('instrutor:revisao', { ligada: revisao.checked });
      } catch (e) { CE.avisar(e.message); revisao.checked = !revisao.checked; }
    });
    return CE.el('div', { class: 'painel-trilha', 'data-trilha-escola': atual },
      CE.el('strong', {}, '🧭 Trilha do curso:'),
      opcao('essencial', 'Essencial', contar('essencial')),
      opcao('completa', 'Completa', contar('completa')),
      CE.el('label', { class: 'painel-check', title: 'No primeiro login do dia, antes da aula, até 3 perguntas das últimas aulas que o aluno fez (uns 2 minutos)' },
        revisao, ' ', CE.el('b', {}, '🔁 Revisão rápida'), ' no começo do dia (2 min)'),
      CE.el('p', { class: 'painel-legenda' }, atual === 'essencial'
        ? 'Essencial: para turmas com pouco tempo (1 hora por semana). Os alunos seguem só as aulas essenciais; as outras viram "Reforço (opcional)" e não travam o curso nem o certificado. Para um aluno diferente da turma, use "🔓 Liberar aulas" na aba Alunos.'
        : 'Completa: todas as aulas são obrigatórias, na ordem. Para um aluno diferente da turma, use "🔓 Liberar aulas" na aba Alunos.'));
  }

  CE.painelExtras = { ondeTrava, certificadosERelatorio, liberarAulas, escolhaDaTrilha };
})();
