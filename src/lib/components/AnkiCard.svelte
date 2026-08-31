<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { CheckCircle, XCircle } from 'lucide-svelte';
  import type { Question } from '../db';

  export let question: Question;
  export let counts: Record<number, number>;

  const dispatch = createEventDispatcher();

  let showAnswer = false;
  let selectedOption: number | null = null;

  function handleOptionClick(index: number) {
    if (showAnswer) return;
    selectedOption = index;
    showAnswer = true;
  }

  function getCorrectIndex(correct: any): number {
    if (correct === 0 || correct === "0") return 1;
    if (correct === 1 || correct === "1") return 2;
    if (correct === 2 || correct === "2") return 3;
    if (typeof correct === 'string') {
      const lower = correct.toLowerCase();
      if (lower === 'a') return 1;
      if (lower === 'b') return 2;
      if (lower === 'c') return 3;
    }
    return 1;
  }

  function handleRate(quality: number) {
    const isCorrect = Number(selectedOption) === (getCorrectIndex(question.correct) - 1);
    dispatch('rate', { quality, isCorrect, selectedOption });
  }

  $: correctIdx = getCorrectIndex(question.correct);
</script>

<div 
  class="relative w-full min-h-[600px] md:min-h-[700px] bg-white rounded-[30px] md:rounded-[30px]
         shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-gray-50 z-10 flex flex-col overflow-hidden"
  in:fly={{ y: 50, duration: 400, delay: 200 }} 
  out:fly={{ y: -150, opacity: 0, duration: 300 }}
