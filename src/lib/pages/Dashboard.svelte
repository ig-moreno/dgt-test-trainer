<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { user, stats } from '../stores';
  
  const dispatch = createEventDispatcher();
</script>

<div class="dashboard">
  <div class="welcome">
    <h1>¡Hola, {$user?.name}! 👋</h1>
    <p>¿Qué vamos a practicar hoy?</p>
  </div>
  
  <div class="stats-grid">
    <div class="stat-card clickable" on:click={() => dispatch('navigate', 'anki')}>
      <h3>Meta de Anki</h3>
      <div class="progress">
        <span class="count">{$stats.ankiToday} / {$user?.dailyGoal}</span>
        <div class="bar">
          <div class="fill" style="width: {Math.min(100, ($stats.ankiToday / ($user?.dailyGoal || 1)) * 100)}%"></div>
        </div>
      </div>
      <p class="stat-hint">Tarjetas diarias</p>
    </div>

    <div class="stat-card clickable" on:click={() => dispatch('navigate', 'exams')}>
      <h3>Meta de Exámenes</h3>
      <div class="progress">
        <span class="count">{$stats.examsToday} / {$user?.dailyExamGoal || 2}</span>
        <div class="bar">
          <div class="fill exam-fill" style="width: {Math.min(100, ($stats.examsToday / ($user?.dailyExamGoal || 1)) * 100)}%"></div>
        </div>
      </div>
      <p class="stat-hint">Simulacros diarios</p>
    </div>
    
    <div class="stat-card clickable" on:click={() => dispatch('navigate', 'exams')}>
      <h3>Exámenes Realizados</h3>
      <span class="big-number">{$stats.totalExams}</span>
      <p class="stat-hint">Ver mis exámenes</p>
    </div>
    
    <div class="stat-card clickable" on:click={() => dispatch('navigate', 'history')}>
      <h3>Puntuación Media</h3>
      <span class="big-number">{$stats.avgScore.toFixed(1)}</span>
      <p class="stat-hint">Ver evolución</p>
    </div>
  </div>

<style>
  .stat-card.clickable {
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .stat-card.clickable:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 30px rgba(0,0,0,0.1);
    border-color: #8fb339;
  }
</style>

  <div class="actions-container">
    <button class="action-card daily-session" on:click={() => dispatch('navigate', 'anki')}>
      <div class="card-icon">📚</div>
      <div class="card-text">
        <h3>Sesión diaria</h3>
        <p>Completa tus tarjetas de hoy y alcanza tu objetivo</p>
      </div>
    </button>

    <button class="action-card take-exam" on:click={() => dispatch('navigate', 'exams')}>
      <div class="card-icon">📝</div>
      <div class="card-text">
        <h3>Realizar examen</h3>
        <p>Ponte a prueba con un simulacro oficial</p>
      </div>
    </button>
  </div>
</div>

<style>
  .dashboard {
    animation: fadeIn 0.5s ease-out;
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .welcome h1 {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
    color: #5c4b37;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
  }

  .stat-card {
    background: white;
    padding: 1.2rem;
    border-radius: 15px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.05);
    text-align: center;
  }

  .progress {
    margin-top: 1rem;
  }

  .count {
    font-size: 1.2rem;
    font-weight: 700;
    color: #8fb339;
  }

  .bar {
    height: 10px;
    background: #f0f0f0;
    border-radius: 5px;
    margin-top: 0.5rem;
    overflow: hidden;
  }

  .fill {
    height: 100%;
    background: #8fb339;
    transition: width 0.5s ease-out;
  }

  .exam-fill {
    background: #3b82f6;
  }

  .big-number {
    font-size: 2.5rem;
    font-weight: 800;
    color: #5c4b37;
    display: block;
    margin-top: 0.5rem;
  }

  .actions-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 1.5rem;
    width: 100%;
    max-width: 1000px;
    margin: 0 auto;
  }

  .action-card {
    display: flex;
    align-items: center;
    gap: 2rem;
    padding: 3.5rem 2.5rem;
    min-height: 220px;
    border: none;
    border-radius: 24px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    text-align: left;
    width: 100%;
    box-shadow: 0 10px 25px rgba(0,0,0,0.1);
  }

  .action-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 30px rgba(0,0,0,0.15);
  }

  .daily-session {
    background: linear-gradient(135deg, #8fb339 0%, #6d8a2b 100%);
    color: white;
  }

  .take-exam {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    color: white;
  }

  .card-icon {
    font-size: 3rem;
    background: rgba(255, 255, 255, 0.2);
    width: 80px;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 20px;
  }

  .card-text h3 {
    font-size: 1.8rem;
    margin: 0;
    margin-bottom: 0.3rem;
  }

  .card-text p {
    opacity: 0.9;
    font-size: 1.1rem;
  }
</style>
