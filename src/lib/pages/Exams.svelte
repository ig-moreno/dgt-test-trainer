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
    <div class="header">
      <h2>Mis Exámenes</h2>
      <button on:click={() => showDifficultyModal = true}>Crear Nuevo Examen</button>
    </div>

    <table class="exam-table">
      <thead>
        <tr>
          <th>Examen</th>
          <th>Dificultad</th>
          <th>Historial de Aciertos</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {#each $exams as exam}
          {@const examAttempts = getAttemptsForExam(exam.id)}
          <tr>
            <td>{exam.name}</td>
            <td><span class="diff-badge {exam.difficulty}">{exam.difficulty}</span></td>
            <td>
              <div class="attempts-list">
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
                  <span class="pending">Sin intentos</span>
                {/if}
              </div>
            </td>
            <td class="exam-actions">
              <button class="redo-btn" on:click={() => createNewAttempt(exam)}>
                Nueva Prueba
              </button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>

    {#if showDifficultyModal}
      <div class="modal">
        <div class="modal-content">
          <h3>Elegir Dificultad</h3>
          <select bind:value={difficulty}>
            <option value="Indiferente">Indiferente</option>
            <option value="Fácil">Fácil</option>
            <option value="Medio">Medio</option>
            <option value="Difícil">Difícil</option>
          </select>
          <div class="modal-btns">
            <button class="primary" on:click={startNewExam}>Empezar</button>
            <button class="cancel" on:click={() => showDifficultyModal = false}>Cancelar</button>
          </div>
        </div>
      </div>
    {/if}
  {/if}
</div>

<style>
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }

  .exam-table {
    width: 100%;
    border-collapse: collapse;
    background: white;
    border-radius: 15px;
    overflow: hidden;
    box-shadow: 0 4px 15px rgba(0,0,0,0.05);
  }

  th, td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid #eee;
  }

  th {
    background-color: #f9fafb;
    font-weight: 600;
    color: #5c4b37;
  }

  .pass { color: #10b981; font-weight: 700; }
  .fail { color: #ef4444; font-weight: 700; }
  .pending { color: #94a3b8; font-style: italic; }

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

  .modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 200;
  }
  .modal-content {
    background: white;
    padding: 2rem;
    border-radius: 20px;
    text-align: center;
  }
  select {
    width: 100%;
    padding: 0.8rem;
    margin: 1rem 0;
    border-radius: 10px;
  }
  .modal-btns {
    display: flex;
    gap: 1rem;
  }
  .exam-actions {
    display: flex;
    gap: 0.5rem;
  }
  
  .attempts-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .attempt-badge {
    padding: 2px 8px;
    border-radius: 6px;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s;
  }

  .attempt-badge:hover {
    transform: scale(1.1);
  }

  .attempt-badge.pass { background: #10b981; color: white; }
  .attempt-badge.fail { background: #ef4444; color: white; }
  .attempt-badge.pending { background: #f1f5f9; color: #64748b; }

  .view-btn { background: #64748b; }
  .redo-btn { background: #3b82f6; }
  .cancel { background: #9ca3af; }
</style>
