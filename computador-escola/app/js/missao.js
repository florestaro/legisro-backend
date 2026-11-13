// Missão da semana: um desafio curto que vale para a semana toda (ex.: "mande um e-mail com anexo", "faça um
// gráfico"). O instrutor escolhe a missão no Painel (aba 🏁 Gincana, missão e jornal) ou deixa automática (muda
// sozinha toda segunda-feira). O computador confere sozinho quando o aluno cumpre, pelo que ele fez de verdade.
// Fica no progresso do aluno (no servidor da sala: vale em qualquer computador):
// p.missoes = { "2026-S46:grafico": { missao, semana, feita, contador } } — uma por semana e missão, para a missão já
// cumprida continuar valendo se o instrutor trocar a missão no meio da semana.
window.CE = window.CE || {};

(function () {
  const MISSOES = [
    { id: 'email-anexo', icone: '📧', titulo: 'Mande um e-mail com um arquivo anexado', dica: 'Abra o E-mail, clique em ✏️ Escrever, use o 📎 Anexar e envie (pode ser para professor@correio.escola).', evento: 'email:enviado', se: (d) => d.anexos >= 1 },
    { id: 'grafico', icone: '📊', titulo: 'Faça um gráfico na Planilha', dica: 'Escreva uma tabelinha (nomes e números), selecione e clique em 📊 Gráfico.', evento: 'planilha:grafico' },
    { id: 'digitar-30', icone: '⌨️', titulo: 'Digite a 30 palavras por minuto (ou mais) num exercício', dica: 'Abra a Digitação e faça um exercício com calma e ritmo.', evento: 'digitacao:concluida', se: (d) => d.ppm >= 30 && !d.nivelamento },
    { id: 'aulas-3', icone: '🎓', titulo: 'Conclua 3 aulas nesta semana', dica: 'Abra as Aulas e siga a sua trilha.', evento: 'licao:concluida', contar: 3 },
    { id: 'golpe', icone: '🕵️', titulo: 'Desmascare um golpe (no celular ou na internet)', dica: 'No Celular, bloqueie um golpista; ou saia de um site falso sem digitar nada.', evento: ['celular:golpe-evitado', 'golpe:evitado'] },
    { id: 'pasta', icone: '🗂️', titulo: 'Organize os arquivos: coloque um arquivo dentro de uma pasta', dica: 'No Arquivos, arraste um arquivo para cima de uma pasta.', evento: 'arquivo:movido' },
    { id: 'cartaz', icone: '🎨', titulo: 'Faça uma imagem: um cartaz no Desenho Vetorial ou uma foto editada', dica: 'Use um modelo pronto do Desenho Vetorial e clique em 🖼️ Exportar PNG (ou salve uma foto no Editor de Fotos).', evento: ['vetor:exportado', 'fotos:salva'] },
    { id: 'pix', icone: '💠', titulo: 'No Celular, faça um Pix conferindo o nome de quem recebe', dica: 'Celular › Banco › Pix. Antes de pagar, confira o nome!', evento: 'celular:pix', se: (d) => !d.golpe },
    { id: 'jornal', icone: '📰', titulo: 'Mande uma matéria para o jornal da turma', dica: 'Escreva no Editor de Texto (título e um parágrafo) e clique em 📰 Jornal.', evento: 'jornal:enviada' },
  ];
  // Semana do ano (a missão automática muda toda segunda-feira). Usa o relógio de verdade, não o relógio de treino das
  // Configurações (que o aluno pode mudar numa aula).
  function semana(data) {
    const d = new Date(Date.UTC(data.getFullYear(), data.getMonth(), data.getDate()));
    const dia = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dia);
    const inicio = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const n = Math.ceil(((d - inicio) / 86400000 + 1) / 7);
    return { id: `${d.getUTCFullYear()}-S${String(n).padStart(2, '0')}`, numero: n };
  }
  const semanaAtual = () => semana(new Date());
  const automatica = () => MISSOES[semanaAtual().numero % MISSOES.length];
  const porId = (id) => MISSOES.find((m) => m.id === id) || null;

  let escolhida = null; // a missão que o instrutor escolheu (dados da escola)
  let registro = null; // o registro desta semana do aluno que está no computador
  let dono = null;
  const missaoAtual = () => (escolhida && escolhida.id && (!escolhida.semana || escolhida.semana === semanaAtual().id) ? porId(escolhida.id) : null) || automatica();
  const chave = (m) => `${semanaAtual().id}:${m.id}`;
  const registroDe = (p, m) => (p && p.missoes && p.missoes[chave(m)]) || null;
  const aluno = () => CE.sessao.usuario && CE.sessao.usuario.papel !== 'instrutor';

  function desenharBandeja() {
    const b = document.getElementById('status-missao');
    if (!b) return;
    b.hidden = !aluno();
    const m = missaoAtual();
    const feita = !!(registro && registro.missao === m.id && registro.feita);
    b.classList.toggle('pendente', !feita);
    b.textContent = feita ? '🎯✅' : '🎯';
    b.title = `Missão da semana: ${m.titulo}${feita ? ' (cumprida!)' : ''}`;
  }
  async function cumprir(m) {
    const s = semanaAtual().id, k = chave(m);
    let nova = false;
    await CE.sessao.atualizarProgresso((p) => {
      p.missoes = p.missoes || {};
      const r = p.missoes[k] || { missao: m.id, semana: s, contador: 0 };
      if (r.feita) { registro = r; return; }
      r.contador = (r.contador || 0) + 1;
      if (r.contador >= (m.contar || 1)) { r.feita = Date.now(); nova = true; }
      p.missoes[k] = r;
      registro = { ...r };
    });
    desenharBandeja();
    if (nova) {
      CE.emitir('missao:cumprida', { missao: m.id, semana: s });
      CE.avisar(`🎯 MISSÃO DA SEMANA CUMPRIDA: ${m.titulo}! 🎉`);
      if (CE.comemorar) CE.comemorar('grande');
      if (CE.voz) CE.voz.falar('Parabéns! Você cumpriu a missão da semana!');
    } else if (registro && m.contar > 1 && !registro.feita) CE.avisar(`🎯 Missão da semana: ${registro.contador} de ${m.contar}.`);
  }

  // Cada evento que alguma missão usa: confere se é o da missão atual.
  const eventos = [...new Set(MISSOES.flatMap((m) => [].concat(m.evento)))];
  eventos.forEach((ev) => CE.ouvir(ev, (d) => {
    if (!aluno() || !dono || CE.sessao.usuario.id !== dono) return;
    const m = missaoAtual();
    if (![].concat(m.evento).includes(ev) || (m.se && !m.se(d || {}))) return;
    if (registro && registro.missao === m.id && registro.feita) return;
    cumprir(m).catch(() => {});
  }));

  // Lê a missão escolhida pelo instrutor e o registro do aluno (no servidor da sala).
  async function atualizar() {
    const quem = CE.sessao.usuario ? CE.sessao.usuario.id : null;
    try {
      const [e, p] = await Promise.all([CE.api.chamar('escola:ler'), quem ? CE.sessao.progresso() : null]);
      if (!CE.sessao.usuario || CE.sessao.usuario.id !== quem) return;
      escolhida = e && e.missao ? e.missao : null;
      registro = registroDe(p, missaoAtual());
    } catch { /* sem conexão: fica o que já tinha */ }
    desenharBandeja();
  }

  CE.MISSOES = MISSOES;
  CE.missao = {
    semana: semanaAtual,
    atual: missaoAtual,
    automatica,
    porId,
    async carregar() {
      registro = null; dono = CE.sessao.usuario ? CE.sessao.usuario.id : null;
      await atualizar();
      if (aluno() && !(registro && registro.feita)) setTimeout(() => { if (CE.sessao.usuario && CE.sessao.usuario.id === dono) CE.avisar(`🎯 Missão da semana: ${missaoAtual().titulo}`); }, 4000);
    },
    atualizar,
    reiniciar() { registro = null; dono = null; escolhida = null; desenharBandeja(); },
    // Quantas missões o aluno já cumpriu (para as medalhas e o painel).
    cumpridas: (p) => Object.values((p && p.missoes) || {}).filter((r) => r && r.feita).length,
    // A missão desta semana de um aluno (para o painel do instrutor e o jornal).
    situacao(p) {
      const m = missaoAtual();
      const r = registroDe(p, m);
      return { missao: m, feita: !!(r && r.feita), em: (r && r.feita) || null, contador: (r && r.contador) || 0 };
    },
    async mostrar() {
      await atualizar(); // a missão pode ter mudado no Painel do instrutor
      if (!CE.sessao.usuario) return;
      const m = missaoAtual();
      const feita = !!(registro && registro.missao === m.id && registro.feita);
      const fundo = CE.el('div', { class: 'dialogo-fundo' }, CE.el('div', { class: 'dialogo missao-dialogo', 'data-missao': m.id },
        CE.el('h3', {}, '🎯 Missão da semana'),
        CE.el('p', { class: 'missao-titulo' }, `${m.icone} ${m.titulo}`),
        CE.el('p', { class: 'ft-dica' }, `💡 ${m.dica}`),
        CE.el('p', { 'data-missao-situacao': feita ? 'feita' : 'pendente' }, feita ? '✅ Missão cumprida! Na semana que vem tem outra.' : m.contar > 1 ? `Progresso: ${(registro && registro.contador) || 0} de ${m.contar}.` : '⏳ Ainda não cumprida. O computador confere sozinho quando você fizer.'),
        CE.el('div', { class: 'dialogo-botoes' }, CE.el('button', { class: 'botao', onclick: () => fundo.remove() }, 'OK'))));
      document.body.append(fundo);
      CE.emitir('missao:aberta', { missao: m.id });
    },
  };
  document.addEventListener('DOMContentLoaded', () => {
    const b = document.getElementById('status-missao');
    if (b) b.addEventListener('click', () => CE.missao.mostrar());
  });
})();
