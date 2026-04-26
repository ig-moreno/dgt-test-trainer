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

<div class="dialog-backdrop" transition:fade on:click={() => dispatch('cancel')}>
  <div class="dialog-content" transition:scale|local={{start: 0.95}} on:click|stopPropagation>
    <div class="icon-header {type}">
      {#if type === 'danger'} ⚠️ {:else if type === 'warning'} ❓ {:else} ℹ️ {/if}
    </div>
    <h2>{title}</h2>
    <p>{message}</p>
    <div class="dialog-actions">
      <button class="cancel-btn" on:click={() => dispatch('cancel')}>{cancelText}</button>
      <button class="confirm-btn {type}" on:click={() => dispatch('confirm')}>{confirmText}</button>
    </div>
  </div>
</div>

<style>
  .dialog-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    backdrop-filter: blur(4px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 2000;
  }

  .dialog-content {
    background: white;
    padding: 2rem;
    border-radius: 20px;
    width: 90%;
    max-width: 400px;
    text-align: center;
    box-shadow: 0 15px 40px rgba(0,0,0,0.2);
  }

  .icon-header {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  h2 { margin: 0 0 0.5rem; color: #1f2937; }
  p { color: #6b7280; margin-bottom: 2rem; line-height: 1.5; }

  .dialog-actions {
    display: flex;
    gap: 1rem;
  }

  button {
    flex: 1;
    padding: 0.8rem;
    border: none;
    border-radius: 10px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
  }

  .cancel-btn { background: #f3f4f6; color: #4b5563; }
  .cancel-btn:hover { background: #e5e7eb; }

  .confirm-btn.danger { background: #fee2e2; color: #b91c1c; }
  .confirm-btn.danger:hover { background: #fecaca; }

  .confirm-btn.warning { background: #fffbeb; color: #92400e; }
  .confirm-btn.warning:hover { background: #fef3c7; }
</style>
