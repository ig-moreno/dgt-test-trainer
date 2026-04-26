<script lang="ts">
  import { onMount } from 'svelte';
  import { user, loading, initApp } from './lib/stores';
  import Navbar from './lib/components/Navbar.svelte';
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
  <div class="loader">Cargando...</div>
{:else if !$user}
  <Onboarding on:registered={initApp} />
{:else}
  <div class="app-container">
    <Navbar bind:activeTab onProfileClick={handleProfileClick} />
    
    <main class="content">
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

<style>
  .loader {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    font-size: 1.5rem;
    color: #8fb339;
  }

  .app-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .content {
    flex: 1;
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
    padding: 2rem;
  }
</style>
