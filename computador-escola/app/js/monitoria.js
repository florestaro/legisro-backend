// Monitoria: o instrutor escolhe alunos (os 🚀 avançados, por exemplo) para ajudar os colegas que apertam
// "🙋 Não entendi". O monitor vê os pedidos de ajuda da turma (botão 💁 na barra de tarefas), avisa que vai ajudar
// (o colega recebe o aviso na tela) e marca quando ajudou. Cada ajuda conta para as medalhas de monitor.
// Funciona na rede da sala: os pedidos vêm da Sala ao vivo do computador do instrutor.
window.CE = window.CE || {};

(function () {
  let monitor = false, dono = null, timer = null;
  const avisados = new Set(); // colegas já avisados (até o pedido acabar)
  const botao = () => document.getElementById('status-monitor');
  const minhaSessao = () => CE.sessao.usuario && CE.sessao.usuario.id === dono;

  function desenharBandeja(pendentes) {
    const b = botao();
    if (!b) return;
    b.hidden = !monitor;
    b.textContent = pendentes ? `💁${pendentes}` : '💁';
    b.classList.toggle('pendente', !!pendentes);
    b.title = pendentes ? `Monitoria: ${pendentes} colega(s) pedindo ajuda` : 'Monitoria: nenhum colega pedindo ajuda agora';
  }
  async function verificar() {
    if (!monitor || !minhaSessao()) return;
    let lista;
    try { lista = await CE.api.chamar('monitor:pedidos'); } catch { return; }
    if (!minhaSessao()) return;
    const pendentes = lista.filter((x) => !x.ajudado && !x.ajudante);
    desenharBandeja(pendentes.length);
    const agora = new Set(lista.map((x) => x.id));
    [...avisados].forEach((id) => { if (!agora.has(id)) avisados.delete(id); });
    pendentes.filter((x) => !avisados.has(x.id)).forEach((x) => {
      avisados.add(x.id);
      CE.avisar(`🙋 ${x.nome} pediu ajuda${x.licao ? ` na aula "${x.licao}"` : ''}. Clique no 💁 da barra.`);
      CE.emitir('monitor:pedido', { colega: x.nome });
    });
  }

  CE.monitoria = {
    async carregar() {
      clearInterval(timer);
      monitor = false; dono = CE.sessao.usuario ? CE.sessao.usuario.id : null; avisados.clear();
      if (!CE.sessao.usuario || CE.sessao.usuario.papel === 'instrutor') { desenharBandeja(0); return; }
      try { const p = await CE.sessao.progresso(); if (minhaSessao()) monitor = !!p.monitor; } catch { /* sem conexão */ }
      desenharBandeja(0);
      if (!monitor) return;
      setTimeout(() => { if (minhaSessao()) CE.avisar('💁 Você é MONITOR(A) da turma! Quando um colega apertar "🙋 Não entendi", aparece no 💁 da barra.'); }, 5500);
      verificar();
      timer = setInterval(verificar, 10000);
    },
    reiniciar() { clearInterval(timer); monitor = false; dono = null; avisados.clear(); desenharBandeja(0); },
    ehMonitor: () => monitor,
  };

  CE.registrarApp({
    id: 'monitoria', nome: 'Monitoria', icone: '💁', semIcone: true, largura: 600, altura: 480,
    abrir(corpo) {
      corpo.classList.add('monitoria-app');
      let relogio = null, ajudas = 0;
      const tempo = (s) => (s < 15 ? 'agora' : s < 60 ? `há ${s} s` : `há ${Math.round(s / 60)} min`);
      async function acao(canal, x) {
        try {
          const r = await CE.api.chamar(canal, x.id);
          if (canal === 'monitor:ajudar') { CE.emitir('monitor:ajudar', { colega: x.nome }); CE.avisar(`🚶 Vá até o ${x.pc || 'computador'} de ${x.nome}. Ajude com calma: explique, sem fazer por ele(a).`); }
          else { ajudas = r.ajudas; CE.emitir('monitor:ajudou', { colega: x.nome, ajudas }); CE.avisar(`👏 Obrigado por ajudar ${x.nome}! Você já ajudou ${ajudas} colega(s).`); }
        } catch (e) { CE.avisar('⚠️ ' + e.message); }
        desenhar();
      }
      const cartao = (x) => CE.el('div', { class: 'mo-pedido' + (x.ajudado ? ' ajudado' : ''), 'data-pedido': x.nome },
        CE.el('div', {}, CE.el('b', {}, `${x.avatar || '🙂'} ${x.nome}`), CE.el('small', {}, ` · ${x.pc || 'computador'} · pediu ajuda ${tempo(x.ajudaHa)}`)),
        x.licao ? CE.el('span', { class: 'ft-dica' }, `Aula: ${x.licao}${x.passo ? ` (passo ${x.passo})` : ''}`) : x.app ? CE.el('span', { class: 'ft-dica' }, `Programa: ${x.app}`) : '',
        x.ajudado ? CE.el('span', { class: 'mo-situacao' }, `✅ Ajudado por ${x.ajudante}`)
          : x.euAjudo ? CE.el('button', { class: 'botao', 'data-acao': 'monitor-ajudei', onclick: () => acao('monitor:ajudei', x) }, '✅ Já ajudei')
            : x.ajudante ? CE.el('span', { class: 'mo-situacao' }, `💁 ${x.ajudante} já está indo`)
              : CE.el('button', { class: 'botao', 'data-acao': 'monitor-ajudar', onclick: () => acao('monitor:ajudar', x) }, '🙋 Vou ajudar'));
      async function desenhar() {
        if (!corpo.isConnected) { clearInterval(relogio); return; }
        let lista;
        try { lista = await CE.api.chamar('monitor:pedidos'); } catch (e) { corpo.replaceChildren(CE.el('p', { class: 'mo-vazio' }, e.message)); return; }
        corpo.replaceChildren(
          CE.el('div', { class: 'mo-topo' }, CE.el('h2', {}, '💁 Monitoria'),
            CE.el('p', {}, 'Colegas que apertaram "🙋 Não entendi". Clique em "Vou ajudar", vá até o computador do colega e ajude com calma: explique e mostre, mas deixe ELE fazer. Depois clique em "✅ Já ajudei".')),
          lista.length ? CE.el('div', { class: 'mo-lista' }, ...lista.map(cartao)) : CE.el('p', { class: 'mo-vazio', 'data-sem-pedidos': '' }, '😊 Ninguém pedindo ajuda agora.'),
          CE.el('p', { class: 'ft-dica', 'data-ajudas': String(ajudas) }, `Você já ajudou ${ajudas} colega(s). Obrigado!`));
      }
      CE.sessao.progresso().then((p) => { ajudas = p.ajudas || 0; desenhar(); }).catch(() => desenhar());
      relogio = setInterval(desenhar, 4000);
      CE.emitir('monitor:aberto', {});
      return { aoFechar() { clearInterval(relogio); return true; } };
    },
  });

  document.addEventListener('DOMContentLoaded', () => {
    const b = botao();
    if (b) b.addEventListener('click', () => CE.janelas.abrir('monitoria'));
  });
})();
