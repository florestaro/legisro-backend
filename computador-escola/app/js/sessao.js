// Dados do usuário que entrou: progresso nas lições e arquivos do "computador" dele.
window.CE = window.CE || {};

(function () {
  CE.sessao = {
    usuario: null,

    async progresso(idUsuario = CE.sessao.usuario.id) {
      return CE.api.chamar('dados:ler', `progresso:${idUsuario}`, { licoes: {}, digitacao: {} });
    },

    async atualizarProgresso(alterar) {
      const atual = await CE.sessao.progresso();
      alterar(atual);
      await CE.api.chamar('dados:salvar', `progresso:${CE.sessao.usuario.id}`, atual);
      return atual;
    },

    async arquivos() {
      return CE.api.chamar('dados:ler', `arquivos:${CE.sessao.usuario.id}`, []);
    },

    // Salva (ou substitui, se o nome já existir) um arquivo do aluno.
    async salvarArquivo({ nome, tipo, conteudo }) {
      const lista = await CE.sessao.arquivos();
      const existente = lista.find((a) => a.nome.toLowerCase() === nome.toLowerCase() && a.tipo === tipo);
      const arquivo = existente || { id: String(Date.now()), nome, tipo, criadoEm: Date.now() };
      Object.assign(arquivo, { nome, conteudo, alteradoEm: Date.now() });
      if (!existente) lista.push(arquivo);
      await CE.api.chamar('dados:salvar', `arquivos:${CE.sessao.usuario.id}`, lista);
      CE.emitir('arquivo:salvo', { nome, tipo, novo: !existente });
      return arquivo;
    },

    async renomearArquivo(id, novoNome) {
      const lista = await CE.sessao.arquivos();
      const arquivo = lista.find((a) => a.id === id);
      if (!arquivo) return;
      arquivo.nome = novoNome;
      await CE.api.chamar('dados:salvar', `arquivos:${CE.sessao.usuario.id}`, lista);
      CE.emitir('arquivo:renomeado', { nome: novoNome, tipo: arquivo.tipo });
    },

    async removerArquivo(id) {
      const lista = await CE.sessao.arquivos();
      const arquivo = lista.find((a) => a.id === id);
      await CE.api.chamar('dados:salvar', `arquivos:${CE.sessao.usuario.id}`, lista.filter((a) => a.id !== id));
      if (arquivo) CE.emitir('arquivo:removido', { nome: arquivo.nome, tipo: arquivo.tipo });
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
