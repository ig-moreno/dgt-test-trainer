<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { db, type User } from '../db';
  import { stats } from '../stores';
  import { X, Award, BookOpen, CheckCircle } from 'lucide-svelte';
  
  export let user: User;
  const dispatch = createEventDispatcher();
  
  let confirmingDelete = false;
  
  async function deleteData() {
    try {
      // Clear all tables instead of deleting the whole DB to avoid connection issues
      await Promise.all([
        db.users.clear(),
        db.ankiCards.clear(),
        db.exams.clear(),
        db.attempts.clear(),
        db.history.clear()
      ]);
      dispatch('deleted');
      dispatch('close');
      window.location.reload();
    } catch (err) {
      console.error("Error deleting data:", err);
      // Fallback: full DB delete
      await db.delete();
      window.location.reload();
    }
  }
</script>

<div class="modal-overlay" on:click|self={() => dispatch('close')}>
  <div class="modal-content">
    <button class="close-btn" on:click={() => dispatch('close')}><X size={24} /></button>
    
    {#if !confirmingDelete}
      <div class="profile-header">
        <img src={user.profilePic} alt="Profile" class="avatar" />
        <h2>{user.name}</h2>
        <p class="joined">Miembro desde {new Date(user.registrationDate).toLocaleDateString()}</p>
      </div>
      
      <div class="stats-summary">
        <div class="stat-item">
          <div class="icon-circle anki">
            <BookOpen size={18} />
          </div>
          <span class="value">{$stats.totalAnki}</span>
          <span class="label">Total Anki</span>
        </div>
        <div class="stat-item">
          <div class="icon-circle exams">
            <Award size={18} />
          </div>
          <span class="value">{$stats.totalExams}</span>
          <span class="label">Exámenes</span>
        </div>
        <div class="stat-item">
          <div class="icon-circle accuracy">
            <CheckCircle size={18} />
          </div>
          <span class="value">{$stats.avgScore.toFixed(1)}</span>
          <span class="label">Media</span>
        </div>
      </div>
      
      <div class="goals-list">
        <div class="goal-pill">
          <strong>{user.dailyGoal}</strong> Anki/día
        </div>
        <div class="goal-pill">
          <strong>{user.dailyExamGoal}</strong> Exámenes/día
        </div>
      </div>
      
      <div class="actions">
        <button class="delete-btn" on:click={() => confirmingDelete = true}>Borrar mis datos</button>
      </div>
    {:else}
      <div class="confirmation">
        <h3>¿Borrar todo el progreso?</h3>
        <p>Esta acción eliminará tu perfil, todos tus exámenes realizados y tu progreso en tarjetas ANKI. Esta acción es irreversible.</p>
        <div class="confirm-actions">
          <button class="confirm-btn danger" on:click={deleteData}>Sí, borrar todo</button>
          <button class="cancel-btn" on:click={() => confirmingDelete = false}>No, cancelar</button>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .modal-content {
    background: white;
    padding: 2.5rem;
    border-radius: 25px;
    width: 90%;
    max-width: 450px;
    position: relative;
    text-align: center;
  }

  .close-btn {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: transparent;
    color: #999;
    padding: 5px;
    box-shadow: none;
  }

  .avatar {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    object-fit: cover;
    border: 4px solid #f1f8e9;
    margin-bottom: 1.5rem;
    box-shadow: 0 8px 20px rgba(0,0,0,0.1);
  }

  .joined {
    font-size: 0.9rem;
    color: #94a3b8;
    margin-top: 0.5rem;
  }

  .stats-summary {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    margin: 2.5rem 0;
    padding: 1.5rem;
    background: #f8fafc;
    border-radius: 20px;
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .icon-circle {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 0.2rem;
  }

  .icon-circle.anki { background: #eef2ff; color: #6366f1; }
  .icon-circle.exams { background: #fff7ed; color: #f97316; }
  .icon-circle.accuracy { background: #f0fdf4; color: #22c55e; }

  .label { 
    font-size: 0.7rem; 
    color: #64748b; 
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .value { font-size: 1.4rem; font-weight: 800; color: #1e293b; }

  .goals-list {
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .goal-pill {
    background: #f1f5f9;
    padding: 0.5rem 1rem;
    border-radius: 12px;
    font-size: 0.9rem;
    color: #475569;
  }

  .goal-pill strong {
    color: #1e293b;
    font-weight: 800;
  }

  .actions {
    margin-top: 2rem;
  }

  .delete-btn {
    background-color: transparent;
    color: #ef4444;
    width: 100%;
    border: 2px solid #fee2e2;
    padding: 1rem;
    border-radius: 12px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
  }

  .delete-btn:hover {
    background-color: #fef2f2;
    border-color: #fecaca;
  }

  .confirmation h3 {
    color: #ef4444;
    margin-bottom: 1rem;
  }

  .confirmation p {
    font-size: 0.9rem;
    color: #666;
    margin-bottom: 2rem;
  }

  .confirm-actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .confirm-btn {
    background-color: #ef4444;
    color: white;
  }

  .cancel-btn {
    background-color: #f3f4f6;
    color: #5c4b37;
    box-shadow: none;
  }
</style>
