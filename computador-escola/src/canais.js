// Canais de dados: o que a tela pode pedir (usuários, progresso, arquivos, e-mail e a sala de aula).
// Cada pedido vem com uma "sessão" ({ usuario, pc }): no computador sozinho é a sessão de quem está na frente dele;
// no modo sala de aula, o computador do instrutor guarda uma sessão para cada computador de aluno.
const os = require('os');

// Chaves que a tela pode usar: "progresso:<id>", "arquivos:<id>" e "email:<id>" (a caixa de e-mail do aluno).
// Cada aluno só lê e grava os próprios dados; o instrutor pode ler e gravar os de todos.
const TIPOS_DE_DADOS = ['progresso', 'arquivos', 'email'];

function criarCanais(dados) {
  const exigirSessao = (s) => { if (!s.usuario) throw new Error('Ninguém entrou no sistema.'); };
  const exigirInstrutor = (s) => { if (!s.usuario || s.usuario.papel !== 'instrutor') throw new Error('Apenas o instrutor pode fazer isso.'); };
  function conferirChave(s, chave) {
    const [tipo, dono] = String(chave).split(':');
    exigirSessao(s);
    if (!TIPOS_DE_DADOS.includes(tipo) || !dono) throw new Error('Tipo de dado desconhecido.');
    if (dono !== s.usuario.id && s.usuario.papel !== 'instrutor') throw new Error('Acesso negado.');
    return `${tipo}-${dono}`;
  }
  const caixas = () => dados.listarUsuarios().map((u) => ({ usuario: u, caixa: dados.ler(`email-${u.id}`, null) }));

  // A sala de aula ao vivo: quem está em cada computador e o que está fazendo (só na memória).
  const presencas = new Map(); // id do usuário -> { usuario, pc, atividade, em }
  const sala = { pausada: false, mensagem: null };

  return {
    'usuarios:listar': () => dados.listarUsuarios(),
    'usuarios:existe-instrutor': () => dados.existeInstrutor(),
    'usuarios:primeiro-instrutor': (s, info) => {
      if (dados.existeInstrutor()) throw new Error('O instrutor já foi cadastrado.');
      s.usuario = dados.criarUsuario({ ...info, papel: 'instrutor', avatar: '🧑‍🏫' });
      return s.usuario;
    },
    'usuarios:criar': (s, info) => {
      exigirInstrutor(s);
      return dados.criarUsuario({ ...info, papel: info.papel === 'instrutor' ? 'instrutor' : 'aluno' });
    },
    'usuarios:trocar-senha': (s, id, segredo) => { exigirInstrutor(s); return dados.trocarSenha(id, segredo); },
    'usuarios:remover': (s, id) => {
      exigirInstrutor(s);
      if (id === s.usuario.id) throw new Error('Você não pode remover a si mesmo.');
      return dados.removerUsuario(id);
    },
    'sessao:entrar': async (s, id, segredo) => { s.usuario = await dados.entrar(id, segredo); return s.usuario; },
    'sessao:sair': (s) => { if (s.usuario) presencas.delete(s.usuario.id); s.usuario = null; return true; },
    'dados:ler': (s, chave, padrao) => dados.ler(conferirChave(s, chave), padrao),
    'dados:salvar': (s, chave, valor) => {
      const arquivo = conferirChave(s, chave);
      // Um colega pode entregar um e-mail (email:entregar) entre a hora em que a tela leu a caixa e a hora em que
      // ela grava: as mensagens que estão guardadas e que a tela ainda não conhece continuam na caixa.
      // (O Correio não apaga mensagens de vez, só muda de pasta, então juntar nunca traz de volta algo apagado.)
      if (arquivo.startsWith('email-') && valor && Array.isArray(valor.mensagens)) {
        const guardada = dados.ler(arquivo, null);
        const conhecidas = new Set(valor.mensagens.map((m) => m && m.id));
        const chegaram = (guardada && Array.isArray(guardada.mensagens) ? guardada.mensagens : []).filter((m) => m && !conhecidas.has(m.id));
        if (chegaram.length) valor = { ...valor, mensagens: valor.mensagens.concat(chegaram) };
      }
      return dados.salvar(arquivo, valor);
    },

    // E-mail entre alunos: o remetente só escreve na caixa do destinatário por aqui,
    // e só pode acrescentar uma mensagem na Caixa de entrada (nunca ler ou apagar as mensagens dele).
    'email:endereco-livre': (s, endereco) => {
      exigirSessao(s);
      const alvo = String(endereco).toLowerCase();
      return !caixas().some(({ usuario, caixa }) => usuario.id !== s.usuario.id && caixa && caixa.conta && caixa.conta.endereco === alvo);
    },
    'email:contatos': (s) => {
      exigirSessao(s);
      return caixas().filter(({ usuario, caixa }) => usuario.id !== s.usuario.id && caixa && caixa.conta)
        .map(({ usuario, caixa }) => ({ nome: caixa.conta.nome || usuario.nome, endereco: caixa.conta.endereco }));
    },
    'email:entregar': (s, mensagem) => {
      exigirSessao(s);
      // O remetente é sempre o dono da sessão: ninguém consegue mandar e-mail fingindo ser outra pessoa.
      const minha = dados.ler(`email-${s.usuario.id}`, null);
      if (!minha || !minha.conta) throw new Error('Crie a sua conta de e-mail primeiro.');
      const para = String(mensagem.para || '').toLowerCase();
      const destino = caixas().find(({ caixa }) => caixa && caixa.conta && caixa.conta.endereco === para);
      if (!destino) return { entregue: false };
      const recebida = {
        id: `${Date.now()}${Math.random().toString(16).slice(2, 8)}`, pasta: 'entrada', lida: false, em: Date.now(),
        de: minha.conta.endereco, deNome: minha.conta.nome, para,
        assunto: String(mensagem.assunto || '').slice(0, 200), texto: String(mensagem.texto || '').slice(0, 20000),
        anexos: Array.isArray(mensagem.anexos) ? mensagem.anexos.slice(0, 5) : [],
      };
      destino.caixa.mensagens = (destino.caixa.mensagens || []).concat(recebida);
      dados.salvar(`email-${destino.usuario.id}`, destino.caixa);
      return { entregue: true, nome: destino.caixa.conta.nome };
    },

    // ---------- Aulas criadas pelo instrutor (valem para todos os alunos) ----------
    'aulas:listar': (s) => { exigirSessao(s); return dados.ler('aulas-professor', []); },
    'aulas:salvar': (s, lista) => {
      exigirInstrutor(s);
      if (!Array.isArray(lista) || lista.length > 300) throw new Error('Lista de aulas inválida.');
      if (JSON.stringify(lista).length > 2 * 1024 * 1024) throw new Error('As aulas ficaram grandes demais.');
      return dados.salvar('aulas-professor', lista);
    },

    // ---------- Sala de aula ao vivo ----------
    // Cada computador avisa de tempos em tempos o que o aluno está fazendo; a resposta diz se a tela deve
    // ficar pausada e se tem mensagem do instrutor.
    'sala:presenca': (s, atividade = {}) => {
      exigirSessao(s);
      presencas.set(s.usuario.id, {
        usuario: { id: s.usuario.id, nome: s.usuario.nome, avatar: s.usuario.avatar, papel: s.usuario.papel, turma: s.usuario.turma || '' },
        pc: String(atividade.pc || s.pc || os.hostname()).slice(0, 60),
        atividade: {
          app: String(atividade.app || '').slice(0, 60), licao: String(atividade.licao || '').slice(0, 120),
          passo: String(atividade.passo || '').slice(0, 30), detalhe: String(atividade.detalhe || '').slice(0, 120),
        },
        em: Date.now(),
      });
      return { pausada: sala.pausada && s.usuario.papel !== 'instrutor', mensagem: s.usuario.papel !== 'instrutor' ? sala.mensagem : null };
    },
    'sala:turma': (s) => {
      exigirInstrutor(s);
      const agora = Date.now();
      return {
        pausada: sala.pausada,
        mensagem: sala.mensagem,
        alunos: [...presencas.values()].filter((p) => agora - p.em < 45000).map((p) => ({ ...p, ha: Math.round((agora - p.em) / 1000) })),
      };
    },
    'sala:pausar': (s, pausar) => { exigirInstrutor(s); sala.pausada = !!pausar; return sala.pausada; },
    'sala:mensagem': (s, texto) => {
      exigirInstrutor(s);
      const t = String(texto || '').trim().slice(0, 300);
      sala.mensagem = t ? { id: Date.now(), texto: t, de: s.usuario.nome } : null;
      return sala.mensagem;
    },
  };
}

module.exports = { criarCanais, TIPOS_DE_DADOS };
