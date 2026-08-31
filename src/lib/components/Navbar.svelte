<script lang="ts">
  import { UserCircle, History, BookOpen, LayoutDashboard, Menu, X } from 'lucide-svelte';
  import { user } from '../stores';
  export let activeTab: string = 'home';
  export let onProfileClick: () => void;

  let menuOpen = false;

  function go(tab: string) {
    activeTab = tab;
    menuOpen = false;
  }
</script>

<nav class="sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm">
  <!-- Top bar -->
  <div class="flex justify-between items-center px-4 md:px-6 py-2.5 md:py-3 relative">
    <!-- Left: hamburger (mobile) / logo (desktop) -->
    <div class="flex items-center flex-1 gap-2">
      <!-- Hamburger (mobile only) -->
      <button class="md:hidden bg-transparent p-1.5 rounded-lg text-warm-600 shadow-none
                     hover:bg-gray-100 hover:transform-none"
              on:click={() => menuOpen = !menuOpen}
              aria-label={menuOpen ? 'Cerrar menÃº' : 'Abrir menÃº'}>
        {#if menuOpen}
          <X size={22} />
        {:else}
          <Menu size={22} />
        {/if}
      </button>

      <!-- Logo (desktop only, left side) -->
      <div class="hidden md:flex items-center gap-2 font-extrabold text-dgt-600 select-none">
        <span class="text-lg">🚗</span>
        <span class="text-base">DGT Trainer</span>
      </div>
    </div>

    <!-- Center: logo (centered on mobile) -->
    <div class="absolute left-1/2 -translate-x-1/2 flex md:hidden items-center gap-2 font-extrabold text-dgt-600 select-none">
      <span class="text-lg">🚗</span>
      <span class="text-base">DGT Test Trainer</span>
    </div>

    <!-- Desktop links -->
    <div class="hidden md:flex flex-1 justify-center gap-2">
      <button class="flex items-center gap-2 bg-transparent text-warm-600 shadow-none px-4 py-2 rounded-lg
                     hover:bg-gray-100 hover:transform-none
                     {activeTab === 'home' ? 'bg-gray-100 text-[var(--color-accent)] font-semibold' : ''}"
              on:click={() => go('home')}>
        <LayoutDashboard size={20} />
        <span>Inicio</span>
      </button>
      <button class="flex items-center gap-2 bg-transparent text-warm-600 shadow-none px-4 py-2 rounded-lg
                     hover:bg-gray-100 hover:transform-none
                     {activeTab === 'anki' ? 'bg-gray-100 text-[var(--color-accent)] font-semibold' : ''}"
              on:click={() => go('anki')}>
        <BookOpen size={20} />
        <span>Anki</span>
      </button>
      <button class="flex items-center gap-2 bg-transparent text-warm-600 shadow-none px-4 py-2 rounded-lg
                     hover:bg-gray-100 hover:transform-none
                     {activeTab === 'exams' ? 'bg-gray-100 text-[var(--color-accent)] font-semibold' : ''}"
              on:click={() => go('exams')}>
        <BookOpen size={20} />
        <span>Exámenes</span>
      </button>
      <button class="flex items-center gap-2 bg-transparent text-warm-600 shadow-none px-4 py-2 rounded-lg
                     hover:bg-gray-100 hover:transform-none
                     {activeTab === 'history' ? 'bg-gray-100 text-[var(--color-accent)] font-semibold' : ''}"
              on:click={() => go('history')}>
        <History size={20} />
        <span>Histórico</span>
      </button>
    </div>

    <!-- Profile -->
    <button class="bg-transparent p-0 flex items-center justify-center rounded-full
                   transition-transform hover:scale-110 shadow-none border-none"
            on:click={onProfileClick}>
      {#if $user?.profilePic}
        <img src={$user.profilePic} alt="Perfil" class="w-8 h-8 md:w-9 md:h-9 rounded-full object-cover border-2 border-dgt-500" />
      {:else}
        <UserCircle size={22} />
      {/if}
    </button>
  </div>

  <!-- Mobile dropdown menu -->
  {#if menuOpen}
    <div class="md:hidden bg-white border-t border-gray-100 shadow-lg">
      <div class="flex flex-col px-3 py-3 gap-1">
        <button class="flex items-center gap-3 bg-transparent text-warm-600 shadow-none px-4 py-3 rounded-xl text-left
                       hover:bg-gray-50 hover:transform-none
                       {activeTab === 'home' ? 'bg-dgt-50 text-[var(--color-accent)] font-semibold' : ''}"
                on:click={() => go('home')}>
          <LayoutDashboard size={20} />
          <span>Inicio</span>
        </button>
        <button class="flex items-center gap-3 bg-transparent text-warm-600 shadow-none px-4 py-3 rounded-xl text-left
                       hover:bg-gray-50 hover:transform-none
                       {activeTab === 'anki' ? 'bg-dgt-50 text-[var(--color-accent)] font-semibold' : ''}"
                on:click={() => go('anki')}>
          <BookOpen size={20} />
          <span>Anki</span>
        </button>
        <button class="flex items-center gap-3 bg-transparent text-warm-600 shadow-none px-4 py-3 rounded-xl text-left
                       hover:bg-gray-50 hover:transform-none
                       {activeTab === 'exams' ? 'bg-dgt-50 text-[var(--color-accent)] font-semibold' : ''}"
                on:click={() => go('exams')}>
          <BookOpen size={20} />
          <span>Exámenes</span>
        </button>
        <button class="flex items-center gap-3 bg-transparent text-warm-600 shadow-none px-4 py-3 rounded-xl text-left
                       hover:bg-gray-50 hover:transform-none
                       {activeTab === 'history' ? 'bg-dgt-50 text-[var(--color-accent)] font-semibold' : ''}"
                on:click={() => go('history')}>
          <History size={20} />
          <span>Histórico</span>
        </button>
      </div>
    </div>
  {/if}
</nav>
