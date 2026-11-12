// Ritmo do aluno e modo desafio automático.
// Em cada aula o professor guarda o tempo (comparado com o tempo normal da aula), quantas perguntas o aluno acertou
// de primeira e quantas vezes precisou de ajuda. Com as 3 últimas aulas, o aluno fica 🐢 com calma, 🚶 no ritmo ou
// 🚀 avançado. Para o 🚀, o professor sobe a exigência sozinho (menos explicação, ajuda só quando pedir, meta de 85%
// de primeira e pergunta bônus). Se as aulas começarem a pesar, ele volta ao normal sem alarde.
// Na Digitação é parecido: quem bate as metas com folga nos 3 últimos exercícios ganha metas 20% mais rápidas.
// O instrutor pode decidir na mão (progresso.modoDesafio: "sempre" ou "nunca"; sem nada, é automático).
window.CE = window.CE || {};

(function () {
  const AULAS_PARA_DECIDIR = 3;
  const NOTA_DESAFIO = 85;
  const FOLGA_DIGITACAO = 1.3; // bater a meta de velocidade com 30% de folga
  const AUMENTO_DIGITACAO = 1.2; // no desafio, a meta de velocidade sobe 20%
  const NIVEIS = {
    calma: { icone: '🐢', rotulo: 'Com calma' },
    normal: { icone: '🚶', rotulo: 'No ritmo' },
    avancado: { icone: '🚀', rotulo: 'Avançado' },
  };

  // Tempo normal da aula, em segundos: o que um aluno no ritmo leva em cada tipo de passo.
  const esperado = (licao) => licao.passos.reduce((s, p) => s + (p.espera ? 40 : 15), 0);
  const aluno = () => CE.sessao.usuario && CE.sessao.usuario.papel !== 'instrutor';
  const ultimas = (p) => ((p && p.ritmo && p.ritmo.historico) || []).slice(-AULAS_PARA_DECIDIR);

  function classificar(p) {
    const lista = ultimas(p);
    if (lista.length < AULAS_PARA_DECIDIR) return 'normal';
    const boa = (h) => h.razao <= 0.6 && (h.primeira == null || h.primeira >= 90) && h.ajudas === 0;
    const pesada = (h) => h.razao >= 1.5 || (h.primeira != null && h.primeira < 70) || h.ajudas >= 3;
    if (lista.every(boa)) return 'avancado';
    if (lista.filter(pesada).length >= 2) return 'calma';
    return 'normal';
  }

  // Digitação: os 3 últimos exercícios (sem contar provas) com a meta de velocidade batida com folga e os acertos em dia.
  function digitacaoAvancada(p) {
    const d = (p && p.digitacao) || {};
    const lista = (d._historico || []).map((h) => ({ h, ex: CE.DIGITACAO && CE.DIGITACAO.lista.find((e) => e.id === h.id) }))
      .filter((x) => x.ex && !x.ex.prova && x.ex.meta && x.ex.meta.ppm > 0).slice(-AULAS_PARA_DECIDIR);
    return lista.length === AULAS_PARA_DECIDIR && lista.every(({ h, ex }) => h.ppm >= ex.meta.ppm * FOLGA_DIGITACAO && h.precisao >= ex.meta.precisao);
  }

  const modo = (p) => (p && (p.modoDesafio === 'sempre' || p.modoDesafio === 'nunca') ? p.modoDesafio : 'auto');
  let digitacaoCache = false; // metas de digitação de quem está usando o computador (CE.metaDigitacao é síncrona)

  CE.ritmo = {
    NIVEIS,
    NOTA_DESAFIO,
    esperado,
    classificar,
    modo,
    desafioAtivo: (p) => modo(p) === 'sempre' || (modo(p) === 'auto' && classificar(p) === 'avancado'),
    digitacaoDesafio: (p) => modo(p) === 'sempre' || (modo(p) === 'auto' && digitacaoAvancada(p)),
    // Lido no login e depois de cada exercício de digitação.
    atualizarDigitacao(p) { digitacaoCache = aluno() && CE.ritmo.digitacaoDesafio(p); return digitacaoCache; },
    async carregar() { try { CE.ritmo.atualizarDigitacao(await CE.sessao.progresso()); } catch { digitacaoCache = false; } },
    // Meta de velocidade da digitação no desafio (provas, nivelamento, ditado e narrada não mudam).
    ajustarMeta(meta, exercicio) {
      if (!digitacaoCache || exercicio.prova || exercicio.nivelamento || !(meta.ppm > 0)) return meta;
      return { ...meta, ppm: Math.round(meta.ppm * AUMENTO_DIGITACAO), desafio: true };
    },
    digitacaoAtiva: () => digitacaoCache,

    // Guarda como foi a aula e devolve o ritmo antes e depois.
    async registrar(licao, { segundos, primeira, ajudas, desafio }) {
      let antes = 'normal', depois = 'normal';
      await CE.sessao.atualizarProgresso((p) => {
        antes = classificar(p);
        p.ritmo = p.ritmo || {};
        p.ritmo.historico = (p.ritmo.historico || []).concat({
          licao: licao.id, segundos: Math.round(segundos), razao: Math.round((segundos / esperado(licao)) * 100) / 100,
          primeira, ajudas, desafio: !!desafio, em: Date.now(),
        }).slice(-20);
        depois = classificar(p);
      });
      CE.emitir('ritmo:atualizado', { licao: licao.id, antes, depois });
      return { antes, depois };
    },

    // Resumo para o Painel do Instrutor.
    resumo(p) {
      const lista = ((p && p.ritmo && p.ritmo.historico) || []).slice(-5);
      const media = (f) => { const v = lista.map(f).filter((x) => x != null); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
      const nivel = classificar(p);
      return {
        nivel, ...NIVEIS[nivel], modo: modo(p), desafio: CE.ritmo.desafioAtivo(p), digitacao: CE.ritmo.digitacaoDesafio(p), aulas: lista.length,
        razao: media((h) => h.razao), primeira: media((h) => h.primeira), ajudas: media((h) => h.ajudas),
      };
    },
    // Nota para ordenar os destaques da turma (quanto maior, melhor).
    pontos(p) {
      const r = CE.ritmo.resumo(p);
      if (!r.aulas) return -1;
      return (r.primeira == null ? 80 : r.primeira) + 40 * Math.max(0, 1.5 - (r.razao || 1.5)) - 10 * (r.ajudas || 0);
    },
  };
})();
