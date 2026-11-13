// Programas do Nível 4 (informática para o trabalho):
// - Gerenciador de Tarefas (Ctrl+Shift+Esc): ver o que está aberto, finalizar programa travado, desempenho e inicialização.
// - Nuvem: guardar arquivos "na internet" (a pasta Nuvem de Meus Documentos fica sincronizada) e compartilhar por link.
// - Agenda: compromissos com hora e lembrete, e contatos (nome, telefone, e-mail).
// A Agenda e a Nuvem guardam o que é delas no progresso do aluno (p.agenda e p.nuvem).
(function () {
  const PASTA_NUVEM = 'Nuvem';
  const INICIALIZACAO = [
    { id: 'antivirus', nome: 'Antivírus', icone: '🛡️', impacto: 'Baixo', padrao: true, dica: 'Deixe ligado: protege o computador desde o começo.' },
    { id: 'nuvem', nome: 'Nuvem (sincronizar arquivos)', icone: '☁️', impacto: 'Médio', padrao: true, dica: 'Pode ficar ligado se você usa a nuvem.' },
    { id: 'atualizador', nome: 'Atualizador de impressora', icone: '🖨️', impacto: 'Médio', padrao: true, dica: 'Não precisa começar com o computador.' },
    { id: 'chat', nome: 'Programa de bate-papo', icone: '💬', impacto: 'Alto', padrao: true, dica: 'Deixa o computador lento para ligar. Abra só quando for usar.' },
  ];

  // ---------- Gerenciador de Tarefas ----------
  CE.registrarApp({
    id: 'tarefas', nome: 'Gerenciador de Tarefas', icone: '📊', largura: 640, altura: 480, semIcone: true,
    abrir(corpo) {
      let aba = 'processos';
      let selecionado = null;
      const conteudo = CE.el('div', { class: 'gt-conteudo' });
      const abas = CE.el('div', { class: 'gt-abas' });
      // Números de treino que mudam um pouco a cada segundo (como no Windows).
      const uso = {};
      const sortear = (id, base) => { uso[id] = Math.max(0, Math.min(99, Math.round((uso[id] ?? base) + (Math.random() - 0.5) * 6))); return uso[id]; };
      const memoria = (id) => 40 + (id.length * 37) % 260;

      function desenharAbas() {
        abas.replaceChildren(...[['processos', '📋 Processos'], ['desempenho', '📈 Desempenho'], ['inicializacao', '🚀 Inicializar']].map(([id, rotulo]) => CE.el('button', {
          class: 'gt-aba' + (aba === id ? ' ativa' : ''), 'data-aba': id, onclick: () => { aba = id; desenhar(); CE.emitir('tarefas:aba', { aba: id }); },
        }, rotulo)));
      }
      function processos() {
        const lista = CE.janelas.abertas().filter((j) => j.id !== 'tarefas');
        if (selecionado && !lista.some((j) => j.id === selecionado)) selecionado = null;
        const linhas = lista.map((j) => {
          const cpu = j.travada ? sortear(j.id, 92) : sortear(j.id, 4);
          return CE.el('tr', { class: 'gt-linha' + (selecionado === j.id ? ' selecionada' : '') + (j.travada ? ' travada' : ''), 'data-processo': j.id,
            onclick: () => { selecionado = j.id; desenhar(); CE.emitir('tarefa:selecionada', { app: j.id, travada: j.travada }); } },
          CE.el('td', {}, `${j.icone} ${j.nome}`), CE.el('td', { class: 'gt-status' }, j.travada ? 'Não está respondendo' : j.minimizada ? 'Minimizado' : 'Executando'),
          CE.el('td', { class: 'gt-num' + (cpu > 70 ? ' alto' : '') }, `${cpu}%`), CE.el('td', { class: 'gt-num' }, `${memoria(j.id) + (j.travada ? 900 : 0)} MB`));
        });
        const sel = lista.find((j) => j.id === selecionado);
        return [
          CE.el('p', { class: 'cfg-sub' }, 'Programas abertos agora. Se um travar ("Não está respondendo"), clique nele e em "Finalizar tarefa".'),
          CE.el('table', { class: 'gt-tabela' }, CE.el('thead', {}, CE.el('tr', {}, CE.el('th', {}, 'Nome'), CE.el('th', {}, 'Status'), CE.el('th', {}, 'CPU'), CE.el('th', {}, 'Memória'))),
            CE.el('tbody', {}, ...(linhas.length ? linhas : [CE.el('tr', {}, CE.el('td', { colspan: '4', class: 'arq-vazio' }, 'Nenhum programa aberto.'))]))),
          CE.el('div', { class: 'dialogo-botoes' }, CE.el('button', { class: 'botao', 'data-acao': 'finalizar-tarefa', disabled: !sel, onclick: async () => {
            if (!sel) return;
            if (!sel.travada && !await CE.confirmar(`Finalizar "${sel.nome}"? O que não foi salvo nele vai ser perdido.`)) return;
            CE.janelas.finalizar(sel.id);
            selecionado = null;
            CE.avisar(`✅ "${sel.nome}" foi finalizado.${sel.travada ? ' Agora você pode abrir de novo.' : ''}`);
            desenhar();
          } }, 'Finalizar tarefa')),
        ];
      }
      function desempenho() {
        const total = CE.janelas.abertas().length;
        const cpu = sortear('cpu', 8 + total * 6 + (CE.janelas.abertas().some((j) => j.travada) ? 60 : 0));
        const mem = sortear('mem', 30 + total * 7);
        const barra = (rotulo, pct, detalhe) => CE.el('div', { class: 'gt-medida', 'data-medida': rotulo },
          CE.el('div', { class: 'gt-medida-topo' }, CE.el('b', {}, rotulo), CE.el('span', {}, detalhe)),
          CE.el('div', { class: 'cfg-progresso' + (pct > 80 ? ' alto' : '') }, CE.el('div', { style: `width:${pct}%` })));
        return [
          CE.el('p', { class: 'cfg-sub' }, 'Como o computador está trabalhando. Se a CPU ou a memória ficam perto de 100%, o computador fica lento: feche o que não está usando.'),
          barra('CPU (processador)', cpu, `${cpu}%`), barra('Memória (RAM)', mem, `${(mem * 0.08).toFixed(1)} de 8 GB (${mem}%)`),
          barra('Disco (SSD)', 41, '96 de 240 GB usados'), barra('Rede (Wi‑Fi)', sortear('rede', 3), CE.config && CE.config.atual.aviao ? 'Desligada (modo avião)' : 'Conectada'),
        ];
      }
      function inicializacao() {
        const estado = (CE.config && CE.config.atual.inicializacao) || {};
        const ligado = (p) => (p.id in estado ? estado[p.id] : p.padrao);
        return [
          CE.el('p', { class: 'cfg-sub' }, 'Programas que abrem sozinhos quando o computador liga. Quanto mais programas aqui, mais demora para ligar.'),
          CE.el('div', { class: 'cfg-lista' }, ...INICIALIZACAO.map((p) => CE.el('div', { class: 'cfg-app', 'data-inicializar': p.id },
            CE.el('span', { class: 'cfg-app-icone' }, p.icone),
            CE.el('div', {}, CE.el('b', {}, p.nome), CE.el('small', {}, `Impacto no início: ${p.impacto}. ${p.dica}`)),
            CE.el('button', { class: 'botao' + (ligado(p) ? ' secundario' : ''), 'data-alternar-inicio': p.id, onclick: async () => {
              const novo = { ...estado, [p.id]: !ligado(p) };
              if (CE.config) await CE.config.guardar({ inicializacao: novo });
              CE.emitir('tarefas:inicializacao', { programa: p.id, nome: p.nome, ativo: novo[p.id], impacto: p.impacto });
              desenhar();
            } }, ligado(p) ? 'Desabilitar' : 'Habilitar')))),
        ];
      }
      function desenhar() {
        desenharAbas();
        conteudo.replaceChildren(...{ processos, desempenho, inicializacao }[aba]());
      }
      const relogio = setInterval(() => { if (aba !== 'inicializacao' && corpo.isConnected) desenhar(); }, 1500);
      const parar = [CE.ouvir('app:aberto', () => desenhar()), CE.ouvir('janela:fechada', () => desenhar()), CE.ouvir('janela:travou', () => desenhar())];
      corpo.classList.add('gerenciador-tarefas');
      corpo.append(abas, conteudo);
      desenhar();
      CE.emitir('tarefas:aberto', {});
      return { aoFechar() { clearInterval(relogio); parar.forEach((f) => f && f()); return true; } };
    },
  });

  // ---------- Nuvem ----------
  const linkDe = (nome) => `https://nuvem.treino/s/${Math.abs([...nome].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7)).toString(36)}`;
  CE.nuvem = {
    PASTA: PASTA_NUVEM,
    // Copia um arquivo de Meus Documentos para a pasta Nuvem (fica "salvo na internet").
    async enviar(arquivo) {
      await CE.sessao.garantirPasta(PASTA_NUVEM, 'pc', '');
      const lista = await CE.sessao.arquivos();
      const ja = lista.find((a) => !a.naLixeira && (a.local || 'pc') === 'pc' && a.pasta === PASTA_NUVEM && a.nome === arquivo.nome && a.tipo === arquivo.tipo);
      if (ja) await CE.sessao.salvarArquivo({ nome: arquivo.nome, tipo: arquivo.tipo, conteudo: arquivo.conteudo, local: 'pc', pasta: PASTA_NUVEM });
      else await CE.sessao.copiarArquivo(arquivo.id, 'pc', PASTA_NUVEM);
      CE.emitir('nuvem:enviado', { nome: arquivo.nome, tipo: arquivo.tipo, atualizado: !!ja });
    },
  };
  CE.registrarApp({
    id: 'nuvem', nome: 'Nuvem', icone: '☁️', largura: 760, altura: 520,
    abrir(corpo) {
      let compartilhados = {};
      const lista = CE.el('div', { class: 'nv-lista' });
      const topo = CE.el('div', { class: 'nv-topo' });
      async function carregar() {
        const vale = CE.sessao.marca();
        const [arquivos, p] = await Promise.all([CE.sessao.arquivos(), CE.sessao.progresso()]);
        if (!vale() || !corpo.isConnected) return;
        compartilhados = (p.nuvem && p.nuvem.compartilhados) || {};
        const naNuvem = arquivos.filter((a) => !a.naLixeira && (a.local || 'pc') === 'pc' && a.pasta === PASTA_NUVEM && a.tipo !== 'pasta');
        const tamanho = naNuvem.reduce((s, a) => s + (a.conteudo || '').length, 0);
        topo.replaceChildren(
          CE.el('div', {}, CE.el('b', {}, '☁️ Sua nuvem de treino'), CE.el('small', {}, `${naNuvem.length} arquivo${naNuvem.length === 1 ? '' : 's'} · ${(tamanho / 1024 / 1024).toFixed(2)} MB de 5 GB usados · ✔️ Tudo sincronizado`)),
          CE.el('button', { class: 'botao', 'data-acao': 'enviar-nuvem', onclick: () => escolherParaEnviar(arquivos) }, '⬆️ Enviar arquivo'));
        lista.replaceChildren(...(naNuvem.length ? naNuvem.map((a) => CE.el('div', { class: 'nv-item', 'data-nuvem': a.nome },
          CE.el('span', { class: 'arq-icone' }, CE.TIPOS_ARQUIVO[a.tipo] ? CE.TIPOS_ARQUIVO[a.tipo].icone : '📄'),
          CE.el('div', { class: 'nv-nome' }, CE.el('b', {}, a.nome), CE.el('small', {}, compartilhados[a.nome] ? `🔗 Compartilhado com ${compartilhados[a.nome].pessoa || 'quem tiver o link'} (${compartilhados[a.nome].permissao === 'editar' ? 'pode editar' : 'só pode ver'})` : '✔️ Sincronizado · só você vê')),
          CE.el('button', { class: 'botao secundario', 'data-abrir-nuvem': a.nome, onclick: () => { const t = CE.TIPOS_ARQUIVO[a.tipo]; if (t && t.app) CE.janelas.abrir(t.app, { arquivo: a }); CE.emitir('nuvem:aberto', { nome: a.nome }); } }, 'Abrir'),
          CE.el('button', { class: 'botao', 'data-compartilhar': a.nome, onclick: () => compartilhar(a) }, '🔗 Compartilhar')))
          : [CE.el('p', { class: 'arq-vazio' }, 'A nuvem está vazia. Clique em "⬆️ Enviar arquivo" para guardar uma cópia aqui. O que está na nuvem não se perde se o computador quebrar e pode ser aberto em outro lugar.')]));
      }
      function escolherParaEnviar(arquivos) {
        const opcoes = arquivos.filter((a) => !a.naLixeira && a.tipo !== 'pasta' && (a.local || 'pc') === 'pc' && a.pasta !== PASTA_NUVEM);
        const fundo = CE.el('div', { class: 'dialogo-fundo' }, CE.el('div', { class: 'dialogo largo' },
          CE.el('p', {}, '⬆️ Qual arquivo vai para a nuvem?'),
          opcoes.length ? CE.el('div', { class: 'em-escolher' }, ...opcoes.map((a) => CE.el('button', { class: 'arq-item', 'data-enviar-nuvem': a.nome, onclick: async () => {
            fundo.remove();
            try { await CE.nuvem.enviar(a); } catch (e) { CE.avisar('⚠️ ' + e.message); return; }
            CE.avisar(`☁️ "${a.nome}" está na nuvem!`);
            carregar();
          } }, CE.el('span', { class: 'arq-icone' }, CE.TIPOS_ARQUIVO[a.tipo].icone), CE.el('span', { class: 'arq-nome' }, a.nome), CE.el('span', { class: 'arq-tipo' }, a.pasta ? `📁 ${a.pasta}` : 'Meus Documentos'))))
            : CE.el('p', {}, 'Você ainda não tem arquivos em Meus Documentos.'),
          CE.el('div', { class: 'dialogo-botoes' }, CE.el('button', { class: 'botao secundario', onclick: () => fundo.remove() }, 'Cancelar'))));
        document.body.append(fundo);
      }
      function compartilhar(a) {
        const pessoa = CE.el('input', { class: 'campo', placeholder: 'E-mail da pessoa (ou deixe vazio para "qualquer um com o link")', 'data-campo': 'pessoa' });
        const permissao = CE.el('select', { class: 'campo', 'data-campo': 'permissao' }, CE.el('option', { value: 'ver' }, '👁️ Só pode ver'), CE.el('option', { value: 'editar' }, '✏️ Pode editar'));
        const link = CE.el('input', { class: 'campo', readonly: true, value: linkDe(a.nome), 'data-campo': 'link' });
        const fundo = CE.el('div', { class: 'dialogo-fundo' }, CE.el('div', { class: 'dialogo' },
          CE.el('p', {}, `🔗 Compartilhar "${a.nome}"`),
          CE.el('label', {}, 'Com quem', pessoa), CE.el('label', {}, 'O que a pessoa pode fazer', permissao),
          CE.el('p', { class: 'ed-dica' }, 'Dica de segurança: para documentos pessoais (RG, contas), escolha "Só pode ver" e mande só para quem precisa.'),
          CE.el('label', {}, 'Link', link),
          CE.el('div', { class: 'dialogo-botoes' },
            CE.el('button', { class: 'botao secundario', onclick: () => fundo.remove() }, 'Cancelar'),
            CE.el('button', { class: 'botao', 'data-acao': 'confirmar-compartilhar', onclick: async () => {
              const dados = { pessoa: pessoa.value.trim(), permissao: permissao.value, link: link.value, em: Date.now() };
              fundo.remove();
              try { navigator.clipboard && navigator.clipboard.writeText(dados.link).catch(() => {}); } catch { /* sem área de transferência */ }
              await CE.sessao.atualizarProgresso((p) => { p.nuvem = p.nuvem || {}; p.nuvem.compartilhados = { ...(p.nuvem.compartilhados || {}), [a.nome]: dados }; });
              CE.emitir('nuvem:compartilhado', { nome: a.nome, ...dados });
              CE.avisar(`🔗 Link copiado! ${dados.pessoa ? `${dados.pessoa} pode` : 'Quem tiver o link pode'} ${dados.permissao === 'editar' ? 'ver e editar' : 'só ver'} o arquivo.`);
              carregar();
            } }, 'Compartilhar e copiar o link'))));
        document.body.append(fundo);
      }
      const parar = CE.ouvir('nuvem:enviado', () => carregar());
      corpo.classList.add('nuvem');
      corpo.append(topo, lista);
      carregar();
      CE.emitir('nuvem:aberta', {});
      return { aoFechar() { parar && parar(); return true; } };
    },
  });

  // ---------- Agenda ----------
  const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const LEMBRETES = [['', 'Sem lembrete'], ['15', '15 minutos antes'], ['60', '1 hora antes'], ['1440', '1 dia antes']];
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const dataBR = (s) => s.split('-').reverse().join('/');
  CE.registrarApp({
    id: 'agenda', nome: 'Agenda', icone: '📅', largura: 900, altura: 580,
    abrir(corpo, janela) {
      const hoje = CE.config ? CE.config.agora() : new Date();
      let mes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      let dia = iso(hoje);
      let aba = 'calendario';
      let agenda = { compromissos: [], contatos: [] };
      let busca = '';
      const conteudo = CE.el('div', { class: 'ag-conteudo' });
      const guardar = () => CE.sessao.atualizarProgresso((p) => { p.agenda = agenda; });

      async function carregar() {
        const vale = CE.sessao.marca();
        const p = await CE.sessao.progresso();
        if (!vale()) return;
        agenda = { compromissos: [], contatos: [], ...(p.agenda || {}) };
        desenhar();
      }
      function desenhar() {
        const abas = CE.el('div', { class: 'gt-abas' }, ...[['calendario', '📅 Calendário'], ['contatos', '👥 Contatos']].map(([id, r]) => CE.el('button', {
          class: 'gt-aba' + (aba === id ? ' ativa' : ''), 'data-aba': id, onclick: () => { aba = id; desenhar(); CE.emitir('agenda:aba', { aba: id }); } }, r)));
        conteudo.replaceChildren(abas, ...(aba === 'calendario' ? calendario() : contatos()));
        janela.definirTitulo(aba === 'calendario' ? `${MESES[mes.getMonth()]} de ${mes.getFullYear()}` : 'Contatos');
      }
      function calendario() {
        const primeiro = mes.getDay();
        const dias = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate();
        const celulas = [];
        for (let i = 0; i < primeiro; i++) celulas.push(CE.el('div', { class: 'ag-dia vazio' }));
        for (let d = 1; d <= dias; d++) {
          const data = iso(new Date(mes.getFullYear(), mes.getMonth(), d));
          const qtd = agenda.compromissos.filter((c) => c.data === data).length;
          celulas.push(CE.el('button', { class: 'ag-dia' + (data === dia ? ' escolhido' : '') + (data === iso(hoje) ? ' hoje' : ''), 'data-dia': data,
            onclick: () => { dia = data; desenhar(); CE.emitir('agenda:dia', { data }); } }, CE.el('span', {}, String(d)), qtd ? CE.el('b', { class: 'ag-marca' }, `${qtd}`) : ''));
        }
        const doDia = agenda.compromissos.filter((c) => c.data === dia).sort((a, b) => (a.hora || '').localeCompare(b.hora || ''));
        const proximos = agenda.compromissos.filter((c) => c.data >= iso(hoje)).sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora)).slice(0, 5);
        const item = (c) => CE.el('div', { class: 'ag-compromisso', 'data-compromisso': c.titulo },
          CE.el('b', {}, `${c.hora || '--:--'} · ${c.titulo}`), CE.el('small', {}, [dataBR(c.data), c.local, c.lembrete ? `🔔 ${LEMBRETES.find((l) => l[0] === c.lembrete)[1]}` : '', c.convidado ? `👥 ${c.convidado}` : ''].filter(Boolean).join(' · ')),
          CE.el('button', { class: 'ag-apagar', title: 'Apagar compromisso', 'data-apagar-compromisso': c.titulo, onclick: async () => {
            if (!await CE.confirmar(`Apagar o compromisso "${c.titulo}"?`)) return;
            agenda.compromissos = agenda.compromissos.filter((x) => x !== c);
            await guardar(); CE.emitir('agenda:apagado', { titulo: c.titulo }); desenhar();
          } }, '🗑️'));
        return [CE.el('div', { class: 'ag-principal' },
          CE.el('div', { class: 'ag-calendario' },
            CE.el('div', { class: 'ag-mes' },
              CE.el('button', { class: 'botao secundario', 'data-acao': 'mes-anterior', onclick: () => { mes = new Date(mes.getFullYear(), mes.getMonth() - 1, 1); desenhar(); } }, '◀'),
              CE.el('b', {}, `${MESES[mes.getMonth()]} de ${mes.getFullYear()}`),
              CE.el('button', { class: 'botao secundario', 'data-acao': 'mes-seguinte', onclick: () => { mes = new Date(mes.getFullYear(), mes.getMonth() + 1, 1); desenhar(); CE.emitir('agenda:mes', { mes: mes.getMonth() + 1 }); } }, '▶')),
            CE.el('div', { class: 'ag-semana' }, ...['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'].map((d) => CE.el('span', {}, d))),
            CE.el('div', { class: 'ag-grade' }, ...celulas)),
          CE.el('div', { class: 'ag-lado' },
            CE.el('button', { class: 'botao', 'data-acao': 'novo-compromisso', onclick: () => novoCompromisso() }, '➕ Novo compromisso'),
            CE.el('h3', {}, `Dia ${dataBR(dia)}`),
            ...(doDia.length ? doDia.map(item) : [CE.el('p', { class: 'cfg-sub' }, 'Nada marcado neste dia.')]),
            CE.el('h3', {}, 'Próximos compromissos'),
            ...(proximos.length ? proximos.map(item) : [CE.el('p', { class: 'cfg-sub' }, 'Nenhum compromisso marcado.')])))];
      }
      function novoCompromisso() {
        const titulo = CE.el('input', { class: 'campo', 'data-campo': 'titulo', placeholder: 'Ex.: Reunião com o fornecedor' });
        const data = CE.el('input', { class: 'campo', type: 'date', 'data-campo': 'data', value: dia });
        const hora = CE.el('input', { class: 'campo', type: 'time', 'data-campo': 'hora', value: '09:00' });
        const local = CE.el('input', { class: 'campo', 'data-campo': 'local', placeholder: 'Ex.: Sala 2' });
        const lembrete = CE.el('select', { class: 'campo', 'data-campo': 'lembrete' }, ...LEMBRETES.map(([v, r]) => CE.el('option', { value: v, selected: v === '15' }, r)));
        const convidado = CE.el('select', { class: 'campo', 'data-campo': 'convidado' }, CE.el('option', { value: '' }, 'Ninguém'), ...agenda.contatos.map((c) => CE.el('option', { value: c.nome }, c.nome)));
        const erro = CE.el('p', { class: 'login-erro em-claro' });
        const fundo = CE.el('div', { class: 'dialogo-fundo' }, CE.el('div', { class: 'dialogo' },
          CE.el('p', {}, '📅 Novo compromisso'),
          CE.el('label', {}, 'O quê', titulo), CE.el('div', { class: 'ag-linha' }, CE.el('label', {}, 'Dia', data), CE.el('label', {}, 'Hora', hora)),
          CE.el('label', {}, 'Onde', local), CE.el('label', {}, '🔔 Lembrete', lembrete), CE.el('label', {}, '👥 Convidar (dos seus contatos)', convidado), erro,
          CE.el('div', { class: 'dialogo-botoes' },
            CE.el('button', { class: 'botao secundario', onclick: () => fundo.remove() }, 'Cancelar'),
            CE.el('button', { class: 'botao', 'data-acao': 'salvar-compromisso', onclick: async () => {
              if (!titulo.value.trim()) { erro.textContent = 'Escreva o que é o compromisso.'; return; }
              if (!data.value) { erro.textContent = 'Escolha o dia.'; return; }
              const c = { titulo: titulo.value.trim(), data: data.value, hora: hora.value, local: local.value.trim(), lembrete: lembrete.value, convidado: convidado.value, em: Date.now() };
              agenda.compromissos.push(c);
              fundo.remove();
              await guardar();
              dia = c.data;
              mes = new Date(Number(c.data.slice(0, 4)), Number(c.data.slice(5, 7)) - 1, 1);
              CE.emitir('agenda:compromisso', c);
              CE.avisar(`📅 Marcado: "${c.titulo}" em ${dataBR(c.data)}${c.hora ? ` às ${c.hora}` : ''}.${c.lembrete ? ' Você vai receber um lembrete.' : ''}`);
              desenhar();
            } }, 'Salvar'))));
        document.body.append(fundo);
        titulo.focus();
      }
      function contatos() {
        const t = busca.toLowerCase();
        const lista = agenda.contatos.filter((c) => !t || [c.nome, c.telefone, c.email, c.empresa].join(' ').toLowerCase().includes(t)).sort((a, b) => a.nome.localeCompare(b.nome));
        const campoBusca = CE.el('input', { class: 'arq-busca', placeholder: '🔍 Procurar contato', value: busca, 'data-acao': 'procurar-contato' });
        campoBusca.addEventListener('input', () => { busca = campoBusca.value; const pos = campoBusca.selectionStart; desenhar(); const novo = conteudo.querySelector('[data-acao="procurar-contato"]'); novo.focus(); novo.setSelectionRange(pos, pos); CE.emitir('agenda:busca', { termo: busca }); });
        return [CE.el('div', { class: 'ag-contatos-topo' }, campoBusca, CE.el('button', { class: 'botao', 'data-acao': 'novo-contato', onclick: novoContato }, '➕ Novo contato')),
          CE.el('div', { class: 'cfg-lista' }, ...(lista.length ? lista.map((c) => CE.el('div', { class: 'cfg-app ag-contato', 'data-contato': c.nome },
            CE.el('span', { class: 'cfg-app-icone' }, '👤'),
            CE.el('div', {}, CE.el('b', {}, c.nome), CE.el('small', {}, [c.empresa, c.telefone, c.email].filter(Boolean).join(' · '))),
            c.email ? CE.el('button', { class: 'botao secundario', 'data-escrever-contato': c.nome, onclick: () => { CE.janelas.abrir('email', { para: c.email }); CE.emitir('agenda:escrever', { nome: c.nome, email: c.email }); } }, '✉️ E-mail') : '',
            CE.el('button', { class: 'ag-apagar', title: 'Apagar contato', 'data-apagar-contato': c.nome, onclick: async () => {
              if (!await CE.confirmar(`Apagar o contato "${c.nome}"?`)) return;
              agenda.contatos = agenda.contatos.filter((x) => x !== c);
              await guardar(); CE.emitir('agenda:contato-apagado', { nome: c.nome }); desenhar();
            } }, '🗑️'))) : [CE.el('p', { class: 'arq-vazio' }, t ? 'Nenhum contato encontrado.' : 'Nenhum contato ainda. Clique em "➕ Novo contato".')]))];
      }
      function novoContato() {
        const campo = (id, ph, tipo = 'text') => CE.el('input', { class: 'campo', type: tipo, 'data-campo': id, placeholder: ph });
        const nome = campo('nome', 'Nome completo'), telefone = campo('telefone', '(69) 99999-0000', 'tel'), email = campo('email', 'nome@empresa.com.br', 'email'), empresa = campo('empresa', 'Empresa ou cargo (opcional)');
        const erro = CE.el('p', { class: 'login-erro em-claro' });
        const fundo = CE.el('div', { class: 'dialogo-fundo' }, CE.el('div', { class: 'dialogo' },
          CE.el('p', {}, '👤 Novo contato'),
          CE.el('label', {}, 'Nome', nome), CE.el('label', {}, 'Telefone', telefone), CE.el('label', {}, 'E-mail', email), CE.el('label', {}, 'Empresa', empresa), erro,
          CE.el('div', { class: 'dialogo-botoes' },
            CE.el('button', { class: 'botao secundario', onclick: () => fundo.remove() }, 'Cancelar'),
            CE.el('button', { class: 'botao', 'data-acao': 'salvar-contato', onclick: async () => {
              if (!nome.value.trim()) { erro.textContent = 'Escreva o nome.'; return; }
              if (email.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) { erro.textContent = 'O e-mail precisa ter @ e ponto, como maria@empresa.com.br.'; return; }
              const c = { nome: nome.value.trim(), telefone: telefone.value.trim(), email: email.value.trim().toLowerCase(), empresa: empresa.value.trim() };
              agenda.contatos.push(c);
              fundo.remove();
              await guardar();
              CE.emitir('agenda:contato', c);
              desenhar();
            } }, 'Salvar'))));
        document.body.append(fundo);
        nome.focus();
      }
      // Lembrete: a cada minuto, avisa os compromissos que estão chegando (uma vez cada).
      const avisados = new Set();
      const lembrar = setInterval(() => {
        const agora = CE.config ? CE.config.agora() : new Date();
        agenda.compromissos.forEach((c) => {
          if (!c.lembrete || !c.hora || avisados.has(c)) return;
          const quando = new Date(`${c.data}T${c.hora}`);
          const falta = (quando - agora) / 60000;
          if (falta > 0 && falta <= Number(c.lembrete)) { avisados.add(c); CE.avisar(`🔔 Lembrete: "${c.titulo}" ${falta < 60 ? `daqui a ${Math.round(falta)} minutos` : `em ${dataBR(c.data)} às ${c.hora}`}.`); CE.emitir('agenda:lembrete', { titulo: c.titulo }); }
        });
      }, 30000);
      corpo.classList.add('agenda');
      corpo.append(conteudo);
      carregar();
      return { aoFechar() { clearInterval(lembrar); return true; } };
    },
  });
})();
