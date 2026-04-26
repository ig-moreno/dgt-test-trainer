<script lang="ts">
  import { db, type Exam, type Attempt } from '../db';
  import { createEventDispatcher } from 'svelte';
  import { questions, refreshData } from '../stores';
  import ConfirmDialog from './ConfirmDialog.svelte';
  
  const dispatch = createEventDispatcher();
  export let exam: Exam; // Template
  export let attempt: Attempt; // Instance
  
  let currentIndex = 0;
  let finished = attempt?.completed || false;
  let answers = attempt?.results?.map(r => r.selected) || [];
  let timeLeft = 30 * 60; // 30 minutes
  let timerInterval: any;

  import { onMount, onDestroy } from 'svelte';
  
  onMount(() => {
    if (!finished) {
      timerInterval = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 0) {
          clearInterval(timerInterval);
          finish();
        }
      }, 1000);
    }
  });

  onDestroy(() => {
    if (timerInterval) clearInterval(timerInterval);
  });

  function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  $: currentQuestion = ($questions.length > 0 && attempt?.results?.[currentIndex]) 
    ? $questions[attempt.results[currentIndex].questionId] 
    : null;

  async function selectOption(optIndex: number) {
    if (finished) return;
    answers[currentIndex] = optIndex;
    attempt.results[currentIndex].selected = optIndex;
  }

  async function finish() {
    finished = true;
    if (timerInterval) clearInterval(timerInterval);
    let finalScore = 0;
    const results = attempt.results.map((r, i) => {
      const q = $questions[r.questionId];
      const isCorrect = answers[i] === q.correct;
      if (isCorrect) finalScore++;
      return { ...r, selected: answers[i] };
    });
    
    // Create attempt in DB only now
    const attemptId = await db.attempts.add({
      examId: exam.id!,
      date: new Date(),
      score: finalScore,
      total: attempt.total,
      completed: true,
      results
    });
    
    attempt = { ...attempt, id: attemptId, score: finalScore, results, completed: true };
    
    await db.history.add({
      date: new Date(),
      type: 'exam',
      referenceId: attemptId,
      correct: finalScore >= 27
    });
    
    await refreshData();
  }

  async function repeat() {
    // Just reset local state
    currentIndex = 0;
    finished = false;
    answers = attempt.results.map(() => -1);
    attempt.results.forEach(r => r.selected = -1);
    attempt.score = 0;
    attempt.completed = false;
  }

  let showExitConfirm = false;

  async function handleExit() {
    if (!finished) {
      showExitConfirm = true;
    } else {
      dispatch('close');
    }
  }

  async function confirmExit() {
    showExitConfirm = false;
    dispatch('close');
  }
</script>

