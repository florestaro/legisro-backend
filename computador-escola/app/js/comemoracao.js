// Confetes na tela quando o aluno conclui uma aula ou passa numa prova.
window.CE = window.CE || {};

(function () {
  const CORES = ['#e81123', '#ffb900', '#107c10', '#0067c0', '#8e44ad', '#ff8c00'];

  CE.comemorar = function (tamanho = 'pequena') {
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const tela = document.createElement('canvas');
    tela.className = 'confetes';
    tela.width = innerWidth;
    tela.height = innerHeight;
    document.body.append(tela);
    const ctx = tela.getContext('2d');
    const quantidade = tamanho === 'grande' ? 260 : 120;
    const pedacos = Array.from({ length: quantidade }, () => ({
      x: innerWidth / 2 + (Math.random() - 0.5) * 200,
      y: innerHeight * 0.55,
      vx: (Math.random() - 0.5) * 16,
      vy: -8 - Math.random() * 12,
      giro: Math.random() * Math.PI,
      vgiro: (Math.random() - 0.5) * 0.3,
      cor: CORES[Math.floor(Math.random() * CORES.length)],
      tam: 6 + Math.random() * 8,
    }));
    const inicio = performance.now();
    function quadro(agora) {
      ctx.clearRect(0, 0, tela.width, tela.height);
      pedacos.forEach((p) => {
        p.vy += 0.35; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.giro += p.vgiro;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.giro);
        ctx.fillStyle = p.cor;
        ctx.fillRect(-p.tam / 2, -p.tam / 4, p.tam, p.tam / 2);
        ctx.restore();
      });
      if (agora - inicio < 3500) requestAnimationFrame(quadro); else tela.remove();
    }
    requestAnimationFrame(quadro);
  };
})();
