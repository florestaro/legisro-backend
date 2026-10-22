// Frequência automática: o dia em que o aluno entra conta presença, e os minutos de uso de verdade
// (mouse ou teclado nos últimos 2 minutos, ou a tela pausada pelo instrutor) somam a carga horária.
// Fica no progresso do aluno: frequencia["2026-10-22"] = { entradas, minutos, primeira, ultima }.
// A data é a do relógio de verdade (a lição de Configurações deixa o aluno mudar só a hora "de treino").
window.CE = window.CE || {};

(function () {
  const MINUTO = 60 * 1000;
  let timer = null;
  let ultimoUso = 0;
  let pendentes = 0; // minutos contados e ainda não gravados

  const doisDigitos = (n) => String(n).padStart(2, '0');
  const diaDe = (d) => `${d.getFullYear()}-${doisDigitos(d.getMonth() + 1)}-${doisDigitos(d.getDate())}`;
  const hoje = () => diaDe(new Date());
  const ehAluno = () => CE.sessao.usuario && CE.sessao.usuario.papel !== 'instrutor';

  const marcarUso = () => { ultimoUso = Date.now(); };
  ['pointerdown', 'keydown', 'wheel', 'pointermove'].forEach((ev) => document.addEventListener(ev, marcarUso, { capture: true, passive: true }));

  function anotar(alterar) {
    const dia = hoje();
    return CE.sessao.atualizarProgresso((p) => {
      p.frequencia = p.frequencia || {};
      const d = (p.frequencia[dia] = p.frequencia[dia] || { entradas: 0, minutos: 0, primeira: Date.now() });
      alterar(d);
      d.ultima = Date.now();
    }).catch(() => {});
  }

  function contarMinuto() {
    const pausado = !!document.getElementById('tela-pausa');
    if (pausado || Date.now() - ultimoUso < 2 * MINUTO) pendentes++;
    if (pendentes >= 5) CE.frequencia.gravar();
  }

  CE.frequencia = {
    hoje,
    diaDe,
    iniciar() {
      clearInterval(timer);
      pendentes = 0;
      if (!ehAluno()) return;
      ultimoUso = Date.now();
      anotar((d) => { d.entradas++; });
      timer = setInterval(contarMinuto, MINUTO);
    },
    gravar() {
      if (!pendentes || !ehAluno()) return Promise.resolve();
      const m = pendentes;
      pendentes = 0;
      return anotar((d) => { d.minutos += m; });
    },
    // Ao sair: grava os minutos que faltam (a saída espera essa gravação).
    parar() {
      clearInterval(timer);
      timer = null;
      return CE.frequencia.gravar();
    },
    // Resumo de um período (datas "AAAA-MM-DD", inclusive): dias presentes e minutos.
    resumo(progresso, de = '0000-00-00', ate = '9999-99-99') {
      const dias = Object.entries(progresso.frequencia || {}).filter(([dia]) => dia >= de && dia <= ate);
      return { dias: dias.length, minutos: dias.reduce((s, [, d]) => s + (d.minutos || 0), 0), lista: dias.map(([dia]) => dia).sort() };
    },
  };
})();
