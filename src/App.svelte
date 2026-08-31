<script lang="ts">
  import { onMount } from 'svelte';
  import { user, loading, initApp, examMode } from './lib/stores';
  import Navbar from './lib/components/Navbar.svelte';
  import ExamTopBar from './lib/components/ExamTopBar.svelte';
  import Onboarding from './lib/components/Onboarding.svelte';
  import Anki from './lib/pages/Anki.svelte';
  import Exams from './lib/pages/Exams.svelte';
  import History from './lib/pages/History.svelte';
  import Dashboard from './lib/pages/Dashboard.svelte';
  import UserProfileModal from './lib/components/UserProfileModal.svelte';

  let activeTab = 'home';
  let showProfileModal = false;

  onMount(async () => {
    await initApp();
  });

  function handleProfileClick() {
    showProfileModal = true;
  }
</script>

{#if $loading}
  <div class="flex justify-center items-center h-screen text-xl text-dgt-500">Cargando...</div>
{:else if !$user}
  <Onboarding on:registered={initApp} />
{:else}
  <div class="min-h-screen flex flex-col">
    {#if $examMode.active && !$examMode.finished}
      <ExamTopBar />
    {:else}
      <Navbar bind:activeTab onProfileClick={handleProfileClick} />
    {/if}
    
    <main class="flex-1 w-full max-w-[1200px] mx-auto px-4 py-6 md:px-8 md:py-8">
      {#if activeTab === 'home'}
        <Dashboard on:navigate={(e) => activeTab = e.detail} />
      {:else if activeTab === 'anki'}
        <Anki on:home={() => activeTab = 'home'} />
      {:else if activeTab === 'exams'}
        <Exams />
      {:else if activeTab === 'history'}
        <History />
      {/if}
    </main>

    {#if showProfileModal}
      <UserProfileModal user={$user} on:close={() => showProfileModal = false} on:deleted={initApp} />
    {/if}
  </div>
{/if}
