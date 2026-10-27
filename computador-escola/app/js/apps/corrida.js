// Corrida de digitação da turma (só o instrutor abre): escolhe o texto e o tempo, os alunos recebem o convite,
// o instrutor dá a largada e acompanha o placar ao vivo (dá para mostrar no projetor). Regras em corrida-regras.js.
(function () {
  CE.registrarApp({
    id: 'corrida',
    nome: 'Corrida de Digitação',
    icone: '🏁',
    largura: 860,
    altura: 600,
    soInstrutor: true,
    abrir(corpo) {
      corpo.classList.add('corrida-app');
      let timer = null, corrida = null, diferenca = 0;
      const agora = () => Date.now() + diferenca;

      async function configurar() {
        clearInterval(timer);
        const turmas = [...new Set((await CE.api.chamar('usuarios:listar').catch(() => [])).filter((u) => u.papel === 'aluno' && u.turma).map((u) => u.turma))].sort();
        const textos = CE.DIGITACAO.textosCorrida;
        const escolhaTexto = CE.el('select', { class: 'campo', 'data-campo': 'texto-corrida' },
          ...Object.entries(textos).map(([id, [nome]]) => CE.el('option', { value: id }, nome)),
          CE.el('option', { value: 'proprio' }, '✏️ Escrever um texto meu'));
        escolhaTexto.value = 'medio';
        const proprio = CE.el('textarea', { class: 'campo', 'data-campo': 'texto-proprio', rows: '4', maxlength: '800', hidden: true, placeholder: 'Escreva ou cole o texto da corrida (de 20 a 800 letras).' });
        escolhaTexto.addEventListener('change', () => { proprio.hidden = escolhaTexto.value !== 'proprio'; });
        const duracao = CE.el('select', { class: 'campo', 'data-campo': 'duracao-corrida' },
          ...[[60, '1 minuto'], [120, '2 minutos'], [180, '3 minutos']].map(([v, n]) => CE.el('option', { value: v }, n)));
        const turma = CE.el('select', { class: 'campo', 'data-campo': 'turma-corrida' },
          CE.el('option', { value: '' }, 'Todos os alunos'), ...turmas.map((t) => CE.el('option', { value: t }, `Turma ${t}`)));
        const erro = CE.el('p', { class: 'login-erro' });
        corpo.replaceChildren(CE.el('div', { class: 'cor-config' },
          CE.el('h2', {}, '🏁 Corrida de digitação'),
          CE.el('p', {}, 'Todos digitam o mesmo texto ao mesmo tempo. Vence quem terminar primeiro; se ninguém terminar, quem chegar mais longe. Os alunos recebem o convite em poucos segundos.'),
          CE.el('label', {}, 'Texto', escolhaTexto), proprio,
          CE.el('label', {}, 'Tempo', duracao),
          CE.el('label', {}, 'Quem participa', turma),
          erro,
          CE.el('button', { class: 'botao grande', 'data-acao': 'abrir-corrida', onclick: async () => {
            erro.textContent = '';
            const texto = escolhaTexto.value === 'proprio' ? proprio.value : textos[escolhaTexto.value][1];
            try {
              receber(await CE.api.chamar('corrida:criar', { texto, duracao: Number(duracao.value), turma: turma.value }));
              CE.emitir('instrutor:corrida', { acao: 'abriu', turma: turma.value });
              acompanhar();
            } catch (e) { erro.textContent = e.message; }
          } }, 'Abrir a corrida'),
        ));
      }

      function receber(r) { corrida = r; if (r) diferenca = r.agora - Date.now(); }

      function desenhar() {
        if (!corrida) { configurar(); return; }
        const t = agora();
        const fase = corrida.fase === 'fim' ? 'fim' : !corrida.inicio ? 'espera' : t < corrida.inicio ? 'contagem' : 'correndo';
        const lista = corrida.participantes;
        const titulo = fase === 'espera' ? `⏳ Esperando os alunos entrarem… (${lista.length} na corrida)`
          : fase === 'contagem' ? `Preparar… ${Math.max(1, Math.ceil((corrida.inicio - t) / 1000))}`
            : fase === 'correndo' ? `⏱️ ${Math.max(0, Math.ceil((corrida.inicio + corrida.duracao * 1000 - t) / 1000))} s · VALENDO!`
              : '🏁 Fim da corrida!';
        const podio = fase === 'fim' && lista.length ? CE.el('div', { class: 'cor-podio' }, ...lista.slice(0, 3).map((p) => CE.el('div', { class: `cor-podio-lugar l${p.lugar}`, 'data-podio': p.lugar },
          CE.el('span', { class: 'cor-medalha' }, ['🥇', '🥈', '🥉'][p.lugar - 1]), CE.el('b', {}, `${p.avatar || ''} ${p.nome}`), CE.el('small', {}, `${p.ppm} ppm · ${p.precisao}%`)))) : null;
        corpo.replaceChildren(CE.el('div', { class: 'cor-ao-vivo' },
          CE.el('div', { class: 'cor-topo' },
            CE.el('h2', { 'data-fase-corrida': fase }, titulo),
            CE.el('div', { class: 'cor-botoes' },
              fase === 'espera' ? CE.el('button', { class: 'botao grande', 'data-acao': 'largar', disabled: !lista.length || null, title: lista.length ? '' : 'Espere pelo menos um aluno entrar', onclick: async () => {
                try { receber(await CE.api.chamar('corrida:largar')); CE.emitir('instrutor:corrida', { acao: 'largou', alunos: lista.length }); desenhar(); } catch (e) { CE.avisar(e.message); }
              } }, '🏁 Dar a largada') : null,
              fase !== 'fim' ? CE.el('button', { class: 'botao secundario', 'data-acao': 'encerrar-corrida', onclick: async () => {
                receber(await CE.api.chamar('corrida:encerrar').catch(() => corrida)); desenhar();
              } }, 'Encerrar') : CE.el('button', { class: 'botao', 'data-acao': 'nova-corrida', onclick: () => { corrida = null; configurar(); } }, 'Nova corrida'))),
          corrida.turma ? CE.el('p', { class: 'painel-legenda' }, `Corrida da turma ${corrida.turma}.`) : null,
          podio,
          lista.length ? CE.el('ol', { class: 'cor-placar grande' }, ...lista.map((p) => CE.el('li', { class: 'cor-linha', 'data-participante': p.nome },
            CE.el('span', { class: 'cor-lugar' }, ['🥇', '🥈', '🥉'][p.lugar - 1] || `${p.lugar}º`),
            CE.el('span', { class: 'cor-nome' }, `${p.avatar || ''} ${p.nome}`),
            CE.el('span', { class: 'cor-barra' }, CE.el('span', { style: `width:${Math.round((p.pos / p.total) * 100)}%` })),
            CE.el('span', { class: 'cor-ppm' }, p.terminou ? `🏁 ${p.ppm} ppm` : `${p.ppm} ppm · ${p.precisao}%`))))
            : CE.el('p', { class: 'cor-vazio' }, 'Ninguém entrou ainda. Nos computadores dos alunos aparece "🏁 Corrida de digitação!": é só clicar em "Entrar na corrida".'),
        ));
      }

      function acompanhar() {
        clearInterval(timer);
        desenhar();
        let ultima = 0;
        timer = setInterval(async () => {
          if (Date.now() - ultima >= 1000) {
            ultima = Date.now();
            try { const r = await CE.api.chamar('corrida:estado'); if (r && (!corrida || r.id === corrida.id)) receber(r); } catch { /* tenta de novo */ }
          }
          if (corrida) desenhar();
        }, 250);
      }

      // Se já tem uma corrida (a janela foi fechada e aberta de novo), mostra ela; se já acabou, mostra o pódio.
      CE.api.chamar('corrida:estado').then((r) => { if (r) { receber(r); acompanhar(); } else configurar(); }).catch(configurar);
      return { aoFechar() { clearInterval(timer); return true; } };
    },
  });
})();
