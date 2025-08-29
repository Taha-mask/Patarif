import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameTemplateComponent } from '../../../game-template/game-template.component';

interface LetterTile {
  id: string;
  letter: string;
  color: string;
  isDragging: boolean;
  used: boolean;
  isCorrect?: boolean;
  animationState?: 'idle' | 'bounce' | 'shake' | 'glow';
}

interface GameWord {
  correct: string;
  image: string;
  difficulty: 'easy' | 'medium' | 'hard';
  hint?: string;
  scrambled?: string[]; // Made optional since we'll generate it
}

interface GameStats {
  totalTime: number;
  hintsUsed: number;
  firstAttempt: boolean;
  attempts: number;
}

@Component({
  selector: 'app-letters-game',
  standalone: true,
  imports: [CommonModule, GameTemplateComponent],
  templateUrl:'./letters-game.component.html',
  styleUrls: ['./letters-game.component.css']
})
export class LettersGameComponent implements OnInit, OnDestroy {
  level: number = 1;
  score: number = 0;
  bonusPoints: number = 0;
  stars: number = 0;
  questionText: string = 'Look at the image and spell the word by dragging letters!';
  totalQuestions: number = 5;
  currentQuestion: number = 1;
  questionsCorrectInLevel: number = 0;
  
  // Game state
  gameStats: GameStats = {
    totalTime: 0,
    hintsUsed: 0,
    firstAttempt: true,
    attempts: 0
  };
  
  showHint: boolean = false;
  isGameComplete: boolean = false;
  timeElapsed: number = 0;
  timer: any;
  
  // Animation states
  showSuccess: boolean = false;
  shakeAnimation: boolean = false;
  
  // Drag and drop state
  draggedItem: LetterTile | null = null;
  draggedFromSlot: number = -1;
  draggedFromAvailable: number = -1;

  // Enhanced words with difficulty levels and hints - 5 words per level minimum
 

  currentWord: GameWord | null = null;
  currentWordIndex: number = 0;
  availableLetters: LetterTile[] = [];
  wordSlots: (LetterTile | null)[] = [];
  letterColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#FF9F43', '#A29BFE', '#6C5CE7'];
  currentDifficulty: 'easy' | 'medium' | 'hard' = 'easy';
  wordsByLevel: { [key: number]: GameWord[] } = {};;

