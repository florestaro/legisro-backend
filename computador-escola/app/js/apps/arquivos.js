// Arquivos (parecido com o Explorador de Arquivos) e Lixeira.
// O mesmo programa mostra a pasta "Meus Documentos" ou a "Lixeira".
(function () {
  const TIPOS = {
    documento: { icone: '📄', app: 'editor', nome: 'Documento de texto' },
    imagem: { icone: '🖼️', app: 'desenho', nome: 'Desenho' },
  };
  const PASTAS = {
    documentos: { nome: 'Meus Documentos', icone: '📁' },
    lixeira: { nome: 'Lixeira', icone: '🗑️' },
  };

  function criarExplorador(pastaInicial) {
    return function abrir(corpo, janela, argumento) {
      let pasta = (argumento && argumento.pasta) || pastaInicial;
      let selecionado = null;
      const lista = CE.el('div', { class: 'arq-lista', role: 'list' });
      const status = CE.el('div', { class: 'arq-status' });
      const caminho = CE.el('div', { class: 'arq-caminho' });
      const lateral = CE.el('nav', { class: 'arq-lateral' });
      const barra = CE.el('div', { class: 'ferramentas' });

      const botao = (acao, rotulo, funcao) => CE.el('button', { class: 'ferramenta texto', 'data-acao': acao, disabled: true, onclick: funcao }, rotulo);
      const botoes = {
        documentos: [
          botao('abrir', '📂 Abrir', () => abrirArquivo(selecionado)),
          botao('renomear', '✏️ Renomear', renomear),
          botao('excluir', '🗑️ Excluir', excluir),
        ],
        lixeira: [
          botao('restaurar', '↩️ Restaurar', async () => { await CE.sessao.restaurarArquivo(selecionado.id); CE.avisar(`"${selecionado.nome}" voltou para Meus Documentos.`); selecionado = null; desenhar(); }),
          botao('apagar', '❌ Apagar de vez', async () => {
            if (!await CE.confirmar(`Apagar "${selecionado.nome}" para sempre? Não dá para desfazer.`)) return;
            await CE.sessao.apagarDeVez(selecionado.id); selecionado = null; desenhar();
          }),
        ],
      };
      const esvaziar = CE.el('button', { class: 'ferramenta texto', 'data-acao': 'esvaziar', onclick: async () => {
        if (!await CE.confirmar('Esvaziar a lixeira? Todos os arquivos dela serão apagados para sempre.')) return;
        await CE.sessao.esvaziarLixeira(); selecionado = null; desenhar();
      } }, '🧹 Esvaziar lixeira');

      function abrirArquivo(arquivo) {
        if (arquivo) CE.janelas.abrir(TIPOS[arquivo.tipo].app, { arquivo });
      }

      async function renomear() {
        if (!selecionado) return;
        const nome = await CE.perguntar('Qual o novo nome?', selecionado.nome);
        if (nome && nome !== selecionado.nome) { await CE.sessao.renomearArquivo(selecionado.id, nome); desenhar(); }
      }

      async function excluir() {
        if (!selecionado) return;
        if (await CE.confirmar(`Mandar "${selecionado.nome}" para a lixeira?`)) {
          await CE.sessao.removerArquivo(selecionado.id);
          CE.avisar(`"${selecionado.nome}" foi para a lixeira.`);
          selecionado = null;
          desenhar();
        }
      }

      function irPara(nova) {
        pasta = nova;
        selecionado = null;
        desenhar();
        CE.emitir('pasta:aberta', { pasta });
      }

      async function desenhar() {
        const todos = await CE.sessao.arquivos();
        const arquivos = todos.filter((a) => (pasta === 'lixeira' ? a.naLixeira : !a.naLixeira)).sort((a, b) => b.alteradoEm - a.alteradoEm);
        const naLixeira = todos.filter((a) => a.naLixeira).length;
        janela.definirTitulo(PASTAS[pasta].nome);
        lateral.replaceChildren(...Object.entries(PASTAS).map(([id, p]) => CE.el('button', {
          class: 'arq-pasta' + (id === pasta ? ' ativa' : ''), 'data-pasta': id, onclick: () => irPara(id),
        }, `${id === 'lixeira' && naLixeira ? '🗑️' : p.icone} ${p.nome}${id === 'lixeira' && naLixeira ? ` (${naLixeira})` : ''}`)));
        caminho.textContent = `Este Computador › ${CE.sessao.usuario.nome} › ${PASTAS[pasta].nome}`;
        barra.replaceChildren(CE.el('div', { class: 'ferramentas-grupo' }, ...botoes[pasta], pasta === 'lixeira' && arquivos.length ? esvaziar : null));
        botoes[pasta].forEach((b) => { b.disabled = !selecionado; });
        if (!arquivos.length) {
          lista.replaceChildren(CE.el('p', { class: 'arq-vazio' }, pasta === 'lixeira'
            ? 'A lixeira está vazia. Os arquivos que você excluir vêm para cá e podem ser restaurados.'
            : 'A pasta está vazia. Os documentos e desenhos que você salvar aparecem aqui.'));
          status.textContent = '0 itens';
          return;
        }
        lista.replaceChildren(...arquivos.map((a) => {
          const item = CE.el('button', { class: 'arq-item' + (selecionado && selecionado.id === a.id ? ' selecionado' : ''), role: 'listitem', 'data-arquivo': a.nome },
            CE.el('span', { class: 'arq-icone' }, TIPOS[a.tipo].icone),
            CE.el('span', { class: 'arq-nome' }, a.nome),
            CE.el('span', { class: 'arq-data' }, new Date(pasta === 'lixeira' ? a.excluidoEm : a.alteradoEm).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })),
            CE.el('span', { class: 'arq-tipo' }, TIPOS[a.tipo].nome),
          );
          item.addEventListener('click', () => {
            selecionado = a;
            lista.querySelectorAll('.arq-item').forEach((i) => i.classList.remove('selecionado'));
            item.classList.add('selecionado');
            botoes[pasta].forEach((b) => { b.disabled = false; });
            status.textContent = `"${a.nome}" selecionado`;
            CE.emitir('arquivo:selecionado', { nome: a.nome, tipo: a.tipo, pasta });
          });
          item.addEventListener('dblclick', () => { if (pasta !== 'lixeira') abrirArquivo(a); });
          item.addEventListener('keydown', (e) => { if (e.key === 'Delete' && pasta !== 'lixeira') { selecionado = a; excluir(); } });
          return item;
        }));
        status.textContent = `${arquivos.length} ${arquivos.length === 1 ? 'item' : 'itens'}`;
      }

      corpo.classList.add('arquivos');
      corpo.append(
        barra,
        CE.el('div', { class: 'arq-principal' },
          lateral,
          CE.el('div', { class: 'arq-conteudo' },
            caminho,
            CE.el('div', { class: 'arq-cabecalho' }, CE.el('span', {}, 'Nome'), CE.el('span', {}, 'Data'), CE.el('span', {}, 'Tipo')),
            lista,
          ),
        ),
        status,
      );
      desenhar();
      const parar = ['arquivo:salvo', 'arquivo:removido', 'arquivo:restaurado', 'arquivo:apagado', 'lixeira:esvaziada']
        .map((ev) => CE.ouvir(ev, desenhar));
      return {
        receber(arg) { if (arg && arg.pasta) irPara(arg.pasta); },
        aoFechar() { parar.forEach((f) => f()); return true; },
      };
    };
  }

  CE.registrarApp({ id: 'arquivos', nome: 'Arquivos', icone: '📁', largura: 760, altura: 480, abrir: criarExplorador('documentos') });
  CE.registrarApp({ id: 'lixeira', nome: 'Lixeira', icone: '🗑️', largura: 720, altura: 440, abrir: criarExplorador('lixeira') });
})();
