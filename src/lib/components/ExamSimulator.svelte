<script lang="ts">
  import { db, type Exam, type Attempt } from '../db';
  import { createEventDispatcher } from 'svelte';
  import { ChevronLeft, ChevronRight } from 'lucide-svelte';
  import { questions, refreshData, examMode, examExitRequested, examJumpTo } from '../stores';
  import ConfirmDialog from './ConfirmDialog.svelte';
  
  const dispatch = createEventDispatcher();
  export let exam: Exam; // Template
  export let attempt: Attempt; // Instance
  
  let currentIndex = 0;
  let finished = attempt?.completed || false;
  let answers = attempt?.results?.map(r => r.selected) || [];
  let timerInterval: any;
  let showExitConfirm = false;

  import { onMount, onDestroy } from 'svelte';

  function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  $: examMode.set({
    active: true,
    finished,
    current: currentIndex + 1,
    total: attempt.total,
    timeLeft: $examMode.timeLeft,
    answered: attempt?.results?.map(r => r.selected >= 0) || []
  });

  $: if ($examExitRequested) {
    examExitRequested.set(false);
    if (!finished) {
      showExitConfirm = true;
    }
  }

  $: if ($examJumpTo !== 0 && !finished) {
    if ($examJumpTo >= 0 && $examJumpTo < attempt.total) {
      currentIndex = $examJumpTo;
    }
    examJumpTo.set(0);
  }
  
  onMount(() => {
    if (!finished) {
      timerInterval = setInterval(() => {
        $examMode.timeLeft--;
        if ($examMode.timeLeft <= 0) {
          clearInterval(timerInterval);
          finish();
        }
      }, 1000);
    }
  });

  onDestroy(() => {
    if (timerInterval) clearInterval(timerInterval);
    examMode.set({ active: false, finished: false, current: 0, total: 0, timeLeft: 30 * 60, answered: [] });
  });

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
    confirmText="Abandonar"
    cancelText="Continuar con el examen"
    type="danger"
    on:confirm={confirmExit}
    on:cancel={() => showExitConfirm = false}
  />
{/if}

