import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameTemplateComponent } from '../../../game-template/game-template.component';
import { CelebrationComponent, CelebrationData } from '../../../game-template/celebration/celebration.component';
import { GamesComponent } from '../games.component';
import { SupabaseService } from '../../../../supabase.service';
import { AudioService } from '../../../../services/audio.service';

/**
 * Types used by the component
 * All comments in this file are in English as requested.
 */
interface LetterTile {
  id: string;
  letter: string;
  color: string;
  isDragging: boolean;
  used: boolean;
  isCorrect?: boolean;
  animationState: 'idle' | 'bounce' | 'shake' | 'glow';
}

interface GameWord {
  correct: string;
  image: string;
  difficulty: 'facile' | 'moyen' | 'difficile';
}

interface DragState {
  draggedItem: LetterTile | null;
  draggedFromSlot: number;
  draggedFromAvailable: number;
}

interface GameStats {
  totalTime: number;
  firstAttempt: boolean;
  attempts: number;
}

const GAME_CONFIG = {
  QUESTIONS_PER_LEVEL: 5,
  TIMER_INTERVAL: 1000,
  SUCCESS_DELAY: 2000,
  WRONG_MESSAGE_DURATION: 2000,
  LETTER_COLORS: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#FF9F43', '#A29BFE', '#6C5CE7']
} as const;

@Component({
  selector: 'app-letters-game',
  standalone: true,
  imports: [CommonModule, GameTemplateComponent, CelebrationComponent, GamesComponent],
  templateUrl: './letters-game.component.html',
  styleUrls: ['./letters-game.component.css']
})
export class LettersGameComponent implements OnInit, OnDestroy {
  // ID for progress save/load
  private readonly GAME_ID = 1;

  // Configuration
  maxLevels = 5;
  incrementOnOpen = false; // enable only if you explicitly want level to increase on each open

  // Local UI state
  loading = true;

  // Centralized game state
  private state = {
    level: 1,
    currentQuestion: 1,
    questionsCorrectInLevel: 0,
    timeElapsed: 0,
    showLevelCompleteModal: false
  };

  // Internal helpers
  private timer: any = null;
  private currentWordIndex = 0;
  private _currentWord: GameWord | null = null;

  // Gameplay data
  availableLetters: LetterTile[] = [];
  wordSlots: (LetterTile | null)[] = [];

  // UI flags
  showSuccess = false;
  showWrong = false;
  shakeAnimation = false;

  // Drag state
  private dragState: DragState = { draggedItem: null, draggedFromSlot: -1, draggedFromAvailable: -1 };

  // Stats
  private gameStats: GameStats = { totalTime: 0, firstAttempt: true, attempts: 0 };

  // Questions store
  private questionsByLevel: Record<number, GameWord[]> = {};

  // Celebration payload
  celebrationData: CelebrationData | null = null;

  constructor(private supabaseService: SupabaseService, private audioService: AudioService) {}

  // ---------- Getters ----------
  get level() { return this.state.level; }
  get currentQuestion() { return this.state.currentQuestion; }
  get questionsCorrectInLevel() { return this.state.questionsCorrectInLevel; }
  get timeElapsed() { return this.state.timeElapsed; }
  get showLevelCompleteModal() { return this.state.showLevelCompleteModal; }
  get currentWord() { return this._currentWord; }
  get isWordComplete() { return this.wordSlots.every(s => s !== null); }

  /** Progress as percentage across global levels (1..maxLevels) */
  get progressPercent() {
    return Math.round((this.level / this.maxLevels) * 100);
  }

  // ---------- Lifecycle ----------
  async ngOnInit() {
    this.loading = true;

    await this.loadAllQuestions();

    try {
      const progress = await this.supabaseService.getPlayerProgress(this.GAME_ID);

      if (progress) {
        const savedLevel = clamp(Number(progress.level) || 1, 1, this.maxLevels);
        const savedQuestion = Math.max(1, Number(progress.question_num) || 1);

        await this.setLevel(savedLevel, false);

        const levelQuestions = this.questionsByLevel[this.level] ?? [];
        this.state.currentQuestion = savedQuestion > levelQuestions.length ? 1 : savedQuestion;
        this.currentWordIndex = Math.max(0, this.state.currentQuestion - 1);
      } else {
        await this.supabaseService.savePlayerProgress(this.GAME_ID, 1, 1);
        await this.setLevel(1, false);
        this.state.currentQuestion = 1;
        this.currentWordIndex = 0;
      }
    } catch (err) {
      console.error('Failed loading progress', err);
      await this.setLevel(1, false);
      this.state.currentQuestion = 1;
      this.currentWordIndex = 0;
    }

    if (this.incrementOnOpen) {
      const next = Math.min(this.maxLevels, this.level + 1);
      await this.setLevel(next, true);
    }

    this.initializeGame();
    this.loading = false;
  }

