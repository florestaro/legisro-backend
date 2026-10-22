// Dados do usuário que entrou: progresso nas lições e arquivos do "computador" dele.
window.CE = window.CE || {};

(function () {
  let filaProgresso = Promise.resolve();

  CE.sessao = {
    usuario: null,

    async progresso(idUsuario = CE.sessao.usuario.id) {
      return CE.api.chamar('dados:ler', `progresso:${idUsuario}`, { licoes: {}, digitacao: {} });
    },

    // As alterações entram numa fila, para duas gravações ao mesmo tempo não apagarem uma à outra.
    atualizarProgresso(alterar) {
      const tarefa = filaProgresso.then(async () => {
        const atual = await CE.sessao.progresso();
        alterar(atual);
        await CE.api.chamar('dados:salvar', `progresso:${CE.sessao.usuario.id}`, atual);
        return atual;
      });
      filaProgresso = tarefa.catch(() => {});
      return tarefa;
    },

    // Todos os arquivos do aluno, inclusive os que estão na lixeira (campo "naLixeira").
    async arquivos() {
      return CE.api.chamar('dados:ler', `arquivos:${CE.sessao.usuario.id}`, []);
    },

    async gravarArquivos(lista) {
      await CE.api.chamar('dados:salvar', `arquivos:${CE.sessao.usuario.id}`, lista);
    },

    // Salva (ou substitui, se o nome já existir) um arquivo do aluno.
    async salvarArquivo({ nome, tipo, conteudo }) {
      const lista = await CE.sessao.arquivos();
      const existente = lista.find((a) => !a.naLixeira && a.nome.toLowerCase() === nome.toLowerCase() && a.tipo === tipo);
      const arquivo = existente || { id: String(Date.now()) + Math.random().toString(16).slice(2, 6), nome, tipo, criadoEm: Date.now() };
      Object.assign(arquivo, { nome, conteudo, alteradoEm: Date.now() });
      if (!existente) lista.push(arquivo);
      await CE.sessao.gravarArquivos(lista);
      CE.emitir('arquivo:salvo', { nome, tipo, novo: !existente, conteudo });
      return arquivo;
    },

    async alterarArquivo(id, alterar, evento) {
      const lista = await CE.sessao.arquivos();
      const arquivo = lista.find((a) => a.id === id);
      if (!arquivo) return;
      const resultado = alterar(arquivo, lista);
      await CE.sessao.gravarArquivos(Array.isArray(resultado) ? resultado : lista);
      CE.emitir(evento, { nome: arquivo.nome, tipo: arquivo.tipo });
    },

    renomearArquivo(id, novoNome) {
      return CE.sessao.alterarArquivo(id, (a) => { a.nome = novoNome; a.alteradoEm = Date.now(); }, 'arquivo:renomeado');
    },
    // "Excluir" manda para a lixeira; de lá dá para restaurar ou apagar de vez.
    removerArquivo(id) {
      return CE.sessao.alterarArquivo(id, (a) => { a.naLixeira = true; a.excluidoEm = Date.now(); }, 'arquivo:removido');
    },
    restaurarArquivo(id) {
      return CE.sessao.alterarArquivo(id, (a) => { delete a.naLixeira; delete a.excluidoEm; }, 'arquivo:restaurado');
    },
    apagarDeVez(id) {
      return CE.sessao.alterarArquivo(id, (a, lista) => lista.filter((x) => x.id !== id), 'arquivo:apagado');
    },
    async esvaziarLixeira() {
      await CE.sessao.gravarArquivos((await CE.sessao.arquivos()).filter((a) => !a.naLixeira));
      CE.emitir('lixeira:esvaziada');
    },
  };

  // Caixas de diálogo próprias (as do navegador são feias e assustam iniciantes).
  CE.perguntar = function (mensagem, valorInicial = '') {
    return new Promise((resolver) => {
      const campo = CE.el('input', { class: 'campo', value: valorInicial });
      const fechar = (valor) => { fundo.remove(); resolver(valor); };
      const fundo = CE.el('div', { class: 'dialogo-fundo' },
        CE.el('div', { class: 'dialogo' },
          CE.el('p', {}, mensagem),
          campo,
          CE.el('div', { class: 'dialogo-botoes' },
            CE.el('button', { class: 'botao secundario', onclick: () => fechar(null) }, 'Cancelar'),
            CE.el('button', { class: 'botao', onclick: () => fechar(campo.value.trim() || null) }, 'OK'),
          ),
        ),
      );
      campo.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') fechar(campo.value.trim() || null);
        if (e.key === 'Escape') fechar(null);
      });
      document.body.append(fundo);
      campo.focus();
      campo.select();
    });
  };

  CE.confirmar = function (mensagem) {
    return new Promise((resolver) => {
      const fechar = (valor) => { fundo.remove(); resolver(valor); };
      const fundo = CE.el('div', { class: 'dialogo-fundo' },
        CE.el('div', { class: 'dialogo' },
          CE.el('p', {}, mensagem),
          CE.el('div', { class: 'dialogo-botoes' },
            CE.el('button', { class: 'botao secundario', onclick: () => fechar(false) }, 'Não'),
            CE.el('button', { class: 'botao', onclick: () => fechar(true) }, 'Sim'),
          ),
        ),
      );
      document.body.append(fundo);
    });
  };

  CE.avisar = function (mensagem) {
    const aviso = CE.el('div', { class: 'aviso' }, mensagem);
    document.body.append(aviso);
    setTimeout(() => aviso.classList.add('saindo'), 2600);
    setTimeout(() => aviso.remove(), 3000);
  };
})();
