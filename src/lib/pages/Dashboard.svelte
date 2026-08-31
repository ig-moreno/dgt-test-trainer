<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { user, stats } from '../stores';
  
  const dispatch = createEventDispatcher();
</script>

<div class="animate-[fadeIn_0.5s_ease-out] flex flex-col gap-6 md:gap-8">
  <div>
    <h1 class="text-3xl md:text-4xl mb-1 text-warm-600">¡Hola, {$user?.name}! 👋</h1>
    <p class="text-warm-400 text-base md:text-lg">¿Qué vamos a practicar hoy?</p>
  </div>
  
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
    <div class="bg-white p-4 md:p-5 rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.05)] text-center
                cursor-pointer transition-transform duration-200 hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(0,0,0,0.1)]
                hover:border-dgt-500 border border-transparent"
         on:click={() => dispatch('navigate', 'anki')}>
      <h3 class="font-semibold text-warm-600 mb-2">Meta de Anki</h3>
      <div>
        <span class="text-lg font-bold text-dgt-500">{$stats.ankiToday} / {$user?.dailyGoal}</span>
        <div class="h-2.5 bg-gray-100 rounded mt-2 overflow-hidden">
          <div class="h-full bg-dgt-500 transition-[width] duration-500"
               style="width: {Math.min(100, ($stats.ankiToday / ($user?.dailyGoal || 1)) * 100)}%"></div>
        </div>
      </div>
      <p class="text-xs text-gray-400 mt-2">Tarjetas diarias</p>
    </div>

    <div class="bg-white p-4 md:p-5 rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.05)] text-center
                cursor-pointer transition-transform duration-200 hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(0,0,0,0.1)]
                hover:border-dgt-500 border border-transparent"
         on:click={() => dispatch('navigate', 'exams')}>
      <h3 class="font-semibold text-warm-600 mb-2">Meta de Exámenes</h3>
      <div>
        <span class="text-lg font-bold text-dgt-500">{$stats.examsToday} / {$user?.dailyExamGoal || 2}</span>
        <div class="h-2.5 bg-gray-100 rounded mt-2 overflow-hidden">
          <div class="h-full bg-blue-600 transition-[width] duration-500"
               style="width: {Math.min(100, ($stats.examsToday / ($user?.dailyExamGoal || 1)) * 100)}%"></div>
        </div>
      </div>
      <p class="text-xs text-gray-400 mt-2">Simulacros diarios</p>
    </div>
    
    <div class="bg-white p-4 md:p-5 rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.05)] text-center
                cursor-pointer transition-transform duration-200 hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(0,0,0,0.1)]
                hover:border-dgt-500 border border-transparent"
         on:click={() => dispatch('navigate', 'exams')}>
      <h3 class="font-semibold text-warm-600 mb-2">Exámenes Realizados</h3>
      <span class="block text-4xl md:text-5xl font-extrabold text-warm-600 mt-2">{$stats.totalExams}</span>
      <p class="text-xs text-gray-400 mt-2">Ver mis exámenes</p>
    </div>
    
    <div class="bg-white p-4 md:p-5 rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.05)] text-center
                cursor-pointer transition-transform duration-200 hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(0,0,0,0.1)]
                hover:border-dgt-500 border border-transparent"
         on:click={() => dispatch('navigate', 'history')}>
      <h3 class="font-semibold text-warm-600 mb-2">Puntuación Media</h3>
      <span class="block text-4xl md:text-5xl font-extrabold text-warm-600 mt-2">{$stats.avgScore.toFixed(1)}</span>
      <p class="text-xs text-gray-400 mt-2">Ver evolución</p>
    </div>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 w-full max-w-[1000px] mx-auto">
    <button class="flex items-center gap-5 md:gap-8 p-6 md:p-10 min-h-[160px] md:min-h-[220px] border-none
                   rounded-3xl cursor-pointer w-full text-left
                   shadow-[0_10px_25px_rgba(0,0,0,0.1)]
                   transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_15px_30px_rgba(0,0,0,0.15)]
                   bg-gradient-to-br from-dgt-500 to-dgt-700 text-white"
            on:click={() => dispatch('navigate', 'anki')}>
      <div class="text-3xl md:text-5xl bg-white/20 w-14 h-14 md:w-20 md:h-20 flex items-center justify-center rounded-2xl flex-shrink-0">📚</div>
      <div class="text-left">
        <h3 class="text-xl md:text-3xl font-semibold mb-1">Sesión diaria</h3>
        <p class="opacity-90 text-sm md:text-lg">Completa tus tarjetas de hoy y alcanza tu objetivo</p>
      </div>
    </button>

    <button class="flex items-center gap-5 md:gap-8 p-6 md:p-10 min-h-[160px] md:min-h-[220px] border-none
                   rounded-3xl cursor-pointer w-full text-left
                   shadow-[0_10px_25px_rgba(0,0,0,0.1)]
                   transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_15px_30px_rgba(0,0,0,0.15)]
                   bg-gradient-to-br from-blue-600 to-blue-800 text-white"
            on:click={() => dispatch('navigate', 'exams')}>
      <div class="text-3xl md:text-5xl bg-white/20 w-14 h-14 md:w-20 md:h-20 flex items-center justify-center rounded-2xl flex-shrink-0">📝</div>
      <div class="text-left">
        <h3 class="text-xl md:text-3xl font-semibold mb-1">Realizar examen</h3>
        <p class="opacity-90 text-sm md:text-lg">Ponte a prueba con un simulacro oficial</p>
      </div>
    </button>
  </div>
</div>

<style>
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
</style>
