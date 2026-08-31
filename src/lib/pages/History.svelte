<script lang="ts">
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { db, type HistoryEntry } from '../db';
  import { exams, attempts, stats } from '../stores';
  import * as d3 from 'd3';
  
  let history: HistoryEntry[] = [];
  let activeTab: 'anki' | 'exams' | 'summary' = 'anki';
  
  let ankiChartContainer: HTMLElement;
  let examChartContainer: HTMLElement;

  // Pagination for Anki
  let ankiPage = 0;
  const pageSize = 20;

  onMount(async () => {
    await loadHistory();
  });

  async function loadHistory() {
    const rawHistory = await db.history.orderBy('date').reverse().toArray();
    history = rawHistory.map(h => ({ ...h, date: new Date(h.date) }));
    
    if (activeTab === 'anki') renderAnkiChart();
    if (activeTab === 'exams') renderExamChart();
  }

  $: if (activeTab === 'anki' && ankiChartContainer) {
    setTimeout(renderAnkiChart, 0);
  }
  $: if (activeTab === 'exams' && examChartContainer) {
    setTimeout(renderExamChart, 0);
  }

  function renderAnkiChart() {
    const ankiHistory = history.filter(h => h.type === 'anki');
    if (!ankiChartContainer || ankiHistory.length === 0) return;
    
    const dataByDate = d3.group(ankiHistory, d => d.date.toISOString().split('T')[0]);
    const chartData = Array.from(dataByDate, ([date, entries]) => ({
      date,
      count: entries.length,
      correct: entries.filter(e => e.correct).length
    })).reverse();

    drawBarsAndLine(ankiChartContainer, chartData, "#8fb339", "#5c4b37");
  }

  function renderExamChart() {
    const finishedAttempts = $attempts.filter(a => a.completed);
    if (!examChartContainer || finishedAttempts.length === 0) return;
    
    const chartData = finishedAttempts.slice().reverse().map(a => ({
      date: new Date(a.date).toLocaleDateString(),
      score: a.score,
      total: a.total
    }));

    const margin = { top: 20, right: 30, bottom: 40, left: 40 };
    const width = examChartContainer.clientWidth - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    d3.select(examChartContainer).selectAll("*").remove();

    const svg = d3.select(examChartContainer)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
      .range([0, width])
      .domain(chartData.map(d => d.date))
      .padding(0.2);

    const y = d3.scaleLinear()
      .domain([0, 30])
      .range([height, 0]);

    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x));

    svg.append("g")
      .call(d3.axisLeft(y));

    // Area
    const area = d3.area<any>()
      .x(d => (x(d.date) || 0) + x.bandwidth() / 2)
      .y0(height)
      .y1(d => y(d.score));

    svg.append("path")
      .datum(chartData)
      .attr("fill", "#3b82f633")
      .attr("d", area);

    // Line
    const line = d3.line<any>()
      .x(d => (x(d.date) || 0) + x.bandwidth() / 2)
      .y(d => y(d.score));

    svg.append("path")
      .datum(chartData)
      .attr("fill", "none")
      .attr("stroke", "#3b82f6")
      .attr("stroke-width", 3)
      .attr("d", line);

    // Points (Circles) - Always visible even for single points
    svg.selectAll(".dot")
      .data(chartData)
      .enter().append("circle")
      .attr("class", "dot")
      .attr("cx", d => (x(d.date) || 0) + x.bandwidth() / 2)
      .attr("cy", d => y(d.score))
      .attr("r", 5)
      .attr("fill", "#3b82f6")
      .attr("stroke", "#fff")
      .attr("stroke-width", 2);

    // Threshold line (27)
    svg.append("line")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", y(27))
      .attr("y2", y(27))
      .attr("stroke", "#ef4444")
      .attr("stroke-dasharray", "4,4")
      .attr("stroke-width", 1);
  }

  function drawBarsAndLine(container: HTMLElement, data: any[], barColor: string, lineColor: string) {
    const margin = { top: 20, right: 30, bottom: 40, left: 40 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    d3.select(container).selectAll("*").remove();

    const svg = d3.select(container)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
      .range([0, width])
      .domain(data.map(d => d.date))
      .padding(0.2);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => (d.count as number)) || 10])
      .range([height, 0]);

    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x));

    svg.append("g")
      .call(d3.axisLeft(y));

    // Bars
    svg.selectAll(".bar")
      .data(data)
      .enter().append("rect")
      .attr("class", "bar")
      .attr("x", d => x(d.date) || 0)
      .attr("width", x.bandwidth())
      .attr("y", d => y(d.count))
      .attr("height", d => height - y(d.count))
      .attr("fill", barColor)
      .attr("opacity", 0.5);

    // Line
    const line = d3.line<any>()
      .x(d => (x(d.date) || 0) + x.bandwidth() / 2)
      .y(d => y(d.correct));

    svg.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", lineColor)
      .attr("stroke-width", 2)
      .attr("d", line);

    // Dots
    svg.selectAll(".dot")
      .data(data)
      .enter().append("circle")
      .attr("cx", d => (x(d.date) || 0) + x.bandwidth() / 2)
      .attr("cy", d => y(d.correct))
      .attr("r", 4)
      .attr("fill", lineColor);
  }

  $: paginatedAnki = history
    .filter(h => h.type === 'anki')
    .slice(ankiPage * pageSize, (ankiPage + 1) * pageSize);

  $: totalAnkiPages = Math.ceil(history.filter(h => h.type === 'anki').length / pageSize);

  function getGlobalSummary() {
    const totalAnki = history.filter(h => h.type === 'anki').length;
    const correctAnki = history.filter(h => h.type === 'anki' && h.correct).length;
    const ankiAccuracy = totalAnki > 0 ? (correctAnki / totalAnki) * 100 : 0;
    
    return { 
      totalAnki, 
      ankiAccuracy, 
      totalExams: $stats.totalExams, 
      examPassRate: $stats.passRate, 
      avgExamScore: $stats.avgScore 
    };
  }
