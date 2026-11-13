// Jornal da turma, do lado da tela: o aluno manda a matéria pelo Editor de Texto ("📰 Jornal") e o instrutor monta
// o jornal no Painel (aba 🏁 Gincana, missão e jornal), com os destaques da semana calculados sozinhos.
// O HTML das matérias passa por um filtro: só formatação e imagens; nada de código (a matéria de um aluno nunca
// roda nada no computador do instrutor).
window.CE = window.CE || {};

(function () {
  const PERMITIDAS = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'H1', 'H2', 'H3', 'P', 'DIV', 'BR', 'UL', 'OL', 'LI', 'SPAN', 'IMG', 'TABLE', 'TBODY', 'TR', 'TD', 'TH', 'SUP', 'BLOCKQUOTE', 'FONT', 'HR']);
  // Estilos que ficam: só os de formatação do texto (nada de posição, tamanho da tela ou camadas: a matéria não cobre
  // a tela do instrutor).
  const ESTILOS = new Set(['color', 'background-color', 'font-size', 'font-family', 'font-weight', 'font-style', 'text-decoration', 'text-align', 'line-height', 'text-indent',
    'margin-left', 'margin-right', 'margin-top', 'margin-bottom', 'padding', 'width', 'max-width', 'height', 'border', 'border-collapse', 'vertical-align', 'column-count', 'column-gap']);
  const TAMANHOS = new Set(['width', 'height', 'max-width']);
  function estiloSeguro(valor) {
    return String(valor).split(';')
      .map((d) => { const i = d.indexOf(':'); return i > 0 ? [d.slice(0, i).trim().toLowerCase(), d.slice(i + 1).trim()] : null; })
      .filter((d) => d && ESTILOS.has(d[0]) && /^[\w\s.,%#()'"-]*$/.test(d[1]) && !/url|expression|javascript|var\(|calc\(|vw|vh/i.test(d[1])
        && (!TAMANHOS.has(d[0]) || /^\d{1,4}(px|%)?$/.test(d[1])))
      .map(([k, v]) => `${k}: ${v}`).join('; ');
  }
  const PERIGOSAS = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'SVG', 'MATH', 'LINK', 'META', 'BASE', 'FORM', 'INPUT', 'BUTTON', 'TEXTAREA', 'SELECT', 'TEMPLATE', 'NOSCRIPT']);
  function limpar(html) {
    const doc = new DOMParser().parseFromString(`<div>${String(html || '')}</div>`, 'text/html');
    const raiz = doc.body.firstElementChild || doc.createElement('div');
    (function percorrer(no) {
      [...no.childNodes].forEach((f) => {
        if (f.nodeType === 3) return;
        if (f.nodeType !== 1 || PERIGOSAS.has(f.tagName)) { f.remove(); return; }
        if (!PERMITIDAS.has(f.tagName)) { percorrer(f); f.replaceWith(...f.childNodes); return; }
        [...f.attributes].forEach((a) => {
          const n = a.name.toLowerCase();
          if (n === 'style') { const e = estiloSeguro(a.value); if (e) f.setAttribute('style', e); else f.removeAttribute('style'); return; }
          const ok = (f.tagName === 'IMG' && n === 'src' && /^data:image\/(png|jpe?g|gif|webp);base64,[a-z0-9+/=\s]+$/i.test(a.value))
            || (f.tagName === 'FONT' && n === 'size' && /^\d$/.test(a.value)) || (f.tagName === 'IMG' && n === 'alt');
          if (!ok) f.removeAttribute(a.name);
        });
        percorrer(f);
      });
    })(raiz);
    return raiz.innerHTML;
  }

  // Do Editor de Texto: pergunta o título, mostra as matérias já enviadas e manda.
  async function enviarDoEditor({ titulo, html }) {
    if (!CE.sessao.usuario) return;
    const minhas = await CE.api.chamar('jornal:minhas').catch(() => []);
    const situacao = { enviada: '⏳ esperando o professor', aprovada: '✅ aprovada', recusada: '✏️ o professor pediu para melhorar', publicada: '📰 publicada' };
    const campo = CE.el('input', { class: 'campo', 'data-campo': 'titulo-materia', value: titulo || '' });
    const fundo = CE.el('div', { class: 'dialogo-fundo' }, CE.el('div', { class: 'dialogo' },
      CE.el('h3', {}, '📰 Mandar para o jornal da turma'),
      CE.el('p', {}, 'O professor lê a sua matéria e, se aprovar, ela sai no próximo jornal da turma, com o seu nome.'),
      CE.el('label', {}, 'Título da matéria', campo),
      minhas.length ? CE.el('div', { class: 'jornal-minhas' }, CE.el('strong', {}, 'Suas matérias:'), ...minhas.slice(-5).map((m) => CE.el('small', { 'data-minha-materia': m.status }, `• ${m.titulo} — ${situacao[m.status] || m.status}`))) : '',
      CE.el('div', { class: 'dialogo-botoes' },
        CE.el('button', { class: 'botao secundario', onclick: () => fundo.remove() }, 'Cancelar'),
        CE.el('button', { class: 'botao', 'data-acao': 'confirmar-jornal', onclick: async () => {
          try {
            const m = await CE.api.chamar('jornal:enviar', { titulo: campo.value, html });
            fundo.remove();
            CE.emitir('jornal:enviada', { titulo: m.titulo, edicao: m.edicao });
            CE.avisar(`📰 Matéria "${m.titulo}" enviada para o jornal! O professor vai ler.`);
            // Conta no progresso do aluno (fica no servidor da sala: vale em qualquer computador) e confere as medalhas.
            CE.sessao.atualizarProgresso((p) => { p.jornal = p.jornal || {}; p.jornal.enviadas = (p.jornal.enviadas || 0) + 1; })
              .then(() => CE.emitir('jornal:registrada', {})).catch(() => {});
          } catch (e) { CE.avisar('⚠️ ' + e.message); }
        } }, 'Enviar'))));
    document.body.append(fundo);
    campo.focus();
  }

  // ---------- Montar o jornal (para imprimir ou salvar em PDF) ----------
  const SEMANA = 7 * 86400000;
  function destaques(alunos, ultimaGincana) {
    const agora = Date.now(), lista = [];
    alunos.forEach(({ usuario, progresso: p }) => {
      CE.certificados.cursos().forEach((c) => {
        const s = c.situacao(p);
        if (s.conquistado && !s.dispensado && agora - s.em < SEMANA) lista.push(`🎓 ${usuario.nome} concluiu ${c.curso} — ${c.nivel}!`);
      });
    });
    const medalhas = alunos.flatMap(({ usuario, progresso: p }) => Object.entries(p.medalhas || {}).filter(([, em]) => agora - em < SEMANA).map(([id]) => ({ nome: usuario.nome, m: CE.MEDALHAS.find((x) => x.id === id) }))).filter((x) => x.m);
    const porAluno = {};
    medalhas.forEach(({ nome, m }) => { (porAluno[nome] = porAluno[nome] || []).push(`${m.icone} ${m.nome}`); });
    Object.entries(porAluno).slice(0, 6).forEach(([nome, ms]) => lista.push(`🏅 ${nome} ganhou: ${ms.slice(0, 3).join(', ')}${ms.length > 3 ? ` e mais ${ms.length - 3}` : ''}.`));
    const recorde = alunos.map(({ usuario, progresso: p }) => ({ nome: usuario.nome, ppm: Math.max(0, ...Object.entries(p.digitacao || {}).filter(([k]) => !k.startsWith('_')).map(([, r]) => (r && r.aprovado && r.ppm) || 0)) })).sort((a, b) => b.ppm - a.ppm)[0];
    if (recorde && recorde.ppm > 0) lista.push(`⌨️ Mais rápido da turma no teclado: ${recorde.nome}, com ${recorde.ppm} palavras por minuto.`);
    const missao = CE.missao ? CE.missao.atual() : null;
    const cumpriram = missao ? alunos.filter(({ progresso: p }) => CE.missao.situacao(p).feita).map(({ usuario }) => usuario.nome) : [];
    if (missao) lista.push(`🎯 Missão da semana (${missao.titulo}): ${cumpriram.length ? `cumprida por ${cumpriram.join(', ')}` : 'ainda ninguém cumpriu. Quem vai ser o primeiro?'}.`);
    if (ultimaGincana && ultimaGincana.podio && ultimaGincana.podio.length && agora - ultimaGincana.em < SEMANA * 2) {
      lista.push(`🏆 ${ultimaGincana.titulo}: ${ultimaGincana.podio.map((p, i) => `${['🥇', '🥈', '🥉'][i]} ${p.nome}`).join(' ')}${ultimaGincana.equipes && ultimaGincana.equipes.length ? ` · Equipe campeã: ${ultimaGincana.equipes[0].nome}` : ''}.`);
    }
    return lista;
  }
  function paginas({ jornal, escola, destaques: itens, materias }) {
    const data = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
    const cabeca = CE.el('div', { class: 'jn-cabeca' },
      CE.el('div', { class: 'jn-nome' }, '📰 JORNAL DA TURMA'),
      CE.el('div', { class: 'jn-linha' }, CE.el('span', {}, escola.nome || 'Computador Escola'), CE.el('span', {}, `Edição nº ${jornal.edicao}`), CE.el('span', {}, data)));
    const caixa = CE.el('div', { class: 'jn-destaques' }, CE.el('h3', {}, '⭐ Destaques da semana'),
      itens.length ? CE.el('ul', {}, ...itens.map((t) => CE.el('li', {}, t))) : CE.el('p', {}, 'Nesta semana, todo mundo está estudando firme!'));
    const materia = (m) => {
      const texto = CE.el('div', { class: 'jn-texto', html: limpar(m.html) });
      // O título do texto já vira o título da matéria: não sai repetido.
      const primeiro = texto.firstElementChild;
      if (primeiro && /^H[1-3]$/.test(primeiro.tagName) && primeiro.textContent.trim().toLowerCase() === String(m.titulo).trim().toLowerCase()) primeiro.remove();
      return CE.el('article', { class: 'jn-materia', 'data-materia-jornal': m.titulo }, CE.el('h2', {}, m.titulo), CE.el('p', { class: 'jn-autor' }, `por ${m.autor}${m.turma ? ` (turma ${m.turma})` : ''}`), texto);
    };
    const lista = [];
    const primeira = CE.el('div', { class: 'pagina jornal' }, cabeca, caixa, CE.el('div', { class: 'jn-colunas' }, ...materias.slice(0, 2).map(materia)));
    lista.push(primeira);
    for (let i = 2; i < materias.length; i += 3) {
      lista.push(CE.el('div', { class: 'pagina jornal' }, CE.el('div', { class: 'jn-linha pequena' }, CE.el('span', {}, '📰 Jornal da Turma'), CE.el('span', {}, `Edição nº ${jornal.edicao}`)),
        CE.el('div', { class: 'jn-colunas' }, ...materias.slice(i, i + 3).map(materia))));
    }
    if (!materias.length) primeira.append(CE.el('p', { class: 'jn-vazio' }, 'Ainda não há matérias aprovadas nesta edição. Peça para a turma mandar textos pelo Editor de Texto (botão 📰 Jornal)!'));
    return lista;
  }

  CE.jornal = { limpar, enviarDoEditor, destaques, paginas };
})();
