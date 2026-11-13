// Jornal da turma: as regras ficam aqui, num lugar só (o servidor da sala e o modo de teste no navegador usam).
// Os alunos mandam matérias pelo Editor de Texto ("📰 Jornal"); o instrutor aprova ou recusa, monta o jornal com os
// destaques da turma e, ao fechar a edição, as aprovadas viram a edição publicada e começa a próxima.
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica();
  else { raiz.CE = raiz.CE || {}; raiz.CE.jornalRegras = fabrica(); }
})(typeof self !== 'undefined' ? self : this, function () {
  const LIMITE_HTML = 400 * 1024; // uma matéria com uma ou duas fotos pequenas
  const LIMITE_PENDENTES = 5; // matérias esperando o instrutor, por aluno
  const LIMITE_EDICAO = 200; // matérias numa edição (o arquivo do jornal não cresce sem fim)
  const texto = (v, n) => String(v == null ? '' : v).trim().slice(0, n);
  const vazio = () => ({ edicao: 1, materias: [], publicadas: [] });
  const normal = (j) => ({ ...vazio(), ...(j || {}), materias: Array.isArray(j && j.materias) ? j.materias : [], publicadas: Array.isArray(j && j.publicadas) ? j.publicadas : [] });

  return {
    vazio,
    normal,
    enviar(jornal, usuario, { titulo, html } = {}, agora = Date.now()) {
      const j = normal(jornal);
      const t = texto(titulo, 120);
      const h = String(html || '');
      if (!t) throw new Error('A matéria precisa de um título.');
      if (h.replace(/<[^>]*>/g, '').trim().length < 20) throw new Error('A matéria está muito curta. Escreva pelo menos um parágrafo.');
      if (h.length > LIMITE_HTML) throw new Error('A matéria ficou grande demais para o jornal (tire alguma imagem ou diminua o tamanho dela).');
      if (j.materias.length >= LIMITE_EDICAO) throw new Error('O jornal desta edição já está cheio. Espere o professor fechar a edição.');
      if (j.materias.filter((m) => m.alunoId === usuario.id && m.status === 'enviada').length >= LIMITE_PENDENTES) throw new Error('Você já tem 5 matérias esperando o professor. Espere ele ler antes de mandar mais.');
      const m = { id: `m${agora}${Math.random().toString(16).slice(2, 6)}`, alunoId: usuario.id, autor: texto(usuario.nome, 60), turma: texto(usuario.turma, 40), titulo: t, html: h, em: agora, status: 'enviada', edicao: j.edicao };
      j.materias.push(m);
      return { jornal: j, materia: { id: m.id, titulo: m.titulo, status: m.status, edicao: m.edicao } };
    },
    minhas(jornal, usuario) {
      const j = normal(jornal);
      return [...j.materias, ...j.publicadas].filter((m) => m.alunoId === usuario.id).map((m) => ({ id: m.id, titulo: m.titulo, status: m.status, edicao: m.edicao, em: m.em }));
    },
    mudarStatus(jornal, id, status) {
      if (!['aprovada', 'recusada', 'enviada'].includes(status)) throw new Error('Situação inválida.');
      const j = normal(jornal);
      const m = j.materias.find((x) => x.id === id);
      if (!m) throw new Error('Matéria não encontrada.');
      m.status = status;
      return j;
    },
    // Fecha a edição: as aprovadas ficam guardadas como publicadas; as recusadas saem; as que faltam ler continuam.
    novaEdicao(jornal) {
      const j = normal(jornal);
      const aprovadas = j.materias.filter((m) => m.status === 'aprovada');
      if (!aprovadas.length) throw new Error('Aprove pelo menos uma matéria antes de fechar a edição.');
      j.publicadas = [...j.publicadas, ...aprovadas.map((m) => ({ ...m, status: 'publicada', edicao: j.edicao }))].slice(-60);
      j.materias = j.materias.filter((m) => m.status === 'enviada').map((m) => ({ ...m, edicao: j.edicao + 1 }));
      j.edicao += 1;
      return j;
    },
  };
});
