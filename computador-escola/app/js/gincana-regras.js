// Gincana ao vivo da turma: as regras ficam aqui, num lugar só. O computador do instrutor usa no servidor da sala
// (src/canais.js) e o modo de teste no navegador usa em app/js/api.js.
// O instrutor abre a gincana (os alunos recebem o convite), separa as equipes (opcional) e passa as rodadas:
// perguntas (das aulas do curso) e tarefas práticas (fazer algo de verdade no computador). Acertar vale 100 pontos
// e responder rápido vale até 50 de bônus; nas tarefas, quem termina primeiro ganha mais bônus.
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica();
  else { raiz.CE = raiz.CE || {}; raiz.CE.gincanaRegras = fabrica(); }
})(typeof self !== 'undefined' ? self : this, function () {
  const MAX_PARTICIPANTES = 60;
  const MAX_RODADAS = 20;
  const EQUIPES = [['vermelha', '🔴 Vermelha'], ['azul', '🔵 Azul'], ['verde', '🟢 Verde'], ['amarela', '🟡 Amarela']];
  const TOLERANCIA = 2000; // resposta que chega logo depois do tempo ainda vale (a rede pode atrasar)
  const texto = (v, n) => String(v == null ? '' : v).trim().slice(0, n);

  return function criarGincanas(relogio = () => Date.now()) {
    let atual = null;
    let ultimoId = 0;

    const rodadaAtual = (g) => (g.indice >= 0 && g.indice < g.rodadas.length ? g.rodadas[g.indice] : null);
    function fase(g, t = relogio()) {
      if (g.encerrada || g.indice >= g.rodadas.length) return 'fim';
      if (g.indice < 0) return 'espera';
      const r = rodadaAtual(g);
      const todos = g.participantes.size > 0 && [...g.participantes.values()].every((p) => p.respostas[g.indice] != null);
      return t > g.inicioRodada + r.limite * 1000 || todos || g.fechada ? 'resultado' : 'rodada';
    }
    const naTurma = (g, usuario) => !g.turma || (usuario && usuario.turma === g.turma);

    function placar(g) {
      const lista = [...g.participantes.values()].map((p) => ({
        id: p.id, nome: p.nome, avatar: p.avatar, turma: p.turma, equipe: p.equipe,
        pontos: p.respostas.reduce((s, r) => s + ((r && r.pontos) || 0), 0),
        acertos: p.respostas.filter((r) => r && r.pontos > 0).length,
        respondeu: g.indice >= 0 && p.respostas[g.indice] != null,
      }));
      lista.sort((a, b) => b.pontos - a.pontos || b.acertos - a.acertos || a.nome.localeCompare(b.nome));
      return lista.map((p, i) => ({ ...p, lugar: i + 1 }));
    }
    function equipes(g, participantes) {
      if (!g.equipes) return [];
      return EQUIPES.slice(0, g.equipes).map(([id, nome]) => {
        const membros = participantes.filter((p) => p.equipe === id);
        return { id, nome, pontos: membros.reduce((s, p) => s + p.pontos, 0), membros: membros.length };
      }).sort((a, b) => b.pontos - a.pontos);
    }

    // O que todos podem ver. A resposta certa só aparece no resultado da rodada.
    function publica(usuario) {
      if (!atual) return null;
      const t = relogio();
      const f = fase(atual, t);
      const r = rodadaAtual(atual);
      const participantes = placar(atual);
      const eu = usuario && atual.participantes.get(usuario.id);
      const minha = eu && atual.indice >= 0 ? eu.respostas[atual.indice] || null : null;
      return {
        id: atual.id, titulo: atual.titulo, turma: atual.turma, por: atual.por, fase: f, agora: t,
        indice: atual.indice, total: atual.rodadas.length,
        rodada: r ? {
          tipo: r.tipo, pergunta: r.pergunta, opcoes: r.opcoes, tarefa: r.tarefa, texto: r.texto, limite: r.limite, inicio: atual.inicioRodada,
          correta: f === 'resultado' || f === 'fim' ? r.correta : undefined,
          respostas: participantes.filter((p) => p.respondeu).length,
        } : null,
        participantes, equipes: equipes(atual, participantes),
        eu: eu ? { equipe: eu.equipe, resposta: minha ? { opcao: minha.opcao, pontos: minha.pontos, feita: !!minha.feita } : null } : null,
      };
    }
    // Resumo da gincana que terminou (para o jornal da turma).
    function resumo() {
      if (!atual) return null;
      const participantes = placar(atual);
      return { titulo: atual.titulo, em: relogio(), podio: participantes.slice(0, 3).map((p) => ({ nome: p.nome, pontos: p.pontos, equipe: p.equipe })), equipes: equipes(atual, participantes), participantes: participantes.length };
    }

    return {
      EQUIPES,
      criar({ titulo, rodadas, equipes: nEquipes, turma, por } = {}) {
        if (!Array.isArray(rodadas) || !rodadas.length) throw new Error('A gincana precisa de pelo menos uma rodada.');
        const limpas = rodadas.slice(0, MAX_RODADAS).map((r) => {
          if (r && r.tipo === 'tarefa') {
            const tarefa = texto(r.tarefa, 40);
            if (!tarefa) throw new Error('Tarefa sem nome.');
            const limite = Math.round(Number(r.limite));
            return { tipo: 'tarefa', tarefa, texto: texto(r.texto, 200), limite: limite >= 20 && limite <= 300 ? limite : 90 };
          }
          const opcoes = (Array.isArray(r && r.opcoes) ? r.opcoes : []).slice(0, 5).map((o) => texto(o, 160)).filter(Boolean);
          const correta = Math.floor(Number(r && r.correta));
          if (!texto(r && r.pergunta, 300) || opcoes.length < 2 || !(correta >= 0 && correta < opcoes.length)) throw new Error('Pergunta inválida.');
          const limite = Math.round(Number(r.limite));
          return { tipo: 'pergunta', pergunta: texto(r.pergunta, 300), opcoes, correta, limite: limite >= 10 && limite <= 120 ? limite : 30 };
        });
        const n = Math.round(Number(nEquipes));
        ultimoId = Math.max(relogio(), ultimoId + 1);
        atual = {
          id: ultimoId, titulo: texto(titulo, 80) || 'Gincana da turma', turma: texto(turma, 40), por: texto(por, 80),
          rodadas: limpas, equipes: n >= 2 && n <= 4 ? n : 0, indice: -1, inicioRodada: 0, encerrada: false, fechada: false, participantes: new Map(),
        };
        return publica();
      },
      comecar() {
        if (!atual || atual.encerrada) throw new Error('Abra uma gincana primeiro.');
        if (atual.indice >= 0) throw new Error('A gincana já começou.');
        atual.indice = 0; atual.inicioRodada = relogio(); atual.fechada = false;
        return publica();
      },
      // Fecha a rodada agora (sem esperar o tempo) ou passa para a próxima.
      proxima() {
        if (!atual || atual.encerrada) throw new Error('Não tem gincana aberta.');
        if (atual.indice < 0) throw new Error('Comece a gincana primeiro.');
        if (fase(atual) === 'rodada') { atual.fechada = true; return publica(); }
        atual.indice += 1; atual.inicioRodada = relogio(); atual.fechada = false;
        if (atual.indice >= atual.rodadas.length) atual.encerrada = true;
        return publica();
      },
      encerrar() { if (atual) atual.encerrada = true; return publica(); },
      estado: (usuario) => publica(usuario),
      resumo,
      convite(usuario) {
        if (!atual || atual.encerrada || !naTurma(atual, usuario)) return null;
        const p = usuario && atual.participantes.get(usuario.id);
        return { id: atual.id, titulo: atual.titulo, fase: fase(atual), entrou: !!p };
      },
      entrar(usuario) {
        if (!atual || atual.encerrada) throw new Error('Não tem gincana aberta agora.');
        if (!naTurma(atual, usuario)) throw new Error(`Esta gincana é da turma ${atual.turma}.`);
        if (!atual.participantes.has(usuario.id)) {
          if (atual.participantes.size >= MAX_PARTICIPANTES) throw new Error('A gincana está cheia.');
          // Equipe: a que tem menos gente (assim as equipes ficam do mesmo tamanho).
          let equipe = null;
          if (atual.equipes) {
            const conta = EQUIPES.slice(0, atual.equipes).map(([id]) => [id, [...atual.participantes.values()].filter((p) => p.equipe === id).length]);
            equipe = conta.sort((a, b) => a[1] - b[1])[0][0];
          }
          atual.participantes.set(usuario.id, { id: usuario.id, nome: texto(usuario.nome, 60), avatar: texto(usuario.avatar, 8), turma: texto(usuario.turma, 40), equipe, respostas: [] });
        }
        return publica(usuario);
      },
      responder(usuario, dados = {}) {
        const p = atual && atual.id === Number(dados.id) && atual.participantes.get(usuario.id);
        if (!p) throw new Error('Você não está nesta gincana.');
        const r = rodadaAtual(atual), t = relogio();
        if (!r || r.tipo !== 'pergunta' || Number(dados.rodada) !== atual.indice) throw new Error('Esta rodada já passou.');
        const dentroDoTempo = !atual.fechada && t <= atual.inicioRodada + r.limite * 1000 + TOLERANCIA;
        if (dentroDoTempo && p.respostas[atual.indice] == null) {
          const opcao = Math.floor(Number(dados.opcao));
          const certa = opcao === r.correta;
          const rapidez = Math.max(0, 1 - (t - atual.inicioRodada) / (r.limite * 1000));
          p.respostas[atual.indice] = { opcao, em: t, pontos: certa ? 100 + Math.round(50 * rapidez) : 0 };
        }
        return publica(usuario);
      },
      tarefa(usuario, dados = {}) {
        const p = atual && atual.id === Number(dados.id) && atual.participantes.get(usuario.id);
        if (!p) throw new Error('Você não está nesta gincana.');
        const r = rodadaAtual(atual), t = relogio();
        if (!r || r.tipo !== 'tarefa' || Number(dados.rodada) !== atual.indice) throw new Error('Esta rodada já passou.');
        const dentroDoTempo = !atual.fechada && t <= atual.inicioRodada + r.limite * 1000 + TOLERANCIA;
        if (dentroDoTempo && p.respostas[atual.indice] == null) {
          const antes = [...atual.participantes.values()].filter((x) => x.respostas[atual.indice] && x.respostas[atual.indice].feita).length;
          p.respostas[atual.indice] = { feita: true, em: t, pontos: 100 + Math.max(10, 50 - antes * 10) };
        }
        return publica(usuario);
      },
    };
  };
});
