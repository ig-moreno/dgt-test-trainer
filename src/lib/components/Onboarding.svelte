<script lang="ts">
  import { db } from '../db';
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  let name = '';
  let dailyGoal = 20;
  let dailyExamGoal = 2;
  let selectedAvatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix";
  let customAvatar: string | null = null;
  
  const avatars = [
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Midnight",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Caspian",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Sasha",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Toby"
  ];

  function handleFileUpload(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        customAvatar = ev.target?.result as string;
        selectedAvatar = customAvatar;
      };
      reader.readAsDataURL(file);
    }
  }
  
  async function register() {
    if (!name) return;
    
    await db.users.add({
      name,
      dailyGoal,
      dailyExamGoal,
      profilePic: selectedAvatar,
      registrationDate: new Date()
    });
    
    // Auto-generate 20 exams
    for (let i = 1; i <= 20; i++) {
      await db.exams.add({
        name: `Examen_${new Date().toISOString().split('T')[0].replace(/-/g, '_')}_${i.toString().padStart(2, '0')}`,
        date: new Date(),
        difficulty: 'Indiferente'
      });
    }
    
    dispatch('registered');
  }
</script>

<div class="onboarding">
  <div class="card">
    <h2>¡Bienvenido al DGT Trainer!</h2>
    <p>Para empezar, necesitamos unos pocos detalles.</p>
    
    <div class="field">
      <label for="name">¿Cómo te llamas?</label>
      <input type="text" id="name" bind:value={name} placeholder="Tu nombre" />
    </div>
    
    <div class="avatar-selection">
        <h4>Elige tu Avatar</h4>
        <div class="avatar-grid">
          {#each avatars as avatar}
            <button 
              type="button"
              class="avatar-btn" 
              class:selected={selectedAvatar === avatar}
              on:click={() => selectedAvatar = avatar}
            >
              <img src={avatar} alt="Avatar" />
            </button>
          {/each}
          
          <label class="avatar-upload" class:selected={selectedAvatar === customAvatar}>
            <input type="file" accept="image/*" on:change={handleFileUpload} />
            {#if customAvatar}
              <img src={customAvatar} alt="Custom" />
            {:else}
              <span class="upload-icon">📷</span>
              <span>Subir foto</span>
            {/if}
          </label>
        </div>
      </div>
    
    <div class="field">
      <label for="goal">¿Cuántas tarjetas Anki quieres hacer al día?</label>
      <input type="number" id="goal" bind:value={dailyGoal} min="1" />
    </div>

    <div class="field">
      <label for="examGoal">¿Cuántos exámenes quieres hacer al día?</label>
      <input type="number" id="examGoal" bind:value={dailyExamGoal} min="1" />
    </div>
    
    <button class="start-btn" on:click={register} disabled={!name}>¡Empezar!</button>
  </div>
</div>

<style>
  .onboarding {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0,0,0,0.6);
    backdrop-filter: blur(8px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .card {
    background: white;
    padding: 2.5rem;
    border-radius: 24px;
    box-shadow: 0 20px 50px rgba(0,0,0,0.2);
    max-width: 450px;
    width: 90%;
    text-align: center;
  }

  h2 { margin: 0 0 0.5rem; color: #5c4b37; }
  p { color: #64748b; margin-bottom: 2rem; }

  .field {
    margin-bottom: 1.5rem;
    text-align: left;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: #5c4b37;
  }

  input {
    width: 100%;
    padding: 0.8rem;
    border: 2px solid #f1f5f9;
    border-radius: 12px;
    font-size: 1rem;
    transition: all 0.2s;
    box-sizing: border-box;
  }

  input:focus {
    border-color: #8fb339;
    outline: none;
    background: #fdfcf0;
  }

  .avatar-selection {
    margin-bottom: 2rem;
    text-align: left;
  }

  .avatar-selection h4 {
    margin-bottom: 1rem;
    color: #5c4b37;
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .avatar-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.8rem;
  }

  .avatar-btn {
    background: #f8fafc;
    border: 3px solid transparent;
    padding: 0.3rem;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .avatar-btn img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .avatar-btn.selected {
    border-color: #8fb339;
    background: #f1f8e9;
    transform: scale(1.05);
  }

  .avatar-upload {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #f8fafc;
    border: 3px dashed #e2e8f0;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;
    aspect-ratio: 1;
    overflow: hidden;
  }

  .avatar-upload input { display: none; }
  .upload-icon { font-size: 1.2rem; }
  .avatar-upload span { font-size: 0.6rem; color: #64748b; font-weight: 700; margin-top: 2px; }

  .avatar-upload img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .avatar-upload.selected {
    border-color: #8fb339;
    background: #f1f8e9;
    border-style: solid;
    transform: scale(1.05);
  }

  .start-btn {
    width: 100%;
    padding: 1rem;
    background: #8fb339;
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 1.1rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
    margin-top: 1rem;
  }

  .start-btn:hover:not(:disabled) {
    background: #7a9a30;
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(143, 179, 57, 0.2);
  }

  .start-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: #cbd5e1;
  }
</style>
