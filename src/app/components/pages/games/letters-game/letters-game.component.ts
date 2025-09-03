import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameTemplateComponent } from '../../../game-template/game-template.component';
import { CelebrationComponent, CelebrationData } from '../../../game-template/celebration/celebration.component';

// Core interfaces
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
  difficulty: 'easy' | 'medium' | 'hard';
  hint?: string;
}

interface GameState {
  level: number;
  score: number;
  stars: number;
  currentQuestion: number;
  questionsCorrectInLevel: number;
  isGameComplete: boolean;
  timeElapsed: number;
  showLevelCompleteModal: boolean;
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

// Game configuration
const GAME_CONFIG = {
  QUESTIONS_PER_LEVEL: 5,
  TIMER_INTERVAL: 1000,
  ANIMATION_DELAY: 500,
  SHAKE_DURATION: 600,
  SUCCESS_DELAY: 2000,
  WRONG_MESSAGE_DURATION: 2000,
  LETTER_COLORS: [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
    '#FFEAA7', '#FF9F43', '#A29BFE', '#6C5CE7'
  ]
};

@Component({
  selector: 'app-letters-game',
  standalone: true,
  imports: [CommonModule, GameTemplateComponent, CelebrationComponent],
  templateUrl: './letters-game.component.html',
  styleUrls: ['./letters-game.component.css']
})
export class LettersGameComponent implements OnInit, OnDestroy {
  // Game state
  private gameState: GameState = {
    level: 1,
    score: 0,
    stars: 0,
    currentQuestion: 1,
    questionsCorrectInLevel: 0,
    isGameComplete: false,
    timeElapsed: 0,
    showLevelCompleteModal: false
  };

  // Game data
  private gameStats: GameStats = {
    totalTime: 0,
    firstAttempt: true,
    attempts: 0
  };

  private dragState: DragState = {
    draggedItem: null,
    draggedFromSlot: -1,
    draggedFromAvailable: -1
  };

  // Current game session
  private _currentWord: GameWord | null = null;
  private currentWordIndex: number = 0;
  private timer: any;

  // Audio elements
  private correctSound: HTMLAudioElement | null = null;
  private wrongSound: HTMLAudioElement | null = null;

  // Public properties for template
  availableLetters: LetterTile[] = [];
  wordSlots: (LetterTile | null)[] = [];
  showSuccess: boolean = false;
  showWrong: boolean = false;
  shakeAnimation: boolean = false;

