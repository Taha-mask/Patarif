import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameTemplateComponent } from '../../game-template/game-template.component';
import { ApiService, GameWord } from '../../../services/api.service';

interface LetterTile {
  letter: string;
  color: string;
  isDragging: boolean;
  used: boolean;
}

@Component({
  selector: 'app-letters-game',
  standalone: true,
  imports: [CommonModule, GameTemplateComponent],
  templateUrl: './letters-game.component.html',
  styleUrls: ['./letters-game.component.css']
})
export class LettersGameComponent implements OnInit {
  fallbackWords: GameWord[] = [
    // Level 1 - 5 questions
    { word: 'POMME', image: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=400&h=300&fit=crop', level: 1 },
    { word: 'CHAT', image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=300&fit=crop', level: 1 },
    { word: 'MAIN', image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=300&fit=crop', level: 1 },
    { word: 'LUNE', image: 'https://images.unsplash.com/photo-1522030299830-16b8d3d049fe?w=400&h=300&fit=crop', level: 1 },
    { word: 'CHIEN', image: 'https://images.unsplash.com/photo-1547407139-3c921d6601c9?w=400&h=300&fit=crop', level: 1 },

    // Level 2 - 5 questions
    { word: 'SOLEIL', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop', level: 2 },
    { word: 'MAISON', image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop', level: 2 },
    { word: 'JARDIN', image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop', level: 2 },
    { word: 'LIVRE', image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=300&fit=crop', level: 2 },
    { word: 'TABLE', image: 'https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=400&h=300&fit=crop', level: 2 },

    // Level 3 - 5 questions
    { word: 'MUSIQUE', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop', level: 3 },
    { word: 'ANIMAL', image: 'https://images.unsplash.com/photo-1549366021-9f761d450615?w=400&h=300&fit=crop', level: 3 },
    { word: 'COULEUR', image: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=400&h=300&fit=crop', level: 3 },
    { word: 'FAMILLE', image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=300&fit=crop', level: 3 },
    { word: 'ECOLE', image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9a1?w=400&h=300&fit=crop', level: 3 },

    // Level 4 - 5 questions
    { word: 'TELEPHONE', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=300&fit=crop', level: 4 },
    { word: 'ORDINATEUR', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop', level: 4 },
    { word: 'RESTAURANT', image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop', level: 4 },
    { word: 'HOPITAL', image: 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=400&h=300&fit=crop', level: 4 },
    { word: 'AEROPORT', image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&h=300&fit=crop', level: 4 },

    // Level 5 - 5 questions
    { word: 'SUPERMARCHE', image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop', level: 5 },
    { word: 'BIBLIOTHEQUE', image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop', level: 5 },
    { word: 'UNIVERSITE', image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9a1?w=400&h=300&fit=crop', level: 5 },
    { word: 'STATION', image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=300&fit=crop', level: 5 },
    { word: 'CINEMA', image: 'https://images.unsplash.com/photo-1489599435383-9d5fd2a2c4b8?w=400&h=300&fit=crop', level: 5 }
  ];

  words: GameWord[] = [];
  currentLevel = 1;
  questionsPerLevel = 5;
  currentQuestionIndex = 0;
  currentWord: GameWord = this.fallbackWords[0];
  availableLetters: LetterTile[] = [];
  filledSlots: (LetterTile | null)[] = [];
  showResult = false;
  dragOverIndex: number | null = null;
  draggedLetterColor: string | null = null;
  isCorrect: boolean | null = null;
  score = 0;
  totalScore = 0;
  showLevelComplete = false;
  currentStars = 0;
  streakCount = 0;
  startTime = 0;
  timeBonus = 0;
  maxTimeBonus = 5000;
  basePoints = 100;
  streakBonus = 1.0;
  maxStreakBonus = 3.0;
  hintUsed = false;
  availableHints = 3;
  wordHistory: string[] = [];
  letterColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3', '#54A0FF', '#5F27CD'];
  correctWord = '';
  finalScore = 0;
  showFinalResult = false;
  totalQuestions = 5;
  currentQuestion = 1;
  correctAnswers = 0;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadWords();
  }

  loadWords() {
    this.apiService.generateInfiniteWords().subscribe({
      next: (words) => {
        this.words = words;
        this.startNewGame();
      },
      error: (error) => {
        console.error('Failed to load words, using fallback:', error);
        this.words = this.fallbackWords;
        this.startNewGame();
      }
    });
  }

  startNewGame() {
    this.currentLevel = 1;
    this.currentQuestionIndex = 0;
    this.score = 0;
    this.totalScore = 0;
    this.showLevelComplete = false;
    this.wordHistory = [];
    this.availableHints = 3;
    this.loadCurrentWord();
  }

  loadCurrentWord() {
    const levelWords = this.getCurrentLevelWords();
    if (this.currentQuestionIndex < levelWords.length) {
      this.currentWord = levelWords[this.currentQuestionIndex];
      this.hintUsed = false;
      this.startTime = Date.now();
      this.setupLetters();
      this.showResult = false;
      this.isCorrect = null;
    } else {
      this.completeLevel();
    }
  }

  setupLetters() {
    const word = this.currentWord.word;
    const shuffledLetters = this.shuffleArray([...word.split('')]);
    this.availableLetters = shuffledLetters.map((letter, index) => ({
      letter,
      color: this.letterColors[index % this.letterColors.length],
      isDragging: false,
      used: false
    }));
    this.filledSlots = new Array(word.length).fill(null);
  }

  private shuffleArray(array: any[]): any[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }

  onDragStartLetter(index: number, event: DragEvent) {
    const letter = this.availableLetters[index];
    letter.isDragging = true;
    this.draggedLetterColor = letter.color;
    event.dataTransfer!.setData('text/plain', `available-${index}`);
    event.dataTransfer!.effectAllowed = 'move';
  }

  onDragStartSlot(index: number, event: DragEvent) {
    if (this.filledSlots[index]) {
      this.filledSlots[index]!.isDragging = true;
      event.dataTransfer!.setData('text/plain', `slot-${index}`);
      event.dataTransfer!.effectAllowed = 'move';
    }
  }

  onDropSlot(event: DragEvent, slotIndex: number) {
    event.preventDefault();
    const data = event.dataTransfer!.getData('text/plain');
    const [source, indexStr] = data.split('-');
    const index = parseInt(indexStr);

    if (source === 'available') {
      const draggedLetter = this.availableLetters[index];
      if (!this.filledSlots[slotIndex]) {
        // Create a copy of the letter for the slot
        const letterCopy = {
          letter: draggedLetter.letter,
          color: draggedLetter.color,
          isDragging: false,
          used: false
        };
        this.filledSlots[slotIndex] = letterCopy;
        // Mark the original letter as used
        this.availableLetters[index].used = true;
      }
    } else if (source === 'slot') {
      if (slotIndex !== index && !this.filledSlots[slotIndex]) {
        const temp = this.filledSlots[slotIndex];
        this.filledSlots[slotIndex] = this.filledSlots[index];
        this.filledSlots[index] = temp;
      }
    }
    this.resetDragState();
  }

  onDropAvailable(event: DragEvent) {
    event.preventDefault();
    const data = event.dataTransfer!.getData('text/plain');
    const [source, indexStr] = data.split('-');
    const index = parseInt(indexStr);

    if (source === 'slot' && this.filledSlots[index]) {
      // Remove the letter from slot and mark original as unused
      const slotLetter = this.filledSlots[index];
      const originalIndex = this.availableLetters.findIndex(l => l.letter === slotLetter.letter && l.used);
      if (originalIndex !== -1) {
        this.availableLetters[originalIndex].used = false;
      }
      this.filledSlots[index] = null;
    }
    this.resetDragState();
  }

  onDragEnd() {
    this.resetDragState();
  }

  onDragOver(event: DragEvent, index?: number) {
    event.preventDefault();
    event.stopPropagation();
    if (index !== undefined) {
      this.dragOverIndex = index;
    }
  }

  resetDragState() {
    this.availableLetters.forEach(letter => letter.isDragging = false);
    this.filledSlots.forEach(slot => {
      if (slot) slot.isDragging = false;
    });
    this.dragOverIndex = null;
    this.draggedLetterColor = null;
  }

  checkAnswer() {
    const userAnswer = this.filledSlots.map(slot => slot?.letter || '').join('');
    this.isCorrect = userAnswer === this.currentWord.word;
    this.correctWord = this.currentWord.word;

    if (this.isCorrect) {
      this.streakCount++;
      this.wordHistory.push(this.currentWord.word);
      // Perfect answer = 3 golden stars
      this.currentStars = 3;
      const starPoints = this.currentStars * 10;
      this.score += starPoints;
      this.totalScore += starPoints;
    } else {
      this.streakCount = 0;
      // Calculate stars based on accuracy
      this.currentStars = this.calculateStarsFromAccuracy(userAnswer);
      const starPoints = this.currentStars * 10;
      this.score += starPoints;
      this.totalScore += starPoints;
    }
    this.showResult = true;
  }

  nextWord() {
    if (this.isCorrect) {
      this.correctAnswers++;
    }
    
    if (this.currentQuestion >= this.totalQuestions) {
      this.showFinalResult = true;
      this.finalScore = Math.round((this.correctAnswers / this.totalQuestions) * 100);
      return;
    }
    
    this.currentQuestion++;
    this.loadNewWord();
    this.showResult = false;
  }

  loadNewWord() {
    this.currentQuestionIndex++;
    this.loadCurrentWord();
  }

  playAgain() {
    this.currentQuestion = 1;
    this.correctAnswers = 0;
    this.showFinalResult = false;
    this.loadNewWord();
  }

  completeLevel() {
    this.showLevelComplete = true;
    this.showResult = false;
    this.currentStars = this.getStars();
  }

  nextLevel() {
    this.currentQuestion = 1;
    this.correctAnswers = 0;
    this.showFinalResult = false;
    this.currentQuestionIndex = 0; // Reset to first question of the new level
    this.loadCurrentWord();
  }

  retryQuestion() {
    // Reset the current question without changing the question index
    this.showResult = false;
    this.hintUsed = false;
    this.loadCurrentWord();
  }

  retryLevel() {
    this.currentQuestionIndex = 0;
    this.score = 0;
    this.showLevelComplete = false;
    this.showResult = false;
    this.loadCurrentWord();
  }

  getCurrentLevelWords(): GameWord[] {
    return this.words.filter(w => w.level === this.currentLevel).slice(0, this.questionsPerLevel);
  }

  calculateStarsFromAccuracy(userAnswer: string): number {
    const correctWord = this.currentWord.word;
    let correctLetters = 0;

    // Count correct letters in correct positions
    for (let i = 0; i < Math.min(userAnswer.length, correctWord.length); i++) {
      if (userAnswer[i] === correctWord[i]) {
        correctLetters++;
      }
    }

    // Calculate accuracy percentage
    const accuracy = (correctLetters / correctWord.length) * 100;

    // Determine stars based on accuracy
    if (accuracy === 100) {
      return 3; // Perfect = 3 stars
    } else if (accuracy >= 80) {
      return 2; // 80%+ = 2 stars
    } else if (accuracy >= 60) {
      return 1; // 60%+ = 1 star
    } else {
      return 0; // Less than 60% = 0 stars
    }
  }

  getStars(): number {
    const levelWords = this.getCurrentLevelWords();
    const progress = (this.currentQuestionIndex / levelWords.length) * 100;
    const accuracy = this.wordHistory.length > 0
      ? (this.wordHistory.filter(w => this.getCurrentLevelWords().some(lw => lw.word === w)).length / this.wordHistory.length) * 100
      : 0;

    // Calculate stars based on performance
    let stars = 0;

    // Star 1: Complete at least 3 questions
    if (this.currentQuestionIndex >= 2) {
      stars = 1;
    }

    // Star 2: Complete at least 4 questions with good accuracy
    if (this.currentQuestionIndex >= 3 && accuracy >= 75) {
      stars = 2;
    }

    // Star 3: Complete all questions with excellent accuracy
    if (this.currentQuestionIndex >= 4 && accuracy >= 90) {
      stars = 3;
    }

    // Bonus star for perfect performance
    if (this.currentQuestionIndex >= 4 && accuracy === 100 && this.streakCount >= 3) {
      stars = 3;
    }

    return stars;
  }

  getResultMessage(): string {
    if (this.showResult) {
      return this.isCorrect ? 'Correct! ' : 'Essayez encore !';
    }
    if (this.showLevelComplete) {
      return `Niveau ${this.currentLevel} terminé !`;
    }
    return '';
  }

  useHint() {
    if (this.availableHints > 0 && !this.hintUsed) {
      const emptySlotIndex = this.filledSlots.findIndex(slot => !slot);
      if (emptySlotIndex !== -1) {
        const correctLetter = this.currentWord.word[emptySlotIndex];
        const letterIndex = this.availableLetters.findIndex(l => l.letter === correctLetter);
        if (letterIndex !== -1) {
          this.filledSlots[emptySlotIndex] = this.availableLetters[letterIndex];
          this.availableLetters.splice(letterIndex, 1);
          this.availableHints--;
          this.hintUsed = true;
        }
      }
    }
  }

  getScoreColor(): string {
    if (this.finalScore >= 80) return '#2ecc71';
    if (this.finalScore >= 50) return '#f39c12';
    return '#e74c3c';
  }

  getFinalResultMessage(): string {
    if (this.finalScore === 100) {
      return 'Parfait ! Tu es un champion ! ';
    } else if (this.finalScore >= 80) {
      return 'Excellent travail ! Continue comme ça ! ';
    } else if (this.finalScore >= 50) {
      return 'Bien joué ! Tu peux encore t\'améliorer ! ';
    } else {
      return 'Ne t\'inquiète pas ! Continue de t\'entraîner ! ';
    }
  }
}
