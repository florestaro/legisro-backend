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
      // A conta foi aberta em outro computador, foi removida pelo instrutor, ou a sessão acabou: volta para a entrada.
      if (resultado.semSessao && CE.sessao && CE.sessao.usuario && CE.emitir) CE.emitir('sessao:perdida', { motivo: resultado.erro });
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
        'email:novas': () => ((atual && ler('email:' + atual.id, {}).mensagens) || []).filter((m) => !(a[0] || []).includes(m.id)),
        'dados:ler': () => ler(a[0], a[1]),
        'dados:salvar': () => gravar(a[0], a[1]),
        'ia:status': () => ({ estado: 'sem-modelo', detalhe: 'Modo de teste no navegador.' }),
        'ia:perguntar': () => CE.responderSemIA(a[1], a[2]),
        'app:sair': () => location.reload(),
        'janela:zoom': () => { document.documentElement.style.zoom = a[0]; return a[0]; },
        'aulas:listar': () => ler('aulas-professor', []),
        'aulas:salvar': () => { if (!atual || atual.papel !== 'instrutor') throw new Error('Apenas o instrutor pode fazer isso.'); return gravar('aulas-professor', a[0]); },
        'aulas:gravar': () => {
          if (!atual || atual.papel !== 'instrutor') throw new Error('Apenas o instrutor pode fazer isso.');
          const lista = ler('aulas-professor', []);
          return gravar('aulas-professor', lista.some((x) => x.id === a[0].id) ? lista.map((x) => (x.id === a[0].id ? a[0] : x)) : [...lista, a[0]]);
        },
        'aulas:apagar': () => { if (!atual || atual.papel !== 'instrutor') throw new Error('Apenas o instrutor pode fazer isso.'); return gravar('aulas-professor', ler('aulas-professor', []).filter((x) => x.id !== a[0])); },
        'sala:ler': () => ({ modo: 'local', navegador: true, servidor: '', codigo: '', protegido: false, nomePc: 'Navegador de teste', ips: [] }),
        'sala:status': () => ({ modo: 'local', conectado: null, erro: '' }),
        'sala:procurar': () => [],
        'sala:salvar': () => { throw new Error('A rede da sala só funciona no programa instalado nos computadores (não neste teste pelo navegador).'); },
        'sala:presenca': () => {
          if (!atual) throw new Error('Ninguém entrou no sistema.');
          salaTeste.presencas[atual.id] = { usuario: atual, pc: 'Este computador', atividade: a[0] || {}, em: Date.now() };
          return { pausada: salaTeste.pausada && atual.papel !== 'instrutor', mensagem: atual.papel !== 'instrutor' ? salaTeste.mensagem : null };
        },
        'sala:turma': () => ({ pausada: salaTeste.pausada, mensagem: salaTeste.mensagem, alunos: Object.values(salaTeste.presencas).filter((x) => Date.now() - x.em < 45000).map((x) => ({ ...x, ha: Math.round((Date.now() - x.em) / 1000), ajudaHa: x.atividade.ajuda ? Math.round((Date.now() - x.atividade.ajuda) / 1000) : null })) }),
        'escola:ler': () => {
          const e = ler('escola', {});
          return { nome: e.nome || '', cidade: e.cidade || '', responsavel: e.responsavel || '', cargo: e.cargo || 'Instrutor(a)', cargas: { n1: 40, n2: 40, n3: 40, digitacao1: 20, digitacao2: 20, digitacao3: 20, ...(e.cargas || {}) }, trilha: e.trilha === 'completa' ? 'completa' : 'essencial' };
        },
        'escola:trilha': () => {
          if (!atual || atual.papel !== 'instrutor') throw new Error('Apenas o instrutor pode fazer isso.');
          if (a[0] !== 'essencial' && a[0] !== 'completa') throw new Error('Trilha inválida.');
          gravar('escola', { ...ler('escola', {}), trilha: a[0] });
          return simulado('escola:ler').then((r) => r.valor);
        },
        'escola:salvar': () => {
          if (!atual || atual.papel !== 'instrutor') throw new Error('Apenas o instrutor pode fazer isso.');
          const info = a[0] || {}; const texto = (v, n) => String(v || '').trim().slice(0, n);
          const cargas = {};
          Object.entries(info.cargas || {}).forEach(([k, v]) => { const h = Math.round(Number(v)); if (h >= 1 && h <= 2000) cargas[k] = h; });
          gravar('escola', { ...ler('escola', {}), nome: texto(info.nome, 120), cidade: texto(info.cidade, 80), responsavel: texto(info.responsavel, 80), cargo: texto(info.cargo, 60), cargas });
          return simulado('escola:ler').then((r) => r.valor);
        },
        'escola:certificado': () => {
          if (!atual || atual.papel !== 'instrutor') throw new Error('Apenas o instrutor pode fazer isso.');
          const e = ler('escola', {}); e.certificados = e.certificados || {};
          const k = `${a[0]}:${a[1]}`;
          if (!e.certificados[k]) { e.ultimoCertificado = (e.ultimoCertificado || 0) + 1; e.certificados[k] = { numero: e.ultimoCertificado, emitidoEm: Date.now() }; gravar('escola', e); }
          return e.certificados[k];
        },
        'escola:certificados': () => ler('escola', {}).certificados || {},
        'progresso:liberar': () => {
          if (!atual || atual.papel !== 'instrutor') throw new Error('Apenas o instrutor pode fazer isso.');
          (a[0] || []).forEach((id) => {
            const p = ler('progresso:' + id, { licoes: {}, digitacao: {} });
            if (Object.keys(a[1] || {}).length) p.liberadas = a[1]; else delete p.liberadas;
            if (a[2] !== undefined) { if (a[2] === 'essencial' || a[2] === 'completa') p.trilha = a[2]; else delete p.trilha; }
            gravar('progresso:' + id, p);
          });
          return true;
        },
        'progresso:zerar-dificuldades': () => {
          if (!atual || atual.papel !== 'instrutor') throw new Error('Apenas o instrutor pode fazer isso.');
          (a[0] || []).forEach((id) => { const p = ler('progresso:' + id, null); if (p) { delete p.dificuldades; gravar('progresso:' + id, p); } });
          return true;
        },
        // Imprimir ou salvar em PDF: no navegador, a janela de impressão do próprio navegador (lá dá para escolher "Salvar como PDF").
        'janela:pdf': () => { window.print(); return null; },
        'arquivo:salvar-texto': () => {
          const { nome, conteudo, tipo } = a[0] || {};
          const link = document.createElement('a');
          link.href = URL.createObjectURL(new Blob([conteudo], { type: tipo || 'text/plain;charset=utf-8' }));
          // Sem acentos no nome: alguns navegadores trocam um nome com acento por "download".
          link.download = String(nome || 'arquivo.txt').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w .,()-]/g, '_');
          document.body.append(link); link.click(); link.remove();
          setTimeout(() => URL.revokeObjectURL(link.href), 60000);
          return link.download;
        },
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
