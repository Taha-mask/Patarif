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
  scrambled: string[];
  image: string;
  difficulty: 'easy' | 'medium' | 'hard';
  hint?: string;
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
  templateUrl: './letters-game.component.html',
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
  wordsByLevel: { [key: number]: GameWord[] } = {
    1: [ // Level 1: Simple 3-5 letter words
      { 
        correct: 'CAT', 
        scrambled: ['T', 'A', 'C'], 
        image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=300&h=300&fit=crop',
        difficulty: 'easy',
        hint: 'A furry pet that says meow!'
      },
      { 
        correct: 'DOG', 
        scrambled: ['G', 'O', 'D'], 
        image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=300&h=300&fit=crop',
        difficulty: 'easy',
        hint: 'A loyal pet that barks!'
      },
      { 
        correct: 'FISH', 
        scrambled: ['H', 'F', 'S', 'I'], 
        image: 'https://images.unsplash.com/photo-1535591273668-578e31182c4f?w=300&h=300&fit=crop',
        difficulty: 'easy',
        hint: 'It swims in water!'
      },
      { 
        correct: 'BIRD', 
        scrambled: ['R', 'I', 'D', 'B'], 
        image: 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=300&h=300&fit=crop',
        difficulty: 'easy',
        hint: 'It flies in the sky!'
      },
      { 
        correct: 'HORSE', 
        scrambled: ['S', 'R', 'O', 'E', 'H'], 
        image: 'https://images.unsplash.com/photo-1553284966-19b8815c7817?w=300&h=300&fit=crop',
        difficulty: 'easy',
        hint: 'A big animal you can ride!'
      }
    ],
    2: [ // Level 2: Fruits 4-6 letters
      { 
        correct: 'APPLE', 
        scrambled: ['P', 'A', 'L', 'P', 'E'], 
        image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=300&h=300&fit=crop',
        difficulty: 'easy',
        hint: 'A red or green fruit that keeps the doctor away!'
      },
      { 
        correct: 'BANANA', 
        scrambled: ['A', 'N', 'B', 'A', 'A', 'N'], 
        image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=300&h=300&fit=crop',
        difficulty: 'medium',
        hint: 'Yellow fruit that monkeys love to eat!'
      },
      { 
        correct: 'ORANGE', 
        scrambled: ['O', 'R', 'A', 'N', 'G', 'E'], 
        image: 'https://images.unsplash.com/photo-1557800636-894a64c1696f?w=300&h=300&fit=crop',
        difficulty: 'medium',
        hint: 'Round citrus fruit, same name as a color!'
      },
      { 
        correct: 'GRAPE', 
        scrambled: ['G', 'A', 'P', 'R', 'E'], 
        image: 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=300&h=300&fit=crop',
        difficulty: 'easy',
        hint: 'Purple fruit that grows in bunches!'
      },
      { 
        correct: 'CHERRY', 
        scrambled: ['R', 'C', 'H', 'E', 'Y', 'R'], 
        image: 'https://images.unsplash.com/photo-1528821128474-27f963b062bf?w=300&h=300&fit=crop',
        difficulty: 'medium',
        hint: 'Small red fruit, often on top of ice cream!'
      }
    ],
    3: [ // Level 3: Colors 4-6 letters
      { 
        correct: 'RED', 
        scrambled: ['E', 'D', 'R'], 
        image: 'https://images.unsplash.com/photo-1607962837359-5e7e89f86776?w=300&h=300&fit=crop',
        difficulty: 'easy',
        hint: 'The color of fire and roses!'
      },
      { 
        correct: 'BLUE', 
        scrambled: ['L', 'U', 'E', 'B'], 
        image: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=300&h=300&fit=crop',
        difficulty: 'easy',
        hint: 'The color of the sky and ocean!'
      },
      { 
        correct: 'GREEN', 
        scrambled: ['R', 'E', 'E', 'N', 'G'], 
        image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=300&h=300&fit=crop',
        difficulty: 'medium',
        hint: 'The color of grass and leaves!'
      },
      { 
        correct: 'YELLOW', 
        scrambled: ['W', 'O', 'L', 'L', 'E', 'Y'], 
        image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=300&fit=crop',
        difficulty: 'medium',
        hint: 'The color of the sun and bananas!'
      },
      { 
        correct: 'PURPLE', 
        scrambled: ['R', 'P', 'L', 'E', 'U', 'P'], 
        image: 'https://images.unsplash.com/photo-1541678736381-fac9ddfebcaa?w=300&h=300&fit=crop',
        difficulty: 'medium',
        hint: 'The color of grapes and lavender!'
      }
    ],
    4: [ // Level 4: Body parts 3-5 letters
      { 
        correct: 'EYE', 
        scrambled: ['Y', 'E', 'E'], 
        image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=300&h=300&fit=crop',
        difficulty: 'easy',
        hint: 'You use this to see!'
      },
      { 
        correct: 'HAND', 
        scrambled: ['A', 'N', 'D', 'H'], 
        image: 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=300&h=300&fit=crop',
        difficulty: 'easy',
        hint: 'You use this to grab things!'
      },
      { 
        correct: 'FOOT', 
        scrambled: ['O', 'T', 'O', 'F'], 
        image: 'https://images.unsplash.com/photo-1574361195575-b79b6542ff45?w=300&h=300&fit=crop',
        difficulty: 'easy',
        hint: 'You use this to walk!'
      },
      { 
        correct: 'MOUTH', 
        scrambled: ['O', 'U', 'T', 'H', 'M'], 
        image: 'https://images.unsplash.com/photo-1609220136736-443140cffec6?w=300&h=300&fit=crop',
        difficulty: 'medium',
        hint: 'You use this to eat and talk!'
      },
      { 
        correct: 'NOSE', 
        scrambled: ['S', 'E', 'O', 'N'], 
        image: 'https://images.unsplash.com/photo-1559757146-99d42e1b4e7e?w=300&h=300&fit=crop',
        difficulty: 'easy',
        hint: 'You use this to smell!'
      }
    ],
    5: [ // Level 5: Vehicles 3-6 letters
      { 
        correct: 'CAR', 
        scrambled: ['A', 'R', 'C'], 
        image: 'https://images.unsplash.com/photo-1549924231-f129b911e442?w=300&h=300&fit=crop',
        difficulty: 'easy',
        hint: 'A vehicle with four wheels!'
      },
      { 
        correct: 'BUS', 
        scrambled: ['U', 'S', 'B'], 
        image: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=300&h=300&fit=crop',
        difficulty: 'easy',
        hint: 'A big vehicle that carries many people!'
      },
      { 
        correct: 'PLANE', 
        scrambled: ['A', 'N', 'E', 'L', 'P'], 
        image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=300&h=300&fit=crop',
        difficulty: 'medium',
        hint: 'It flies in the sky with people inside!'
      },
      { 
        correct: 'BOAT', 
        scrambled: ['O', 'A', 'T', 'B'], 
        image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=300&h=300&fit=crop',
        difficulty: 'easy',
        hint: 'It travels on water!'
      },
      { 
        correct: 'TRAIN', 
        scrambled: ['R', 'A', 'I', 'N', 'T'], 
        image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=300&h=300&fit=crop',
        difficulty: 'medium',
        hint: 'It runs on tracks and has many cars!'
      }
    ]
  };

  currentWord: GameWord = this.wordsByLevel[1][0];
  currentWordIndex: number = 0;
  availableLetters: LetterTile[] = [];
  wordSlots: (LetterTile | null)[] = [];
  letterColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#FF9F43', '#A29BFE', '#6C5CE7'];

  ngOnInit() {
    this.resetForNewWord();
    this.startTimer();
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
    const currentLevelWords = this.wordsByLevel[this.level];
    
    if (!currentLevelWords || this.currentWordIndex >= currentLevelWords.length) {
      this.completeGame();
      return;
    }
    
    // Reset game stats for new word
    this.gameStats = {
      totalTime: 0,
      hintsUsed: 0,
      firstAttempt: true,
      attempts: 0
    };
    
    this.showHint = false;
    this.showSuccess = false;
    this.shakeAnimation = false;
    
    // Get the current word based on the word index
    this.currentWord = currentLevelWords[this.currentWordIndex];
    
    // Create letter tiles with unique IDs and enhanced properties
    this.availableLetters = this.currentWord.scrambled.map((letter, index) => ({
      id: `letter-${index}-${Date.now()}`,
      letter,
      color: this.letterColors[index % this.letterColors.length],
      isDragging: false,
      used: false,
      isCorrect: false,
      animationState: 'idle'
    }));
    
    // Shuffle the available letters for better gameplay
    this.shuffleArray(this.availableLetters);
    
    // Initialize word slots as empty
    this.wordSlots = Array(this.currentWord.correct.length).fill(null);
    
    this.startTimer();
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
    this.gameStats.attempts++;
    const formedWord = this.wordSlots.map(slot => slot?.letter || '').join('');
    
    if (formedWord === this.currentWord.correct) {
      this.handleCorrectAnswer();
    } else {
      this.handleIncorrectAnswer();
    }
  }

    handleCorrectAnswer() {
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
    bonus += difficultyBonus[this.currentWord.difficulty];
    
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
    if (this.currentWord.hint) {
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
    return `difficulty-${this.currentWord.difficulty}`;
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