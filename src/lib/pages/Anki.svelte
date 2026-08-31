<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();
  import { scale } from 'svelte/transition';
  import { db, type AnkiCard as AnkiCardDB, type Question } from '../db';
  import { questions, user, refreshData, stats, history } from '../stores';
  import { sm2 } from '../anki';
  import confetti from 'canvas-confetti';
  import GoalSummaryModal from '../components/GoalSummaryModal.svelte';
  import AnkiCard from '../components/AnkiCard.svelte';
  import { BookOpen } from 'lucide-svelte';
  
  let currentCard: AnkiCardDB | null = null;
  let currentQuestion: Question | null = null;
  let loading = true;
  
  let sessionResults: { correct: boolean, quality: number }[] = [];
  let showSummary = false;

  // Celebrate goal reached
  $: if ($user && $stats.ankiToday >= $user.dailyGoal) {
    const lastCelebrated = $user.lastGoalCelebration ? new Date($user.lastGoalCelebration) : null;
    const today = new Date();
    today.setHours(0,0,0,0);
    
    if (!lastCelebrated || lastCelebrated < today) {
      celebrate();
      showSummary = true;
      db.users.update($user.id!, { lastGoalCelebration: new Date() }).then(() => {
        refreshData();
      });
    }
  }

  onMount(async () => {
    await nextCard();
    loading = false;
  });

  function celebrate() {
    confetti({ 
      particleCount: 100, 
      spread: 70, 
      origin: { y: 0.6 },
      zIndex: 3000 
    });
  }

  async function nextCard() {
    const now = new Date();
    
    let card = await db.ankiCards.where('dueDate').below(now).first();
    
    if (!card) {
      const existingIds = (await db.ankiCards.toArray()).map(c => c.questionId);
      const availableIds = $questions.map((_, i) => i).filter(id => !existingIds.includes(id));
      
      if (availableIds.length > 0) {
        const randomId = availableIds[Math.floor(Math.random() * availableIds.length)];
        card = {
          questionId: randomId,
          interval: 0,
          repetition: 0,
          easeFactor: 2.5,
          dueDate: new Date()
        };
      } else {
        card = await db.ankiCards.orderBy('dueDate').first();
      }
    }
    
    currentCard = card || null;
    currentQuestion = card ? $questions[card.questionId] : null;
  }


  async function handleRate(e: CustomEvent) {
    const { quality, isCorrect } = e.detail;
    if (!currentCard || !currentQuestion) return;
    
    const result = sm2(quality, currentCard.interval, currentCard.repetition, currentCard.easeFactor);
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + result.interval);
    
    const updatedCard = { ...currentCard, ...result, dueDate };
    
    if (currentCard.id) await db.ankiCards.put(updatedCard);
    else await db.ankiCards.add(updatedCard);
    
    sessionResults = [...sessionResults, { correct: isCorrect, quality }];

    await db.history.add({
      date: new Date(),
      type: 'anki',
      referenceId: currentCard.questionId,
      correct: isCorrect,
      quality
    });
    
    await refreshData();
    await nextCard();
  }

  $: historyAnki = $history.filter(h => h.type === 'anki');
  $: historyCorrect = historyAnki.filter(h => h.correct).length;
  $: historyAccuracy = historyAnki.length > 0 ? (historyCorrect / historyAnki.length) * 100 : 0;

  function getCorrectIndex(correct: any): number {
    // The data mapping uses 0, 1, 2 for A, B, C
    if (correct === 0 || correct === "0") return 1;
    if (correct === 1 || correct === "1") return 2;
    if (correct === 2 || correct === "2") return 3;

    // Fallback for letters
    if (typeof correct === 'string') {
      const lower = correct.toLowerCase();
      if (lower === 'a') return 1;
      if (lower === 'b') return 2;
      if (lower === 'c') return 3;
    }
    
    return 1; // Default to A
  }

  $: qHistory = $history.filter(h => h.type === 'anki' && h.referenceId === currentCard?.questionId);
  $: counts = {
    0: qHistory.filter(h => h.quality === 0).length,
    2: qHistory.filter(h => h.quality === 2).length,
    3: qHistory.filter(h => h.quality === 3).length,
    5: qHistory.filter(h => h.quality === 5).length
  };
  $: if (currentQuestion) {
    const idx = getCorrectIndex(currentQuestion.correct);
    const letter = idx === 1 ? 'A' : idx === 2 ? 'B' : idx === 3 ? 'C' : '?';
    console.log(`%c[DEBUG ANKI] Pregunta ID: ${currentQuestion.id} | Correcta: ${idx} (${letter})`, 'color: #3b82f6; font-weight: bold;');
  }
</script>

<div class="min-h-[calc(100vh-80px)] md:min-h-[calc(100vh-100px)] flex justify-center px-0 md:px-8 py-4 md:py-8">
  {#if showSummary}
    <GoalSummaryModal 
      {sessionResults} 
      totalHistoryCount={historyAnki.length}
      {historyAccuracy}
      on:close={() => showSummary = false}
      on:home={() => dispatch('home')}
    />
  {/if}

  <div class="w-full max-w-[700px] flex flex-col">
    <div class="flex flex-wrap justify-center items-center gap-2 md:gap-4 mb-6">
      <div class="bg-white px-4 py-2 rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.05)] text-sm font-semibold">
        <span class="text-gray-400">Hoy:</span>
        <span class="text-warm-600">{$stats.ankiToday} / {$user?.dailyGoal}</span>
      </div>
      {#if $user && $stats.ankiToday >= $user.dailyGoal}
        <div class="bg-dgt-500 text-white px-4 py-2 rounded-full shadow text-sm font-semibold" in:scale>¡Objetivo cumplido! 🥳</div>
      {/if}
    </div>

    {#if loading}
      <div class="text-center text-gray-400 py-12">Cargando mazo...</div>
    {:else if currentQuestion}
      <div class="relative w-full mb-8">
        <!-- Decoration cards for stack effect -->
        <div class="absolute inset-0 bg-white rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] border border-gray-100
                    translate-y-1 scale-[0.96] opacity-70"></div>
        <div class="absolute inset-0 bg-white rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] border border-gray-100
                    translate-y-2 scale-[0.92] opacity-40"></div>

        {#key currentQuestion.id}
          <AnkiCard 
            question={currentQuestion} 
            {counts} 
            on:rate={handleRate} 
          />
        {/key}
      </div>
    {:else}
      <div class="text-center px-6 py-16 md:py-20 bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)]">
        <BookOpen size={48} class="mx-auto text-gray-300 mb-4" />
        <h2 class="text-2xl font-bold text-warm-600 mb-2">¡Mazo completado!</h2>
        <p class="text-gray-500 mb-6">No tienes más tarjetas pendientes para hoy.</p>
        <button class="bg-dgt-500 text-white font-extrabold text-lg px-8 py-3.5 rounded-2xl border-none cursor-pointer
                       transition-transform hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(143,179,57,0.3)]"
                on:click={() => dispatch('home')}>Volver al inicio</button>
      </div>
    {/if}
  </div>
</div>