  ngOnDestroy(): void { this.cleanupTimer(); }

  // ---------- Initialization & Timer ----------
  private initializeGame() {
    this.resetForNewWord();
    this.startTimer();
  }

  private startTimer() {
    if (this.timer) return;
    this.timer = setInterval(() => this.state.timeElapsed++, GAME_CONFIG.TIMER_INTERVAL);
  }

  private cleanupTimer() {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = null;
  }

  private resetTimer() { this.state.timeElapsed = 0; }

  // ---------- Data loading ----------
  private async loadAllQuestions() {
    // Load levels sequentially (small number) and ensure empty arrays if none
    for (let lvl = 1; lvl <= this.maxLevels; lvl++) {
      const questions = (await this.supabaseService.getSortingLettersQuestions(lvl)) || [];
      this.questionsByLevel[lvl] = questions.map((q: any) => ({ correct: q.value, image: `/${q.image}`, difficulty: q.difficulty }));
    }
  }

  // ---------- Level & Progress management ----------
  private async setLevel(newLevel: number, save = false) {
    const clamped = clamp(Math.floor(newLevel), 1, this.maxLevels);
    this.state.level = clamped;

    // reset per-level counters
    this.state.questionsCorrectInLevel = 0;
    this.state.currentQuestion = 1;
    this.currentWordIndex = 0;

    if (save) await safeSaveProgress(this.supabaseService, this.GAME_ID, this.state.level, this.state.currentQuestion);
  }

  // ---------- Word flow ----------
  private resetForNewWord() {
    this.gameStats.firstAttempt = true;
    this.gameStats.attempts = 0;
    this.shakeAnimation = false;
    this.showSuccess = false;
    this.showWrong = false;

    const levelQs = this.questionsByLevel[this.state.level] ?? [];

    if (levelQs[this.currentWordIndex]) {
      this._currentWord = levelQs[this.currentWordIndex];
    } else {
      // move to next level if current level exhausted
      const nextLevel = Math.min(this.maxLevels, this.state.level + 1);
      this.setLevel(nextLevel, true).catch(err => console.error('setLevel', err));
      this._currentWord = this.questionsByLevel[this.state.level]?.[0] ?? null;
    }

    if (!this._currentWord) return;

    const scrambled = scramble(this._currentWord.correct);
    this.availableLetters = createTiles(scrambled);
    this.wordSlots = Array(this._currentWord.correct.length).fill(null);

    if (this.state.currentQuestion === 1) { this.resetTimer(); this.startTimer(); }
  }

  // ---------- Drag & Drop ----------
  onDragStart(ev: DragEvent, item: LetterTile, fromSlot?: number, fromAvailable?: number) {
    this.dragState.draggedItem = item;
    this.dragState.draggedFromSlot = fromSlot ?? -1;
    this.dragState.draggedFromAvailable = fromAvailable ?? -1;
    if (ev.dataTransfer) {
      ev.dataTransfer.effectAllowed = 'move';
      ev.dataTransfer.setData('text/plain', item.id);
    }
    item.isDragging = true;
    item.animationState = 'bounce';
  }

  onDragEnd(_: DragEvent, item: LetterTile) { item.isDragging = false; item.animationState = 'idle'; }

  onDragOver(ev: DragEvent) { ev.preventDefault(); if (ev.dataTransfer) ev.dataTransfer.dropEffect = 'move'; }

  onDropToSlot(ev: DragEvent, slotIndex: number) {
    ev.preventDefault();
    const dragged = this.dragState.draggedItem;
    if (!dragged) return;

    const target = this.wordSlots[slotIndex];

    if (this.dragState.draggedFromAvailable >= 0) {
      // place from available -> if target existed, swap back to available slot
      if (target) this.availableLetters[this.dragState.draggedFromAvailable] = target;
      else this.availableLetters.splice(this.dragState.draggedFromAvailable, 1);

      this.wordSlots[slotIndex] = dragged;
    } else if (this.dragState.draggedFromSlot >= 0) {
      // swap slots
      this.wordSlots[slotIndex] = this.wordSlots[this.dragState.draggedFromSlot];
      this.wordSlots[this.dragState.draggedFromSlot] = target;
    }

    this.dragState = { draggedItem: null, draggedFromSlot: -1, draggedFromAvailable: -1 };
  }

