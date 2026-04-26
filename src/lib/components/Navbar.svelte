<script lang="ts">
  import { UserCircle, History, BookOpen, LayoutDashboard } from 'lucide-svelte';
  import { user } from '../stores';
  export let activeTab: string = 'home';
  export let onProfileClick: () => void;
</script>

<nav class="navbar">
  <div class="nav-links">
    <button class:active={activeTab === 'home'} on:click={() => activeTab = 'home'}>
      <LayoutDashboard size={20} />
      <span>Inicio</span>
    </button>
    <button class:active={activeTab === 'anki'} on:click={() => activeTab = 'anki'}>
      <BookOpen size={20} />
      <span>Anki</span>
    </button>
    <button class:active={activeTab === 'exams'} on:click={() => activeTab = 'exams'}>
      <BookOpen size={20} />
      <span>Exámenes</span>
    </button>
    <button class:active={activeTab === 'history'} on:click={() => activeTab = 'history'}>
      <History size={20} />
      <span>Histórico</span>
    </button>
  </div>
  
  <div class="user-section">
    <button class="profile-btn" on:click={onProfileClick}>
      {#if $user?.profilePic}
        <img src={$user.profilePic} alt="Perfil" class="nav-avatar" />
      {:else}
        <UserCircle size={24} />
      {/if}
    </button>
  </div>
</nav>

<style>
  .navbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 2rem;
    background-color: #ffffff;
    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .nav-links {
    display: flex;
    gap: 1rem;
  }

  .nav-links button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: transparent;
    color: #5c4b37;
    box-shadow: none;
    padding: 0.5rem 1rem;
    border-radius: 8px;
  }

  .nav-links button.active {
    background-color: #f3f4f6;
    color: #8fb339;
    font-weight: 600;
  }

  .nav-links button:hover {
    background-color: #f9fafb;
    transform: none;
  }

  .profile-btn {
    background: transparent;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: transform 0.2s;
    box-shadow: none;
    border: none;
  }

  .profile-btn:hover {
    transform: scale(1.1);
  }

  .nav-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #8fb339;
  }
</style>
