<script lang="ts">
  import { onMount } from 'svelte';
  import { db, type Exam, type Attempt } from '../db';
  import { questions, exams, attempts, refreshData } from '../stores';
  import ExamSimulator from '../components/ExamSimulator.svelte';
  
  let showSimulator = false;
  let selectedExam: Exam | null = null;
  let selectedAttempt: Attempt | null = null;
  let difficulty: 'Indiferente' | 'Fácil' | 'Medio' | 'Difícil' = 'Indiferente';
  let showDifficultyModal = false;

  function getAttemptsForExam(examId: any) {
    // Ensure we compare as the same type (numeric)
    return $attempts.filter(a => Number(a.examId) === Number(examId));
  }

  async function startNewExam() {
    if ($questions.length === 0) {
      alert("Las preguntas aún se están cargando. Por favor, espera un momento.");
      return;
    }

    showDifficultyModal = false;
    let qIds: number[] = [];
    
    const maxQuestions = Math.min(30, $questions.length);
    while (qIds.length < maxQuestions) {
      const rand = Math.floor(Math.random() * $questions.length);
      if (!qIds.includes(rand)) qIds.push(rand);
    }

    const now = new Date();
    const dateStrSafe = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const dateStrUnderscore = dateStrSafe.replace(/-/g, '_'); // YYYY_MM_DD
    
    // Count exams that match today's date with either - or _
    const todayCount = $exams.filter(e => 
      e.name.includes(dateStrSafe) || e.name.includes(dateStrUnderscore)
    ).length;
    
    const examName = `Examen_${dateStrUnderscore}_${(todayCount + 1).toString().padStart(2, '0')}`;

    const newExam = {
      name: examName,
      difficulty,
      date: now
    };

    const examId = await db.exams.add(newExam);
    
    selectedExam = { ...newExam, id: examId };
    selectedAttempt = {
      examId: examId,
      date: new Date(),
      score: 0,
      total: qIds.length,
      completed: false,
      results: qIds.map(id => ({ 
        questionId: id, 
        selected: -1 
      }))
    } as Attempt;

    showSimulator = true;
    await refreshData();
  }

  async function createNewAttempt(exam: Exam) {
    if ($questions.length === 0) {
      alert("Las preguntas aún se están cargando...");
      return;
    }

    let qIds = exam.questionIds || [];
    if (qIds.length === 0) {
      const maxQuestions = Math.min(30, $questions.length);
      while (qIds.length < maxQuestions) {
        const rand = Math.floor(Math.random() * $questions.length);
        if (!qIds.includes(rand)) qIds.push(rand);
      }
      await db.exams.update(exam.id!, { questionIds: qIds });
    }

    selectedExam = exam;
    // Create a temporary attempt object (NOT saved in DB)
    selectedAttempt = {
      examId: exam.id!,
      date: new Date(),
      score: 0,
      total: qIds.length,
      completed: false,
      results: qIds.map(id => ({ 
        questionId: id, 
        selected: -1 
      }))
    } as Attempt;

    showSimulator = true;
  }

  function openAttempt(exam: Exam, attempt: Attempt) {
    selectedExam = exam;
    selectedAttempt = attempt;
    showSimulator = true;
  }
</script>

