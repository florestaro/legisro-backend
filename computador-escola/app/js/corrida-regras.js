// Corrida de digitação da turma: as regras ficam aqui, num lugar só. O computador do instrutor usa no servidor da
// sala (src/canais.js) e o modo de teste no navegador usa em app/js/api.js.
// O instrutor abre a corrida (os alunos recebem o convite), dá a largada e todos digitam o mesmo texto ao mesmo
// tempo. Vence quem termina primeiro; quem não termina, fica na frente quem chegou mais longe no texto.
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica();
  else { raiz.CE = raiz.CE || {}; raiz.CE.corridaRegras = fabrica(); }
})(typeof self !== 'undefined' ? self : this, function () {
  const CONTAGEM = 3500; // a largada tem 3, 2, 1
  const TOLERANCIA = 3000; // progresso que chega logo depois do fim ainda vale (a rede pode atrasar um pouco)
  const MAX_PARTICIPANTES = 60;
  const texto = (v, n) => String(v == null ? '' : v).trim().slice(0, n);

  return function criarCorridas(relogio = () => Date.now()) {
    let atual = null;
    let ultimoId = 0;

    const acabou = (c, t = relogio()) => !!(c.encerrada || (c.inicio && t > c.inicio + c.duracao * 1000)
      || (c.inicio && c.participantes.size && [...c.participantes.values()].every((p) => p.terminouEm)));
    const fase = (c, t = relogio()) => (acabou(c, t) ? 'fim' : !c.inicio ? 'espera' : t < c.inicio ? 'contagem' : 'correndo');

    function placar(c, t) {
      const fimDaProva = c.inicio ? c.inicio + c.duracao * 1000 : t;
      const lista = [...c.participantes.values()].map((p) => {
        const comeco = Math.max(c.inicio || t, p.entrouEm);
        const ate = p.terminouEm || Math.min(t, fimDaProva);
        const minutos = Math.max((ate - comeco) / 60000, 1 / 60);
        return {
          id: p.id, nome: p.nome, avatar: p.avatar, turma: p.turma, pos: p.pos, total: c.texto.length,
          erros: p.erros, terminou: !!p.terminouEm, terminouEm: p.terminouEm || null,
          ppm: c.inicio && t >= c.inicio ? Math.round((p.pos / 5) / minutos) : 0,
          precisao: p.pos + p.erros ? Math.round((p.pos / (p.pos + p.erros)) * 100) : 100,
        };
      });
      lista.sort((a, b) => (b.terminou - a.terminou) || (a.terminou ? a.terminouEm - b.terminouEm : 0) || (b.pos - a.pos) || (a.erros - b.erros) || a.nome.localeCompare(b.nome));
      return lista.map((p, i) => ({ ...p, lugar: i + 1 }));
    }

    function publica() {
      if (!atual) return null;
      const t = relogio();
      return {
        id: atual.id, texto: atual.texto, duracao: atual.duracao, turma: atual.turma, por: atual.por,
        inicio: atual.inicio, agora: t, fase: fase(atual, t), participantes: placar(atual, t),
      };
    }

    const naTurma = (c, usuario) => !c.turma || (usuario && usuario.turma === c.turma);

    return {
      criar({ texto: t, duracao, turma, por } = {}) {
        const limpo = texto(t, 800).replace(/\s+/g, ' ');
        if (limpo.length < 20) throw new Error('O texto da corrida precisa ter pelo menos 20 letras.');
        const segundos = Math.round(Number(duracao));
        ultimoId = Math.max(relogio(), ultimoId + 1);
        atual = {
          id: ultimoId, texto: limpo, duracao: segundos >= 30 && segundos <= 300 ? segundos : 60,
          turma: texto(turma, 40), por: texto(por, 80), inicio: null, encerrada: false, participantes: new Map(),
        };
        return publica();
      },
      largar() {
        if (!atual || acabou(atual)) throw new Error('Não tem corrida aberta. Abra uma corrida primeiro.');
        if (!atual.inicio) atual.inicio = relogio() + CONTAGEM;
        return publica();
      },
      encerrar() { if (atual) atual.encerrada = true; return publica(); },
      estado: publica,
      // Convite que vai junto com a presença do aluno: só enquanto a corrida não acabou e se é da turma dele.
      convite(usuario) {
        if (!atual || acabou(atual) || !naTurma(atual, usuario)) return null;
        const p = usuario && atual.participantes.get(usuario.id);
        return p && p.terminouEm ? null : { id: atual.id, fase: fase(atual), entrou: !!p };
      },
      entrar(usuario) {
        if (!atual || acabou(atual)) throw new Error('Não tem corrida aberta agora.');
        if (!naTurma(atual, usuario)) throw new Error(`Esta corrida é da turma ${atual.turma}.`);
        if (!atual.participantes.has(usuario.id)) {
          if (atual.participantes.size >= MAX_PARTICIPANTES) throw new Error('A corrida está cheia.');
          atual.participantes.set(usuario.id, {
            id: usuario.id, nome: texto(usuario.nome, 60), avatar: texto(usuario.avatar, 8), turma: texto(usuario.turma, 40),
            pos: 0, erros: 0, entrouEm: relogio(), terminouEm: null,
          });
        }
        return publica();
      },
      progresso(usuario, dados = {}) {
        const t = relogio();
        const p = atual && atual.id === Number(dados.id) && atual.participantes.get(usuario.id);
        if (!p) throw new Error('Você não está nesta corrida.');
        const valeAinda = atual.inicio && t >= atual.inicio && !atual.encerrada && t <= atual.inicio + atual.duracao * 1000 + TOLERANCIA;
        if (valeAinda && !p.terminouEm) {
          const pos = Math.min(atual.texto.length, Math.max(p.pos, Math.floor(Number(dados.pos)) || 0));
          p.pos = pos;
          p.erros = Math.min(100000, Math.max(p.erros, Math.floor(Number(dados.erros)) || 0));
          if (pos >= atual.texto.length) p.terminouEm = Math.min(t, atual.inicio + atual.duracao * 1000);
        }
        return publica();
      },
    };
  };
});
