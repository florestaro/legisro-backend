// Central de eventos: os programas avisam o que o aluno fez ("abriu o editor", "deixou em negrito")
// e o motor de lições escuta para saber se a tarefa foi cumprida.
window.CE = window.CE || {};

(function () {
  const ouvintes = {};

  CE.ouvir = function (nome, funcao) {
    (ouvintes[nome] = ouvintes[nome] || []).push(funcao);
    return () => { ouvintes[nome] = ouvintes[nome].filter((f) => f !== funcao); };
  };

  CE.emitir = function (nome, dados = {}) {
    [...(ouvintes[nome] || []), ...(ouvintes['*'] || [])].forEach((f) => {
      try { f(dados, nome); } catch (erro) { console.error(erro); }
    });
  };

  // Pequenos utilitários usados em todo o programa.
  CE.el = function (tag, atributos = {}, ...filhos) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(atributos)) {
      if (k === 'class') e.className = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else if (k === 'html') e.innerHTML = v;
      else if (v !== false && v != null) e.setAttribute(k, v === true ? '' : v);
    }
    filhos.flat().forEach((f) => f != null && e.append(f.nodeType ? f : document.createTextNode(f)));
    return e;
  };

  CE.escapar = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
})();
