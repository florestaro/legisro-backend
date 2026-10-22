// Pen drive simulado: um ícone na barra de tarefas conecta e remove o pen drive.
// Os arquivos do pen drive ficam guardados com os do aluno (local 'pendrive'), como se o pen drive fosse dele.
window.CE = window.CE || {};

(function () {
  let conectado = false;

  function desenharIcone() {
    const icone = document.getElementById('status-pendrive');
    if (!icone) return;
    icone.textContent = conectado ? '💾' : '🔌';
    icone.classList.toggle('conectado', conectado);
    icone.title = conectado ? 'Pen drive conectado. Para tirar, use "Remover com segurança" no programa Arquivos.' : 'Clique para conectar o pen drive';
  }

  CE.pendrive = {
    get conectado() { return conectado; },
    conectar() {
      if (conectado) return;
      conectado = true;
      desenharIcone();
      CE.avisar('💾 Pen drive conectado! Ele aparece no programa Arquivos.');
      CE.emitir('pendrive:conectado');
    },
    remover() {
      if (!conectado) return;
      conectado = false;
      desenharIcone();
      CE.avisar('✅ Pode tirar o pen drive com segurança.');
      CE.emitir('pendrive:removido');
    },
    reiniciar() { conectado = false; desenharIcone(); },
  };

  document.addEventListener('DOMContentLoaded', () => {
    const icone = document.getElementById('status-pendrive');
    if (icone) icone.addEventListener('click', () => {
      if (conectado) CE.avisar('Para tirar o pen drive, abra o programa Arquivos e clique em "Remover com segurança".');
      else CE.pendrive.conectar();
    });
    desenharIcone();
  });
})();