<div class="bg-transparent md:bg-white p-0 md:p-8 pt-[62px] md:pt-[62px] pb-20 md:pb-8 rounded-none md:rounded-3xl shadow-none md:shadow-[0_10px_30px_rgba(0,0,0,0.1)]">
  {#if !attempt.results || attempt.results.length === 0}
    <p class="text-gray-500">Cargando preguntas...</p>
  {:else}
    <div class="hidden md:block mb-6 pb-4 border-b border-gray-100">
      {#if !finished}
        <h3 class="text-lg font-bold text-warm-600">{exam.name}</h3>
      {/if}
    </div>

    {#if !finished}
      {#if !currentQuestion}
        <div class="py-10 text-center text-gray-400">
          <p>Preparando pregunta {currentIndex + 1}...</p>
        </div>
      {:else}
        <div>
          {#if currentQuestion.img}
            <img src={"./anki-img/" + currentQuestion.img} alt="Q" class="w-full h-60 md:h-96 object-cover rounded-xl mb-4 shadow-lg" />
          {/if}
          <p class="text-xl md:text-2xl font-semibold m-6 text-warm-600">{currentQuestion.question}</p>
          
          <div class="flex flex-col gap-3">
            {#each ['a', 'b', 'c'] as opt, i}
              <button 
                class="flex items-center gap-3 text-left bg-gray-50 text-warm-600 border-2 transition-none py-3.5 px-4 md:px-5 rounded-2xl cursor-pointer
                       hover:bg-gray-100
                       {answers[currentIndex] === i ? 'bg-indigo-50 border-[var(--color-accent)]' : 'border-gray-50'}"
                on:click={() => selectOption(i)}
              >
                <span class="inline-flex items-center justify-center w-11 h-11 p-1.5 rounded-full border border-[var(--color-accent)] font-black text-base flex-shrink-0 self-start mt-0.5
                             {answers[currentIndex] === i ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-white' : 'text-[var(--color-accent)]'}">{opt.toUpperCase()}</span>
                {currentQuestion[opt]}
              </button>
            {/each}
          </div>
        </div>
      {/if}

      <div class="fixed bottom-0 inset-x-0 flex justify-between gap-3 px-4 py-3 pb-5 bg-gradient-to-b from-transparent to-[var(--color-bg)]">
        <button class="flex items-center justify-center gap-1 bg-[var(--color-accent)] hover:bg-[var(--color-accent)] text-white font-semibold px-5 pr-7 py-3 rounded-full border-none cursor-pointer hover:translate-y-0 active:translate-y-0 disabled:cursor-not-allowed disabled:bg-[#bdb8c3] disabled:hover:bg-[#bdb8c3] disabled:text-white"
                disabled={currentIndex === 0} on:click={() => currentIndex--}>
          <ChevronLeft size={20} />
          <span>Anterior</span>
        </button>
        
        {#if currentIndex < 29}
          <button class="flex items-center justify-center gap-1 bg-[var(--color-accent)] hover:bg-[var(--color-accent)] text-white font-semibold pl-7 px-5 py-3 rounded-full border-none cursor-pointer hover:translate-y-0 active:translate-y-0 disabled:cursor-not-allowed disabled:bg-[#bdb8c3] disabled:hover:bg-[#bdb8c3] disabled:text-white" on:click={() => currentIndex++}>
            <span>Siguiente</span>
            <ChevronRight size={20} />
          </button>
        {:else}
          <button class="flex items-center justify-center gap-1 bg-[#e37b00] hover:bg-[#c96e00] text-white font-semibold px-7 py-3 rounded-full border-none cursor-pointer hover:translate-y-0 active:translate-y-0 disabled:cursor-not-allowed disabled:bg-[#bdb8c3] disabled:hover:bg-[#bdb8c3] disabled:text-white" on:click={finish}>
            <span>Corregir</span>
          </button>
        {/if}
      </div>
    {:else}
      <div class="mt-6 text-left">
        <div class="text-center p-6 md:p-10 rounded-2xl mb-8 text-white
                    {attempt.score >= 27 ? 'bg-green-500' : 'bg-red-500'}">
          <h2 class="text-3xl md:text-4xl font-bold">{attempt.score >= 27 ? '¡APROBADO!' : 'SUSPENSO'}</h2>
          <p class="mt-2">Puntuación: {attempt.score} / 30</p>
        </div>

        <div class="grid gap-5">
          {#each attempt.results as res, i}
            {@const q = $questions[res.questionId]}
            <div class="bg-gray-50 p-4 md:p-6 rounded-2xl border-l-4
                        {res.selected === q.correct ? 'border-green-500' : 'border-red-500'}">
              <div class="flex justify-between mb-4 font-bold text-sm">
                <span class="text-warm-600">Pregunta {i + 1}</span>
                <span class="{res.selected === q.correct ? 'text-green-600' : 'text-red-600'}">
                  {res.selected === q.correct ? 'Correcta' : 'Incorrecta'}
                </span>
              </div>

              {#if q.img}
                <img src={"./anki-img/" + q.img} alt="Q" class="max-w-[200px] max-h-[150px] object-contain rounded-lg mb-4" />
              {/if}
              
              <p class="font-semibold mb-4 text-warm-600">{q.question}</p>

              <div class="flex flex-col gap-1 mb-4">
                {#each ['a', 'b', 'c'] as opt, idx}
                  <div class="flex items-center gap-2 p-2 rounded-lg text-sm
                              {q.correct === idx ? 'bg-green-100 text-green-800 font-semibold' : ''}
                              {res.selected === idx && q.correct !== idx ? 'bg-red-100 text-red-800' : ''}">
                    <span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-300 text-slate-800 font-black text-xs flex-shrink-0">{opt.toUpperCase()}</span>
                    {q[opt]}
                  </div>
                {/each}
              </div>

              {#if q.explanation}
                <div class="bg-warm-50 p-4 rounded-xl text-sm border border-warm-100">
                  <strong class="text-warm-700">Explicación:</strong> {q.explanation.charAt(0).toUpperCase() + q.explanation.slice(1).toLowerCase()}
                </div>
              {/if}
            </div>
          {/each}
        </div>
        <div class="mt-6 flex flex-col sm:flex-row gap-3 justify-center sticky bottom-0 bg-white py-4">
          <button class="bg-blue-600 text-white font-bold py-3 px-6 rounded-xl border-none cursor-pointer hover:bg-blue-700" on:click={repeat}>Repetir prueba</button>
          <button class="bg-gray-500 text-white font-bold py-3 px-6 rounded-xl border-none cursor-pointer hover:bg-gray-600" on:click={() => dispatch('close')}>Finalizar</button>
        </div>
      </div>
    {/if}
  {/if}
</div>
