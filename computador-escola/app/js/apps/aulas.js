// Aulas: o curso de informática por nível e módulo, com cadeados, notas e medalhas.
(function () {
  CE.registrarApp({
    id: 'aulas',
    nome: 'Aulas',
    icone: '🎓',
    largura: 820,
    altura: 600,
    abrir(corpo) {
      corpo.classList.add('aulas');
      let aba = null;

      async function desenhar() {
        await CE.curso.trilhaPronta();
        const p = await CE.sessao.progresso();
        const proxima = CE.curso.proxima(p);
        aba = aba || (proxima ? proxima.nivel : 'n1');
        const instrutor = CE.sessao.usuario.papel === 'instrutor';

        const abas = CE.el('div', { class: 'aulas-abas' },
          ...CE.NIVEIS_CURSO.map((n) => {
            const aulas = CE.curso.aulasDaTrilha(p, { nivel: n.id });
            const feitas = aulas.filter((l) => CE.curso.aprovada(l, p)).length;
            return CE.el('button', { class: 'chip' + (aba === n.id ? ' ativo' : ''), 'data-nivel': n.id, onclick: () => { aba = n.id; desenhar(); } },
              `${n.icone} ${n.nome}${aulas.length ? ` · ${feitas}/${aulas.length}` : ''}`);
          }),
          CE.LICOES_EXTRAS.length ? CE.el('button', { class: 'chip' + (aba === 'professor' ? ' ativo' : ''), 'data-nivel': 'professor', onclick: () => { aba = 'professor'; desenhar(); } },
            `📌 Do professor · ${CE.LICOES_EXTRAS.filter((l) => CE.curso.aprovada(l, p)).length}/${CE.LICOES_EXTRAS.length}`) : null,
          CE.el('button', { class: 'chip' + (aba === 'medalhas' ? ' ativo' : ''), 'data-nivel': 'medalhas', onclick: () => { aba = 'medalhas'; desenhar(); } },
            `🏅 Medalhas · ${Object.keys(p.medalhas || {}).length}/${CE.MEDALHAS.length}`),
          CE.el('button', { class: 'chip' + (aba === 'certificados' ? ' ativo' : ''), 'data-nivel': 'certificados', onclick: () => { aba = 'certificados'; desenhar(); } },
            `🎓 Certificados · ${CE.certificados.conquistados(p).length}/${CE.certificados.cursos().length}`),
        );

        if (aba === 'certificados') {
          corpo.replaceChildren(abas,
            CE.el('div', { class: 'aulas-topo' }, CE.el('h2', {}, '🎓 Meus certificados'),
              CE.el('p', {}, instrutor ? 'Os certificados dos alunos são impressos no Painel do Instrutor › 📜 Certificados e relatório.' : 'Quando você termina um nível, ganha o certificado. Peça ao instrutor para imprimir!')),
            CE.el('div', { class: 'medalhas' }, ...CE.certificados.cursos().map((c) => {
              const sit = c.situacao(p);
              return CE.el('div', { class: 'medalha' + (sit.conquistado ? ' ganha' : ''), 'data-curso': c.id },
                CE.el('span', { class: 'medalha-icone' }, sit.conquistado ? '🎓' : '🔒'),
                CE.el('strong', {}, `${c.curso} · ${c.nivel}`),
                CE.el('span', {}, sit.conquistado ? `Conquistado em ${new Date(sit.em).toLocaleDateString('pt-BR')}`
                  : sit.faltam ? `Faltam ${sit.faltam} aula${sit.faltam === 1 ? '' : 's'}` : 'Passe na prova de digitação deste nível'));
            })));
          return;
        }

        if (aba === 'medalhas') {
          corpo.replaceChildren(abas, CE.el('div', { class: 'medalhas' },
            ...CE.MEDALHAS.map((m) => {
              const ganha = p.medalhas && p.medalhas[m.id];
              return CE.el('div', { class: 'medalha' + (ganha ? ' ganha' : ''), title: m.descricao },
                CE.el('span', { class: 'medalha-icone' }, ganha ? m.icone : '🔒'),
                CE.el('strong', {}, m.nome),
                CE.el('span', {}, m.descricao),
                ganha ? CE.el('small', {}, `Ganha em ${new Date(ganha).toLocaleDateString('pt-BR')}`) : null);
            })));
          return;
        }

        if (aba === 'professor') {
          corpo.replaceChildren(abas,
            CE.el('div', { class: 'aulas-topo' }, CE.el('h2', {}, '📌 Aulas do professor'), CE.el('p', {}, 'Aulas extras que o seu instrutor preparou. Faça quando quiser!')),
            CE.el('section', { class: 'aulas-modulo' }, ...CE.LICOES_EXTRAS.map((l) => {
              const r = p.licoes && p.licoes[l.id];
              const feita = CE.curso.aprovada(l, p);
              return CE.el('div', { class: 'aula' + (feita ? ' feita' : ''), 'data-licao': l.id },
                CE.el('span', { class: 'aula-icone' }, feita ? '✅' : l.icone),
                CE.el('div', { class: 'aula-info' }, CE.el('strong', {}, l.titulo), CE.el('span', {}, l.descricao),
                  r && r.nota != null ? CE.el('small', { class: r.concluida ? 'ok' : 'abaixo' }, `Nota: ${r.nota}%`) : null),
                CE.el('button', { class: 'botao' + (feita ? ' secundario' : ''), onclick: () => CE.professor.comecarLicao(l.id) }, feita ? 'Fazer de novo' : 'Começar ▶'));
            })));
          return;
        }

        const nivel = CE.NIVEIS_CURSO.find((n) => n.id === aba);
        const modulos = CE.MODULOS.filter((m) => m.nivel === nivel.id);
        const aulasNivel = CE.curso.aulasDaTrilha(p, { nivel: nivel.id });
        const essencial = CE.curso.trilha(p) === 'essencial';
        const feitasNivel = aulasNivel.filter((l) => CE.curso.aprovada(l, p)).length;

        const cartaoAula = (l) => {
          const r = p.licoes && p.licoes[l.id];
          const feita = CE.curso.aprovada(l, p);
          const liberada = CE.curso.liberada(l, p);
          const reforco = !CE.curso.obrigatoria(l, p);
          const tipo = l.prova ? 'Prova' : l.desafio ? 'Desafio' : null;
          const anterior = !liberada && CE.curso.anteriorNaTrilha(l, p);
          return CE.el('div', { class: 'aula' + (feita ? ' feita' : '') + (l === proxima ? ' proxima' : '') + (!liberada ? ' bloqueada' : '') + (l.prova ? ' prova' : '') + (reforco ? ' reforco' : ''), 'data-licao': l.id, 'data-reforco': reforco ? '' : null },
            CE.el('span', { class: 'aula-icone' }, !liberada ? '🔒' : feita ? '✅' : l.icone),
            CE.el('div', { class: 'aula-info' },
              CE.el('strong', {}, l.titulo, tipo ? CE.el('span', { class: 'aula-tipo' }, tipo) : null,
                reforco ? CE.el('span', { class: 'aula-tipo reforco', title: 'Aula a mais, para treinar. Não é obrigatória para passar de nível nem para o certificado.' }, 'Reforço (opcional)') : null,
                l === proxima ? CE.el('span', { class: 'aula-tipo hoje' }, '👉 Sua próxima aula') : null),
              CE.el('span', {}, l.descricao),
              r && r.dispensada ? CE.el('small', { class: 'ok' }, 'Dispensada pelo teste de nivelamento') : null,
              !instrutor && !feita && CE.curso.liberadaPeloInstrutor(l, p) ? CE.el('small', { class: 'ok', 'data-liberada-instrutor': '' }, '🔓 Liberada pelo instrutor') : null,
              r && r.nota != null ? CE.el('small', { class: r.concluida ? 'ok' : 'abaixo' }, `Nota: ${r.nota}%${r.concluida ? '' : ` (precisa de ${CE.curso.NOTA_MINIMA}%)`}`) : null),
            liberada
              ? CE.el('button', { class: 'botao' + (feita ? ' secundario' : ''), onclick: () => CE.professor.comecarLicao(l.id) },
                  feita ? 'Fazer de novo' : r ? 'Tentar de novo' : l === proxima ? 'Começar ▶' : 'Começar')
              : CE.el('span', { class: 'aula-bloqueio' }, anterior ? `Antes, faça: ${anterior.titulo}` : 'Termine a aula anterior'),
          );
        };

        // A próxima aula fica sempre no topo, com um botão grande: o aluno não precisa procurar.
        const destaque = !instrutor && proxima ? CE.el('div', { class: 'aulas-proxima', 'data-proxima': proxima.id },
          CE.el('span', { class: 'aulas-proxima-icone' }, proxima.icone),
          CE.el('div', {}, CE.el('small', {}, '👉 Sua próxima aula'), CE.el('strong', {}, proxima.titulo), CE.el('span', {}, proxima.descricao || '')),
          CE.el('button', { class: 'botao conduzir', 'data-acao': 'comecar-proxima', onclick: () => CE.professor.comecarLicao(proxima.id) }, 'Começar ▶')) : null;

        corpo.replaceChildren(
          abas,
          destaque,
          CE.el('div', { class: 'aulas-topo' },
            CE.el('h2', {}, `${nivel.icone} Nível ${nivel.nome}: ${nivel.descricao}`),
            aulasNivel.length ? CE.el('div', { class: 'aulas-barra', title: `${feitasNivel} de ${aulasNivel.length} aulas` },
              CE.el('div', { class: 'aulas-barra-cheia', style: `width:${Math.round((feitasNivel / aulasNivel.length) * 100)}%` })) : null,
            CE.el('p', {}, aulasNivel.length
              ? `${feitasNivel} de ${aulasNivel.length} aulas concluídas${essencial ? ' (trilha essencial: as aulas de reforço são opcionais)' : ''}${instrutor ? ' · Instrutor: todas as aulas liberadas' : ''}`
              : 'Este nível está sendo preparado. Veja abaixo o que vem por aí!'),
          ),
          ...modulos.map((m) => {
            const aulas = CE.LICOES.filter((l) => l.modulo === m.id);
            const contam = aulas.filter((l) => CE.curso.obrigatoria(l, p));
            const feitas = contam.filter((l) => CE.curso.aprovada(l, p)).length;
            return CE.el('section', { class: 'aulas-modulo' },
              CE.el('h3', {}, `${m.icone} ${m.titulo}`, CE.el('span', { class: 'aulas-contagem' }, `${feitas}/${contam.length}`)),
              ...aulas.map(cartaoAula));
          }),
          nivel.emBreve ? CE.el('section', { class: 'aulas-modulo em-breve' },
            CE.el('h3', {}, '🚧 Em breve neste nível'),
            CE.el('ul', {}, ...nivel.emBreve.map((t) => CE.el('li', {}, t)))) : null,
        );
      }

      desenhar();
      const parar = [CE.ouvir('licao:concluida', desenhar), CE.ouvir('licao:reprovada', desenhar), CE.ouvir('medalha:ganha', desenhar), CE.ouvir('aulas-professor:carregadas', desenhar)];
      return { aoFechar() { parar.forEach((f) => f()); return true; } };
    },
  });
})();
