// Acesso ao processo principal. Quando a tela é aberta direto no navegador (sem Electron),
// usa o armazenamento do navegador — útil só para testar o visual.
window.CE = window.CE || {};

(function () {
  const temElectron = !!window.api;
  let idPergunta = 0;
  const ouvintesIA = {};

  if (temElectron) {
    window.api.aoReceberTrechoIA((id, trecho) => ouvintesIA[id] && ouvintesIA[id](trecho));
  }

  // Computador de aluno sem conexão com o instrutor: avisa (no máximo a cada 15 s) que algo não foi salvo.
  let ultimoAvisoRede = 0;
  async function chamar(canal, ...args) {
    const resultado = temElectron ? await window.api.chamar(canal, ...args) : await simulado(canal, ...args);
    if (!resultado.ok) {
      if (/^Sem conexão com o computador do instrutor/.test(resultado.erro) && canal !== 'sala:presenca' && CE.sessao && CE.sessao.usuario && Date.now() - ultimoAvisoRede > 15000) {
        ultimoAvisoRede = Date.now();
        if (CE.avisar) CE.avisar('⚠️ Sem conexão com o computador do instrutor: o que você fez agora pode não ter sido salvo. Chame o instrutor.');
      }
      throw new Error(resultado.erro);
    }
    return resultado.valor;
  }

  // ---------- Modo de teste no navegador ----------
  const ler = (k, p) => { try { const v = localStorage.getItem('ce-' + k); return v ? JSON.parse(v) : p; } catch { return p; } };
  const gravar = (k, v) => { try { localStorage.setItem('ce-' + k, JSON.stringify(v)); } catch { /* ignora */ } return true; };
  let atual = null;
  // Sala de aula no navegador de teste: só este computador (a rede só funciona no programa instalado).
  const salaTeste = { pausada: false, mensagem: null, presencas: {} };

  async function simulado(canal, ...a) {
    try {
      const usuarios = ler('usuarios', []);
      const publico = (u) => ({ id: u.id, nome: u.nome, papel: u.papel, turma: u.turma || '', avatar: u.avatar, crianca: !!u.crianca });
      const criar = (info, papel) => {
        if (!info.nome || !info.nome.trim()) throw new Error('Informe o nome.');
        if (!info.segredo || info.segredo.length < 4) throw new Error('A senha precisa ter pelo menos 4 caracteres.');
        if (usuarios.some((u) => u.nome.toLowerCase() === info.nome.trim().toLowerCase())) throw new Error('Já existe alguém com esse nome.');
        const u = { id: String(Date.now()) + Math.random().toString(16).slice(2), nome: info.nome.trim(), papel, turma: info.turma || '', avatar: info.avatar || '🙂', crianca: !!info.crianca, segredo: info.segredo };
        usuarios.push(u); gravar('usuarios', usuarios); return publico(u);
      };
      const valor = {
        'usuarios:listar': () => usuarios.map(publico),
        'usuarios:existe-instrutor': () => usuarios.some((u) => u.papel === 'instrutor'),
        'usuarios:primeiro-instrutor': () => (atual = criar({ ...a[0], avatar: '🧑‍🏫' }, 'instrutor')),
        'usuarios:criar': () => criar(a[0], a[0].papel === 'instrutor' ? 'instrutor' : 'aluno'),
        'usuarios:trocar-senha': () => { const u = usuarios.find((x) => x.id === a[0]); u.segredo = a[1]; return gravar('usuarios', usuarios); },
        'usuarios:remover': () => gravar('usuarios', usuarios.filter((u) => u.id !== a[0])),
        'sessao:entrar': () => {
          const u = usuarios.find((x) => x.id === a[0]);
          if (!u || u.segredo !== a[1]) throw new Error('Senha incorreta. Tente de novo.');
          return (atual = publico(u));
        },
        'sessao:sair': () => { atual = null; return true; },
        'email:endereco-livre': () => !usuarios.some((u) => u.id !== (atual && atual.id) && (ler('email:' + u.id, {}).conta || {}).endereco === String(a[0]).toLowerCase()),
        'email:contatos': () => usuarios.filter((u) => u.id !== (atual && atual.id) && (ler('email:' + u.id, {}).conta))
          .map((u) => ({ nome: ler('email:' + u.id).conta.nome, endereco: ler('email:' + u.id).conta.endereco })),
        'email:entregar': () => {
          const para = String(a[0].para || '').toLowerCase();
          const u = usuarios.find((x) => (ler('email:' + x.id, {}).conta || {}).endereco === para);
          if (!u) return { entregue: false };
          const caixa = ler('email:' + u.id);
          const minha = (ler('email:' + atual.id, {}).conta) || {};
          caixa.mensagens = (caixa.mensagens || []).concat({ ...a[0], de: minha.endereco, deNome: minha.nome, id: String(Date.now()) + Math.random(), pasta: 'entrada', lida: false, em: Date.now(), para });
          gravar('email:' + u.id, caixa);
          return { entregue: true, nome: caixa.conta.nome };
        },
        'dados:ler': () => ler(a[0], a[1]),
        'dados:salvar': () => gravar(a[0], a[1]),
        'ia:status': () => ({ estado: 'sem-modelo', detalhe: 'Modo de teste no navegador.' }),
        'ia:perguntar': () => CE.responderSemIA(a[1], a[2]),
        'app:sair': () => location.reload(),
        'janela:zoom': () => { document.documentElement.style.zoom = a[0]; return a[0]; },
        'aulas:listar': () => ler('aulas-professor', []),
        'aulas:salvar': () => { if (!atual || atual.papel !== 'instrutor') throw new Error('Apenas o instrutor pode fazer isso.'); return gravar('aulas-professor', a[0]); },
        'sala:ler': () => ({ modo: 'local', navegador: true, servidor: '', codigo: '', protegido: false, nomePc: 'Navegador de teste', ips: [] }),
        'sala:status': () => ({ modo: 'local', conectado: null, erro: '' }),
        'sala:procurar': () => [],
        'sala:salvar': () => { throw new Error('A rede da sala só funciona no programa instalado nos computadores (não neste teste pelo navegador).'); },
        'sala:presenca': () => {
          if (!atual) throw new Error('Ninguém entrou no sistema.');
          salaTeste.presencas[atual.id] = { usuario: atual, pc: 'Este computador', atividade: a[0] || {}, em: Date.now() };
          return { pausada: salaTeste.pausada && atual.papel !== 'instrutor', mensagem: atual.papel !== 'instrutor' ? salaTeste.mensagem : null };
        },
        'sala:turma': () => ({ pausada: salaTeste.pausada, mensagem: salaTeste.mensagem, alunos: Object.values(salaTeste.presencas).filter((x) => Date.now() - x.em < 45000).map((x) => ({ ...x, ha: Math.round((Date.now() - x.em) / 1000) })) }),
        'sala:pausar': () => (salaTeste.pausada = !!a[0]),
        'sala:mensagem': () => (salaTeste.mensagem = String(a[0] || '').trim() ? { id: Date.now(), texto: String(a[0]).trim().slice(0, 300), de: atual.nome } : null),
      }[canal];
      return { ok: true, valor: await valor() };
    } catch (erro) {
      return { ok: false, erro: erro.message };
    }
  }

  CE.api = {
    chamar,
    temElectron,
    // Pergunta ao professor; aoReceberTrecho recebe o texto aos poucos (quando há IA).
    async perguntarIA(pergunta, situacao, aoReceberTrecho) {
      const id = ++idPergunta;
      if (aoReceberTrecho) ouvintesIA[id] = aoReceberTrecho;
      try {
        return await chamar('ia:perguntar', id, pergunta, situacao);
      } finally {
        delete ouvintesIA[id];
      }
    },
  };
})();
