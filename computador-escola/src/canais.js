// Canais de dados: o que a tela pode pedir (usuários, progresso, arquivos, e-mail e a sala de aula).
// Cada pedido vem com uma "sessão" ({ usuario, pc }): no computador sozinho é a sessão de quem está na frente dele;
// no modo sala de aula, o computador do instrutor guarda uma sessão para cada computador de aluno.
const os = require('os');

// Chaves que a tela pode usar: "progresso:<id>", "arquivos:<id>" e "email:<id>" (a caixa de e-mail do aluno).
// Cada aluno só lê e grava os próprios dados; o instrutor pode ler e gravar os de todos.
const TIPOS_DE_DADOS = ['progresso', 'arquivos', 'email'];

function criarCanais(dados) {
  // "semSessao": a tela volta para a entrada (a conta foi aberta em outro computador, foi removida, ou a sessão acabou).
  const erroSemSessao = (texto) => Object.assign(new Error(texto), { semSessao: true });
  function exigirSessao(s) {
    if (!s.usuario) throw erroSemSessao(s.motivo || 'Ninguém entrou no sistema.');
    const versao = dados.versaoSenha(s.usuario.id);
    if (versao && !s.versaoSenha) s.versaoSenha = versao; // sessão guardada por uma versão anterior do programa
    const motivo = !versao ? 'Esta conta foi removida pelo instrutor.'
      : s.versaoSenha && s.versaoSenha !== versao ? 'A senha desta conta foi trocada. Entre de novo com a senha nova.' : null;
    if (motivo) {
      presencas.delete(s.usuario.id);
      s.usuario = null;
      throw erroSemSessao(motivo);
    }
  }
  const exigirInstrutor = (s) => { exigirSessao(s); if (s.usuario.papel !== 'instrutor') throw new Error('Apenas o instrutor pode fazer isso.'); };
  function conferirChave(s, chave) {
    const [tipo, dono] = String(chave).split(':');
    exigirSessao(s);
    if (!TIPOS_DE_DADOS.includes(tipo) || !dono) throw new Error('Tipo de dado desconhecido.');
    if (dono !== s.usuario.id && s.usuario.papel !== 'instrutor') throw new Error('Acesso negado.');
    return `${tipo}-${dono}`;
  }
  // Índice dos endereços de e-mail (endereço -> dono): as caixas podem ter anexos grandes, então elas não são
  // abertas todas a cada pedido. É montado uma vez e atualizado sempre que uma caixa é gravada.
  let indice = null; // Map endereço -> { id, nome }
  const contas = new Map(); // id do dono -> { endereco, nome }
  function enderecos() {
    if (!indice) {
      indice = new Map();
      for (const u of dados.listarUsuarios()) {
        const caixa = dados.ler(`email-${u.id}`, null);
        if (caixa && caixa.conta && caixa.conta.endereco) {
          indice.set(caixa.conta.endereco, { id: u.id, nome: caixa.conta.nome || u.nome });
          contas.set(u.id, { endereco: caixa.conta.endereco, nome: caixa.conta.nome || u.nome });
        }
      }
    }
    return indice;
  }
  function anotarEndereco(id, conta) {
    const mapa = enderecos();
    for (const [e, d] of mapa) if (d.id === id) mapa.delete(e);
    contas.delete(id);
    if (conta && conta.endereco) {
      mapa.set(conta.endereco, { id, nome: conta.nome || '' });
      contas.set(id, { endereco: conta.endereco, nome: conta.nome || '' });
    }
  }
  const donoDoEndereco = (endereco) => {
    const d = enderecos().get(String(endereco || '').toLowerCase());
    return d && dados.listarUsuarios().some((u) => u.id === d.id) ? d : null;
  };
  const LIMITE_ANEXOS = 10 * 1024 * 1024;
  // Dados da escola para os certificados (carga horária de cada curso, em horas).
  const ESCOLA_PADRAO = { nome: '', cidade: '', responsavel: '', cargo: 'Instrutor(a)', cargas: { n1: 40, n2: 40, n3: 40, digitacao1: 20, digitacao2: 20, digitacao3: 20 } };
  const dadosDaEscola = () => {
    const e = dados.ler('escola', {});
    return { nome: e.nome || '', cidade: e.cidade || '', responsavel: e.responsavel || '', cargo: e.cargo || ESCOLA_PADRAO.cargo, cargas: { ...ESCOLA_PADRAO.cargas, ...(e.cargas || {}) }, trilha: e.trilha === 'completa' ? 'completa' : 'essencial', revisao: e.revisao !== false };
  };
  // A caixa inteira vai pela rede a cada gravação (limite de 25 MB): uma caixa quase cheia não recebe mais nada.
  const LIMITE_CAIXA = 20 * 1024 * 1024;
  const CAIXA_CHEIA = 'Sua caixa de e-mail está cheia (mais de 20 MB). Apague de vez as mensagens com anexos que não usa mais (mova para a Lixeira e clique em Esvaziar a Lixeira).';
  function salvarAulas(lista) {
    if (!Array.isArray(lista) || lista.length > 300) throw new Error('Lista de aulas inválida.');
    if (JSON.stringify(lista).length > 2 * 1024 * 1024) throw new Error('As aulas ficaram grandes demais.');
    return dados.salvar('aulas-professor', lista);
  }

  // A sala de aula ao vivo: quem está em cada computador e o que está fazendo (só na memória).
  const presencas = new Map(); // id do usuário -> { usuario, pc, atividade, em }
  const sala = { pausada: false, mensagens: [] };
  // Cada mensagem do instrutor vale por 15 minutos (quem entrar bem depois não vê um aviso velho); as últimas
  // ficam guardadas, para duas mensagens mandadas em seguida chegarem as duas.
  const mensagensAtuais = () => sala.mensagens.filter((m) => Date.now() - m.id < 15 * 60 * 1000);
  const mensagemAtual = () => mensagensAtuais().slice(-1)[0] || null;

  return {
    'usuarios:listar': () => dados.listarUsuarios(),
    'usuarios:existe-instrutor': () => dados.existeInstrutor(),
    'usuarios:primeiro-instrutor': (s, info) => {
      if (dados.existeInstrutor()) throw new Error('O instrutor já foi cadastrado.');
      s.usuario = dados.criarUsuario({ ...info, papel: 'instrutor', avatar: '🧑‍🏫' });
      s.versaoSenha = dados.versaoSenha(s.usuario.id);
      return s.usuario;
    },
    'usuarios:criar': (s, info) => {
      exigirInstrutor(s);
      return dados.criarUsuario({ ...info, papel: info.papel === 'instrutor' ? 'instrutor' : 'aluno' });
    },
    'usuarios:trocar-senha': (s, id, segredo) => {
      exigirInstrutor(s);
      dados.trocarSenha(id, segredo);
      // Quem trocou a própria senha continua dentro; nos outros computadores, essa conta sai.
      if (id === s.usuario.id) s.versaoSenha = dados.versaoSenha(id);
      return true;
    },
    'usuarios:remover': (s, id) => {
      exigirInstrutor(s);
      if (id === s.usuario.id) throw new Error('Você não pode remover a si mesmo.');
      return dados.removerUsuario(id);
    },
    'sessao:entrar': async (s, id, segredo) => {
      s.usuario = await dados.entrar(id, segredo);
      s.versaoSenha = dados.versaoSenha(id);
      s.motivo = null;
      return s.usuario;
    },
    'sessao:sair': (s) => { if (s.usuario) presencas.delete(s.usuario.id); s.usuario = null; s.motivo = null; return true; },
    'dados:ler': (s, chave, padrao) => dados.ler(conferirChave(s, chave), padrao),
    'dados:salvar': (s, chave, valor) => {
      const arquivo = conferirChave(s, chave);
      // Um colega pode entregar um e-mail (email:entregar) entre a hora em que a tela leu a caixa e a hora em que
      // ela grava: as mensagens que estão guardadas e que a tela ainda não conhece continuam na caixa.
      // As que o aluno apagou de vez (Lixeira) vêm em "apagadas" e não voltam.
      if (arquivo.startsWith('email-') && valor && Array.isArray(valor.mensagens)) {
        const guardada = dados.ler(arquivo, null);
        // O endereço é conferido aqui também: duas pessoas criando a conta ao mesmo tempo não ficam com o mesmo endereço.
        const dono = arquivo.slice('email-'.length);
        const endereco = valor.conta && String(valor.conta.endereco || '').toLowerCase();
        if (endereco && !(guardada && guardada.conta && guardada.conta.endereco === endereco)) {
          const ocupado = donoDoEndereco(endereco);
          if (ocupado && ocupado.id !== dono) throw new Error('Esse endereço já está em uso. Escolha outro nome de usuário.');
        }
        const conhecidas = new Set();
        const apagadas = new Set(Array.isArray(valor.apagadas) ? valor.apagadas : []);
        valor = { ...valor, mensagens: valor.mensagens.filter((m) => m && !conhecidas.has(m.id) && conhecidas.add(m.id)) };
        delete valor.apagadas;
        const chegaram = (guardada && Array.isArray(guardada.mensagens) ? guardada.mensagens : []).filter((m) => m && !conhecidas.has(m.id) && !apagadas.has(m.id));
        if (chegaram.length) valor = { ...valor, mensagens: valor.mensagens.concat(chegaram) };
        // A caixa não passa do limite por nenhum caminho (também pelo próprio computador do instrutor):
        // uma gravação que faria a caixa crescer além dele é recusada (as que diminuem a caixa sempre passam).
        const tamanho = JSON.stringify(valor).length;
        if (tamanho > LIMITE_CAIXA && tamanho > (guardada ? JSON.stringify(guardada).length : 0) + 4096) throw new Error(CAIXA_CHEIA);
        dados.salvar(arquivo, valor);
        anotarEndereco(dono, valor.conta);
        return true;
      }
      // O que o instrutor liberou fora da sequência ("liberadas") e a trilha do aluno só o instrutor muda: a gravação
      // do próprio aluno mantém o que está guardado (e uma gravação dele feita ao mesmo tempo não desfaz a mudança).
      if (arquivo.startsWith('progresso-') && s.usuario.papel !== 'instrutor' && valor && typeof valor === 'object') {
        const guardada = dados.ler(arquivo, null);
        valor = { ...valor };
        ['liberadas', 'trilha'].forEach((k) => { if (guardada && guardada[k]) valor[k] = guardada[k]; else delete valor[k]; });
      }
      return dados.salvar(arquivo, valor);
    },
    // Instrutor libera aulas fora da sequência para alunos (troca as liberações deles por estas). Com "trilha"
    // ("essencial" ou "completa"; vazio = a da escola), troca também a trilha deles.
    'progresso:liberar': (s, ids, liberadas, trilha) => {
      exigirInstrutor(s);
      const existem = new Set(dados.listarUsuarios().map((u) => u.id));
      const limpas = {};
      Object.entries(liberadas || {}).slice(0, 500).forEach(([k, v]) => { if (v) limpas[String(k).slice(0, 80)] = true; });
      (Array.isArray(ids) ? ids : []).filter((id) => existem.has(id)).forEach((id) => {
        const p = dados.ler(`progresso-${id}`, { licoes: {}, digitacao: {} });
        if (Object.keys(limpas).length) p.liberadas = limpas; else delete p.liberadas;
        if (trilha !== undefined) { if (trilha === 'essencial' || trilha === 'completa') p.trilha = trilha; else delete p.trilha; }
        dados.salvar(`progresso-${id}`, p);
      });
      return true;
    },
    // Instrutor zera a contagem de "onde a turma trava" (depois de reescrever uma aula, por exemplo).
    'progresso:zerar-dificuldades': (s, ids) => {
      exigirInstrutor(s);
      (Array.isArray(ids) ? ids : []).forEach((id) => {
        const p = dados.ler(`progresso-${id}`, null);
        if (p && p.dificuldades) { delete p.dificuldades; dados.salvar(`progresso-${id}`, p); }
      });
      return true;
    },

    // E-mail entre alunos: o remetente só escreve na caixa do destinatário por aqui,
    // e só pode acrescentar uma mensagem na Caixa de entrada (nunca ler ou apagar as mensagens dele).
    'email:endereco-livre': (s, endereco) => {
      exigirSessao(s);
      const dono = donoDoEndereco(endereco);
      return !dono || dono.id === s.usuario.id;
    },
    'email:contatos': (s) => {
      exigirSessao(s);
      const existem = new Set(dados.listarUsuarios().map((u) => u.id));
      return [...enderecos()].filter(([, d]) => d.id !== s.usuario.id && existem.has(d.id)).map(([endereco, d]) => ({ nome: d.nome, endereco }));
    },
    'email:entregar': (s, mensagem) => {
      exigirSessao(s);
      // O remetente é sempre o dono da sessão: ninguém consegue mandar e-mail fingindo ser outra pessoa.
      enderecos();
      const minha = contas.get(s.usuario.id);
      if (!minha) throw new Error('Crie a sua conta de e-mail primeiro.');
      const para = String(mensagem.para || '').toLowerCase();
      const dono = donoDoEndereco(para);
      const caixa = dono && dados.ler(`email-${dono.id}`, null);
      if (!caixa || !caixa.conta) return { entregue: false };
      const anexos = Array.isArray(mensagem.anexos) ? mensagem.anexos.slice(0, 5) : [];
      if (JSON.stringify(anexos).length > LIMITE_ANEXOS) throw new Error('Os anexos ficaram grandes demais (o máximo é 10 MB). Mande menos arquivos ou arquivos menores.');
      const recebida = {
        id: `${Date.now()}${Math.random().toString(16).slice(2, 8)}`, pasta: 'entrada', lida: false, em: Date.now(),
        de: minha.endereco, deNome: minha.nome, para,
        assunto: String(mensagem.assunto || '').slice(0, 200), texto: String(mensagem.texto || '').slice(0, 20000), anexos,
      };
      if (JSON.stringify(caixa).length + JSON.stringify(recebida).length > LIMITE_CAIXA) {
        throw new Error(`A caixa de e-mail de ${caixa.conta.nome} está cheia. Peça para apagar de vez as mensagens antigas com anexos.`);
      }
      caixa.mensagens = (caixa.mensagens || []).concat(recebida);
      dados.salvar(`email-${dono.id}`, caixa);
      return { entregue: true, nome: caixa.conta.nome };
    },
    // Só as mensagens que a tela ainda não tem (o Correio confere de tempos em tempos sem baixar a caixa inteira).
    'email:novas': (s, conhecidas) => {
      exigirSessao(s);
      const ids = new Set(Array.isArray(conhecidas) ? conhecidas : []);
      const caixa = dados.ler(`email-${s.usuario.id}`, null);
      return caixa && Array.isArray(caixa.mensagens) ? caixa.mensagens.filter((m) => m && !ids.has(m.id)) : [];
    },

    // ---------- Aulas criadas pelo instrutor (valem para todos os alunos) ----------
    // ---------- Dados da escola (certificados e relatórios) ----------
    'escola:ler': (s) => { exigirSessao(s); return dadosDaEscola(); },
    'escola:salvar': (s, info = {}) => {
      exigirInstrutor(s);
      const guardada = dados.ler('escola', {});
      const texto = (v, n) => String(v || '').trim().slice(0, n);
      const cargas = {};
      Object.keys(ESCOLA_PADRAO.cargas).forEach((k) => {
        const h = Math.round(Number(info.cargas && info.cargas[k]));
        cargas[k] = h >= 1 && h <= 2000 ? h : ESCOLA_PADRAO.cargas[k];
      });
      dados.salvar('escola', { ...guardada, nome: texto(info.nome, 120), cidade: texto(info.cidade, 80), responsavel: texto(info.responsavel, 80), cargo: texto(info.cargo, 60), cargas });
      return dadosDaEscola();
    },
    // Trilha do curso para a escola toda: "essencial" (o padrão) ou "completa".
    'escola:trilha': (s, trilha) => {
      exigirInstrutor(s);
      if (trilha !== 'essencial' && trilha !== 'completa') throw new Error('Trilha inválida.');
      dados.salvar('escola', { ...dados.ler('escola', {}), trilha });
      return dadosDaEscola();
    },
    // Revisão rápida no primeiro login do dia (ligada por padrão).
    'escola:revisao': (s, ligada) => {
      exigirInstrutor(s);
      dados.salvar('escola', { ...dados.ler('escola', {}), revisao: ligada !== false });
      return dadosDaEscola();
    },
    // Número do certificado: o mesmo aluno e o mesmo curso ficam sempre com o mesmo número (reimprimir não gasta outro).
    'escola:certificado': (s, idAluno, idCurso) => {
      exigirInstrutor(s);
      if (!dados.listarUsuarios().some((u) => u.id === idAluno)) throw new Error('Aluno não encontrado.');
      const escola = dados.ler('escola', {});
      escola.certificados = escola.certificados || {};
      const chave = `${idAluno}:${String(idCurso).slice(0, 40)}`;
      if (!escola.certificados[chave]) {
        escola.ultimoCertificado = (escola.ultimoCertificado || 0) + 1;
        escola.certificados[chave] = { numero: escola.ultimoCertificado, emitidoEm: Date.now() };
        dados.salvar('escola', escola);
      }
      return escola.certificados[chave];
    },
    'escola:certificados': (s) => { exigirInstrutor(s); return dados.ler('escola', {}).certificados || {}; },

    'aulas:listar': (s) => { exigirSessao(s); return dados.ler('aulas-professor', []); },
    'aulas:salvar': (s, lista) => { exigirInstrutor(s); return salvarAulas(lista); },
    // Uma aula de cada vez, a partir da lista guardada: dois instrutores mexendo ao mesmo tempo não apagam a aula do outro.
    'aulas:gravar': (s, aula) => {
      exigirInstrutor(s);
      if (!aula || typeof aula.id !== 'string' || !aula.id) throw new Error('Aula inválida.');
      const lista = dados.ler('aulas-professor', []);
      return salvarAulas(lista.some((x) => x.id === aula.id) ? lista.map((x) => (x.id === aula.id ? aula : x)) : [...lista, aula]);
    },
    'aulas:apagar': (s, id) => { exigirInstrutor(s); return salvarAulas(dados.ler('aulas-professor', []).filter((x) => x.id !== id)); },

    // ---------- Sala de aula ao vivo ----------
    // Cada computador avisa de tempos em tempos o que o aluno está fazendo; a resposta diz se a tela deve
    // ficar pausada e se tem mensagem do instrutor.
    'sala:presenca': (s, atividade = {}) => {
      exigirSessao(s);
      // "ajuda": o aluno apertou "Não entendi". A hora é a deste computador (o relógio de cada PC pode estar diferente).
      const anterior = presencas.get(s.usuario.id);
      const pedido = Number(atividade.ajuda) || 0;
      const ajudaEm = !pedido ? 0 : anterior && anterior.pedidoAjuda === pedido ? anterior.ajudaEm : Date.now();
      presencas.set(s.usuario.id, {
        usuario: { id: s.usuario.id, nome: s.usuario.nome, avatar: s.usuario.avatar, papel: s.usuario.papel, turma: s.usuario.turma || '' },
        pc: String(atividade.pc || s.pc || os.hostname()).slice(0, 60),
        atividade: {
          app: String(atividade.app || '').slice(0, 60), licao: String(atividade.licao || '').slice(0, 120),
          passo: String(atividade.passo || '').slice(0, 30), detalhe: String(atividade.detalhe || '').slice(0, 120),
        },
        pedidoAjuda: pedido, ajudaEm,
        em: Date.now(),
      });
      const aluno = s.usuario.papel !== 'instrutor';
      // "mensagem" (só a última) continua para os computadores de aluno com a versão anterior do programa.
      return { pausada: sala.pausada && aluno, mensagens: aluno ? mensagensAtuais() : [], mensagem: aluno ? mensagemAtual() : null };
    },
    'sala:turma': (s) => {
      exigirInstrutor(s);
      const agora = Date.now();
      return {
        pausada: sala.pausada,
        mensagem: mensagemAtual(),
        alunos: [...presencas.values()].filter((p) => agora - p.em < 45000).map((p) => ({
          usuario: p.usuario, pc: p.pc, atividade: p.atividade, em: p.em,
          ha: Math.round((agora - p.em) / 1000),
          ajudaHa: p.ajudaEm ? Math.round((agora - p.ajudaEm) / 1000) : null, // segundos desde o "Não entendi"
        })),
      };
    },
    'sala:pausar': (s, pausar) => { exigirInstrutor(s); sala.pausada = !!pausar; return sala.pausada; },
    'sala:mensagem': (s, texto) => {
      exigirInstrutor(s);
      const t = String(texto || '').trim().slice(0, 300);
      if (!t) { sala.mensagens = []; return null; }
      const ultima = sala.mensagens.slice(-1)[0];
      const m = { id: Math.max(Date.now(), ultima ? ultima.id + 1 : 0), texto: t, de: s.usuario.nome };
      sala.mensagens = mensagensAtuais().concat(m).slice(-5);
      return m;
    },
  };
}

module.exports = { criarCanais, TIPOS_DE_DADOS };
