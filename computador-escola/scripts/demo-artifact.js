// Só na demonstração publicada no Claude (o gerador da demo acrescenta este arquivo no fim).
// Lá a página não baixa arquivos sozinha: a planilha (CSV) e a versão para imprimir do certificado e do relatório
// passam pelo "downloads" do Claude, que pergunta ao visitante antes de salvar. Fora do Claude, nada muda.
(function () {
  if (!window.claude || typeof window.claude.use !== 'function') return;
  const pronto = window.claude.use('downloads').catch(() => null);
  const salvar = async (filename, data) => {
    const downloads = await pronto;
    if (!downloads) return null;
    try { await downloads.save({ filename, data }); return filename; } catch (e) {
      if (e && e.code === 'declined') return null;
      throw new Error('Não deu para baixar o arquivo aqui.');
    }
  };

  const chamarOriginal = CE.api.chamar;
  CE.api.chamar = async (canal, ...args) => {
    if (canal === 'arquivo:salvar-texto' && await pronto) {
      const { nome, conteudo } = args[0] || {};
      return salvar(nome || 'arquivo.csv', String(conteudo || ''));
    }
    return chamarOriginal(canal, ...args);
  };

  // Na prévia de impressão: "⬇️ Baixar para imprimir" (um HTML com as páginas; no navegador, Ctrl+P imprime ou
  // salva em PDF).
  const imprimirOriginal = CE.imprimir;
  CE.imprimir = function (opcoes) {
    const area = imprimirOriginal(opcoes);
    pronto.then((downloads) => {
      if (!downloads || !area.isConnected) return;
      const barra = area.querySelector('.impressao-barra');
      const botao = CE.el('button', { class: 'botao', 'data-acao': 'baixar-impressao', onclick: async () => {
        const estilos = [...document.querySelectorAll('style')].map((s) => s.textContent).join('\n');
        const paginas = area.querySelector('.impressao-paginas').innerHTML;
        const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${CE.escapar(opcoes.titulo)}</title><style>${estilos}</style></head><body>`
          + `<div id="area-impressao" class="${area.className}"><div class="impressao-barra"><strong>${CE.escapar(opcoes.titulo)}</strong>`
          + '<span class="impressao-total">Para imprimir ou salvar em PDF: aperte Ctrl+P</span></div>'
          + `<div class="impressao-paginas">${paginas}</div></div></body></html>`;
        try {
          const nome = await salvar(String(opcoes.nomeArquivo || 'documento.pdf').replace(/\.pdf$/i, '') + '.html', html);
          if (nome) CE.avisar('⬇️ Arquivo baixado. Abra no navegador e aperte Ctrl+P para imprimir ou salvar em PDF.');
        } catch (e) { CE.avisar(e.message); }
      } }, '⬇️ Baixar para imprimir');
      barra.insertBefore(botao, barra.querySelector('[data-acao="fechar-impressao"]'));
    });
    return area;
  };
})();
