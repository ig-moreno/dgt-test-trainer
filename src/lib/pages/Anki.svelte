<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();
  import { fade, fly, scale } from 'svelte/transition';
  import { db, type AnkiCard, type Question } from '../db';
  import { questions, user, refreshData, stats, history } from '../stores';
  import { sm2 } from '../anki';
  import confetti from 'canvas-confetti';
  import GoalSummaryModal from '../components/GoalSummaryModal.svelte';
  import AnkiCard from '../components/AnkiCard.svelte';
  import { BookOpen, CheckCircle, XCircle, ChevronRight } from 'lucide-svelte';
  
  let currentCard: AnkiCard | null = null;
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

<div class="anki-page">
  {#if showSummary}
    <GoalSummaryModal 
      {sessionResults} 
      totalHistoryCount={historyAnki.length}
      {historyAccuracy}
      on:close={() => showSummary = false}
      on:home={() => dispatch('home')}
    />
  {/if}

  <div class="anki-container">
    <div class="goal-pills">
      <div class="pill">
        <span class="label">Hoy:</span>
        <span class="value">{$stats.ankiToday} / {$user?.dailyGoal}</span>
      </div>
      {#if $user && $stats.ankiToday >= $user.dailyGoal}
        <div class="pill success" in:scale>¡Objetivo cumplido! 🥳</div>
      {/if}
    </div>

    {#if loading}
      <div class="loading-state">Cargando mazo...</div>
    {:else if currentQuestion}
      <div class="card-stack">
        <!-- Decoration cards for stack effect -->
        <div class="stack-bg card-2"></div>
        <div class="stack-bg card-1"></div>

        {#key currentQuestion.id}
          <AnkiCard 
            question={currentQuestion} 
            {counts} 
            on:rate={handleRate} 
          />
        {/key}
      </div>
    {:else}
      <div class="empty-stack">
        <BookOpen size={48} />
        <h2>¡Mazo completado!</h2>
        <p>No tienes más tarjetas pendientes para hoy.</p>
        <button class="home-btn" on:click={() => dispatch('home')}>Volver al inicio</button>
      </div>
    {/if}
  </div>
</div>

<style>
  .anki-page {
    min-height: calc(100vh - 100px);
    display: flex;
    justify-content: center;
    padding: 2rem;
  }

  .anki-container {
    width: 100%;
    max-width: 700px;
    display: flex;
    flex-direction: column;
  }

  .goal-pills {
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .pill {
    background: white;
    padding: 0.5rem 1rem;
    border-radius: 20px;
    box-shadow: 0 4px 10px rgba(0,0,0,0.05);
    font-size: 0.9rem;
    font-weight: 600;
  }

  .pill.success {
    background: #8fb339;
    color: white;
  }

  .card-stack {
    position: relative;
    min-height: 750px;
    height: auto;
    width: 100%;
    margin-bottom: 3rem;
  }

  .stack-bg {
    position: absolute;
    width: 100%;
    height: 100%;
    background: white;
    border-radius: 30px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.05);
    border: 1px solid #f1f5f9;
  }

  .card-1 { transform: translateY(15px) scale(0.96); z-index: 1; opacity: 0.7; }
  .card-2 { transform: translateY(30px) scale(0.92); z-index: 0; opacity: 0.4; }

  .anki-card-container {
    position: relative; /* Changed from absolute to allow natural growth if needed */
    width: 100%;
    min-height: 700px;
    background: white;
    border-radius: 30px;
    box-shadow: 0 20px 50px rgba(0,0,0,0.1);
    border: 1px solid #f1f5f9;
    z-index: 10;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  /* When cards are absolute for the stack effect, we need a way to stack them properly */
  .card-stack .anki-card-container {
    position: absolute;
    top: 0;
    left: 0;
  }

  .card-header {
    padding: 1.5rem 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #f8fafc;
    background: #fcfcfc;
  }

  .category {
    font-weight: 800;
    color: #94a3b8;
    text-transform: uppercase;
    font-size: 0.75rem;
    letter-spacing: 0.1em;
  }

  .result-badge span {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-weight: 700;
    font-size: 0.9rem;
  }
  .correct { color: #166534; }
  .incorrect { color: #991b1b; }

  .card-body {
    flex: 1;
    padding: 2rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    overflow-y: auto; /* Enable scroll if content is too long */
  }

  .question-section h3 {
    font-size: 1.5rem;
    color: #1e293b;
    line-height: 1.4;
    margin: 0;
  }

  .image-box {
    width: 100%;
    background: #f1f5f9;
    border-radius: 20px;
    padding: 0.8rem;
    box-sizing: border-box;
  }

  .image-box img {
    width: 100%;
    max-height: 250px;
    object-fit: contain;
    border-radius: 12px;
    display: block;
  }

  .options-grid {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .opt-btn {
    display: flex;
    align-items: center;
    gap: 1.2rem;
    text-align: left;
    padding: 1.2rem;
    background: #f8fafc;
    border: 2px solid #e2e8f0;
    border-radius: 18px;
    transition: all 0.2s;
    cursor: pointer;
    width: 100%;
    box-sizing: border-box;
  }

  .opt-btn:hover {
    background: #f1f5f9;
    border-color: #8fb339;
    transform: translateX(8px);
  }

  .letter {
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    background: #cbd5e1;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 900;
    font-size: 0.9rem;
    color: #1e293b; /* Dark text for contrast */
  }

  .opt-btn .text {
    font-size: 1.1rem;
    font-weight: 600;
    color: #334155; /* Dark grey text */
    line-height: 1.4;
  }

  .correction-view {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }

  .correction-item {
    padding: 1.2rem;
    border-radius: 16px;
    background: #f8fafc;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 1rem;
    color: #475569;
    border: 2px solid transparent;
  }

  .correction-item.correct { background: #f0fdf4; color: #166534; border-color: #bbf7d0; }
  .correction-item.wrong { background: #fef2f2; color: #991b1b; border-color: #fecaca; }

  .correction-item .letter {
    background: rgba(0,0,0,0.05);
  }

  .explanation-box {
    margin-top: 1rem;
    padding: 1.5rem;
    background: #fffbeb;
    border-radius: 20px;
    border-left: 5px solid #f59e0b;
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.1);
  }

  .explanation-box strong { color: #92400e; font-size: 1rem; display: block; margin-bottom: 0.5rem; }
  .explanation-box p { font-size: 0.95rem; color: #b45309; line-height: 1.6; margin: 0; }

  .card-footer {
    padding: 2rem;
    background: #f8fafc;
    border-top: 1px solid #f1f5f9;
    margin-top: auto;
  }

  .rating-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.8rem;
  }

  .r-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 0.8rem 0.4rem;
    border-radius: 14px;
    transition: all 0.2s;
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 5px rgba(0,0,0,0.05);
  }

  .r-btn .name { font-size: 0.8rem; font-weight: 800; text-transform: uppercase; margin-bottom: 2px; }
  .r-btn .count { font-size: 0.7rem; opacity: 0.8; font-weight: 700; }

  .r0 { background: #fee2e2; color: #991b1b; }
  .r2 { background: #fff7ed; color: #9a3412; }
  .r3 { background: #f0fdf4; color: #166534; }
  .r5 { background: #ecfdf5; color: #065f46; }

  .r-btn:hover { transform: translateY(-5px); box-shadow: 0 8px 15px rgba(0,0,0,0.1); }

  .footer-tip {
    text-align: center;
    color: #94a3b8;
    font-size: 0.9rem;
    font-weight: 700;
  }

  .empty-stack {
    text-align: center;
    padding: 5rem 2rem;
    background: white;
    border-radius: 30px;
    box-shadow: 0 20px 50px rgba(0,0,0,0.1);
  }

  .home-btn {
    background: #8fb339;
    color: white;
    padding: 1.2rem 2.5rem;
    border-radius: 16px;
    font-weight: 800;
    font-size: 1.1rem;
    cursor: pointer;
    border: none;
    transition: all 0.2s;
  }

  .home-btn:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 20px rgba(143, 179, 57, 0.3);
  }
</style>