  // Questions database organized by levels
  private readonly questionsByLevel: { [key: number]: GameWord[] } = {
    1: [
      { correct: 'CAT', image: '/assets/images/cat.png', difficulty: 'easy' },
      { correct: 'DOG', image: '/assets/images/dog.png', difficulty: 'easy' },
      { correct: 'CAR', image: '/assets/images/car.png', difficulty: 'easy' },
      { correct: 'SUN', image: '/assets/images/sun.png', difficulty: 'easy' },
      { correct: 'MAP', image: '/assets/images/map.png', difficulty: 'easy' },
      { correct: 'FAN', image: '/assets/images/fan.png', difficulty: 'easy' },
      { correct: 'PEN', image: '/assets/images/pen.png', difficulty: 'easy' },
      { correct: 'HAT', image: '/assets/images/hat.png', difficulty: 'easy' },
      { correct: 'BAG', image: '/assets/images/bag.png', difficulty: 'easy' },
      { correct: 'BOX', image: '/assets/images/box.png', difficulty: 'easy' }
    ],
    2: [
      { correct: 'HOUSE', image: '/assets/images/house.png', difficulty: 'easy' },
      { correct: 'WATER', image: '/assets/images/water.png', difficulty: 'easy' },
      { correct: 'MOUSE', image: '/assets/images/mouse.png', difficulty: 'easy' },
      { correct: 'APPLE', image: '/assets/images/apple.png', difficulty: 'easy' },
      { correct: 'GRASS', image: '/assets/images/grass.png', difficulty: 'easy' },
      { correct: 'PLANT', image: '/assets/images/plant.png', difficulty: 'easy' },
      { correct: 'CHAIR', image: '/assets/images/chair.png', difficulty: 'easy' },
      { correct: 'PHONE', image: '/assets/images/phone.png', difficulty: 'easy' },
      { correct: 'SHOES', image: '/assets/images/shoes.png', difficulty: 'easy' },
      { correct: 'CLOCK', image: '/assets/images/clock.png', difficulty: 'easy' }
    ],
    3: [
      { correct: 'PLANET', image: '/assets/images/planet.png', difficulty: 'medium' },
      { correct: 'BRIDGE', image: '/assets/images/bridge.png', difficulty: 'medium' },
      { correct: 'PYRAMID', image: '/assets/images/pyramid.png', difficulty: 'medium' },
      { correct: 'MARKET', image: '/assets/images/market.png', difficulty: 'medium' },
      { correct: 'FLOWER', image: '/assets/images/flower.png', difficulty: 'medium' },
      { correct: 'GUITAR', image: '/assets/images/guitar.png', difficulty: 'medium' },
      { correct: 'CASTLE', image: '/assets/images/castle.png', difficulty: 'medium' },
      { correct: 'MONKEY', image: '/assets/images/monkey.png', difficulty: 'medium' },
      { correct: 'PYTHON', image: '/assets/images/python.png', difficulty: 'medium' },
      { correct: 'TIGERS', image: '/assets/images/tigers.png', difficulty: 'medium' }
    ],
    4: [
      { correct: 'COMPUTER', image: '/assets/images/computer.png', difficulty: 'medium' },
      { correct: 'ELEPHANT', image: '/assets/images/elephant.png', difficulty: 'medium' },
      { correct: 'MOUNTAIN', image: '/assets/images/mountain.png', difficulty: 'medium' },
      { correct: 'BUTTERFLY', image: '/assets/images/butterfly.png', difficulty: 'medium' },
      { correct: 'TELEPHONE', image: '/assets/images/telephone.png', difficulty: 'medium' },
      { correct: 'AEROPLANE', image: '/assets/images/aeroplane.png', difficulty: 'medium' },
      { correct: 'RESTAURANT', image: '/assets/images/restaurant.png', difficulty: 'medium' },
      { correct: 'BASKETBALL', image: '/assets/images/basketball.png', difficulty: 'medium' },
      { correct: 'CHOCOLATE', image: '/assets/images/chocolate.png', difficulty: 'medium' },
      { correct: 'TELEVISION', image: '/assets/images/television.png', difficulty: 'medium' }
    ],
    5: [
      { correct: 'ASTRONAUT', image: '/assets/images/astronaut.png', difficulty: 'hard' },
      { correct: 'HELICOPTER', image: '/assets/images/helicopter.png', difficulty: 'hard' },
      { correct: 'ARCHAEOLOGIST', image: '/assets/images/archaeologist.png', difficulty: 'hard' },
      { correct: 'PHOTOGRAPHER', image: '/assets/images/photographer.png', difficulty: 'hard' },
      { correct: 'MAGNIFICENT', image: '/assets/images/magnificent.png', difficulty: 'hard' },
      { correct: 'ADVENTURE', image: '/assets/images/adventure.png', difficulty: 'hard' },
      { correct: 'BEAUTIFUL', image: '/assets/images/beautiful.png', difficulty: 'hard' },
      { correct: 'DANGEROUS', image: '/assets/images/dangerous.png', difficulty: 'hard' },
      { correct: 'EXCELLENT', image: '/assets/images/excellent.png', difficulty: 'hard' },
      { correct: 'FANTASTIC', image: '/assets/images/fantastic.png', difficulty: 'hard' }
    ]
  };

  // Celebration data
  celebrationData: CelebrationData | null = null;

  // Getters for template
  get level(): number { return this.gameState.level; }
  get score(): number { return this.gameState.score; }
  get stars(): number { return this.gameState.stars; }
  get currentQuestion(): number { return this.gameState.currentQuestion; }
  get questionsCorrectInLevel(): number { return this.gameState.questionsCorrectInLevel; }
  get isGameComplete(): boolean { return this.gameState.isGameComplete; }
  get timeElapsed(): number { return this.gameState.timeElapsed; }
  get showLevelCompleteModal(): boolean { return this.gameState.showLevelCompleteModal; }
  get currentWord(): GameWord | null { return this._currentWord; }
  get isWordComplete(): boolean { return this.wordSlots.every(slot => slot !== null); }

