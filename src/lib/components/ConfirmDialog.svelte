<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { fade, scale } from 'svelte/transition';

  export let title = "¿Estás seguro?";
  export let message = "Esta acción no se puede deshacer.";
  export let confirmText = "Confirmar";
  export let cancelText = "Cancelar";
  export let type: 'danger' | 'warning' | 'info' = 'warning';

  const dispatch = createEventDispatcher();
</script>

<div class="fixed top-0 left-0 w-full h-full bg-black/50 backdrop-blur-sm flex items-center justify-center z-[2000] p-4"
     transition:fade on:click={() => dispatch('cancel')}>
  <div class="bg-white p-6 md:p-8 rounded-3xl w-full max-w-[400px] text-center shadow-[0_15px_40px_rgba(0,0,0,0.2)]"
       transition:scale|local={{start: 0.95}} on:click|stopPropagation>
    <div class="text-4xl md:text-5xl mb-4">{#if type === 'danger'} ⚠️ {:else if type === 'warning'} ❓ {:else} ℹ️ {/if}</div>
    <h2 class="m-0 mb-2 text-xl font-bold text-gray-800">{title}</h2>
    <p class="text-gray-500 mb-8 leading-relaxed">{message}</p>
    <div class="flex flex-col gap-3">
      <button class="flex-1 py-3 rounded-full font-bold border-none cursor-pointer transition-all bg-transparent shadow-none text-[var(--color-accent)] hover:opacity-80 hover:bg-transparent"
              on:click={() => dispatch('cancel')}>{cancelText}</button>
      <button class="flex-1 py-3 rounded-full font-bold border-none cursor-pointer transition-all
                     {type === 'danger' ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-amber-50 text-amber-900 hover:bg-amber-100'}"
              on:click={() => dispatch('confirm')}>{confirmText}</button>
    </div>
  </div>
</div>
