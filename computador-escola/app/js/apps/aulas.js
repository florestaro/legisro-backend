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
        const p = await CE.sessao.progresso();
        const proxima = CE.curso.proxima(p);
        aba = aba || (proxima ? proxima.nivel : 'n1');
        const instrutor = CE.sessao.usuario.papel === 'instrutor';

        const abas = CE.el('div', { class: 'aulas-abas' },
          ...CE.NIVEIS_CURSO.map((n) => {
            const aulas = CE.LICOES.filter((l) => l.nivel === n.id);
            const feitas = aulas.filter((l) => CE.curso.aprovada(l, p)).length;
            return CE.el('button', { class: 'chip' + (aba === n.id ? ' ativo' : ''), 'data-nivel': n.id, onclick: () => { aba = n.id; desenhar(); } },
              `${n.icone} ${n.nome}${aulas.length ? ` · ${feitas}/${aulas.length}` : ''}`);
          }),
          CE.el('button', { class: 'chip' + (aba === 'medalhas' ? ' ativo' : ''), 'data-nivel': 'medalhas', onclick: () => { aba = 'medalhas'; desenhar(); } },
            `🏅 Medalhas · ${Object.keys(p.medalhas || {}).length}/${CE.MEDALHAS.length}`),
        );

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

        const nivel = CE.NIVEIS_CURSO.find((n) => n.id === aba);
        const modulos = CE.MODULOS.filter((m) => m.nivel === nivel.id);
        const aulasNivel = CE.LICOES.filter((l) => l.nivel === nivel.id);
        const feitasNivel = aulasNivel.filter((l) => CE.curso.aprovada(l, p)).length;

        const cartaoAula = (l) => {
          const r = p.licoes && p.licoes[l.id];
          const feita = CE.curso.aprovada(l, p);
          const liberada = CE.curso.liberada(l, p);
          const tipo = l.prova ? 'Prova' : l.desafio ? 'Desafio' : null;
          return CE.el('div', { class: 'aula' + (feita ? ' feita' : '') + (l === proxima ? ' proxima' : '') + (!liberada ? ' bloqueada' : '') + (l.prova ? ' prova' : ''), 'data-licao': l.id },
            CE.el('span', { class: 'aula-icone' }, !liberada ? '🔒' : feita ? '✅' : l.icone),
            CE.el('div', { class: 'aula-info' },
              CE.el('strong', {}, l.titulo, tipo ? CE.el('span', { class: 'aula-tipo' }, tipo) : null),
              CE.el('span', {}, l.descricao),
              r && r.dispensada ? CE.el('small', { class: 'ok' }, 'Dispensada pelo teste de nivelamento') : null,
              r && r.nota != null ? CE.el('small', { class: r.concluida ? 'ok' : 'abaixo' }, `Nota: ${r.nota}%${r.concluida ? '' : ` (precisa de ${CE.curso.NOTA_MINIMA}%)`}`) : null),
            liberada
              ? CE.el('button', { class: 'botao' + (feita ? ' secundario' : ''), onclick: () => CE.professor.comecarLicao(l.id) },
                  feita ? 'Fazer de novo' : r ? 'Tentar de novo' : l === proxima ? 'Começar ▶' : 'Começar')
              : CE.el('span', { class: 'aula-bloqueio' }, 'Termine a aula anterior'),
          );
        };

        corpo.replaceChildren(
          abas,
          CE.el('div', { class: 'aulas-topo' },
            CE.el('h2', {}, `${nivel.icone} Nível ${nivel.nome}: ${nivel.descricao}`),
            aulasNivel.length ? CE.el('div', { class: 'aulas-barra', title: `${feitasNivel} de ${aulasNivel.length} aulas` },
              CE.el('div', { class: 'aulas-barra-cheia', style: `width:${Math.round((feitasNivel / aulasNivel.length) * 100)}%` })) : null,
            CE.el('p', {}, aulasNivel.length
              ? `${feitasNivel} de ${aulasNivel.length} aulas concluídas${instrutor ? ' · Instrutor: todas as aulas liberadas' : ''}`
              : 'Este nível está sendo preparado. Veja abaixo o que vem por aí!'),
          ),
          ...modulos.map((m) => {
            const aulas = CE.LICOES.filter((l) => l.modulo === m.id);
            const feitas = aulas.filter((l) => CE.curso.aprovada(l, p)).length;
            return CE.el('section', { class: 'aulas-modulo' },
              CE.el('h3', {}, `${m.icone} ${m.titulo}`, CE.el('span', { class: 'aulas-contagem' }, `${feitas}/${aulas.length}`)),
              ...aulas.map(cartaoAula));
          }),
          nivel.emBreve ? CE.el('section', { class: 'aulas-modulo em-breve' },
            CE.el('h3', {}, '🚧 Em breve neste nível'),
            CE.el('ul', {}, ...nivel.emBreve.map((t) => CE.el('li', {}, t)))) : null,
        );
      }

      desenhar();
      const parar = [CE.ouvir('licao:concluida', desenhar), CE.ouvir('licao:reprovada', desenhar), CE.ouvir('medalha:ganha', desenhar)];
      return { aoFechar() { parar.forEach((f) => f()); return true; } };
    },
  });
})();
