<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { fade, scale } from 'svelte/transition';
  import * as d3 from 'd3';

  export let sessionResults: { correct: boolean, quality: number }[] = [];
  export let totalHistoryCount: number = 0;
  export let historyAccuracy: number = 0;

  const dispatch = createEventDispatcher();

  let chartContainer: HTMLElement;

  const sessionTotal = sessionResults.length;
  const sessionCorrect = sessionResults.filter(r => r.correct).length;
  const sessionAccuracy = sessionTotal > 0 ? (sessionCorrect / sessionTotal) * 100 : 0;

  onMount(() => {
    renderChart();
  });

  function renderChart() {
    if (!chartContainer) return;
    
    const data = [
      { label: 'Histórico', value: historyAccuracy, color: '#64748b' },
      { label: 'Sesión Hoy', value: sessionAccuracy, color: '#8fb339' }
    ];

    const width = 300;
    const height = 200;
    const margin = { top: 20, right: 20, bottom: 40, left: 40 };

    d3.select(chartContainer).selectAll("*").remove();

    const svg = d3.select(chartContainer)
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    const x = d3.scaleBand()
      .range([margin.left, width - margin.right])
      .domain(data.map(d => d.label))
      .padding(0.4);

    const y = d3.scaleLinear()
      .range([height - margin.bottom, margin.top])
      .domain([0, 100]);

    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x));

    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(5).tickFormat(d => d + "%"));

    svg.selectAll("rect")
      .data(data)
      .enter()
      .append("rect")
      .attr("x", d => x(d.label)!)
      .attr("y", d => y(d.value))
      .attr("width", x.bandwidth())
      .attr("height", d => (height - margin.bottom) - y(d.value))
      .attr("fill", d => d.color)
      .attr("rx", 4);
  }
</script>

<div class="modal-backdrop" transition:fade on:click={() => dispatch('close')}>
  <div class="modal-content" transition:scale on:click|stopPropagation>
    <div class="header">
      <span class="icon">🏆</span>
      <h2>¡Objetivo Alcanzado!</h2>
      <p>Has completado tus revisiones diarias</p>
    </div>

    <div class="stats-grid">
      <div class="stat-item">
        <span class="label">Revisadas</span>
        <span class="value">{sessionTotal}</span>
      </div>
      <div class="stat-item">
        <span class="label">Aciertos</span>
        <span class="value">{sessionAccuracy.toFixed(0)}%</span>
      </div>
    </div>

    <div class="chart-section">
      <h3>Rendimiento Comparado</h3>
      <div bind:this={chartContainer} class="chart-canvas"></div>
      <p class="insight">
        {#if sessionAccuracy > historyAccuracy}
          ¡Estás on fire! Hoy has rendido un <strong>{(sessionAccuracy - historyAccuracy).toFixed(1)}% mejor</strong> que de costumbre.
        {:else}
          Mantienes un ritmo sólido. ¡Sigue así!
        {/if}
      </p>
    </div>

    <div class="actions">
      <button class="secondary-btn" on:click={() => dispatch('home')}>Volver al inicio</button>
      <button class="primary-btn" on:click={() => dispatch('close')}>Seguir practicando</button>
    </div>
  </div>
</div>

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.6);
    backdrop-filter: blur(4px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .modal-content {
    background: white;
    padding: 2.5rem;
    border-radius: 24px;
    width: 90%;
    max-width: 450px;
    text-align: center;
    box-shadow: 0 20px 50px rgba(0,0,0,0.2);
  }

  .icon { font-size: 3rem; display: block; margin-bottom: 1rem; }
  h2 { margin: 0; color: #5c4b37; }
  p { color: #64748b; margin: 0.5rem 0 1.5rem; }

  .stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .stat-item {
    background: #f8fafc;
    padding: 1rem;
    border-radius: 16px;
    display: flex;
    flex-direction: column;
  }

  .stat-item .label { font-size: 0.8rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
  .stat-item .value { font-size: 1.5rem; font-weight: 800; color: #5c4b37; }

  .chart-section {
    margin-bottom: 2rem;
  }

  .chart-section h3 { font-size: 1rem; color: #5c4b37; margin-bottom: 1rem; }

  .chart-canvas {
    display: flex;
    justify-content: center;
    margin-bottom: 1rem;
  }

  .insight {
    font-size: 0.9rem;
    color: #475569;
    background: #f1f5f9;
    padding: 1rem;
    border-radius: 12px;
  }

  .actions {
    display: flex;
    gap: 1rem;
    margin-top: 1rem;
  }

  .primary-btn, .secondary-btn {
    flex: 1;
    padding: 1rem;
    border: none;
    border-radius: 12px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
  }

  .primary-btn {
    background: #8fb339;
    color: white;
  }

  .primary-btn:hover {
    background: #7a9a30;
    transform: translateY(-2px);
  }

  .secondary-btn {
    background: #f1f5f9;
    color: #64748b;
  }

  .secondary-btn:hover {
    background: #e2e8f0;
    color: #475569;
  }
</style>