  ngOnInit(): void {
    this.initializeGame();
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  // ===== GAME INITIALIZATION =====
  private initializeGame(): void {
    this.initializeAudio();
    this.startTimer();
    this.resetForNewWord();
  }

  private initializeAudio(): void {
    this.correctSound = new Audio('/audio/correct.mp3');
    this.correctSound.preload = 'auto';
    this.wrongSound = new Audio('/audio/wrong.mp3');
    this.wrongSound.preload = 'auto';
  }

  private cleanup(): void {
    this.cleanupTimer();
    if (this.correctSound) {
      this.correctSound.pause();
      this.correctSound = null;
    }
    if (this.wrongSound) {
      this.wrongSound.pause();
      this.wrongSound = null;
    }
  }

  // ===== TIMER MANAGEMENT =====
  private startTimer(): void {
    // Only start the timer if it's not already running
    if (!this.timer) {
      this.timer = setInterval(() => {
        this.gameState.timeElapsed++;
      }, GAME_CONFIG.TIMER_INTERVAL);
    }
  }

  private stopTimer(): void {
    this.cleanupTimer();
  }

  private resetTimer(): void {
    this.gameState.timeElapsed = 0;
  }

  private cleanupTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  // ===== WORD MANAGEMENT =====
  private resetForNewWord(): void {
    this.resetGameStats();
    this.resetAnimations();
    this.loadCurrentWord();
    this.setupLetterTiles();
    
    // Only start timer on first question of the set
    if (this.gameState.currentQuestion === 1) {
      this.resetTimer();
      this.startTimer();
    }
  }

  private resetGameStats(): void {
    this.gameStats.firstAttempt = true;
    this.gameStats.attempts = 0;
  }

  private resetAnimations(): void {
    this.shakeAnimation = false;
    this.showSuccess = false;
    this.showWrong = false;
  }

  private loadCurrentWord(): void {
    const currentLevelQuestions = this.questionsByLevel[this.gameState.level];
    if (currentLevelQuestions && currentLevelQuestions[this.currentWordIndex]) {
      this._currentWord = currentLevelQuestions[this.currentWordIndex];
    } else {
      // If no more questions in current level, move to next level
      this.gameState.level++;
      this.currentWordIndex = 0;
      const nextLevelQuestions = this.questionsByLevel[this.gameState.level];
      if (nextLevelQuestions) {
        this._currentWord = nextLevelQuestions[0];
      }
    }
  }

  private setupLetterTiles(): void {
    if (!this.currentWord) return;

    const scrambledLetters = this.scrambleWord(this.currentWord.correct);
    this.availableLetters = this.createLetterTiles(scrambledLetters);
    this.wordSlots = Array(this.currentWord.correct.length).fill(null);
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
      id: this.generateLetterId(index),
      letter,
      color: this.getRandomColor(),
      isDragging: false,
      used: false,
      animationState: 'idle'
    }));
  }

  private generateLetterId(index: number): string {
    return `letter-${index}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getRandomColor(): string {
    return GAME_CONFIG.LETTER_COLORS[
      Math.floor(Math.random() * GAME_CONFIG.LETTER_COLORS.length)
    ];
  }

  // ===== DRAG AND DROP LOGIC =====
  onDragStart(event: DragEvent, item: LetterTile, fromSlot?: number, fromAvailable?: number): void {
    this.dragState.draggedItem = item;
    this.dragState.draggedFromSlot = fromSlot ?? -1;
    this.dragState.draggedFromAvailable = fromAvailable ?? -1;
    
    this.setupDragEvent(event, item);
  }

  private setupDragEvent(event: DragEvent, item: LetterTile): void {
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', item.id);
    }
    
    item.isDragging = true;
    item.animationState = 'bounce';
  }

  onDragEnd(event: DragEvent, item: LetterTile): void {
    item.isDragging = false;
    item.animationState = 'idle';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  onDropToSlot(event: DragEvent, slotIndex: number): void {
    event.preventDefault();
    
    if (!this.dragState.draggedItem) return;
    
    this.handleSlotDrop(slotIndex);
    this.resetDragState();
    this.checkAutoComplete();
  }

  private handleSlotDrop(slotIndex: number): void {
    const targetSlot = this.wordSlots[slotIndex];
    
    if (this.dragState.draggedFromAvailable >= 0) {
      this.handleAvailableToSlot(slotIndex, targetSlot);
    } else if (this.dragState.draggedFromSlot >= 0) {
      this.handleSlotToSlot(slotIndex, targetSlot);
    }
  }

  private handleAvailableToSlot(slotIndex: number, targetSlot: LetterTile | null): void {
    if (targetSlot) {
      this.wordSlots[slotIndex] = this.dragState.draggedItem;
      this.availableLetters[this.dragState.draggedFromAvailable] = targetSlot;
    } else {
      this.wordSlots[slotIndex] = this.dragState.draggedItem;
      this.availableLetters.splice(this.dragState.draggedFromAvailable, 1);
    }
  }

  private handleSlotToSlot(slotIndex: number, targetSlot: LetterTile | null): void {
    const sourceItem = this.wordSlots[this.dragState.draggedFromSlot];
    this.wordSlots[slotIndex] = sourceItem;
    this.wordSlots[this.dragState.draggedFromSlot] = targetSlot;
  }

  onDropToAvailable(event: DragEvent, availableIndex?: number): void {
    event.preventDefault();
    
    if (!this.dragState.draggedItem || this.dragState.draggedFromSlot < 0) return;
    
    this.handleSlotToAvailable(availableIndex);
    this.resetDragState();
  }

  private handleSlotToAvailable(availableIndex?: number): void {
    const insertIndex = availableIndex ?? this.availableLetters.length;
    this.availableLetters.splice(insertIndex, 0, this.dragState.draggedItem!);
    this.wordSlots[this.dragState.draggedFromSlot] = null;
  }

  private resetDragState(): void {
    this.dragState = {
      draggedItem: null,
      draggedFromSlot: -1,
      draggedFromAvailable: -1
    };
  }

  private checkAutoComplete(): void {
    // Commented out auto-complete since we now have a manual check button
    // if (this.wordSlots.every(slot => slot !== null)) {
    //   setTimeout(() => {
    //     this.checkWord();
    //   }, GAME_CONFIG.ANIMATION_DELAY);
    // }
  }

  // ===== GAME LOGIC =====
  checkWord(): void {
    if (!this.currentWord) return;
    
    this.gameStats.attempts++;
    const formedWord = this.getFormedWord();
    
    if (formedWord === this.currentWord.correct) {
      this.handleCorrectAnswer();
    } else {
      this.handleIncorrectAnswer();
    }
  }

  private getFormedWord(): string {
    return this.wordSlots.map(slot => slot?.letter || '').join('');
  }

  private handleCorrectAnswer(): void {
    if (!this.currentWord) return;
    
    this.stopTimer();
    this.updateGameStats();
    this.showSuccess = true;
    this.playCorrectSound();
    
    // Automatically move to next question after delay
    setTimeout(() => {
      this.incrementProgress();
      this.handleLevelProgress();
    }, GAME_CONFIG.SUCCESS_DELAY);
  }

  private updateGameStats(): void {
    this.gameStats.totalTime += this.gameState.timeElapsed;
    this.gameState.questionsCorrectInLevel++;
  }

  private incrementProgress(): void {
    this.gameState.currentQuestion++;
    this.currentWordIndex++;
  }

  private handleLevelProgress(): void {
    if (this.gameState.questionsCorrectInLevel >= GAME_CONFIG.QUESTIONS_PER_LEVEL) {
      this.completeLevel();
    } else {
      this.resetForNewWord();
    }
  }

  private completeLevel(): void {
    console.log('Level completed! Showing modal...');
    console.log('Current level:', this.level);
    console.log('Questions correct:', this.questionsCorrectInLevel);
    console.log('Total questions:', GAME_CONFIG.QUESTIONS_PER_LEVEL);
    console.log('Score:', this.score);
    console.log('Time elapsed:', this.timeElapsed);
    console.log('Stars:', this.stars);
    
    this.stopTimer();
    
    // Prepare celebration data
    this.celebrationData = {
      level: this.level,
      questionsCorrect: this.questionsCorrectInLevel,
      totalQuestions: GAME_CONFIG.QUESTIONS_PER_LEVEL,
      score: this.score,
      timeElapsed: this.timeElapsed,
      bonusPoints: this.stars * 100, // 100 points per star
      difficulty: this.getCurrentLevelDifficulty()
    };
    
    console.log('Celebration data:', this.celebrationData);
    console.log('Setting showLevelCompleteModal to true');
    this.gameState.showLevelCompleteModal = true;
    this.preventBodyScroll();
  }
  
  // Helper to get current level difficulty
  private getCurrentLevelDifficulty(): 'easy' | 'medium' | 'hard' {
    if (this.level <= 2) return 'easy';
    if (this.level <= 4) return 'medium';
    return 'hard';
  }
  
  // Handle celebration modal close
  onCloseCelebration(): void {
    this.gameState.showLevelCompleteModal = false;
    this.restoreBodyScroll();
  }

  private handleIncorrectAnswer(): void {
    if (!this.currentWord) return;
    
    this.gameStats.firstAttempt = false;
    this.showWrong = true;
    this.playWrongSound();
    this.triggerShakeAnimation();
    
    setTimeout(() => {
      this.showWrong = false;
    }, GAME_CONFIG.WRONG_MESSAGE_DURATION);
  }

  private triggerShakeAnimation(): void {
    this.shakeAnimation = true;
    
    this.wordSlots.forEach(slot => {
      if (slot) {
        slot.animationState = 'shake';
      }
    });
    
    setTimeout(() => {
      this.resetShakeAnimation();
    }, GAME_CONFIG.SHAKE_DURATION);
  }

  private resetShakeAnimation(): void {
    this.shakeAnimation = false;
    this.wordSlots.forEach(slot => {
      if (slot) {
        slot.animationState = 'idle';
      }
    });
  }

  // ===== AUDIO MANAGEMENT =====
  private playCorrectSound(): void {
    if (this.correctSound) {
      this.correctSound.currentTime = 0;
      this.correctSound.play().catch(error => {
        console.log('Audio playback failed:', error);
      });
    }
  }

  private playWrongSound(): void {
    if (this.wrongSound) {
      this.wrongSound.currentTime = 0;
      this.wrongSound.play().catch(error => {
        console.log('Audio playback failed:', error);
      });
    }
  }

  // ===== UTILITY METHODS =====
  trackByLetterId(index: number, item: LetterTile): string {
    return item.id;
  }

  continueToNextLevel(event?: number): void {
    console.log('Continuing to next level...');
    this.gameState.showLevelCompleteModal = false;
    this.restoreBodyScroll();
    
    if (event) {
      // If we received a specific level to go to
      this.gameState.level = event;
    } else {
      // Otherwise, just go to the next level
      this.gameState.level++;
    }
    
    this.gameState.currentQuestion = 1;
    this.gameState.questionsCorrectInLevel = 0;
    this.currentWordIndex = 0;
    this.gameState.stars = 0;
    
    // Check if next level exists
    if (this.questionsByLevel[this.gameState.level]) {
      this.resetForNewWord();
    } else {
      // Game completed - all levels finished
      this.gameState.isGameComplete = true;
      console.log('Game completed! All levels finished.');
    }
  }

  private preventBodyScroll(): void {
    document.body.style.overflow = 'hidden';
  }

  private restoreBodyScroll(): void {
    document.body.style.overflow = 'auto';
  }

  // Get current level's questions
  getCurrentLevelQuestions(): GameWord[] {
    return this.questionsByLevel[this.gameState.level] || [];
  }

  // Get total levels available
  getTotalLevels(): number {
    return Object.keys(this.questionsByLevel).length;
  }

  getDifficultyClass(): string {
    return this.currentWord?.difficulty || 'easy';
  }

  completeGame(): void {
    this.gameState.isGameComplete = true;
    this.stopTimer();
    this.showSuccess = true;
  }
}
