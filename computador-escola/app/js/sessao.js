// Dados do usuário que entrou: progresso nas lições e arquivos do "computador" dele.
window.CE = window.CE || {};

(function () {
  let filaProgresso = Promise.resolve();
  // As mudanças nos arquivos também entram numa fila: cada uma lê a lista, altera e grava antes da próxima começar
  // (no modo sala de aula a gravação vai pela rede e demora mais; sem a fila, uma mudança apagaria a outra).
  let filaArquivos = Promise.resolve();
  // Cada mudança grava nos arquivos de quem a pediu (mesmo que alguém saia e outro entre antes de ela rodar).
  function naFilaDosArquivos(tarefa) {
    const dono = CE.sessao.usuario.id;
    const vez = filaArquivos.then(() => tarefa(dono));
    filaArquivos = vez.catch(() => {});
    return vez;
  }

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
      const id = CE.sessao.usuario.id;
      const tarefa = filaProgresso.then(async () => {
        const atual = await CE.sessao.progresso(id);
        alterar(atual);
        await CE.api.chamar('dados:salvar', `progresso:${id}`, atual);
        return atual;
      });
      filaProgresso = tarefa.catch(() => {});
      return tarefa;
    },

    // Todos os arquivos do aluno, inclusive os que estão na lixeira (campo "naLixeira").
    async arquivos(id = CE.sessao.usuario.id) {
      return CE.api.chamar('dados:ler', `arquivos:${id}`, []);
    },

    async gravarArquivos(lista, id = CE.sessao.usuario.id) {
      await CE.api.chamar('dados:salvar', `arquivos:${id}`, lista);
    },

    // Antes de sair: espera as gravações que ainda estão na fila (no máximo alguns segundos, se a rede caiu).
    aguardarGravacoes(limite = 5000) {
      return Promise.race([Promise.all([filaProgresso, filaArquivos]), new Promise((r) => setTimeout(r, limite))]);
    },

    // Cada item tem "local" ('pc' ou 'pendrive') e "pasta" (o caminho dentro do local, '' = raiz).
    // Pastas também são itens, com tipo 'pasta'. O caminho de uma pasta é pasta + '/' + nome.
    async salvarArquivo({ nome, tipo, conteudo, local = 'pc', pasta = '' }) {
      const { arquivo, existente } = await naFilaDosArquivos(async (dono) => {
        const lista = await CE.sessao.arquivos(dono);
        const existente = lista.find((a) => !a.naLixeira && mesmoLugar(a, local, pasta) && a.nome.toLowerCase() === nome.toLowerCase() && a.tipo === tipo);
        const arquivo = existente || { id: novoId(), nome, tipo, local, pasta, criadoEm: Date.now() };
        Object.assign(arquivo, { nome, conteudo, alteradoEm: Date.now() });
        if (!existente) lista.push(arquivo);
        await CE.sessao.gravarArquivos(lista, dono);
        return { arquivo, existente };
      });
      CE.emitir('arquivo:salvo', { nome, tipo, novo: !existente, conteudo, local, pasta });
      return arquivo;
    },

    async criarPasta(nome, local = 'pc', pasta = '') {
      nome = String(nome || '').trim().replace(/[\\/]/g, '-');
      if (!nome) throw new Error('Escreva um nome para a pasta.');
      const item = await naFilaDosArquivos(async (dono) => {
        const lista = await CE.sessao.arquivos(dono);
        if (lista.some((a) => !a.naLixeira && a.tipo === 'pasta' && mesmoLugar(a, local, pasta) && a.nome.toLowerCase() === nome.toLowerCase())) {
          throw new Error('Já existe uma pasta com esse nome aqui.');
        }
        const item = { id: novoId(), nome, tipo: 'pasta', local, pasta, criadoEm: Date.now(), alteradoEm: Date.now() };
        lista.push(item);
        await CE.sessao.gravarArquivos(lista, dono);
        return item;
      });
      CE.emitir('pasta:criada', { nome, local, pasta, caminho: juntar(pasta, nome) });
      return item;
    },

    // Garante que exista uma pasta (usado pelos Downloads). Devolve o caminho dela.
    async garantirPasta(nome, local = 'pc', pasta = '') {
      const criada = await naFilaDosArquivos(async (dono) => {
        const lista = await CE.sessao.arquivos(dono);
        if (lista.some((a) => !a.naLixeira && a.tipo === 'pasta' && mesmoLugar(a, local, pasta) && a.nome === nome)) return false;
        lista.push({ id: novoId(), nome, tipo: 'pasta', local, pasta, criadoEm: Date.now(), alteradoEm: Date.now() });
        await CE.sessao.gravarArquivos(lista, dono);
        return true;
      });
      if (criada) CE.emitir('pasta:criada', { nome, local, pasta, caminho: juntar(pasta, nome) });
      return juntar(pasta, nome);
    },

    async alterarArquivo(id, alterar, evento, dadosExtras = {}) {
      const arquivo = await naFilaDosArquivos(async (dono) => {
        const lista = await CE.sessao.arquivos(dono);
        const arquivo = lista.find((a) => a.id === id);
        if (!arquivo) return null;
        const resultado = alterar(arquivo, lista);
        await CE.sessao.gravarArquivos(Array.isArray(resultado) ? resultado : lista, dono);
        return arquivo;
      });
      if (!arquivo) return;
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
    // Compactar: junta um arquivo (ou uma pasta com tudo dentro) num só arquivo .zip, no mesmo lugar.
    async compactar(id) {
      const r = await naFilaDosArquivos(async (dono) => {
      const lista = await CE.sessao.arquivos(dono);
      const a = lista.find((x) => x.id === id);
      if (!a) return null;
      const local = a.local || 'pc';
      let itens = [{ nome: a.nome, tipo: a.tipo, conteudo: a.conteudo, pasta: '' }];
      if (a.tipo === 'pasta') {
        const origem = juntar(a.pasta, a.nome);
        lista.filter((x) => !x.naLixeira && (x.local || 'pc') === local && dentroDe(x.pasta, origem))
          .forEach((x) => itens.push({ nome: x.nome, tipo: x.tipo, conteudo: x.conteudo, pasta: juntar(a.nome, (x.pasta || '').slice(origem.length + 1)) }));
      }
      const tamanho = (i) => JSON.stringify(i).length;
      const antes = itens.reduce((s, i) => s + tamanho(i), 0);
      const zip = { id: novoId(), tipo: 'zip', local, pasta: a.pasta || '', criadoEm: Date.now(), alteradoEm: Date.now(), conteudo: JSON.stringify({ itens }) };
      zip.nome = nomeLivre(lista, { ...a, tipo: 'zip' }, local, a.pasta || '');
      lista.push(zip);
      await CE.sessao.gravarArquivos(lista, dono);
      return { a, zip, itens, antes, local };
      });
      if (!r) return null;
      const { a, zip, itens, antes, local } = r;
      const arquivos = itens.filter((i) => i.tipo !== 'pasta').length;
      CE.emitir('arquivo:compactado', { nome: zip.nome, origem: a.nome, arquivos, local, pasta: zip.pasta });
      return { zip, arquivos, antes, depois: Math.round(antes * 0.45) };
    },
    // Extrair: recria o que está dentro do .zip numa pasta com o mesmo nome.
    async extrair(id) {
      const r = await naFilaDosArquivos(async (dono) => {
      const lista = await CE.sessao.arquivos(dono);
      const zip = lista.find((x) => x.id === id && x.tipo === 'zip');
      if (!zip) return null;
      const local = zip.local || 'pc';
      let itens = [];
      try { itens = JSON.parse(zip.conteudo || '{}').itens || []; } catch { itens = []; }
      const pastaNova = { id: novoId(), tipo: 'pasta', local, pasta: zip.pasta || '', criadoEm: Date.now(), alteradoEm: Date.now() };
      pastaNova.nome = nomeLivre(lista, { nome: zip.nome, tipo: 'pasta' }, local, zip.pasta || '');
      const base = juntar(zip.pasta, pastaNova.nome);
      lista.push(pastaNova, ...itens.map((i) => ({ id: novoId(), nome: i.nome, tipo: i.tipo, conteudo: i.conteudo, local, pasta: juntar(base, i.pasta), criadoEm: Date.now(), alteradoEm: Date.now() })));
      await CE.sessao.gravarArquivos(lista, dono);
      return { zip, pastaNova, itens, local };
      });
      if (!r) return null;
      const { zip, pastaNova, itens, local } = r;
      CE.emitir('arquivo:extraido', { nome: zip.nome, pasta: pastaNova.nome, arquivos: itens.filter((i) => i.tipo !== 'pasta').length, local });
      return pastaNova;
    },
    // Cópia de segurança: tudo de "Meus Documentos" vai para uma pasta "Backup <data>" no pen drive.
    async backupNoPendrive() {
      if (!CE.pendrive.conectado) throw new Error('Conecte o pen drive primeiro (botão 🔌 na barra de tarefas).');
      const nome = 'Backup ' + new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
      const pasta = await CE.sessao.garantirPasta(nome, 'pendrive', '');
      const doPc = await naFilaDosArquivos(async (dono) => {
        const lista = await CE.sessao.arquivos(dono);
        const doPc = lista.filter((x) => !x.naLixeira && (x.local || 'pc') === 'pc');
        const ja = new Set(lista.filter((x) => x.local === 'pendrive' && dentroDe(x.pasta, pasta)).map((x) => `${x.pasta}|${x.nome}|${x.tipo}`));
        const copias = doPc.map((x) => ({ ...x, id: novoId(), local: 'pendrive', pasta: juntar(pasta, x.pasta || ''), alteradoEm: Date.now() }))
          .filter((x) => !ja.has(`${x.pasta}|${x.nome}|${x.tipo}`));
        lista.push(...copias);
        await CE.sessao.gravarArquivos(lista, dono);
        return doPc;
      });
      const arquivos = doPc.filter((x) => x.tipo !== 'pasta').length;
      CE.emitir('config:backup', { pasta: nome, arquivos });
      return { pasta: nome, arquivos };
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
      await naFilaDosArquivos(async (dono) => CE.sessao.gravarArquivos((await CE.sessao.arquivos(dono)).filter((a) => !a.naLixeira), dono));
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
