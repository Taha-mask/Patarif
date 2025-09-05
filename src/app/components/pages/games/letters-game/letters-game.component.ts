import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameTemplateComponent } from '../../../game-template/game-template.component';
import { CelebrationComponent, CelebrationData } from '../../../game-template/celebration/celebration.component';
import { GamesComponent } from '../games.component';
import { SupabaseService } from '../../../../supabase.service';

// Interfaces
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
  ANIMATION_DELAY: 500,
  SHAKE_DURATION: 600,
  SUCCESS_DELAY: 2000,
  WRONG_MESSAGE_DURATION: 2000,
  LETTER_COLORS: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#FF9F43', '#A29BFE', '#6C5CE7']
};

@Component({
  selector: 'app-letters-game',
  standalone: true,
  imports: [CommonModule, GameTemplateComponent, CelebrationComponent, GamesComponent],
  templateUrl: './letters-game.component.html',
  styleUrls: ['./letters-game.component.css']
})
export class LettersGameComponent implements OnInit, OnDestroy {
  constructor(private supabaseService: SupabaseService) {}

  // ===== Game State =====
  private gameState = {
    level: 1,
    currentQuestion: 1,
    questionsCorrectInLevel: 0,
    timeElapsed: 0,
    showLevelCompleteModal: false
  };
  loading: boolean = true;
  async ngOnInit() {
    this.loading = true;
    await this.loadAllQuestions();
    this.initializeGame();
    this.loading = false;
  }
  
  private async loadAllQuestions() {
    const totalLevels = 5;
    for (let level = 1; level <= totalLevels; level++) {
      const questions = await this.supabaseService.getSortingLettersQuestions(level);
      this.questionsByLevel[level] = questions.map((q: any) => ({
        correct: q.value,
        image: `/${q.image}`, // الصور
        difficulty: q.difficulty
      }));
    }
  }
  
  private gameStats: GameStats = { totalTime: 0, firstAttempt: true, attempts: 0 };
  private dragState: DragState = { draggedItem: null, draggedFromSlot: -1, draggedFromAvailable: -1 };
  private _currentWord: GameWord | null = null;
  private currentWordIndex: number = 0;
  private timer: any;

  private correctSound: HTMLAudioElement | null = null;
  private wrongSound: HTMLAudioElement | null = null;

  availableLetters: LetterTile[] = [];
  wordSlots: (LetterTile | null)[] = [];
  showSuccess: boolean = false;
  showWrong: boolean = false;
  shakeAnimation: boolean = false;

  celebrationData: CelebrationData | null = null;

  private questionsByLevel: { [key: number]: GameWord[] } = {};

  // ===== Getters =====
  get level(): number { return this.gameState.level; }
  get currentQuestion(): number { return this.gameState.currentQuestion; }
  get questionsCorrectInLevel(): number { return this.gameState.questionsCorrectInLevel; }
  get timeElapsed(): number { return this.gameState.timeElapsed; }
  get showLevelCompleteModal(): boolean { return this.gameState.showLevelCompleteModal; }
  get currentWord(): GameWord | null { return this._currentWord; }
  get isWordComplete(): boolean { return this.wordSlots.every(slot => slot !== null); }

  // ===== Lifecycle =====
 

  ngOnDestroy(): void { this.cleanup(); }

  // ===== Load questions from Supabase =====


  // ===== Game Initialization =====
  private initializeGame(): void {
    this.initializeAudio();
    this.startTimer();
    this.resetForNewWord();
  }

  private initializeAudio(): void {
    this.correctSound = new Audio('/audio/correct.mp3'); this.correctSound.preload = 'auto';
    this.wrongSound = new Audio('/audio/wrong.mp3'); this.wrongSound.preload = 'auto';
  }

  private cleanup(): void {
    if (this.timer) clearInterval(this.timer);
    if (this.correctSound) { this.correctSound.pause(); this.correctSound = null; }
    if (this.wrongSound) { this.wrongSound.pause(); this.wrongSound = null; }
  }

  private startTimer(): void {
    if (!this.timer) this.timer = setInterval(() => { this.gameState.timeElapsed++; }, GAME_CONFIG.TIMER_INTERVAL);
  }
  private stopTimer(): void { if (this.timer) { clearInterval(this.timer); this.timer = null; } }
  private resetTimer(): void { this.gameState.timeElapsed = 0; }

  // ===== Word Management =====
  private resetForNewWord(): void {
    this.gameStats.firstAttempt = true; this.gameStats.attempts = 0;
    this.shakeAnimation = false; this.showSuccess = false; this.showWrong = false;

    const currentLevelQuestions = this.questionsByLevel[this.gameState.level];
    if (currentLevelQuestions && currentLevelQuestions[this.currentWordIndex]) {
      this._currentWord = currentLevelQuestions[this.currentWordIndex];
    } else {
      this.gameState.level++;
      this.currentWordIndex = 0;
      const nextLevelQuestions = this.questionsByLevel[this.gameState.level];
      if (nextLevelQuestions) this._currentWord = nextLevelQuestions[0];
    }

    if (!this._currentWord) return;

    const scrambledLetters = this.scrambleWord(this._currentWord.correct);
    this.availableLetters = this.createLetterTiles(scrambledLetters);
    this.wordSlots = Array(this._currentWord.correct.length).fill(null);

    if (this.gameState.currentQuestion === 1) { this.resetTimer(); this.startTimer(); }
  }

