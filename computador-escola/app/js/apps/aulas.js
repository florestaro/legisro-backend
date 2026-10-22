// Aulas: lista das lições guiadas, com o que o aluno já concluiu.
(function () {
  CE.registrarApp({
    id: 'aulas',
    nome: 'Aulas',
    icone: '🎓',
    largura: 760,
    altura: 560,
    abrir(corpo) {
      corpo.classList.add('aulas');

      async function desenhar() {
        const feitas = (await CE.sessao.progresso()).licoes || {};
        const total = CE.LICOES.length;
        const concluidas = CE.LICOES.filter((l) => feitas[l.id] && feitas[l.id].concluida).length;
        const proxima = CE.LICOES.find((l) => !(feitas[l.id] && feitas[l.id].concluida));
        const modulos = [...new Set(CE.LICOES.map((l) => l.modulo))];

        corpo.replaceChildren(
          CE.el('div', { class: 'aulas-topo' },
            CE.el('h2', {}, `Suas aulas, ${CE.sessao.usuario.nome.split(' ')[0]}`),
            CE.el('div', { class: 'aulas-barra', title: `${concluidas} de ${total} aulas` },
              CE.el('div', { class: 'aulas-barra-cheia', style: `width:${Math.round((concluidas / total) * 100)}%` })),
            CE.el('p', {}, `${concluidas} de ${total} aulas concluídas`),
          ),
          ...modulos.map((m) => CE.el('section', { class: 'aulas-modulo' },
            CE.el('h3', {}, m),
            ...CE.LICOES.filter((l) => l.modulo === m).map((l) => {
              const feita = feitas[l.id] && feitas[l.id].concluida;
              return CE.el('div', { class: 'aula' + (feita ? ' feita' : '') + (l === proxima ? ' proxima' : ''), 'data-licao': l.id },
                CE.el('span', { class: 'aula-icone' }, feita ? '✅' : l.icone),
                CE.el('div', { class: 'aula-info' }, CE.el('strong', {}, l.titulo), CE.el('span', {}, l.descricao)),
                CE.el('button', { class: 'botao' + (feita ? ' secundario' : ''), onclick: () => CE.professor.comecarLicao(l.id) },
                  feita ? 'Fazer de novo' : l === proxima ? 'Começar ▶' : 'Começar'),
              );
            }),
          )),
        );
      }

      desenhar();
      const parar = CE.ouvir('licao:concluida', desenhar);
      return { aoFechar() { parar(); return true; } };
    },
  });
})();
