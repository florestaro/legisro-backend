// Voz do professor, usando as vozes instaladas no próprio Windows (funciona sem internet).
// No Windows 10 em português, a voz "Microsoft Maria" já vem instalada.
window.CE = window.CE || {};

(function () {
  const sintese = window.speechSynthesis;
  let ligada = true;
  let vozEscolhida = null;

  function escolherVoz() {
    if (!sintese) return;
    const vozes = sintese.getVoices();
    vozEscolhida =
      vozes.find((v) => v.lang === 'pt-BR' && v.localService) ||
      vozes.find((v) => v.lang && v.lang.startsWith('pt')) ||
      null;
  }

  if (sintese) {
    escolherVoz();
    sintese.addEventListener && sintese.addEventListener('voiceschanged', escolherVoz);
  }

  // Tira emojis e marcações para a voz não ler "carinha sorrindo".
  function limpar(texto) {
    return String(texto).replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').replace(/[*_#"]/g, '');
  }

  CE.voz = {
    falar(texto) {
      if (!ligada || !sintese) return;
      sintese.cancel();
      const fala = new SpeechSynthesisUtterance(limpar(texto));
      fala.lang = 'pt-BR';
      fala.rate = 0.95;
      if (vozEscolhida) fala.voice = vozEscolhida;
      sintese.speak(fala);
    },
    parar() { sintese && sintese.cancel(); },
    get ligada() { return ligada; },
    alternar() { ligada = !ligada; if (!ligada) this.parar(); return ligada; },
  };
})();
