// Arquivos (parecido com o Explorador de Arquivos): ver, abrir, renomear e excluir documentos salvos.
(function () {
  const TIPOS = { documento: { icone: '📄', app: 'editor', nome: 'Documento de texto' } };

  CE.registrarApp({
    id: 'arquivos',
    nome: 'Arquivos',
    icone: '📁',
    largura: 720,
    altura: 480,
    abrir(corpo) {
      let selecionado = null;
      const lista = CE.el('div', { class: 'arq-lista', role: 'list' });
      const status = CE.el('div', { class: 'arq-status' });

      const botoes = {
        abrir: CE.el('button', { class: 'ferramenta texto', 'data-acao': 'abrir', disabled: true, onclick: () => abrir(selecionado) }, '📂 Abrir'),
        renomear: CE.el('button', { class: 'ferramenta texto', 'data-acao': 'renomear', disabled: true, onclick: renomear }, '✏️ Renomear'),
        excluir: CE.el('button', { class: 'ferramenta texto', 'data-acao': 'excluir', disabled: true, onclick: excluir }, '🗑️ Excluir'),
      };

      function abrir(arquivo) {
        if (!arquivo) return;
        CE.janelas.abrir(TIPOS[arquivo.tipo].app, { arquivo });
      }

      async function renomear() {
        if (!selecionado) return;
        const nome = await CE.perguntar('Qual o novo nome?', selecionado.nome);
        if (nome && nome !== selecionado.nome) { await CE.sessao.renomearArquivo(selecionado.id, nome); desenhar(); }
      }

      async function excluir() {
        if (!selecionado) return;
        if (await CE.confirmar(`Tem certeza que quer excluir "${selecionado.nome}"? Não dá para desfazer.`)) {
          await CE.sessao.removerArquivo(selecionado.id);
          selecionado = null;
          desenhar();
        }
      }

      async function desenhar() {
        const arquivos = (await CE.sessao.arquivos()).sort((a, b) => b.alteradoEm - a.alteradoEm);
        Object.values(botoes).forEach((b) => { b.disabled = !selecionado; });
        if (!arquivos.length) {
          lista.replaceChildren(CE.el('p', { class: 'arq-vazio' }, 'A pasta está vazia. Os documentos que você salvar no Editor de Texto aparecem aqui.'));
          status.textContent = '0 itens';
          return;
        }
        lista.replaceChildren(...arquivos.map((a) => {
          const item = CE.el('button', { class: 'arq-item' + (selecionado && selecionado.id === a.id ? ' selecionado' : ''), role: 'listitem', 'data-arquivo': a.nome },
            CE.el('span', { class: 'arq-icone' }, TIPOS[a.tipo].icone),
            CE.el('span', { class: 'arq-nome' }, a.nome),
            CE.el('span', { class: 'arq-data' }, new Date(a.alteradoEm).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })),
            CE.el('span', { class: 'arq-tipo' }, TIPOS[a.tipo].nome),
          );
          item.addEventListener('click', () => {
            selecionado = a;
            lista.querySelectorAll('.arq-item').forEach((i) => i.classList.remove('selecionado'));
            item.classList.add('selecionado');
            Object.values(botoes).forEach((b) => { b.disabled = false; });
            status.textContent = `"${a.nome}" selecionado`;
            CE.emitir('arquivo:selecionado', { nome: a.nome, tipo: a.tipo });
          });
          item.addEventListener('dblclick', () => abrir(a));
          return item;
        }));
        status.textContent = `${arquivos.length} ${arquivos.length === 1 ? 'item' : 'itens'}`;
      }

      corpo.classList.add('arquivos');
      corpo.append(
        CE.el('div', { class: 'ferramentas' }, CE.el('div', { class: 'ferramentas-grupo' }, ...Object.values(botoes))),
        CE.el('div', { class: 'arq-principal' },
          CE.el('nav', { class: 'arq-lateral' }, CE.el('div', { class: 'arq-pasta ativa' }, '📁 Meus Documentos')),
          CE.el('div', { class: 'arq-conteudo' },
            CE.el('div', { class: 'arq-caminho' }, `Este Computador › ${CE.sessao.usuario.nome} › Meus Documentos`),
            CE.el('div', { class: 'arq-cabecalho' }, CE.el('span', {}, 'Nome'), CE.el('span', {}, 'Modificado em'), CE.el('span', {}, 'Tipo')),
            lista,
          ),
        ),
        status,
      );
      desenhar();
      const pararDeOuvir = [CE.ouvir('arquivo:salvo', desenhar), CE.ouvir('arquivo:removido', desenhar)];
      return { aoFechar() { pararDeOuvir.forEach((f) => f()); return true; } };
    },
  });
})();