>
  <div class="px-5 md:px-8 py-4 md:py-6 flex justify-between items-center border-b border-gray-50 bg-[#fcfcfc]">
    <span class="font-extrabold text-gray-400 uppercase tracking-widest text-xs">{question.category || 'General'}</span>
    {#if showAnswer}
      <div in:fade>
        {#if Number(selectedOption) === (correctIdx - 1)}
          <span class="flex items-center gap-1.5 font-bold text-sm text-green-800"><CheckCircle size={14} /> Correcto</span>
        {:else}
          <span class="flex items-center gap-1.5 font-bold text-sm text-red-800"><XCircle size={14} /> Incorrecto</span>
        {/if}
      </div>
    {/if}
  </div>

  <div class="flex-1 px-5 md:px-8 py-5 md:py-8 flex flex-col gap-5 overflow-y-auto">
    <div>
      <h3 class="text-xl md:text-2xl text-slate-800 leading-relaxed">{question.question}</h3>
      {#if question.img}
        <div class="w-full bg-slate-100 rounded-3xl p-2.5 box-border mt-4">
          <img src={"./anki-img/" + question.img} alt="Pregunta" class="w-full max-h-60 object-contain rounded-2xl block" />
        </div>
      {/if}
    </div>

    <div class="flex flex-col gap-3 md:gap-4" class:revealed={showAnswer}>
      {#each [
        { key: 'a', label: 'A', text: question.a, index: 0 },
        { key: 'b', label: 'B', text: question.b, index: 1 },
        { key: 'c', label: 'C', text: question.c, index: 2 }
      ] as opt}
        <button 
          class="flex items-center gap-3 md:gap-5 text-left px-4 md:px-6 py-3.5 md:py-5 bg-gray-50 md:border-2 border-gray-200 rounded-2xl
                 transition-all duration-300 cursor-pointer w-full box-border relative
                 not-disabled:hover:bg-gray-100 not-disabled:md:hover:border-dgt-500 not-disabled:hover:translate-x-2
                 {showAnswer && correctIdx === (opt.index + 1) ? 'bg-green-50 md:border-green-500 text-green-800 scale-[1.02] z-[2]' : ''}
                 {showAnswer && selectedOption === opt.index && correctIdx !== (opt.index + 1) ? 'bg-red-50 md:border-red-500 text-red-800' : ''}
                 {showAnswer && selectedOption !== opt.index && correctIdx !== (opt.index + 1) ? 'opacity-60 grayscale-[0.5] scale-[0.98]' : ''}"
          on:click={() => handleOptionClick(opt.index)}
          disabled={showAnswer}
        >
          <span class="flex-shrink-0 w-8 h-8 bg-slate-300 rounded-full flex items-center justify-center font-black text-base text-slate-800 transition-colors
                       {showAnswer && correctIdx === (opt.index + 1) ? 'bg-green-500 text-white' : ''}
                       {showAnswer && selectedOption === opt.index && correctIdx !== (opt.index + 1) ? 'bg-red-500 text-white' : ''}">
            {opt.label}
          </span>
          <span class="text-base md:text-lg font-semibold text-slate-600 leading-relaxed">{opt.text}</span>
        </button>
      {/each}

      {#if showAnswer && question.explanation}
        <div class="mt-4 p-5 bg-amber-50 rounded-3xl border-l-4 border-amber-500 shadow-[0_4px_12px_rgba(245,158,11,0.1)]" in:fly={{ y: 20 }}>
          <strong class="text-amber-900 text-base block mb-2">¿Por qué?</strong>
          <p class="text-sm text-amber-700 leading-relaxed">{question.explanation}</p>
        </div>
      {/if}
    </div>
  </div>

  <div class="px-5 md:px-8 py-4 md:py-8 bg-gray-50 border-t border-gray-100 mt-auto">
    {#if showAnswer}
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3" in:fade>
        <button class="flex flex-col items-center justify-center py-3 md:py-4 rounded-2xl transition-all cursor-pointer border-none shadow-[0_2px_5px_rgba(0,0,0,0.05)]
                      bg-red-100 text-red-800 hover:-translate-y-1.5 hover:shadow-[0_8px_15px_rgba(0,0,0,0.1)]"
                on:click={() => handleRate(0)}>
          <span class="text-xs font-extrabold uppercase mb-0.5">Fatal</span>
          <span class="text-xs opacity-80 font-bold">{counts[0] || 0}</span>
        </button>
        <button class="flex flex-col items-center justify-center py-3 md:py-4 rounded-2xl transition-all cursor-pointer border-none shadow-[0_2px_5px_rgba(0,0,0,0.05)]
                      bg-orange-50 text-orange-800 hover:-translate-y-1.5 hover:shadow-[0_8px_15px_rgba(0,0,0,0.1)]"
                on:click={() => handleRate(2)}>
          <span class="text-xs font-extrabold uppercase mb-0.5">Difícil</span>
          <span class="text-xs opacity-80 font-bold">{counts[2] || 0}</span>
        </button>
        <button class="flex flex-col items-center justify-center py-3 md:py-4 rounded-2xl transition-all cursor-pointer border-none shadow-[0_2px_5px_rgba(0,0,0,0.05)]
                      bg-green-50 text-green-800 hover:-translate-y-1.5 hover:shadow-[0_8px_15px_rgba(0,0,0,0.1)]"
                on:click={() => handleRate(3)}>
          <span class="text-xs font-extrabold uppercase mb-0.5">Bien</span>
          <span class="text-xs opacity-80 font-bold">{counts[3] || 0}</span>
        </button>
        <button class="flex flex-col items-center justify-center py-3 md:py-4 rounded-2xl transition-all cursor-pointer border-none shadow-[0_2px_5px_rgba(0,0,0,0.05)]
                      bg-emerald-50 text-emerald-800 hover:-translate-y-1.5 hover:shadow-[0_8px_15px_rgba(0,0,0,0.1)]"
                on:click={() => handleRate(5)}>
          <span class="text-xs font-extrabold uppercase mb-0.5">Fácil</span>
          <span class="text-xs opacity-80 font-bold">{counts[5] || 0}</span>
        </button>
      </div>
    {:else}
      <div class="text-center text-gray-400 text-sm font-bold">Elige una opción para ver la respuesta</div>
    {/if}
  </div>
</div>