</script>

<div class="history-page">
  <div class="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-6">
    <h2 class="text-2xl font-bold text-warm-600">Historial de Actividad</h2>
    <div class="inline-flex bg-gray-100 p-1 rounded-xl gap-1 w-full md:w-auto overflow-x-auto scrollbar-hide">
      <button class="flex-1 md:flex-none px-4 py-2 border-none rounded-lg cursor-pointer font-semibold transition-all
                     bg-transparent text-gray-500
                     {activeTab === 'anki' ? 'bg-white text-warm-600 shadow-[0_2px_4px_rgba(0,0,0,0.05)]' : ''}"
              on:click={() => activeTab = 'anki'}>Anki</button>
      <button class="flex-1 md:flex-none px-4 py-2 border-none rounded-lg cursor-pointer font-semibold transition-all
                     bg-transparent text-gray-500
                     {activeTab === 'exams' ? 'bg-white text-warm-600 shadow-[0_2px_4px_rgba(0,0,0,0.05)]' : ''}"
              on:click={() => activeTab = 'exams'}>Exámenes</button>
      <button class="flex-1 md:flex-none px-4 py-2 border-none rounded-lg cursor-pointer font-semibold transition-all
                     bg-transparent text-gray-500
                     {activeTab === 'summary' ? 'bg-white text-warm-600 shadow-[0_2px_4px_rgba(0,0,0,0.05)]' : ''}"
              on:click={() => activeTab = 'summary'}>Resumen</button>
    </div>
  </div>

  {#if activeTab === 'anki'}
    <div class="tab-content" in:fade>
      <div class="bg-white p-4 md:p-6 rounded-3xl mb-8 shadow-[0_4px_15px_rgba(0,0,0,0.05)]">
        <h3 class="font-semibold text-warm-600 mb-2">Evolución de Aciertos Anki</h3>
        <div bind:this={ankiChartContainer} class="w-full h-[300px]"></div>
        <p class="flex flex-wrap justify-center gap-4 text-sm mt-4">
          <span class="flex items-center gap-1.5"><span class="inline-block w-5 h-2.5 bg-dgt-500/50 rounded"></span> Preguntas respondidas</span>
          <span class="flex items-center gap-1.5"><span class="inline-block w-5 h-0.5 bg-warm-600"></span> Aciertos</span>
        </p>
      </div>

      <div class="list-section">
        <h3 class="font-semibold text-warm-600 mb-4">Histórico de Preguntas</h3>
        <div class="bg-white rounded-2xl overflow-hidden shadow-[0_4px_15px_rgba(0,0,0,0.05)]">
          {#each paginatedAnki as entry}
            <div class="flex justify-between items-center gap-3 px-3 py-3 md:p-4 border-b border-gray-50">
              <span class="text-sm text-gray-500">{entry.date.toLocaleString()}</span>
              <span class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide
                           {entry.correct ? 'text-green-800 bg-green-50 border border-green-200' : 'text-red-800 bg-red-50 border border-red-200'}">
                {entry.correct ? 'Acierto' : 'Fallo'}
              </span>
            </div>
          {:else}
            <p class="p-8 text-center text-gray-500 italic">No hay actividad registrada aún.</p>
          {/each}
        </div>

        {#if totalAnkiPages > 1}
          <div class="flex justify-center items-center gap-4 mt-6">
            <button class="bg-gray-100 text-warm-600 font-semibold py-2 px-4 rounded-lg border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" 
                    disabled={ankiPage === 0} on:click={() => ankiPage--}>Anterior</button>
            <span class="text-sm text-gray-500">Página {ankiPage + 1} de {totalAnkiPages}</span>
            <button class="bg-gray-100 text-warm-600 font-semibold py-2 px-4 rounded-lg border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" 
                    disabled={ankiPage >= totalAnkiPages - 1} on:click={() => ankiPage++}>Siguiente</button>
          </div>
        {/if}
      </div>
    </div>
  {/if}

  {#if activeTab === 'exams'}
    <div class="tab-content">
      <div class="bg-white p-4 md:p-6 rounded-3xl mb-8 shadow-[0_4px_15px_rgba(0,0,0,0.05)]">
        <h3 class="font-semibold text-warm-600 mb-2">Progreso en Exámenes</h3>
        <div bind:this={examChartContainer} class="w-full h-[300px]"></div>
        <p class="flex flex-wrap justify-center gap-4 text-sm mt-4">
          <span class="flex items-center gap-1.5"><span class="inline-block w-5 h-0.5 bg-blue-600"></span> Puntuación (max 30)</span>
          <span class="flex items-center gap-1.5"><span class="inline-block w-5 border-t-2 border-dashed border-red-500"></span> Límite aprobado (27)</span>
        </p>
      </div>

      <div class="list-section">
        <h3 class="font-semibold text-warm-600 mb-4">Exámenes Realizados</h3>
        <div class="bg-white rounded-2xl overflow-hidden shadow-[0_4px_15px_rgba(0,0,0,0.05)]">
          {#each $attempts.filter(a => a.completed) as attempt}
            {@const examTemplate = $exams.find(e => e.id === attempt.examId)}
            {@const fails = attempt.total - attempt.score}
            {@const passed = attempt.score >= 27}
            <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 px-3 py-4 md:p-4 border-b border-gray-50">
              <div class="flex flex-col">
                <span class="font-bold text-warm-600">{examTemplate?.name || 'Examen'}</span>
                <span class="text-sm text-gray-500">{new Date(attempt.date).toLocaleString()}</span>
              </div>
              <div class="flex items-center gap-3">
                <span class="font-semibold text-gray-500 {fails > 3 ? 'text-red-500' : ''}">Fallos: {fails}</span>
                <span class="px-3 py-1 rounded-full text-xs font-bold
                             {passed ? 'text-green-800 bg-green-50 border border-green-200' : 'text-red-800 bg-red-50 border border-red-200'}">
                  {passed ? 'APROBADO' : 'SUSPENSO'}
                </span>
              </div>
            </div>
          {:else}
            <p class="p-8 text-center text-gray-500 italic">No has finalizado ningún examen todavía.</p>
          {/each}
        </div>
      </div>
    </div>
  {/if}

  {#if activeTab === 'summary'}
    {@const summary = getGlobalSummary()}
    <div class="tab-content grid grid-cols-1 sm:grid-cols-3 gap-5">
      <div class="bg-white p-6 md:p-8 rounded-3xl text-center shadow-[0_4px_15px_rgba(0,0,0,0.05)]">
        <h4 class="font-semibold text-warm-600">Preguntas Anki</h4>
        <span class="block text-4xl md:text-5xl font-extrabold text-warm-600 my-2">{summary.totalAnki}</span>
        <p class="text-gray-500">Precisión: {summary.ankiAccuracy.toFixed(1)}%</p>
      </div>
      <div class="bg-white p-6 md:p-8 rounded-3xl text-center shadow-[0_4px_15px_rgba(0,0,0,0.05)]">
        <h4 class="font-semibold text-warm-600">Exámenes Simulados</h4>
        <span class="block text-4xl md:text-5xl font-extrabold text-warm-600 my-2">{summary.totalExams}</span>
        <p class="text-gray-500">Aprobados: {summary.examPassRate.toFixed(1)}%</p>
      </div>
      <div class="bg-white p-6 md:p-8 rounded-3xl text-center shadow-[0_4px_15px_rgba(0,0,0,0.05)]">
        <h4 class="font-semibold text-warm-600">Nota Media</h4>
        <span class="block text-4xl md:text-5xl font-extrabold text-warm-600 my-2">{summary.avgExamScore.toFixed(1)}</span>
        <p class="text-gray-500">sobre 30 puntos</p>
      </div>
    </div>
  {/if}
</div>