  // Function to scramble letters of a word
  private scrambleWord(word: string): string[] {
    const letters = word.split('');
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [letters[i], letters[j]] = [letters[j], letters[i]];
    }
    return letters;
  }

  ngOnInit() {
    this.startTimer();
    this.resetForNewWord();
  }

  ngOnDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  startTimer() {
    this.timeElapsed = 0;
    if (this.timer) {
      clearInterval(this.timer);
    }
    this.timer = setInterval(() => {
      this.timeElapsed++;
    }, 1000);
  }

  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  resetForNewWord() {
    // Reset game state for a new word
    this.showHint = false;
    this.gameStats.firstAttempt = true;
    this.gameStats.attempts = 0;
    this.shakeAnimation = false;
    this.showSuccess = false;
    
    // Get a random word from the current level
    const levelWords = this.wordsByLevel[this.level] || [];
    this.currentWord = levelWords[Math.floor(Math.random() * levelWords.length)];
    
    if (!this.currentWord) return;
    
    // Generate scrambled letters from the correct word
    const scrambledLetters = this.scrambleWord(this.currentWord.correct);
    
    // Initialize available letters from the scrambled word
    this.availableLetters = scrambledLetters.map((letter, index) => ({
      id: `letter-${index}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      letter,
      color: this.letterColors[Math.floor(Math.random() * this.letterColors.length)],
      isDragging: false,
      used: false
    }));
    
    // Initialize empty word slots
    this.wordSlots = Array(this.currentWord.correct.length).fill(null);
  }

  shuffleArray(array: any[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  completeGame() {
    this.isGameComplete = true;
    this.stopTimer();
    this.showSuccess = true;
    
    // Calculate final bonus based on performance
    const timeBonus = Math.max(0, 300 - this.gameStats.totalTime) * 2;
    const hintPenalty = this.gameStats.hintsUsed * 10;
    const finalBonus = Math.max(0, timeBonus - hintPenalty);
    
    this.bonusPoints += finalBonus;
    this.score += finalBonus;
    
    setTimeout(() => {
      alert(`🎉 Congratulations! You completed all levels!\n\nFinal Score: ${this.score}\nBonus Points: ${this.bonusPoints}\nTotal Time: ${this.gameStats.totalTime}s`);
    }, 1000);
  }

  // HTML5 Drag and Drop Methods
  onDragStart(event: DragEvent, item: LetterTile, fromSlot?: number, fromAvailable?: number) {
    this.draggedItem = item;
    this.draggedFromSlot = fromSlot ?? -1;
    this.draggedFromAvailable = fromAvailable ?? -1;
    
    // Set drag data
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', item.id);
    }
    
    // Add visual feedback
    item.isDragging = true;
    if (item.animationState !== undefined) {
      item.animationState = 'bounce';
    }
  }

  onDragEnd(event: DragEvent, item: LetterTile) {
    // Reset visual feedback
    item.isDragging = false;
    if (item.animationState !== undefined) {
      item.animationState = 'idle';
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault(); // Allow drop
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  onDropToSlot(event: DragEvent, slotIndex: number) {
    event.preventDefault();
    
    if (!this.draggedItem) return;
    
    const targetSlot = this.wordSlots[slotIndex];
    
    if (this.draggedFromAvailable >= 0) {
      // Dragging from available letters to word slot
      if (targetSlot) {
        // Slot occupied, swap items
        this.wordSlots[slotIndex] = this.draggedItem;
        this.availableLetters[this.draggedFromAvailable] = targetSlot;
      } else {
        // Slot empty, move item
        this.wordSlots[slotIndex] = this.draggedItem;
        this.availableLetters.splice(this.draggedFromAvailable, 1);
      }
    } else if (this.draggedFromSlot >= 0) {
      // Dragging from word slot to word slot
      const sourceItem = this.wordSlots[this.draggedFromSlot];
      this.wordSlots[slotIndex] = sourceItem;
      this.wordSlots[this.draggedFromSlot] = targetSlot;
    }
    
    this.resetDragState();
    this.checkAutoComplete();
  }

  onDropToAvailable(event: DragEvent, availableIndex?: number) {
    event.preventDefault();
    
    if (!this.draggedItem || this.draggedFromSlot < 0) return;
    
    // Only allow dropping from word slots to available
    const insertIndex = availableIndex ?? this.availableLetters.length;
    this.availableLetters.splice(insertIndex, 0, this.draggedItem);
    this.wordSlots[this.draggedFromSlot] = null;
    
    this.resetDragState();
  }

  private resetDragState() {
    this.draggedItem = null;
    this.draggedFromSlot = -1;
    this.draggedFromAvailable = -1;
  }

  private checkAutoComplete() {
    // Auto-check when all slots are filled
    if (this.wordSlots.every(slot => slot !== null)) {
      setTimeout(() => {
        this.checkWord();
      }, 500);
    }
  }

  checkWord() {
    if (!this.currentWord) return;
    
    this.gameStats.attempts++;
    const formedWord = this.wordSlots.map(slot => slot?.letter || '').join('');
    
    if (formedWord === this.currentWord.correct) {
      this.handleCorrectAnswer();
    } else {
      this.handleIncorrectAnswer();
    }
  }

    handleCorrectAnswer() {
    if (!this.currentWord) return;
    
    this.stopTimer();
    this.gameStats.totalTime += this.timeElapsed;
    this.questionsCorrectInLevel++;
    
    // Calculate bonus points
    let bonus = 0;
    const basePoints = 100;
    
    // First attempt bonus
    if (this.gameStats.firstAttempt) {
      bonus += 50;
    }
    
    // No hints bonus
    if (this.gameStats.hintsUsed === 0) {
      bonus += 30;
    }
    
    // Speed bonus (under 30 seconds)
    if (this.timeElapsed < 30) {
      bonus += (30 - this.timeElapsed) * 2;
    }
    
    // Difficulty bonus
    const difficultyBonus = {
      'easy': 0,
      'medium': 20,
      'hard': 50
    };
    
    const wordDifficulty = this.currentWord.difficulty || 'easy';
    bonus += difficultyBonus[wordDifficulty];
    
    this.score += basePoints + bonus;
    this.bonusPoints += bonus;
    this.stars = Math.min(this.stars + 1, 3);
    
    // Show success animation
    this.showSuccess = true;
    this.wordSlots.forEach(slot => {
      if (slot) {
        slot.isCorrect = true;
        slot.animationState = 'glow';
      }
    });
    
    // Play success sound effect (placeholder)
    this.playSound('success');
    
    setTimeout(() => {
      // Check if 5 questions completed in this level
      if (this.questionsCorrectInLevel >= 5) {
        // Level complete! Move to next level
        this.level++;
        this.currentQuestion = 1;
        this.questionsCorrectInLevel = 0;
        this.currentWordIndex = 0;
        this.stars = 0;
        
        // Show level complete message
        alert(`🎉 Level ${this.level - 1} Complete!\nMoving to Level ${this.level}!`);
        
        this.resetForNewWord();
      } else {
        // Move to next word in current level
        this.currentQuestion++;
        this.currentWordIndex++;
        this.resetForNewWord();
      }
    }, 2000);
  }

  handleIncorrectAnswer() {
    if (!this.currentWord) return;
    
    this.gameStats.firstAttempt = false;
    this.shakeAnimation = true;
    
    // Shake incorrect letters
    this.wordSlots.forEach(slot => {
      if (slot) {
        slot.animationState = 'shake';
      }
    });
    
    // Play error sound effect (placeholder)
    this.playSound('error');
    
    setTimeout(() => {
      this.shakeAnimation = false;
      this.wordSlots.forEach(slot => {
        if (slot) {
          slot.animationState = 'idle';
        }
      });
    }, 600);
  }

  showHintDialog() {
    if (this.currentWord?.hint) {
      this.showHint = true;
      this.gameStats.hintsUsed++;
      this.gameStats.firstAttempt = false;
      
      // Play hint sound effect (placeholder)
      this.playSound('hint');
    }
  }

  hideHint() {
    this.showHint = false;
  }

  // Placeholder for sound effects
  playSound(type: 'success' | 'error' | 'hint' | 'drop') {
    // This would integrate with a sound service
    console.log(`Playing ${type} sound`);
  }

  retry() {
    this.resetForNewWord();
  }

  isCheckButtonDisabled(): boolean {
    return !this.wordSlots.some(slot => slot !== null);
  }

  getDifficultyClass(): string {
    return `difficulty-${this.currentWord?.difficulty || 'easy'}`;
  }

  getTimeDisplayClass(): string {
    if (this.timeElapsed < 15) return 'time-good';
    if (this.timeElapsed < 30) return 'time-warning';
    return 'time-danger';
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  trackByLetterId(index: number, item: LetterTile): string {
    return item.id;
  }
}