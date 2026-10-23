// Certificados e relatório da turma (usados no Painel do Instrutor e na tela de Aulas do aluno).
// Certificado: cada nível de Informática (todas as aulas do nível na trilha do aluno aprovadas, prova incluída;
// na trilha essencial, as aulas de reforço não contam) e cada nível de
// Digitação (prova do nível aprovada). O número do certificado vem do computador do instrutor e é sempre o mesmo
// para o mesmo aluno e curso (reimprimir não gasta outro número).
window.CE = window.CE || {};

(function () {
  const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const porExtenso = (ts) => { const d = new Date(ts); return `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`; };
  const horas = (minutos) => (minutos >= 60 ? `${Math.floor(minutos / 60)} h ${String(minutos % 60).padStart(2, '0')} min` : `${minutos} min`);

  CE.escola = {
    ler: () => CE.api.chamar('escola:ler'),
    salvar: (dados) => CE.api.chamar('escola:salvar', dados),
  };

  // ---------- Cursos que dão certificado ----------
  function cursos() {
    const informatica = CE.NIVEIS_CURSO.map((n, i) => {
      return {
        id: n.id, curso: 'Informática', nivel: `Nível ${i + 1} — ${n.nome}`, icone: n.icone, carga: n.id,
        conteudo: () => CE.MODULOS.filter((m) => m.nivel === n.id).map((m) => m.titulo),
        situacao(p) {
          const lista = CE.curso.aulasDaTrilha(p, { nivel: n.id });
          const feitas = lista.filter((l) => CE.curso.aprovada(l, p));
          if (!lista.length || feitas.length < lista.length) return { conquistado: false, faltam: lista.length - feitas.length };
          const r = (l) => (p.licoes && p.licoes[l.id]) || {};
          return { conquistado: true, em: Math.max(...lista.map((l) => r(l).aprovadaEm || r(l).em || 0)) || Date.now(), dispensado: lista.every((l) => r(l).dispensada) };
        },
      };
    });
    const digitacao = CE.DIGITACAO.niveis.map((n, i) => ({
      id: `digitacao-${n.id}`, curso: 'Digitação', nivel: `Nível ${i + 1} — ${n.nome}`, icone: '⌨️', carga: `digitacao${i + 1}`,
      conteudo: () => n.modulos.map((m) => m.titulo),
      situacao(p) {
        const r = p.digitacao && p.digitacao[n.prova.id];
        return r && r.aprovado ? { conquistado: true, em: r.aprovadoEm || r.em || Date.now(), dispensado: !!r.dispensado } : { conquistado: false, faltam: null };
      },
    }));
    return [...informatica, ...digitacao];
  }

  function montarCertificado({ aluno, curso, situacao, numero, escola }) {
    const carga = escola.cargas[curso.carga];
    return CE.el('div', { class: 'pagina certificado', 'data-certificado': `${aluno.nome} · ${curso.id}` },
      CE.el('div', { class: 'cert-moldura' },
        CE.el('div', { class: 'cert-escola' }, escola.nome || 'Computador Escola'),
        CE.el('h1', { class: 'cert-titulo' }, 'Certificado'),
        CE.el('p', { class: 'cert-texto' }, 'Certificamos que ', CE.el('b', { class: 'cert-nome' }, aluno.nome),
          ` concluiu, em ${porExtenso(situacao.em)}, o Curso de ${curso.curso} — ${curso.nivel}, com carga horária de ${carga} horas.`),
        CE.el('p', { class: 'cert-conteudo' }, CE.el('b', {}, 'Conteúdo: '), curso.conteudo().join(' · ')),
        CE.el('p', { class: 'cert-data' }, `${escola.cidade ? escola.cidade + ', ' : ''}${porExtenso(Date.now())}.`),
        CE.el('div', { class: 'cert-assinaturas' },
          CE.el('div', { class: 'cert-assinatura' }, CE.el('span', {}, escola.responsavel || ' '), CE.el('small', {}, escola.cargo || 'Instrutor(a)')),
          CE.el('div', { class: 'cert-assinatura' }, CE.el('span', {}, aluno.nome), CE.el('small', {}, 'Aluno(a)'))),
        CE.el('div', { class: 'cert-numero' }, `Certificado nº ${String(numero).padStart(4, '0')}`)));
  }

  CE.certificados = {
    cursos,
    // Todos os certificados que um aluno já conquistou.
    conquistados: (progresso) => cursos().map((c) => ({ curso: c, situacao: c.situacao(progresso) })).filter((x) => x.situacao.conquistado),
    // Páginas prontas para imprimir. "itens" = [{ aluno, curso }] (o progresso é lido aqui).
    async paginas(itens) {
      const escola = await CE.escola.ler();
      const paginas = [];
      for (const { aluno, curso } of itens) {
        const situacao = curso.situacao(await CE.sessao.progresso(aluno.id));
        if (!situacao.conquistado) continue;
        const { numero } = await CE.api.chamar('escola:certificado', aluno.id, curso.id);
        paginas.push(montarCertificado({ aluno, curso, situacao, numero, escola }));
      }
      return paginas;
    },
  };

  // ---------- Relatório da turma ----------
  const PERIODOS = [
    ['mes', 'Este mês'],
    ['mes-passado', 'Mês passado'],
    ['tudo', 'Todo o curso'],
  ];
  function intervalo(periodo) {
    const d = new Date();
    if (periodo === 'tudo') return { de: '0000-00-00', ate: '9999-99-99', nome: 'todo o curso' };
    const inicio = periodo === 'mes-passado' ? new Date(d.getFullYear(), d.getMonth() - 1, 1) : new Date(d.getFullYear(), d.getMonth(), 1);
    const fim = new Date(inicio.getFullYear(), inicio.getMonth() + 1, 0);
    return { de: CE.frequencia.diaDe(inicio), ate: CE.frequencia.diaDe(fim), nome: `${MESES[inicio.getMonth()]} de ${inicio.getFullYear()}` };
  }

  async function dadosDoRelatorio({ turma = '', periodo = 'mes' } = {}) {
    const escola = await CE.escola.ler();
    const p = intervalo(periodo);
    const usuarios = (await CE.api.chamar('usuarios:listar'))
      .filter((u) => u.papel === 'aluno' && (!turma || u.turma === turma))
      .sort((a, b) => (a.turma + a.nome).localeCompare(b.turma + b.nome));
    const alunos = await Promise.all(usuarios.map(async (usuario) => ({ usuario, progresso: await CE.sessao.progresso(usuario.id) })));
    const linhas = alunos.map(({ usuario, progresso }) => {
      const freq = CE.frequencia.resumo(progresso, p.de, p.ate);
      const niveis = CE.NIVEIS_CURSO.map((n) => {
        const aulas = CE.curso.aulasDaTrilha(progresso, { nivel: n.id });
        return { nivel: n, feitas: aulas.filter((l) => CE.curso.aprovada(l, progresso)).length, total: aulas.length };
      });
      const resumo = CE.curso.resumo(progresso);
      const dig = progresso.digitacao || {};
      return {
        usuario, progresso, freq, niveis, media: resumo.media,
        digitacao: { aprovados: CE.DIGITACAO.lista.filter((e) => dig[e.id] && dig[e.id].aprovado).length, total: CE.DIGITACAO.lista.length, ppm: Math.max(0, ...CE.DIGITACAO.lista.map((e) => (dig[e.id] && dig[e.id].ppm) || 0)) },
        certificados: CE.certificados.conquistados(progresso).map((x) => x.curso),
        ajuda: CE.dificuldades.pedidosDeAjuda(progresso),
      };
    });
    const dias = [...new Set(linhas.flatMap((l) => l.freq.lista))].sort();
    return { escola, turma, periodo: p, linhas, dias, dificuldades: CE.dificuldades.somar(alunos).slice(0, 10) };
  }

  const tabela = (cabecalho, linhas, classe = '') => CE.el('table', { class: 'rel-tabela ' + classe },
    CE.el('thead', {}, CE.el('tr', {}, ...cabecalho.map((t) => CE.el('th', {}, t)))),
    CE.el('tbody', {}, ...linhas.map((l) => CE.el('tr', {}, ...l.map((c) => CE.el('td', {}, c))))));

  function paginasDoRelatorio(d) {
    const titulo = (subtitulo) => CE.el('div', { class: 'rel-cabecalho' },
      CE.el('h1', {}, d.escola.nome || 'Computador Escola'),
      CE.el('p', {}, `${subtitulo} · Turma: ${d.turma || 'todas'} · Período: ${d.periodo.nome} · Emitido em ${porExtenso(Date.now())}`));
    const resumo = CE.el('div', { class: 'pagina relatorio' },
      titulo('Relatório da turma'),
      tabela(['Aluno', 'Turma', 'Dias', 'Horas', ...CE.NIVEIS_CURSO.map((n) => `Informática ${n.nome}`), 'Média', 'Digitação', 'Melhor ppm', 'Certificados', '🙋 Ajuda'],
        d.linhas.map((l) => [l.usuario.nome, l.usuario.turma || '—', String(l.freq.dias), horas(l.freq.minutos),
          ...l.niveis.map((n) => `${n.feitas}/${n.total}`), l.media != null ? `${l.media}%` : '—',
          `${l.digitacao.aprovados}/${l.digitacao.total}`, l.digitacao.ppm ? String(l.digitacao.ppm) : '—',
          l.certificados.length ? l.certificados.map((c) => `${c.curso} ${c.nivel.split(' — ')[0].replace('Nível ', 'N')}`).join(', ') : '—',
          String(l.ajuda)])),
      CE.el('p', { class: 'rel-legenda' }, `${d.linhas.length} aluno(s). Dias e horas: presença registrada pelo programa no período (só conta o tempo com uso do mouse ou do teclado). Informática: aulas aprovadas / total do nível. Média: acertos nas perguntas. Ajuda: vezes que o aluno apertou "Não entendi".`));
    const presenca = CE.el('div', { class: 'pagina relatorio' },
      titulo('Lista de presença'),
      d.dias.length
        ? tabela(['Aluno', ...d.dias.map((dia) => dia.slice(8, 10) + '/' + dia.slice(5, 7)), 'Total'],
          d.linhas.map((l) => [l.usuario.nome, ...d.dias.map((dia) => (l.freq.lista.includes(dia) ? '✔' : '·')), String(l.freq.dias)]), 'rel-presenca')
        : CE.el('p', {}, 'Nenhuma presença registrada neste período.'));
    const trava = CE.el('div', { class: 'pagina relatorio' },
      titulo('Onde a turma mais travou'),
      d.dificuldades.length
        ? tabela(['Aula', 'Passo', 'Alunos', '🙋', '💡', '❌', '🚪'],
          d.dificuldades.map((x) => [`${x.licao.icone} ${x.licao.titulo}`, `${x.passo + 1}: ${x.texto}`, String(x.alunos.length), String(x.totais.naoEntendi), String(x.totais.dica), String(x.totais.erro), String(x.totais.desistiu)]))
        : CE.el('p', {}, 'Nenhuma dificuldade registrada ainda.'),
      CE.el('p', { class: 'rel-legenda' }, '🙋 Não entendi · 💡 precisou de dica · ❌ errou a pergunta · 🚪 saiu da aula no meio.'));
    return [resumo, presenca, trava];
  }

  // Planilha (CSV com ";" e acentos, do jeito que o Excel e o LibreOffice abrem em português).
  function csvDoRelatorio(d) {
    const campo = (v) => `"${String(v).replace(/"/g, '""')}"`;
    const linhas = [['Aluno', 'Turma', 'Dias presentes', 'Minutos', ...CE.NIVEIS_CURSO.map((n) => `Informática ${n.nome} (aprovadas)`), 'Média (%)', 'Digitação (aprovados)', 'Melhor ppm', 'Certificados', 'Pedidos de ajuda', ...d.dias]];
    d.linhas.forEach((l) => linhas.push([l.usuario.nome, l.usuario.turma || '', l.freq.dias, l.freq.minutos, ...l.niveis.map((n) => `${n.feitas}/${n.total}`),
      l.media != null ? l.media : '', `${l.digitacao.aprovados}/${l.digitacao.total}`, l.digitacao.ppm || '',
      l.certificados.map((c) => `${c.curso} ${c.nivel}`).join(' | '), l.ajuda, ...d.dias.map((dia) => (l.freq.lista.includes(dia) ? 'P' : ''))]));
    return '﻿' + linhas.map((l) => l.map(campo).join(';')).join('\r\n');
  }

  CE.relatorio = { PERIODOS, intervalo, dados: dadosDoRelatorio, paginas: paginasDoRelatorio, csv: csvDoRelatorio };

  // ---------- Impressão ----------
  // Mostra a prévia em tela cheia; ao imprimir (ou salvar em PDF), só as páginas aparecem no papel.
  CE.imprimir = function ({ titulo, paginas, paisagem = false, nomeArquivo = 'documento.pdf' }) {
    document.querySelectorAll('#area-impressao').forEach((a) => a.remove());
    let estilo = document.getElementById('estilo-pagina');
    if (!estilo) { estilo = CE.el('style', { id: 'estilo-pagina' }); document.head.append(estilo); }
    estilo.textContent = `@page { size: A4 ${paisagem ? 'landscape' : 'portrait'}; margin: 0; }`;
    const fechar = () => area.remove();
    const comPdf = !!window.api; // no programa instalado dá para salvar direto em PDF
    const area = CE.el('div', { id: 'area-impressao', class: paisagem ? 'paisagem' : 'retrato' },
      CE.el('div', { class: 'impressao-barra' },
        CE.el('strong', {}, titulo),
        CE.el('span', { class: 'impressao-total' }, `${paginas.length} página(s)`),
        CE.el('button', { class: 'botao', 'data-acao': 'imprimir', onclick: () => window.print() }, '🖨️ Imprimir'),
        comPdf ? CE.el('button', { class: 'botao', 'data-acao': 'salvar-pdf', onclick: async () => {
          try {
            const onde = await CE.api.chamar('janela:pdf', { nome: nomeArquivo, paisagem });
            if (onde) CE.avisar(`💾 Salvo em ${onde}`);
          } catch (e) { CE.avisar(`⚠️ Não consegui salvar o PDF: ${e.message}`); }
        } }, '💾 Salvar em PDF') : null,
        CE.el('button', { class: 'botao secundario', 'data-acao': 'fechar-impressao', onclick: fechar }, '✕ Fechar')),
      CE.el('div', { class: 'impressao-paginas' }, ...paginas));
    area.tabIndex = -1;
    area.addEventListener('keydown', (e) => { if (e.key === 'Escape') fechar(); });
    document.body.append(area);
    area.focus();
    CE.emitir('impressao:aberta', { titulo, paginas: paginas.length });
    return area;
  };
})();
