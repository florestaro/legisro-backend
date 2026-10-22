// Dados do usuário que entrou: progresso nas lições e arquivos do "computador" dele.
window.CE = window.CE || {};

(function () {
  let filaProgresso = Promise.resolve();

  const novoId = () => String(Date.now()) + Math.random().toString(16).slice(2, 8);
  const juntar = (pasta, nome) => (pasta ? pasta + '/' : '') + nome;
  const dentroDe = (pasta, caminho) => (pasta || '') === caminho || (pasta || '').startsWith(caminho + '/');
  const mesmoLugar = (a, local, pasta) => (a.local || 'pc') === local && (a.pasta || '') === pasta;
  // Se já existe um item com o mesmo nome no destino, usa "nome (2)", "nome (3)"...
  function nomeLivre(lista, item, local, pasta) {
    const ocupado = (n) => lista.some((x) => x !== item && !x.naLixeira && x.tipo === item.tipo && mesmoLugar(x, local, pasta) && x.nome.toLowerCase() === n.toLowerCase());
    if (!ocupado(item.nome)) return item.nome;
    for (let i = 2; ; i++) if (!ocupado(`${item.nome} (${i})`)) return `${item.nome} (${i})`;
  }
  // Ao renomear ou mover uma pasta, tudo o que está dentro dela muda de caminho junto.
  function trocarCaminho(lista, localAntigo, antigo, localNovo, novo) {
    lista.filter((x) => (x.local || 'pc') === localAntigo && dentroDe(x.pasta, antigo)).forEach((x) => {
      x.local = localNovo;
      x.pasta = novo + (x.pasta || '').slice(antigo.length);
    });
  }
  CE.caminhos = { juntar, dentroDe };

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

    // Cada item tem "local" ('pc' ou 'pendrive') e "pasta" (o caminho dentro do local, '' = raiz).
    // Pastas também são itens, com tipo 'pasta'. O caminho de uma pasta é pasta + '/' + nome.
    async salvarArquivo({ nome, tipo, conteudo, local = 'pc', pasta = '' }) {
      const lista = await CE.sessao.arquivos();
      const existente = lista.find((a) => !a.naLixeira && mesmoLugar(a, local, pasta) && a.nome.toLowerCase() === nome.toLowerCase() && a.tipo === tipo);
      const arquivo = existente || { id: novoId(), nome, tipo, local, pasta, criadoEm: Date.now() };
      Object.assign(arquivo, { nome, conteudo, alteradoEm: Date.now() });
      if (!existente) lista.push(arquivo);
      await CE.sessao.gravarArquivos(lista);
      CE.emitir('arquivo:salvo', { nome, tipo, novo: !existente, conteudo, local, pasta });
      return arquivo;
    },

    async criarPasta(nome, local = 'pc', pasta = '') {
      nome = String(nome || '').trim().replace(/[\\/]/g, '-');
      if (!nome) throw new Error('Escreva um nome para a pasta.');
      const lista = await CE.sessao.arquivos();
      if (lista.some((a) => !a.naLixeira && a.tipo === 'pasta' && mesmoLugar(a, local, pasta) && a.nome.toLowerCase() === nome.toLowerCase())) {
        throw new Error('Já existe uma pasta com esse nome aqui.');
      }
      const item = { id: novoId(), nome, tipo: 'pasta', local, pasta, criadoEm: Date.now(), alteradoEm: Date.now() };
      lista.push(item);
      await CE.sessao.gravarArquivos(lista);
      CE.emitir('pasta:criada', { nome, local, pasta, caminho: juntar(pasta, nome) });
      return item;
    },

    // Garante que exista uma pasta (usado pelos Downloads). Devolve o caminho dela.
    async garantirPasta(nome, local = 'pc', pasta = '') {
      const lista = await CE.sessao.arquivos();
      if (!lista.some((a) => !a.naLixeira && a.tipo === 'pasta' && mesmoLugar(a, local, pasta) && a.nome === nome)) {
        await CE.sessao.criarPasta(nome, local, pasta);
      }
      return juntar(pasta, nome);
    },

    async alterarArquivo(id, alterar, evento, dadosExtras = {}) {
      const lista = await CE.sessao.arquivos();
      const arquivo = lista.find((a) => a.id === id);
      if (!arquivo) return;
      const resultado = alterar(arquivo, lista);
      await CE.sessao.gravarArquivos(Array.isArray(resultado) ? resultado : lista);
      CE.emitir(evento, { nome: arquivo.nome, tipo: arquivo.tipo, local: arquivo.local || 'pc', pasta: arquivo.pasta || '', ...dadosExtras });
    },

    renomearArquivo(id, novoNome) {
      return CE.sessao.alterarArquivo(id, (a, lista) => {
        if (a.tipo === 'pasta') trocarCaminho(lista, a.local || 'pc', juntar(a.pasta, a.nome), a.local || 'pc', juntar(a.pasta, novoNome));
        a.nome = novoNome;
        a.alteradoEm = Date.now();
      }, 'arquivo:renomeado');
    },

    // Mover: o arquivo (ou a pasta, com tudo dentro) vai para outro lugar.
    moverArquivo(id, local, pasta) {
      return CE.sessao.alterarArquivo(id, (a, lista) => {
        const origem = juntar(a.pasta, a.nome);
        if (a.tipo === 'pasta' && (a.local || 'pc') === local && (pasta === origem || pasta.startsWith(origem + '/'))) {
          throw new Error('Não dá para colocar uma pasta dentro dela mesma.');
        }
        a.nome = nomeLivre(lista, a, local, pasta);
        if (a.tipo === 'pasta') trocarCaminho(lista, a.local || 'pc', origem, local, juntar(pasta, a.nome));
        a.local = local;
        a.pasta = pasta;
      }, 'arquivo:movido', { destinoLocal: local, destino: pasta });
    },

    // Copiar: cria uma cópia no destino (pastas são copiadas com tudo dentro).
    copiarArquivo(id, local, pasta) {
      return CE.sessao.alterarArquivo(id, (a, lista) => {
        const copia = { ...a, id: novoId(), local, pasta, criadoEm: Date.now(), alteradoEm: Date.now() };
        copia.nome = nomeLivre(lista, a, local, pasta);
        const novos = [copia];
        if (a.tipo === 'pasta') {
          const origem = juntar(a.pasta, a.nome), destino = juntar(pasta, copia.nome);
          lista.filter((x) => !x.naLixeira && (x.local || 'pc') === (a.local || 'pc') && dentroDe(x.pasta, origem)).forEach((x) => {
            novos.push({ ...x, id: novoId(), local, pasta: destino + (x.pasta || '').slice(origem.length) });
          });
        }
        lista.push(...novos);
      }, 'arquivo:copiado', { destinoLocal: local, destino: pasta });
    },

    // "Excluir" manda para a lixeira (uma pasta vai junto com tudo o que tem dentro).
    removerArquivo(id) {
      return CE.sessao.alterarArquivo(id, (a, lista) => {
        const agora = Date.now();
        a.naLixeira = true; a.excluidoEm = agora; a.grupoLixeira = a.id;
        if (a.tipo === 'pasta') {
          const caminho = juntar(a.pasta, a.nome);
          lista.filter((x) => !x.naLixeira && (x.local || 'pc') === (a.local || 'pc') && dentroDe(x.pasta, caminho))
            .forEach((x) => { x.naLixeira = true; x.excluidoEm = agora; x.grupoLixeira = a.id; });
        }
      }, 'arquivo:removido');
    },
    restaurarArquivo(id) {
      return CE.sessao.alterarArquivo(id, (a, lista) => {
        lista.filter((x) => x.grupoLixeira === a.id || x.id === a.id).forEach((x) => { delete x.naLixeira; delete x.excluidoEm; delete x.grupoLixeira; });
      }, 'arquivo:restaurado');
    },
    apagarDeVez(id) {
      return CE.sessao.alterarArquivo(id, (a, lista) => lista.filter((x) => x.id !== id && x.grupoLixeira !== id), 'arquivo:apagado');
    },
    // Baixar (da internet ou de um e-mail): o arquivo vai para a pasta Downloads.
    async baixarArquivo({ nome, tipo, conteudo }, origem = 'internet') {
      const pasta = await CE.sessao.garantirPasta('Downloads');
      const salvo = await CE.sessao.salvarArquivo({ nome, tipo, conteudo, local: 'pc', pasta });
      CE.emitir('arquivo:baixado', { nome, tipo, origem });
      CE.avisar(`⬇️ "${nome}" baixado para a pasta Downloads.`);
      return salvo;
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
