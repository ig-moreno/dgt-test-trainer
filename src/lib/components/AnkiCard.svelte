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
  class="anki-card-container" 
  in:fly={{ y: 50, duration: 400, delay: 200 }} 
  out:fly={{ y: -150, opacity: 0, duration: 300 }}
>
  <div class="card-header">
    <span class="category">{question.category || 'General'}</span>
    {#if showAnswer}
      <div class="result-badge" in:fade>
        {#if Number(selectedOption) === (correctIdx - 1)}
          <span class="correct"><CheckCircle size={14} /> Correcto</span>
        {:else}
          <span class="incorrect"><XCircle size={14} /> Incorrecto</span>
        {/if}
      </div>
    {/if}
  </div>

  <div class="card-body">
    <div class="question-section">
      <h3>{question.question}</h3>
      {#if question.img}
        <div class="image-box">
          <img src={"./anki-img/" + question.img} alt="Pregunta" />
        </div>
      {/if}
    </div>

    <div class="options-section" class:revealed={showAnswer}>
      <div class="options-grid">
        {#each [
          { key: 'a', label: 'A', text: question.a, index: 0 },
          { key: 'b', label: 'B', text: question.b, index: 1 },
          { key: 'c', label: 'C', text: question.c, index: 2 }
        ] as opt}
          <button 
            class="opt-btn result-btn" 
            class:correct={showAnswer && correctIdx === (opt.index + 1)}
            class:wrong={showAnswer && selectedOption === opt.index && correctIdx !== (opt.index + 1)}
            class:dimmed={showAnswer && selectedOption !== opt.index && correctIdx !== (opt.index + 1)}
            on:click={() => handleOptionClick(opt.index)}
            disabled={showAnswer}
          >
            <span class="letter">{opt.label}</span>
            <span class="text">{opt.text}</span>
          </button>
        {/each}
      </div>

      {#if showAnswer && question.explanation}
        <div class="explanation-box" in:fly={{ y: 20 }}>
          <strong>¿Por qué?</strong>
          <p>{question.explanation}</p>
        </div>
      {/if}
    </div>
  </div>

  <div class="card-footer">
    {#if showAnswer}
      <div class="rating-grid" in:fade>
        <button class="r-btn r0" on:click={() => handleRate(0)}>
          <span class="name">Fatal</span>
          <span class="count">{counts[0] || 0}</span>
        </button>
        <button class="r-btn r2" on:click={() => handleRate(2)}>
          <span class="name">Difícil</span>
          <span class="count">{counts[2] || 0}</span>
        </button>
        <button class="r-btn r3" on:click={() => handleRate(3)}>
          <span class="name">Bien</span>
          <span class="count">{counts[3] || 0}</span>
        </button>
        <button class="r-btn r5" on:click={() => handleRate(5)}>
          <span class="name">Fácil</span>
          <span class="count">{counts[5] || 0}</span>
        </button>
      </div>
    {:else}
      <div class="footer-tip">Elige una opción para ver la respuesta</div>
    {/if}
  </div>
</div>

<style>
  .anki-card-container {
    position: absolute;
    top: 0;
    left: 0;
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
    overflow-y: auto;
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
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
    width: 100%;
    box-sizing: border-box;
    position: relative;
  }

  .opt-btn:not(:disabled):hover {
    background: #f1f5f9;
    border-color: #8fb339;
    transform: translateX(8px);
  }

  .opt-btn.correct {
    background: #f0fdf4;
    border-color: #22c55e;
    color: #166534;
    transform: scale(1.02);
    z-index: 2;
  }

  .opt-btn.wrong {
    background: #fef2f2;
    border-color: #ef4444;
    color: #991b1b;
  }

  .opt-btn.dimmed {
    opacity: 0.6;
    filter: grayscale(0.5);
    transform: scale(0.98);
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
    color: #1e293b;
    transition: background 0.3s;
  }

  .correct .letter { background: #22c55e; color: white; }
  .wrong .letter { background: #ef4444; color: white; }

  .opt-btn .text {
    font-size: 1.1rem;
    font-weight: 600;
    color: #334155;
    line-height: 1.4;
  }

  .options-section.revealed .opt-btn:disabled {
    cursor: default;
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
</style>
