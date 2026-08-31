<script lang="ts">
  import { ArrowLeft, X } from 'lucide-svelte';
  import { examMode, examExitRequested, examJumpTo } from '../stores';

  let showJumpModal = false;

  function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  $: urgent = $examMode.timeLeft <= 60 && $examMode.timeLeft > 0;
  $: total = $examMode.total;
  $: answered = $examMode.answered;

  function jumpTo(i: number) {
    examJumpTo.set(i);
    showJumpModal = false;
  }
</script>

<style>
  @keyframes blink-red {
    0%, 100% { color: rgb(185 28 28); }
    50% { color: transparent; }
  }
  .blink-red {
    animation: blink-red 1s step-end infinite;
  }
</style>

<nav class="fixed top-0 inset-x-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm">
  <div class="flex justify-between items-center px-4 md:px-6 h-[54px] md:h-[60px] relative">
    <!-- Left: Salir -->
    <div class="flex-1 flex items-center">
      <button
        class="bg-transparent p-0 flex items-center gap-1.5 text-red-600 shadow-none border-none
               cursor-pointer transition-all hover:opacity-80 hover:transform-none hover:shadow-none active:shadow-none focus:shadow-none"
        on:click={() => examExitRequested.set(true)}
        aria-label="Salir del examen"
      >
        <ArrowLeft size={22} />
        <span class="text-base">Salir</span>
      </button>
    </div>

    <!-- Center: question pill -->
    <div class="absolute left-1/2 -translate-x-1/2 flex items-center">
      <button
        class="bg-gray-100 px-4 py-1.5 rounded-full text-sm text-gray-600 font-semibold whitespace-nowrap tabular-nums
               border-none cursor-pointer hover:bg-gray-200 transition-colors"
        on:click={() => showJumpModal = true}
        aria-label="Saltar a pregunta"
      >
        {$examMode.current} de {$examMode.total}
      </button>
    </div>

    <!-- Right: timer -->
    <div class="flex-1 flex items-center justify-end">
      <span class="flex items-center gap-1.5 text-base font-bold tabular-nums
                   {urgent ? 'blink-red' : 'text-blue-800'}">
        <span>⏱</span>
        {formatTime($examMode.timeLeft)}
      </span>
    </div>
  </div>

  <!-- Mobile progress bar -->
  <div class="md:hidden h-1.5 w-full bg-gray-200">
    <div class="h-full bg-[var(--color-accent)] transition-all duration-300" style="width: {($examMode.total > 0 ? $examMode.current / $examMode.total * 100 : 0)}%"></div>
  </div>
</nav>

<!-- Jump to question modal -->
{#if showJumpModal}
  <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[2000] p-4" on:click={() => showJumpModal = false}>
    <div class="bg-white rounded-3xl w-full max-w-sm shadow-[0_15px_40px_rgba(0,0,0,0.2)] overflow-hidden" on:click|stopPropagation>
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h3 class="text-lg font-bold text-warm-600">Saltar a pregunta:</h3>
        <button class="bg-transparent border-none cursor-pointer text-gray-500 hover:text-gray-700 p-1" on:click={() => showJumpModal = false} aria-label="Cerrar">
          <X size={20} />
        </button>
      </div>
      <div class="p-4 grid grid-cols-5 gap-2 max-h-[60vh] overflow-y-auto">
        {#each Array(total) as _, i}
          <button
            class="flex items-center justify-center h-10 rounded-xl text-sm font-semibold border cursor-pointer transition-colors
                   {i + 1 === $examMode.current
                     ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]'
                     : (answered[i] ? 'bg-white border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-gray-100' : 'bg-gray-100 text-warm-600 border-transparent hover:bg-gray-200')}"
            on:click={() => jumpTo(i)}
          >
            {i + 1}
          </button>
        {/each}
      </div>
    </div>
  </div>
{/if}
