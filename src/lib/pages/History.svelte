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
  <div class="header">
    <h2>Historial de Actividad</h2>
    <div class="tabs">
      <button class:active={activeTab === 'anki'} on:click={() => activeTab = 'anki'}>Anki</button>
      <button class:active={activeTab === 'exams'} on:click={() => activeTab = 'exams'}>Exámenes</button>
      <button class:active={activeTab === 'summary'} on:click={() => activeTab = 'summary'}>Resumen</button>
    </div>
  </div>

  {#if activeTab === 'anki'}
    <div class="tab-content" in:fade>
      <div class="chart-box">
        <h3>Evolución de Aciertos Anki</h3>
        <div bind:this={ankiChartContainer} class="chart"></div>
        <p class="legend">
          <span class="bar-leg"></span> Preguntas respondidas 
          <span class="line-leg"></span> Aciertos
        </p>
      </div>

      <div class="list-section">
        <h3>Histórico de Preguntas</h3>
        <div class="list">
          {#each paginatedAnki as entry}
            <div class="item">
              <span class="date">{entry.date.toLocaleString()}</span>
              <span class="result" class:pass={entry.correct} class:fail={!entry.correct}>
                {entry.correct ? 'Acierto' : 'Fallo'}
              </span>
            </div>
          {:else}
            <p class="empty">No hay actividad registrada aún.</p>
          {/each}
        </div>

        {#if totalAnkiPages > 1}
          <div class="pagination">
            <button disabled={ankiPage === 0} on:click={() => ankiPage--}>Anterior</button>
            <span>Página {ankiPage + 1} de {totalAnkiPages}</span>
            <button disabled={ankiPage >= totalAnkiPages - 1} on:click={() => ankiPage++}>Siguiente</button>
          </div>
        {/if}
      </div>
    </div>
  {/if}

  {#if activeTab === 'exams'}
    <div class="tab-content">
      <div class="chart-box">
        <h3>Progreso en Exámenes</h3>
        <div bind:this={examChartContainer} class="chart"></div>
        <p class="legend">
          <span class="exam-line-leg"></span> Puntuación (max 30)
          <span class="threshold-leg"></span> Límite aprobado (27)
        </p>
      </div>

      <div class="list-section">
        <h3>Exámenes Realizados</h3>
        <div class="list">
          {#each $attempts.filter(a => a.completed) as attempt}
            {@const examTemplate = $exams.find(e => e.id === attempt.examId)}
            {@const fails = attempt.total - attempt.score}
            {@const passed = attempt.score >= 27}
            <div class="item exam-item">
              <div class="exam-info">
                <span class="exam-name">{examTemplate?.name || 'Examen'}</span>
                <span class="exam-date">{new Date(attempt.date).toLocaleString()}</span>
              </div>
              <div class="exam-results">
                <span class="fails" class:many-fails={fails > 3}>Fallos: {fails}</span>
                <span class="status" class:pass={passed} class:fail={!passed}>
                  {passed ? 'APROBADO' : 'SUSPENSO'}
                </span>
              </div>
            </div>
          {:else}
            <p class="empty">No has finalizado ningún examen todavía.</p>
          {/each}
        </div>
      </div>
    </div>
  {/if}

  {#if activeTab === 'summary'}
    {@const summary = getGlobalSummary()}
    <div class="tab-content summary-grid">
      <div class="stat-card">
        <h4>Preguntas Anki</h4>
        <span class="val">{summary.totalAnki}</span>
        <p>Precisión: {summary.ankiAccuracy.toFixed(1)}%</p>
      </div>
      <div class="stat-card">
        <h4>Exámenes Simulados</h4>
        <span class="val">{summary.totalExams}</span>
        <p>Aprobados: {summary.examPassRate.toFixed(1)}%</p>
      </div>
      <div class="stat-card">
        <h4>Nota Media</h4>
        <span class="val">{summary.avgExamScore.toFixed(1)}</span>
        <p>sobre 30 puntos</p>
      </div>
    </div>
  {/if}
</div>

<style>
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }

  .tabs {
    background: #f1f5f9;
    padding: 4px;
    border-radius: 12px;
    display: flex;
    gap: 4px;
  }

  .tabs button {
    padding: 8px 16px;
    border: none;
    background: transparent;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    color: #64748b;
    transition: all 0.2s;
  }

  .tabs button.active {
    background: white;
    color: #5c4b37;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  }

  .chart-box {
    background: white;
    padding: 1.5rem;
    border-radius: 20px;
    margin-bottom: 2rem;
    box-shadow: 0 4px 15px rgba(0,0,0,0.05);
  }

  .chart {
    width: 100%;
    height: 300px;
  }

  .legend {
    display: flex;
    justify-content: center;
    gap: 1.5rem;
    font-size: 0.9rem;
    margin-top: 1rem;
  }

  .bar-leg { width: 20px; height: 10px; background: #8fb339; opacity: 0.5; display: inline-block; }
  .line-leg { width: 20px; height: 2px; background: #5c4b37; display: inline-block; vertical-align: middle; }
  .exam-line-leg { width: 20px; height: 2px; background: #3b82f6; display: inline-block; vertical-align: middle; }
  .threshold-leg { width: 20px; height: 2px; border-top: 2px dashed #ef4444; display: inline-block; vertical-align: middle; }

  .list-section h3 { margin-bottom: 1rem; }

  .list {
    background: white;
    border-radius: 15px;
    overflow: hidden;
    box-shadow: 0 4px 15px rgba(0,0,0,0.05);
  }

  .item {
    display: flex;
    justify-content: space-between;
    padding: 1rem;
    border-bottom: 1px solid #f1f5f9;
  }

  .exam-item {
    align-items: center;
  }

  .exam-info { display: flex; flex-direction: column; }
  .exam-name { font-weight: 700; color: #5c4b37; }
  .exam-date { font-size: 0.85rem; color: #64748b; }

  .exam-results { display: flex; gap: 1.5rem; align-items: center; }
  .fails { font-weight: 600; color: #64748b; }
  .many-fails { color: #ef4444; }

  .result {
    padding: 0.3rem 0.8rem;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.025em;
  }

  .pass { 
    color: #166534; 
    background: #f0fdf4; 
    border: 1px solid #bbf7d0;
  }
  .fail { 
    color: #991b1b; 
    background: #fef2f2; 
    border: 1px solid #fecaca;
  }

  .empty { padding: 2rem; text-align: center; color: #64748b; font-style: italic; }

  .pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1.5rem;
    margin-top: 1.5rem;
  }

  .pagination button {
    background: #f1f5f9;
    border: none;
    padding: 8px 16px;
    border-radius: 8px;
    cursor: pointer;
  }

  .summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
  }

  .summary-grid .stat-card {
    background: white;
    padding: 2rem;
    border-radius: 20px;
    text-align: center;
    box-shadow: 0 4px 15px rgba(0,0,0,0.05);
  }

  .val {
    display: block;
    font-size: 3rem;
    font-weight: 800;
    color: #5c4b37;
    margin: 0.5rem 0;
  }

  .stat-card p { color: #64748b; margin: 0; }
</style>