<div class="exams-page">
  {#if showSimulator && selectedExam && selectedAttempt}
    <ExamSimulator 
      exam={selectedExam}
      attempt={selectedAttempt}
      on:close={() => { showSimulator = false; refreshData(); }} 
    />
  {:else}
    <div class="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
      <h2 class="text-2xl font-bold text-warm-600">Mis Exámenes</h2>
      <button class="bg-dgt-500 text-white px-5 py-2.5 rounded-xl font-semibold w-full md:w-auto border-none cursor-pointer
                     hover:bg-dgt-600 shadow-md"
              on:click={() => showDifficultyModal = true}>Crear Nuevo Examen</button>
    </div>

    <!-- Desktop: tabla -->
    <div class="hidden md:block bg-white rounded-2xl overflow-hidden shadow-[0_4px_15px_rgba(0,0,0,0.05)]">
      <table class="w-full border-collapse">
        <thead>
          <tr>
            <th class="px-6 py-4 text-left bg-gray-50 font-semibold text-warm-600 border-b border-gray-100">Examen</th>
            <th class="px-6 py-4 text-left bg-gray-50 font-semibold text-warm-600 border-b border-gray-100">Dificultad</th>
            <th class="px-6 py-4 text-left bg-gray-50 font-semibold text-warm-600 border-b border-gray-100">Historial de Aciertos</th>
            <th class="px-6 py-4 text-left bg-gray-50 font-semibold text-warm-600 border-b border-gray-100">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {#each $exams as exam}
            {@const examAttempts = getAttemptsForExam(exam.id)}
            <tr class="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
              <td class="px-6 py-4">{exam.name}</td>
              <td class="px-6 py-4"><span class="diff-badge {exam.difficulty}">{exam.difficulty}</span></td>
              <td class="px-6 py-4">
                <div class="flex flex-wrap gap-1.5">
                  {#each examAttempts as attempt}
                    <span 
                      class="attempt-badge {attempt.completed || attempt.score > 0 ? (attempt.total - attempt.score <= 3 ? 'pass' : 'fail') : 'pending'}"
                      on:click={() => openAttempt(exam, attempt)}
                      title="Ver este intento"
                    >
                      {(attempt.completed || attempt.score > 0) ? `${attempt.score}/${attempt.total}` : '...'}
                    </span>
                  {/each}
                  {#if examAttempts.length === 0}
                    <span class="text-gray-400 italic">Sin intentos</span>
                  {/if}
                </div>
              </td>
              <td class="px-6 py-4">
                <button class="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold border-none cursor-pointer text-sm hover:bg-blue-700"
                        on:click={() => createNewAttempt(exam)}>
                  Nueva Prueba
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <!-- Mobile: cards -->
    <div class="flex flex-col md:hidden gap-4">
      {#each $exams as exam}
        {@const examAttempts = getAttemptsForExam(exam.id)}
        <div class="bg-white rounded-2xl p-4 shadow-[0_4px_15px_rgba(0,0,0,0.05)]">
          <div class="flex justify-between items-start mb-3">
            <span class="font-bold text-warm-600">{exam.name}</span>
            <span class="diff-badge {exam.difficulty}">{exam.difficulty}</span>
          </div>
          <div class="flex flex-wrap gap-1.5 mb-3">
            {#each examAttempts as attempt}
              <span 
                class="attempt-badge {attempt.completed || attempt.score > 0 ? (attempt.total - attempt.score <= 3 ? 'pass' : 'fail') : 'pending'}"
                on:click={() => openAttempt(exam, attempt)}
                title="Ver este intento"
              >
                {(attempt.completed || attempt.score > 0) ? `${attempt.score}/${attempt.total}` : '...'}
              </span>
            {/each}
            {#if examAttempts.length === 0}
              <span class="text-gray-400 italic text-sm">Sin intentos</span>
            {/if}
          </div>
          <button class="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold border-none cursor-pointer text-sm hover:bg-blue-700"
                  on:click={() => createNewAttempt(exam)}>
            Nueva Prueba
          </button>
        </div>
      {/each}
    </div>

    {#if showDifficultyModal}
      <div class="fixed top-0 left-0 w-full h-full bg-black/50 flex items-center justify-center z-[200] p-4">
        <div class="bg-white p-6 md:p-8 rounded-3xl text-center w-full max-w-sm shadow-[0_15px_40px_rgba(0,0,0,0.2)]">
          <h3 class="text-xl font-bold text-warm-600 mb-4">Elegir Dificultad</h3>
          <select bind:value={difficulty} class="w-full p-3 my-4 rounded-xl border-2 border-gray-100 focus:border-dgt-500 outline-none">
            <option value="Indiferente">Indiferente</option>
            <option value="Fácil">Fácil</option>
            <option value="Medio">Medio</option>
            <option value="Difícil">Difícil</option>
          </select>
          <div class="flex gap-3 mt-2">
            <button class="flex-1 bg-dgt-500 text-white py-3 rounded-xl font-bold border-none cursor-pointer hover:bg-dgt-600" on:click={startNewExam}>Empezar</button>
            <button class="flex-1 bg-gray-300 text-white py-3 rounded-xl font-bold border-none cursor-pointer hover:bg-gray-400" on:click={() => showDifficultyModal = false}>Cancelar</button>
          </div>
        </div>
      </div>
    {/if}
  {/if}
</div>

<style>
  .diff-badge {
    font-size: 0.8rem;
    padding: 2px 8px;
    border-radius: 10px;
    color: white;
  }
  .Indiferente { background: #9ca3af; }
  .Fácil { background: #10b981; }
  .Medio { background: #f59e0b; }
  .Difícil { background: #ef4444; }

  .attempt-badge {
    padding: 2px 8px;
    border-radius: 6px;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s;
  }
  .attempt-badge:hover { transform: scale(1.1); }
  .attempt-badge.pass { background: #10b981; color: white; }
  .attempt-badge.fail { background: #ef4444; color: white; }
  .attempt-badge.pending { background: #f1f5f9; color: #64748b; }
</style>
