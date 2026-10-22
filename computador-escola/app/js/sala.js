// Sala de aula em rede, do lado da tela: avisa o computador do instrutor o que o aluno está fazendo,
// mostra a tela de pausa e as mensagens do instrutor, e a janela "Rede da sala" (escolher o modo do computador).
window.CE = window.CE || {};

(function () {
  let timer = null;
  const mensagensVistas = new Map(); // id do aluno -> última mensagem do instrutor que ele já viu neste computador
  const $ = (id) => document.getElementById(id);

  // O que o aluno está fazendo agora (vai para o painel do instrutor). "ajuda": quando apertou "Não entendi"
  // (o pedido some quando ele passa para o próximo passo).
  let ajudaEm = 0;
  function atividade() {
    const app = CE.janelas.ativa();
    const s = CE.professor.situacao ? CE.professor.situacao() : null;
    return { app: app ? `${app.icone} ${app.nome}` : '🖥️ Área de trabalho', licao: s ? s.titulo : '', passo: s ? s.passo : '', ajuda: ajudaEm };
  }

  function marcarRede(ok, erro) {
    const icone = $('status-rede');
    if (!icone) return;
    icone.classList.toggle('erro', !ok);
    icone.title = ok ? icone.dataset.titulo || 'Rede da sala' : `⚠️ ${erro || 'Sem conexão com o computador do instrutor.'}`;
  }

  function pausar(ligado) {
    let tela = $('tela-pausa');
    if (ligado && !tela) {
      tela = CE.el('div', { id: 'tela-pausa', class: 'tela-pausa', role: 'dialog' },
        CE.el('div', { class: 'tela-pausa-icone' }, '⏸️'),
        CE.el('h1', {}, 'O professor pausou as telas'),
        CE.el('p', {}, 'Tire a mão do mouse e olhe para a frente 🙂'));
      document.body.append(tela);
      CE.voz.parar();
      CE.emitir('sala:pausada', { pausada: true });
    } else if (!ligado && tela) {
      tela.remove();
      CE.emitir('sala:pausada', { pausada: false });
    }
  }

  // Mensagens novas do instrutor: as que chegam juntas aparecem numa caixa só (e são lidas numa fala só).
  function mostrarMensagens(lista) {
    const quem = CE.sessao.usuario && CE.sessao.usuario.id;
    if (!quem) return;
    const novas = lista.filter((m) => m && m.id > (mensagensVistas.get(quem) || 0));
    if (!novas.length) return;
    mensagensVistas.set(quem, Math.max(...novas.map((m) => m.id)));
    const de = novas[novas.length - 1].de || 'Instrutor';
    const fundo = CE.el('div', { class: 'dialogo-fundo sala-mensagem' },
      CE.el('div', { class: 'dialogo' },
        CE.el('p', {}, novas.length > 1 ? `📢 Mensagens de ${de}:` : `📢 Mensagem de ${de}:`),
        ...novas.map((m) => CE.el('div', { class: 'sala-mensagem-texto', 'data-mensagem-sala': '' }, m.texto)),
        CE.el('div', { class: 'dialogo-botoes' }, CE.el('button', { class: 'botao', onclick: () => fundo.remove() }, 'OK, entendi'))));
    document.body.append(fundo);
    novas.forEach((m) => CE.emitir('sala:mensagem', { texto: m.texto }));
    // Uma fala só (uma fala nova cortaria a anterior); a mensagem do instrutor fala mesmo com a tela pausada.
    CE.voz.falar(`Mensagem do professor: ${novas.map((m) => m.texto).join('. ')}`, { mesmoPausado: true });
  }

  // Sem resposta do instrutor por uns 20 s (3 tentativas), a pausa sai sozinha: o aluno não fica com a tela travada.
  let falhasSeguidas = 0;
  let geracao = 0; // muda ao entrar e ao sair: resposta de uma presença antiga é ignorada
  async function avisar() {
    if (!CE.sessao.usuario) return;
    const minha = geracao;
    try {
      const r = await CE.api.chamar('sala:presenca', atividade());
      if (minha !== geracao || !CE.sessao.usuario) return;
      falhasSeguidas = 0;
      marcarRede(true);
      pausar(!!r.pausada);
      mostrarMensagens(r.mensagens || (r.mensagem ? [r.mensagem] : []));
    } catch (e) {
      if (minha !== geracao) return;
      marcarRede(false, e.message);
      if (++falhasSeguidas >= 3) pausar(false);
    }
  }

  CE.sala = {
    async iniciar() {
      clearInterval(timer);
      geracao++;
      const st = await CE.api.chamar('sala:status').catch(() => ({ modo: 'local' }));
      const icone = $('status-rede');
      if (icone) {
        icone.hidden = st.modo === 'local';
        icone.dataset.titulo = st.modo === 'servidor' ? 'Computador do instrutor: atendendo a sala pela rede' : `Computador de aluno: ligado ao instrutor (${st.servidor})`;
        icone.title = icone.dataset.titulo;
      }
      await avisar();
      timer = setInterval(avisar, 8000);
    },
    // Ao sair: a pausa e a mensagem do instrutor não ficam na frente da tela de entrada.
    parar() { clearInterval(timer); geracao++; ajudaEm = 0; pausar(false); document.querySelectorAll('.sala-mensagem').forEach((d) => d.remove()); },
    avisarAgora: avisar,
    // "Não entendi": avisa o instrutor na hora (sem esperar a próxima presença).
    pedirAjuda() { ajudaEm = Date.now(); avisar(); },
    ajudaResolvida() { if (!ajudaEm) return; ajudaEm = 0; avisar(); }, // o pedido sai da Sala ao vivo na hora
  };

  // ---------- Janela "Rede da sala" (na tela de entrada) ----------
  const MODOS = [
    ['local', '🖥️', 'Este computador sozinho', 'Os dados dos alunos ficam neste computador mesmo.'],
    ['servidor', '🧑‍🏫', 'Computador do INSTRUTOR', 'Guarda os dados de todos os alunos. Os outros computadores da sala se ligam nele pelo cabo de rede.'],
    ['aluno', '👩‍🎓', 'Computador de ALUNO', 'O aluno entra e salva tudo no computador do instrutor. Assim ele pode sentar em qualquer computador.'],
  ];
  CE.abrirRedeSala = async function (aoMudar) {
    const atual = await CE.api.chamar('sala:ler');
    let modo = atual.modo;
    const area = CE.el('div', { class: 'sala-detalhes' });
    const erro = CE.el('p', { class: 'login-erro' });
    const endereco = CE.el('input', { class: 'campo', 'data-campo': 'endereco', placeholder: 'Endereço do computador do instrutor (ex.: 192.168.0.10)', value: atual.servidor || '' });
    const codigo = CE.el('input', { class: 'campo', 'data-campo': 'codigo', inputmode: 'numeric', maxlength: '6', placeholder: 'Código da sala (6 números)' });
    const codigoAtual = CE.el('input', { class: 'campo', 'data-campo': 'codigo-atual', inputmode: 'numeric', maxlength: '6', placeholder: 'Código atual da sala' });
    const achados = CE.el('div', { class: 'sala-achados' });
    const opcoes = CE.el('div', { class: 'sala-modos' }, ...MODOS.map(([id, icone, nome, texto]) => CE.el('button', {
      class: 'sala-modo' + (id === modo ? ' escolhido' : ''), 'data-modo': id,
      onclick: (e) => { modo = id; opcoes.querySelectorAll('.sala-modo').forEach((b) => b.classList.toggle('escolhido', b === e.currentTarget)); desenhar(); },
    }, CE.el('span', { class: 'sala-modo-icone' }, icone), CE.el('b', {}, nome), CE.el('small', {}, texto))));
    function desenhar() {
      erro.textContent = '';
      const partes = [];
      if (modo === 'servidor' && atual.modo === 'servidor') {
        partes.push(CE.el('div', { class: 'sala-info' },
          CE.el('p', {}, 'Nos computadores dos alunos, escolha "Computador de ALUNO" e use:'),
          CE.el('p', {}, 'Endereço deste computador: ', CE.el('b', { 'data-ips': '' }, atual.ips.length ? atual.ips.join(' ou ') : '(sem rede)')),
          CE.el('p', {}, 'Código da sala: ', CE.el('b', { class: 'sala-codigo', 'data-codigo-sala': '' }, atual.codigo))));
      } else if (modo === 'servidor') {
        partes.push(CE.el('p', { class: 'sala-dica' }, 'Depois de salvar, aparecem o endereço deste computador e o código da sala para configurar os computadores dos alunos.'));
      }
      if (modo === 'aluno') {
        partes.push(CE.el('button', { class: 'botao secundario', 'data-acao': 'procurar-instrutor', onclick: async (e) => {
          e.currentTarget.disabled = true;
          achados.replaceChildren(CE.el('p', {}, '🔎 Procurando o computador do instrutor na rede…'));
          const lista = await CE.api.chamar('sala:procurar').catch(() => []);
          e.target.disabled = false;
          achados.replaceChildren(...(lista.length ? lista.map((s) => CE.el('button', { class: 'chip', 'data-achado': s.endereco, onclick: () => { endereco.value = `${s.endereco}:${s.porta}`; } }, `🧑‍🏫 ${s.nome} (${s.endereco})`))
            : [CE.el('p', {}, 'Não achei. Confira se o computador do instrutor está ligado com o Computador Escola aberto, ou escreva o endereço abaixo.')]));
        } }, '🔎 Procurar o computador do instrutor'), achados, endereco, codigo);
      }
      if (atual.protegido && modo !== atual.modo) partes.push(CE.el('p', { class: 'sala-dica' }, 'Para mudar, digite o código atual da sala:'), codigoAtual);
      area.replaceChildren(...partes);
    }
    desenhar();
    const fundo = CE.el('div', { class: 'dialogo-fundo' },
      CE.el('div', { class: 'dialogo largo sala-dialogo' },
        CE.el('p', {}, '🖧 Rede da sala de aula'),
        CE.el('p', { class: 'sala-dica' }, `Este computador: ${atual.nomePc}`),
        opcoes, area, erro,
        CE.el('div', { class: 'dialogo-botoes' },
          CE.el('button', { class: 'botao secundario', onclick: () => fundo.remove() }, 'Fechar'),
          CE.el('button', { class: 'botao', 'data-acao': 'salvar-rede', onclick: async (e) => {
            erro.textContent = '';
            e.currentTarget.disabled = true;
            try {
              await CE.api.chamar('sala:salvar', { modo, servidor: endereco.value, codigo: codigo.value.trim(), codigoAtual: codigoAtual.value.trim() });
              fundo.remove();
              CE.avisar(modo === 'local' ? '🖥️ Este computador agora funciona sozinho.' : modo === 'servidor' ? '🧑‍🏫 Este é o computador do instrutor. Abra "Rede da sala" de novo para ver o código.' : '👩‍🎓 Computador de aluno ligado ao instrutor!');
              if (aoMudar) aoMudar();
            } catch (er) { erro.textContent = er.message; }
            e.target.disabled = false;
          } }, 'Salvar'))));
    document.body.append(fundo);
  };

  // Com a tela pausada, o teclado também fica parado.
  document.addEventListener('keydown', (e) => { if ($('tela-pausa')) { e.preventDefault(); e.stopPropagation(); } }, true);

  document.addEventListener('DOMContentLoaded', () => {
    const icone = $('status-rede');
    if (icone) icone.addEventListener('click', () => CE.avisar(icone.title));
  });
})();
