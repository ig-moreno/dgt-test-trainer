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

<div class="fixed top-0 left-0 w-full h-full bg-black/60 backdrop-blur-md flex justify-center items-center z-[1000] p-4 overflow-y-auto">
  <div class="bg-white p-6 md:p-10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] max-w-[450px] w-full text-center my-auto">
    <h2 class="m-0 mb-2 text-2xl md:text-3xl font-bold text-warm-600">¡Bienvenido al DGT Trainer!</h2>
    <p class="text-gray-500 mb-8">Para empezar, necesitamos unos pocos detalles.</p>
    
    <div class="mb-6 text-left">
      <label for="name" class="block mb-2 font-semibold text-warm-600">¿Cómo te llamas?</label>
      <input type="text" id="name" bind:value={name} placeholder="Tu nombre"
             class="w-full p-3 border-2 border-gray-100 rounded-xl text-base transition-all box-border
                    focus:border-dgt-500 focus:outline-none focus:bg-warm-50" />
    </div>
    
    <div class="mb-8 text-left">
        <h4 class="mb-3 text-warm-600 text-xs font-bold uppercase tracking-wider">Elige tu Avatar</h4>
        <div class="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {#each avatars as avatar}
            <button 
              type="button"
              class="bg-gray-50 border-2 border-transparent p-1 rounded-xl cursor-pointer transition-all aspect-square flex items-center justify-center
                     hover:border-dgt-300
                     {selectedAvatar === avatar ? 'border-dgt-500 bg-dgt-100 scale-105' : ''}"
              on:click={() => selectedAvatar = avatar}
            >
              <img src={avatar} alt="Avatar" class="w-full h-full object-contain" />
            </button>
          {/each}
          
          <label class="flex flex-col items-center justify-center bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer transition-all aspect-square overflow-hidden text-center
                        {selectedAvatar === customAvatar ? 'border-dgt-500 bg-dgt-100 border-solid scale-105' : ''}">
            <input type="file" accept="image/*" on:change={handleFileUpload} class="hidden" />
            {#if customAvatar}
              <img src={customAvatar} alt="Custom" class="w-full h-full object-cover" />
            {:else}
              <span class="text-lg">📷</span>
              <span class="text-[10px] text-gray-500 font-bold mt-1 px-1">Subir foto</span>
            {/if}
          </label>
        </div>
      </div>
    
    <div class="mb-6 text-left">
      <label for="goal" class="block mb-2 font-semibold text-warm-600">¿Cuántas tarjetas Anki quieres hacer al día?</label>
      <input type="number" id="goal" bind:value={dailyGoal} min="1"
             class="w-full p-3 border-2 border-gray-100 rounded-xl text-base transition-all box-border
                    focus:border-dgt-500 focus:outline-none" />
    </div>

    <div class="mb-6 text-left">
      <label for="examGoal" class="block mb-2 font-semibold text-warm-600">¿Cuántos exámenes quieres hacer al día?</label>
      <input type="number" id="examGoal" bind:value={dailyExamGoal} min="1"
             class="w-full p-3 border-2 border-gray-100 rounded-xl text-base transition-all box-border
                    focus:border-dgt-500 focus:outline-none" />
    </div>
    
    <button class="w-full p-4 bg-dgt-500 text-white border-none rounded-xl text-lg font-bold cursor-pointer transition-all mt-4
                   hover:bg-dgt-600 hover:-translate-y-0.5 hover:shadow-[0_10px_20px_rgba(143,179,57,0.2)]
                   disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:hover:transform-none disabled:hover:bg-gray-300"
            on:click={register} disabled={!name}>¡Empezar!</button>
  </div>
</div>

<style>
  input[type="number"] {
    -moz-appearance: textfield;
  }
  input[type="number"]::-webkit-outer-spin-button,
  input[type="number"]::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
</style>