{#if showExitConfirm}
  <ConfirmDialog 
    title="¿Abandonar examen?" 
    message="Si sales ahora, tu progreso se perderá y este intento no se guardará en el historial."
    confirmText="Salir y borrar"
    cancelText="Continuar examen"
    type="danger"
    on:confirm={confirmExit}
    on:cancel={() => showExitConfirm = false}
  />
{/if}

<div class="simulator">
  {#if !attempt.results || attempt.results.length === 0}
    <p>Cargando preguntas...</p>
  {:else}
    <div class="sim-header">
      <div class="header-left">
        <h3>{exam.name}</h3>
        {#if !finished}
          <span class="progress-info">Pregunta {currentIndex + 1} / {attempt.total}</span>
          <span class="timer" class:warning={timeLeft < 300}>
            ⏱️ {formatTime(timeLeft)}
          </span>
        {/if}
      </div>
      {#if !finished}
        <button 
          type="button" 
          class="exit-trigger"
          on:click|once={handleExit}
        >
          Salir del Examen
        </button>
      {/if}
    </div>

    {#if !finished}
      {#if !currentQuestion}
        <div class="loading-box">
          <p>Preparando pregunta {currentIndex + 1}...</p>
        </div>
      {:else}
        <div class="question-box">
        {#if currentQuestion.img}
          <img src={"./anki-img/" + currentQuestion.img} alt="Q" class="q-img" />
        {/if}
        <p class="question-text">{currentQuestion.question}</p>
        
        <div class="options">
          {#each ['a', 'b', 'c'] as opt, i}
            <button 
              class="option-btn" 
              class:selected={answers[currentIndex] === i}
              on:click={() => selectOption(i)}
            >
              {opt.toUpperCase()}) {currentQuestion[opt]}
            </button>
          {/each}
        </div>
      </div>
    {/if}

      <div class="controls">
        <button disabled={currentIndex === 0} on:click={() => currentIndex--}>Anterior</button>
        
        {#if currentIndex < 29}
          <button on:click={() => currentIndex++}>Siguiente</button>
        {:else}
          <button class="finish-btn" on:click={finish}>Corregir</button>
        {/if}
      </div>
    {:else}
      <div class="exam-summary">
        <div class="result-banner" class:pass={attempt.score >= 27} class:fail={attempt.score < 27}>
          <h2>{attempt.score >= 27 ? '¡APROBADO!' : 'SUSPENSO'}</h2>
          <p>Puntuación: {attempt.score} / 30</p>
        </div>

        <div class="questions-review">
          {#each attempt.results as res, i}
            {@const q = $questions[res.questionId]}
            <div class="review-item" class:correct={res.selected === q.correct} class:wrong={res.selected !== q.correct}>
              <div class="review-header">
                <span class="q-num">Pregunta {i + 1}</span>
                <span class="q-status">{res.selected === q.correct ? 'Correcta' : 'Incorrecta'}</span>
              </div>

              {#if q.img}
                <img src={"./anki-img/" + q.img} alt="Q" class="q-img-thumb" />
              {/if}
              
              <p class="q-text">{q.question}</p>

              <div class="review-options">
                {#each ['a', 'b', 'c'] as opt, idx}
                  <div class="opt-line" 
                    class:sel={res.selected === idx} 
                    class:is-correct={q.correct === idx}
                    class:is-wrong={res.selected === idx && q.correct !== idx}
                  >
                    {opt.toUpperCase()}) {q[opt]}
                  </div>
                {/each}
              </div>

              {#if q.explanation}
                <div class="review-explanation">
                  <strong>Explicación:</strong> {q.explanation.charAt(0).toUpperCase() + q.explanation.slice(1).toLowerCase()}
                </div>
              {/if}
            </div>
          {/each}
        </div>
        <div class="summary-actions">
          <button class="repeat-btn" on:click={repeat}>Repetir prueba</button>
          <button class="exit-btn" on:click={() => dispatch('close')}>Finalizar</button>
        </div>
      </div>
    {/if}
  {/if}
</div>

<style>
  .simulator {
    background: #fff;
    padding: 2rem;
    border-radius: 20px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  }

  .sim-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #eee;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 1.5rem;
  }

  .progress-info {
    background: #f3f4f6;
    padding: 0.4rem 0.8rem;
    border-radius: 20px;
    font-size: 0.9rem;
    color: #6b7280;
    font-weight: 600;
  }

  .exit-trigger {
    background: #fee2e2;
    color: #b91c1c;
    border: none;
    padding: 0.6rem 1.2rem;
    border-radius: 8px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
  }

  .exit-trigger:hover {
    background: #fecaca;
    transform: translateY(-2px);
  }

  .timer {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: #eff6ff;
    color: #1e40af;
    padding: 0.4rem 1rem;
    border-radius: 20px;
    font-size: 0.9rem;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
  }

  .timer.warning {
    background: #fef2f2;
    color: #b91c1c;
    animation: pulse 1s infinite;
  }

  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.7; }
    100% { opacity: 1; }
  }

  .q-img {
    width: 100%;
    max-height: 300px;
    object-fit: contain;
    border-radius: 10px;
    margin-bottom: 1rem;
  }

  .question-text {
    font-size: 1.2rem;
    font-weight: 600;
    margin-bottom: 1.5rem;
  }

  .options {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }

  .option-btn {
    text-align: left;
    background: #f9fafb;
    color: #5c4b37;
    border: 2px solid transparent;
    box-shadow: none;
    transition: all 0.2s;
  }

  .option-btn:hover:not(:disabled) {
    background: #f3f4f6;
    border-color: #8fb339;
  }

  .option-btn.selected {
    background: #eef2ff;
    border-color: #3b82f6;
  }

  .option-btn.correct {
    background: #d1fae5;
    border-color: #10b981;
    color: #065f46;
  }

  .option-btn.wrong {
    background: #fee2e2;
    border-color: #ef4444;
    color: #991b1b;
  }

  .controls {
    display: flex;
    justify-content: space-between;
    margin-top: 2rem;
  }

  .finish-btn { background: #8fb339; }

  .explanation {
    margin-top: 1rem;
    padding: 1rem;
    background: #fdf6e3;
    border-radius: 10px;
    font-size: 0.9rem;
  }

  .result-summary {
    margin-top: 1.5rem;
    text-align: center;
    font-size: 1.5rem;
    font-weight: 700;
  }

  .pass { color: #10b981; }
  .fail { color: #ef4444; }

  .exam-summary {
    margin-top: 2rem;
    text-align: left;
  }

  .result-banner {
    text-align: center;
    padding: 2rem;
    border-radius: 15px;
    margin-bottom: 2rem;
    color: white;
  }
  .result-banner.pass { background: #10b981; }
  .result-banner.fail { background: #ef4444; }
  .result-banner h2 { margin: 0; font-size: 2.5rem; }

  .questions-review {
    display: grid;
    gap: 1.5rem;
  }

  .review-item {
    background: #f9fafb;
    padding: 1.5rem;
    border-radius: 15px;
    border-left: 5px solid #eee;
  }
  .review-item.correct { border-left-color: #10b981; }
  .review-item.wrong { border-left-color: #ef4444; }

  .review-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 1rem;
    font-weight: 700;
    font-size: 0.9rem;
  }

  .q-img-thumb {
    max-width: 200px;
    max-height: 150px;
    object-fit: contain;
    border-radius: 8px;
    margin-bottom: 1rem;
  }

  .q-text {
    font-weight: 600;
    margin-bottom: 1rem;
  }

  .review-options {
    display: flex;
    flex-direction: column;
    gap: 5px;
    margin-bottom: 1rem;
  }

  .opt-line {
    padding: 0.5rem;
    border-radius: 5px;
    font-size: 0.9rem;
  }

  .is-correct { background: #d1fae5; color: #065f46; font-weight: 600; }
  .is-wrong { background: #fee2e2; color: #991b1b; }

  .review-explanation {
    background: #fdf6e3;
    padding: 1rem;
    border-radius: 10px;
    font-size: 0.85rem;
    border: 1px solid #eee;
  }

  .summary-actions {
    margin-top: 2rem;
    display: flex;
    gap: 1rem;
    justify-content: center;
    position: sticky;
    bottom: 0;
    background: white;
    padding: 1rem 0;
  }

  .repeat-btn { background: #3b82f6; }
  .exit-btn { background: #64748b; }
</style>