  private scrambleWord(word: string): string[] {
    const letters = word.split('');
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [letters[i], letters[j]] = [letters[j], letters[i]];
    }
    return letters;
  }

  private createLetterTiles(letters: string[]): LetterTile[] {
    return letters.map((letter, index) => ({
      id: `letter-${index}-${Date.now()}-${Math.random().toString(36).substr(2,9)}`,
      letter,
      color: GAME_CONFIG.LETTER_COLORS[Math.floor(Math.random() * GAME_CONFIG.LETTER_COLORS.length)],
      isDragging: false, used: false, animationState: 'idle'
    }));
  }

  // ===== Drag & Drop =====
  onDragStart(event: DragEvent, item: LetterTile, fromSlot?: number, fromAvailable?: number) {
    this.dragState.draggedItem = item;
    this.dragState.draggedFromSlot = fromSlot ?? -1;
    this.dragState.draggedFromAvailable = fromAvailable ?? -1;
    if (event.dataTransfer) { event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', item.id); }
    item.isDragging = true; item.animationState = 'bounce';
  }

  onDragEnd(event: DragEvent, item: LetterTile) { item.isDragging = false; item.animationState = 'idle'; }
  onDragOver(event: DragEvent) { event.preventDefault(); if(event.dataTransfer) event.dataTransfer.dropEffect='move'; }

  onDropToSlot(event: DragEvent, slotIndex: number) {
    event.preventDefault();
    if (!this.dragState.draggedItem) return;
    const targetSlot = this.wordSlots[slotIndex];
    if (this.dragState.draggedFromAvailable >= 0) {
      if (targetSlot) { this.wordSlots[slotIndex] = this.dragState.draggedItem; this.availableLetters[this.dragState.draggedFromAvailable] = targetSlot; }
      else { this.wordSlots[slotIndex] = this.dragState.draggedItem; this.availableLetters.splice(this.dragState.draggedFromAvailable, 1); }
    } else if (this.dragState.draggedFromSlot >= 0) {
      this.wordSlots[slotIndex] = this.wordSlots[this.dragState.draggedFromSlot];
      this.wordSlots[this.dragState.draggedFromSlot] = targetSlot;
    }
    this.dragState = { draggedItem: null, draggedFromSlot: -1, draggedFromAvailable: -1 };
  }

  onDropToAvailable(event: DragEvent, availableIndex?: number) {
    event.preventDefault();
    if (!this.dragState.draggedItem || this.dragState.draggedFromSlot < 0) return;
    const insertIndex = availableIndex ?? this.availableLetters.length;
    this.availableLetters.splice(insertIndex, 0, this.dragState.draggedItem);
    this.wordSlots[this.dragState.draggedFromSlot] = null;
    this.dragState = { draggedItem: null, draggedFromSlot: -1, draggedFromAvailable: -1 };
  }

  // ===== Game Logic =====
  checkWord() {
    if (!this._currentWord) return;
    this.gameStats.attempts++;
    const formedWord = this.wordSlots.map(slot => slot?.letter||'').join('');
    if (formedWord === this._currentWord.correct) {
      this.stopTimer(); this.gameState.questionsCorrectInLevel++; this.showSuccess = true; this.playCorrectSound();
      setTimeout(() => { this.showSuccess = false; this.nextWord(); }, GAME_CONFIG.SUCCESS_DELAY);
    } else {
      this.shakeAnimation = true; this.showWrong = true; this.playWrongSound(); this.gameStats.firstAttempt = false;
      setTimeout(() => { this.shakeAnimation = false; this.showWrong = false; }, GAME_CONFIG.WRONG_MESSAGE_DURATION);
    }
  }

  private nextWord() {
    this.currentWordIndex++;
    const currentLevelQuestions = this.questionsByLevel[this.gameState.level];
    if (this.currentWordIndex >= currentLevelQuestions.length) this.completeLevel();
    else this.resetForNewWord();
  }

  private completeLevel() {
    // Prepare celebration data with only the defined properties
    this.celebrationData = {
      level: this.gameState.level,
      questionsCorrect: this.gameState.questionsCorrectInLevel,
      totalQuestions: this.questionsByLevel[this.gameState.level]?.length || GAME_CONFIG.QUESTIONS_PER_LEVEL,
      timeElapsed: this.gameState.timeElapsed,
      difficulty: this.currentWord?.difficulty ||  'facile'
    };

    this.gameState.showLevelCompleteModal = true;

    // Prepare for the next level
    this.gameState.level++;
    this.currentWordIndex = 0;

    if (!this.questionsByLevel[this.gameState.level]) {
      this.stopTimer();
    }
  }

  // ===== Template Functions =====
  trackByLetterId(index: number, item: LetterTile): string { return item.id; }

  onCloseCelebration() {
    this.gameState.showLevelCompleteModal = false;
  }

  continueToNextLevel(nextLevel: number) {
    this.gameState.level = nextLevel;
    this.currentWordIndex = 0;
    this.gameState.questionsCorrectInLevel = 0; // reset counter
    this.resetForNewWord();
    this.gameState.showLevelCompleteModal = false;
  }

  // ===== Audio =====
  playCorrectSound() { if (this.correctSound) { this.correctSound.currentTime = 0; this.correctSound.play().catch(e=>console.error(e)); } }
  playWrongSound() { if (this.wrongSound) this.wrongSound.play(); }
}
