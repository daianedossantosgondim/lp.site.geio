/**
 * GEIO Calculator Module - Heavy logic separated for lazy loading
 * Only loads when calculator section is visible
 */

const GEIOCalculator = (() => {
  // ===== CALCULATOR STATE =====
  const state = {
    retrabalhoPct: 0,
    shadowITPct: 0,
    margemAtual: 0,
    revenuaMensal: 0,
    resultado: null
  };

  // ===== CALCULATION ENGINE =====
  const calculate = {
    performCalculation(inputs) {
      // Heavy calculation - runs only once when needed
      const perda = this.calcularPerda(inputs);
      const impacto = this.calcularImpacto(perda);
      return {
        perda,
        impacto,
        roi: this.calcularROI(impacto)
      };
    },

    calcularPerda(inputs) {
      // Simplified heavy calculation
      const retrabalho = inputs.revenue * (inputs.retrabalho / 100);
      const shadow = inputs.revenue * (inputs.shadow / 100);
      return retrabalho + shadow;
    },

    calcularImpacto(perda) {
      return {
        diaria: perda / 30,
        semanal: perda / 4,
        mensal: perda,
        anual: perda * 12
      };
    },

    calcularROI(impacto) {
      const investimento = 12000; // Consultoria estruturada
      return (impacto.mensal / investimento) * 100;
    }
  };

  // ===== UI RENDERING (Batched updates) =====
  const render = {
    updateResults(resultado) {
      // Use requestAnimationFrame to batch DOM updates
      requestAnimationFrame(() => {
        const elements = {
          diaria: document.getElementById('perda-diaria'),
          mensal: document.getElementById('perda-mensal'),
          anual: document.getElementById('perda-anual'),
          roi: document.getElementById('roi-value')
        };

        if (elements.diaria) elements.diaria.textContent = this.formatCurrency(resultado.impacto.diaria);
        if (elements.mensal) elements.mensal.textContent = this.formatCurrency(resultado.impacto.mensal);
        if (elements.anual) elements.anual.textContent = this.formatCurrency(resultado.impacto.anual);
        if (elements.roi) elements.roi.textContent = resultado.roi.toFixed(0) + '%';
      });
    },

    formatCurrency(value) {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 0
      }).format(value);
    }
  };

  // ===== EVENT HANDLING (Debounced input) =====
  const events = {
    init() {
      const inputRetrabalho = document.getElementById('retrabalho-input');
      const inputShadow = document.getElementById('shadow-input');
      const inputRevenue = document.getElementById('revenue-input');
      const btnCalcular = document.getElementById('btn-calcular');

      if (!inputRetrabalho || !inputRevenue) {
        console.warn('[Calculator] Input elements not found');
        return;
      }

      const debouncedCalc = this.debounce(() => this.handleCalculate(), 300);

      inputRetrabalho?.addEventListener('input', debouncedCalc);
      inputShadow?.addEventListener('input', debouncedCalc);
      inputRevenue?.addEventListener('input', debouncedCalc);
      btnCalcular?.addEventListener('click', () => this.handleCalculate());
    },

    debounce(fn, wait) {
      let timeoutId = null;
      return function() {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(fn.bind(this), wait);
      };
    },

    handleCalculate() {
      const inputs = {
        retrabalho: parseFloat(document.getElementById('retrabalho-input')?.value || 15),
        shadow: parseFloat(document.getElementById('shadow-input')?.value || 10),
        revenue: parseFloat(document.getElementById('revenue-input')?.value || 100000)
      };

      if (inputs.revenue <= 0) {
        console.warn('[Calculator] Invalid input');
        return;
      }

      const resultado = calculate.performCalculation(inputs);
      render.updateResults(resultado);
      state.resultado = resultado;
    }
  };

  // ===== INITIALIZATION =====
  const init = () => {
    console.log('[Calculator] Module loaded');
    events.init();
  };

  return {
    init,
    calculate,
    render,
    state
  };
})();

// Initialize when window loads or on demand
if (document.readyState === 'complete') {
  GEIOCalculator.init();
} else {
  window.addEventListener('load', () => GEIOCalculator.init(), { once: true });
}
