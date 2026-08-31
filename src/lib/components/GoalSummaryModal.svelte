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

<div class="fixed top-0 left-0 w-full h-full bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000] p-4"
     transition:fade on:click={() => dispatch('close')}>
  <div class="bg-white p-6 md:p-10 rounded-3xl w-full max-w-[450px] max-h-[90vh] overflow-y-auto text-center shadow-[0_20px_50px_rgba(0,0,0,0.2)]"
       transition:scale on:click|stopPropagation>
    <div class="text-4xl md:text-5xl block mb-4">🏆</div>
    <h2 class="m-0 font-bold text-warm-600 text-2xl">¡Objetivo Alcanzado!</h2>
    <p class="text-gray-500 my-2 mb-6">Has completado tus revisiones diarias</p>

    <div class="grid grid-cols-2 gap-4 mb-8">
      <div class="bg-gray-50 p-4 rounded-2xl flex flex-col">
        <span class="text-xs text-gray-400 uppercase tracking-wide">Revisadas</span>
        <span class="text-2xl font-extrabold text-warm-600">{sessionTotal}</span>
      </div>
      <div class="bg-gray-50 p-4 rounded-2xl flex flex-col">
        <span class="text-xs text-gray-400 uppercase tracking-wide">Aciertos</span>
        <span class="text-2xl font-extrabold text-warm-600">{sessionAccuracy.toFixed(0)}%</span>
      </div>
    </div>

    <div class="mb-8">
      <h3 class="text-base font-semibold text-warm-600 mb-4">Rendimiento Comparado</h3>
      <div bind:this={chartContainer} class="flex justify-center mb-4"></div>
      <p class="text-sm text-gray-600 bg-gray-100 p-4 rounded-xl">
        {#if sessionAccuracy > historyAccuracy}
          ¡Estás on fire! Hoy has rendido un <strong>{(sessionAccuracy - historyAccuracy).toFixed(1)}% mejor</strong> que de costumbre.
        {:else}
          Mantienes un ritmo sólido. ¡Sigue así!
        {/if}
      </p>
    </div>

    <div class="flex flex-col sm:flex-row gap-3 mt-4">
      <button class="flex-1 py-3 rounded-xl font-bold border-none cursor-pointer transition-all bg-gray-100 text-gray-500 hover:bg-gray-200"
              on:click={() => dispatch('home')}>Volver al inicio</button>
      <button class="flex-1 bg-dgt-500 text-white font-bold py-3 rounded-xl border-none cursor-pointer transition-all hover:bg-dgt-600 hover:-translate-y-0.5"
              on:click={() => dispatch('close')}>Seguir practicando</button>
    </div>
  </div>
</div>