  onDropToAvailable(ev: DragEvent, availableIndex?: number) {
    ev.preventDefault();
    if (!this.dragState.draggedItem || this.dragState.draggedFromSlot < 0) return;
    const insert = availableIndex ?? this.availableLetters.length;
    this.availableLetters.splice(insert, 0, this.dragState.draggedItem);
    this.wordSlots[this.dragState.draggedFromSlot] = null;
    this.dragState = { draggedItem: null, draggedFromSlot: -1, draggedFromAvailable: -1 };
  }

  // ---------- Game logic ----------
  async checkWord() {
    if (!this._currentWord) return;
    this.gameStats.attempts++;
    const formed = this.wordSlots.map(s => s?.letter || '').join('');

    if (formed === this._currentWord.correct) {
      this.cleanupTimer();
      this.state.questionsCorrectInLevel++;
      this.showSuccess = true;
      this.audioService.playCorrectSound();

      if (this.gameStats.firstAttempt) {
        // fire-and-forget save; log on failure
        safeSaveProgress(this.supabaseService, this.GAME_ID, this.state.level, this.state.currentQuestion).catch(err => console.error('save', err));
      }

      setTimeout(() => { this.showSuccess = false; this.nextWord(); }, GAME_CONFIG.SUCCESS_DELAY);
      return;
    }

    // wrong answer
    this.shakeAnimation = true;
    this.showWrong = true;
    this.audioService.playWrongSound();
    this.gameStats.firstAttempt = false;

    setTimeout(() => { this.shakeAnimation = false; this.showWrong = false; }, GAME_CONFIG.WRONG_MESSAGE_DURATION);
  }

  private nextWord() {
    this.state.currentQuestion++;
    this.currentWordIndex++;

    const levelQs = this.questionsByLevel[this.state.level] ?? [];
    if (this.currentWordIndex >= levelQs.length) {
      this.completeLevel();
    } else {
      this.resetForNewWord();
    }
  }

  private async completeLevel() {
    this.celebrationData = {
      level: this.state.level,
      questionsCorrect: this.state.questionsCorrectInLevel,
      totalQuestions: this.questionsByLevel[this.state.level]?.length ?? GAME_CONFIG.QUESTIONS_PER_LEVEL,
      timeElapsed: this.state.timeElapsed,
      difficulty: this.currentWord?.difficulty ?? 'facile'
    };

    this.state.showLevelCompleteModal = true;

    // advance and save
    const next = Math.min(this.maxLevels, this.state.level + 1);
    await this.setLevel(next, true);

    // stop timer if no questions loaded for new level
    if (!this.questionsByLevel[this.state.level]) this.cleanupTimer();
  }

  // ---------- Template helpers ----------
  trackByLetterId(_: number, item: LetterTile) { return item.id; }

  onCloseCelebration() { this.state.showLevelCompleteModal = false; }

  continueToNextLevel(nextLevel: number) {
    this.setLevel(nextLevel, true).then(() => {
      this.resetForNewWord();
      this.state.showLevelCompleteModal = false;
    }).catch(err => console.error('continueToNextLevel', err));
  }
}

// ---------- Utility functions (kept outside class for brevity) ----------

function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)); }

function scramble(word: string) {
  const letters = word.split('');
  for (let i = letters.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [letters[i], letters[j]] = [letters[j], letters[i]];
  }
  return letters;
}

function createTiles(letters: string[]) {
  return letters.map((l, i) => ({
    id: `l-${i}-${Date.now()}-${Math.random().toString(36).slice(2,9)}`,
    letter: l,
    color: GAME_CONFIG.LETTER_COLORS[Math.floor(Math.random() * GAME_CONFIG.LETTER_COLORS.length)],
    isDragging: false,
    used: false,
    animationState: 'idle' as const
  }));
}

async function safeSaveProgress(svc: SupabaseService, gameId: number, level: number, question: number) {
  try {
    const ok = await svc.savePlayerProgress(gameId, level, question);
    if (!ok) console.warn('savePlayerProgress returned falsy');
    return ok;
  } catch (err) {
    console.error('safeSaveProgress error', err);
    throw err;
  }
}
