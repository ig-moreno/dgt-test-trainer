<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { db, type User } from '../db';
  import { stats } from '../stores';
  import { X, Award, BookOpen, CheckCircle, UserCircle } from 'lucide-svelte';
  
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

<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4" on:click|self={() => dispatch('close')}>
  <div class="bg-white p-6 md:p-10 rounded-3xl w-full max-w-[450px] max-h-[90vh] overflow-y-auto relative text-center shadow-[0_15px_40px_rgba(0,0,0,0.2)]">
    <button class="absolute top-4 right-4 bg-transparent text-gray-400 p-1 shadow-none" on:click={() => dispatch('close')}><X size={24} /></button>
    
    {#if !confirmingDelete}
      <div>
        {#if user.profilePic}
          <img src={user.profilePic} alt="Profile" class="w-28 h-28 rounded-full object-cover border-4 border-dgt-100 mb-6 shadow-[0_8px_20px_rgba(0,0,0,0.1)] mx-auto" />
        {:else}
          <div class="w-28 h-28 rounded-full border-4 border-dgt-100 mb-6 shadow-[0_8px_20px_rgba(0,0,0,0.1)] mx-auto flex items-center justify-center bg-gray-100 text-gray-400"><UserCircle size={56} /></div>
        {/if}
        <h2 class="m-0 text-2xl font-bold text-warm-600">{user.name}</h2>
        <p class="text-sm text-gray-400 mt-2">Miembro desde {new Date(user.registrationDate).toLocaleDateString()}</p>
      </div>
      
      <div class="grid grid-cols-3 gap-3 my-8 p-4 md:p-6 bg-gray-50 rounded-3xl">
        <div class="flex flex-col items-center gap-2">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center mb-1 bg-indigo-100 text-indigo-600"><BookOpen size={18} /></div>
          <span class="text-xl font-extrabold text-gray-800">{$stats.totalAnki}</span>
          <span class="text-[10px] text-gray-500 font-bold uppercase tracking-wide">Total Anki</span>
        </div>
        <div class="flex flex-col items-center gap-2">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center mb-1 bg-orange-100 text-orange-600"><Award size={18} /></div>
          <span class="text-xl font-extrabold text-gray-800">{$stats.totalExams}</span>
          <span class="text-[10px] text-gray-500 font-bold uppercase tracking-wide">Exámenes</span>
        </div>
        <div class="flex flex-col items-center gap-2">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center mb-1 bg-green-100 text-green-600"><CheckCircle size={18} /></div>
          <span class="text-xl font-extrabold text-gray-800">{$stats.avgScore.toFixed(1)}</span>
          <span class="text-[10px] text-gray-500 font-bold uppercase tracking-wide">Media</span>
        </div>
      </div>
      
      <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wide text-center mb-2">Objetivo</p>
      <div class="flex justify-center gap-3 mb-8">
        <div class="bg-gray-100 px-4 py-2 rounded-xl text-sm text-gray-500">
          <strong class="text-gray-800 font-extrabold">{user.dailyGoal ?? 0}</strong> Anki/día
        </div>
        <div class="bg-gray-100 px-4 py-2 rounded-xl text-sm text-gray-500">
          <strong class="text-gray-800 font-extrabold">{user.dailyExamGoal ?? 0}</strong> Exámenes/día
        </div>
      </div>
      
      <div class="mt-6">
        <button class="w-full bg-transparent text-red-500 border-2 border-red-100 py-4 rounded-xl font-bold cursor-pointer transition-all hover:bg-red-50"
                on:click={() => confirmingDelete = true}>Borrar mis datos</button>
      </div>
    {:else}
      <div>
        <h3 class="text-red-500 font-bold text-xl mb-4">¿Borrar todo el progreso?</h3>
        <p class="text-sm text-gray-500 mb-8 leading-relaxed">Esta acción eliminará tu perfil, todos tus exámenes realizados y tu progreso en tarjetas ANKI. Esta acción es irreversible.</p>
        <div class="flex flex-col gap-3">
          <button class="bg-red-500 text-white py-3 rounded-xl font-bold border-none cursor-pointer hover:bg-red-600" on:click={deleteData}>Sí, borrar todo</button>
          <button class="bg-gray-100 text-warm-600 py-3 rounded-xl font-bold border-none cursor-pointer hover:bg-gray-200 shadow-none" on:click={() => confirmingDelete = false}>No, cancelar</button>
        </div>
      </div>
    {/if}
  </div>
</div>
