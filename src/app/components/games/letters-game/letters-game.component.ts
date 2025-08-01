import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameTemplateComponent } from "../../game-template/game-template.component";
import { ApiService, GameWord } from '../../../services/api.service';

interface LetterTile {
  letter: string;
  color: string;
  isDragging: boolean;
  originalPosition: Position;
}

interface Position {
  x: number;
  y: number;
}

@Component({
  selector: 'app-letters-game',
  standalone: true,
  imports: [CommonModule, GameTemplateComponent],
  templateUrl: './letters-game.component.html',
  styleUrls: ['./letters-game.component.css']
})
export class LettersGameComponent implements OnInit {
  // Fallback words if API fails
  fallbackWords: GameWord[] = [
    { word: 'POMME', image: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=400&h=300&fit=crop', level: 1 },
    { word: 'CHAT', image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=300&fit=crop', level: 1 },
    { word: 'MAIN', image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=300&fit=crop', level: 1 },
    { word: 'LUNE', image: 'https://images.unsplash.com/photo-1522030299830-16b8d3d049fe?w=400&h=300&fit=crop', level: 1 },
    { word: 'SOLEIL', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop', level: 2 },
    { word: 'MAISON', image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop', level: 2 },
    { word: 'JARDIN', image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop', level: 2 },
    { word: 'MUSIQUE', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop', level: 3 },
    { word: 'ANIMAL', image: 'https://images.unsplash.com/photo-1549366021-9f761d450615?w=400&h=300&fit=crop', level: 3 },
    { word: 'COULEUR', image: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=400&h=300&fit=crop', level: 3 }
  ];

  words: GameWord[] = [];
  currentLevel = 1;
  wordsPerLevel = 5;
  currentWordIndex = 0;
  currentWord: GameWord = this.fallbackWords[0];
  availableLetters: LetterTile[] = [];
  filledSlots: (LetterTile | null)[] = [];
  originalPositions: Position[] = [];
  selectedAnswer: boolean | null = null;
  isCorrect: boolean | null = null;
  showResult = false;
  score = 0;
  totalScore = 0;
  showLevelComplete = false;
  imageUrl: string = this.fallbackWords[0].image;
  letterColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57'];

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
    this.currentWordIndex = 0;
    this.score = 0;
    this.totalScore = 0;
    this.showLevelComplete = false;
    this.loadCurrentWord();
  }

  loadCurrentWord() {
    const levelWords = this.words.filter(w => w.level === this.currentLevel);
    if (this.currentWordIndex < levelWords.length) {
      this.currentWord = levelWords[this.currentWordIndex];
      this.imageUrl = this.currentWord.image;
      this.setupLetters();
    } else {
      this.completeLevel();
    }
  }

  setupLetters() {
    const word = this.currentWord.word;
    const letters = word.split('');

    // Create letter tiles with random positions
    this.availableLetters = letters.map((letter, index) => ({
      letter,
      color: this.letterColors[index % this.letterColors.length],
      isDragging: false,
      originalPosition: {
        x: 10 + (index * 15) + Math.random() * 10,
        y: 20 + Math.random() * 20
      }
    }));

    // Create empty slots
    this.filledSlots = new Array(word.length).fill(null);

    // Store original positions for placeholders
    this.originalPositions = this.availableLetters.map(letter => letter.originalPosition);
  }

  onDragStartLetter(index: number, event: DragEvent) {
    this.availableLetters[index].isDragging = true;
    event.dataTransfer!.setData('text/plain', index.toString());
    event.dataTransfer!.effectAllowed = 'move';
  }

  onDragStartSlot(index: number, event: DragEvent) {
    if (this.filledSlots[index]) {
      this.filledSlots[index]!.isDragging = true;
      event.dataTransfer!.setData('text/plain', index.toString());
      event.dataTransfer!.effectAllowed = 'move';
    }
  }

  onDropSlot(event: DragEvent, slotIndex: number) {
    event.preventDefault();

    const draggedIndex = parseInt(event.dataTransfer!.getData('text/plain'));
    const draggedLetter = this.availableLetters[draggedIndex];

    if (draggedLetter && !this.filledSlots[slotIndex]) {
      // Move letter from available to slot
      this.filledSlots[slotIndex] = draggedLetter;
      this.availableLetters.splice(draggedIndex, 1);
    } else if (this.filledSlots[slotIndex]) {
      // Swap letters
      const temp = this.filledSlots[slotIndex];
      this.filledSlots[slotIndex] = draggedLetter;
      this.availableLetters[draggedIndex] = temp!;
    }
  }

  onDropAvailable(event: DragEvent) {
    event.preventDefault();

    const draggedIndex = parseInt(event.dataTransfer!.getData('text/plain'));
    const draggedLetter = this.filledSlots[draggedIndex];

    if (draggedLetter) {
      // Return letter to available area
      this.availableLetters.push(draggedLetter);
      this.filledSlots[draggedIndex] = null;
    }
  }

  onDragEnd() {
    // Reset dragging state
    this.availableLetters.forEach(letter => letter.isDragging = false);
    this.filledSlots.forEach(slot => {
      if (slot) slot.isDragging = false;
    });
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  resetDragState() {
    this.availableLetters.forEach(letter => letter.isDragging = false);
    this.filledSlots.forEach(slot => {
      if (slot) slot.isDragging = false;
    });
  }

  isPositionOccupied(position: Position): boolean {
    return this.availableLetters.some(letter =>
      Math.abs(letter.originalPosition.x - position.x) < 5 &&
      Math.abs(letter.originalPosition.y - position.y) < 5
    );
  }

  checkAnswer() {
    const userAnswer = this.filledSlots.map(slot => slot?.letter || '').join('');
    this.isCorrect = userAnswer === this.currentWord.word;

    if (this.isCorrect) {
      this.score += 10; // 10 points per correct word
    }

    this.showResult = true;
  }

  nextWord() {
    if (this.currentWordIndex < this.words.filter(w => w.level === this.currentLevel).length - 1) {
      this.currentWordIndex++;
      this.loadCurrentWord();
      this.resetDragState();
    } else {
      this.completeLevel();
    }
  }

  completeLevel() {
    this.totalScore += this.score;
    this.showLevelComplete = true;
    this.showResult = false;
  }

  nextLevel() {
    this.currentLevel++;
    this.currentWordIndex = 0;
    this.score = 0; // Reset score for new level
    this.showLevelComplete = false;

    // For infinite gameplay, cycle through levels
    const maxLevel = Math.max(...this.words.map(w => w.level));
    if (this.currentLevel > maxLevel) {
      this.currentLevel = 1; // Reset to level 1 for infinite gameplay
    }

    this.loadCurrentWord();
  }

  getCurrentLevelWords(): GameWord[] {
    return this.words.filter(w => w.level === this.currentLevel);
  }

  getLevelScorePercentage(): number {
    const levelWords = this.getCurrentLevelWords();
    return Math.round((this.score / (levelWords.length * 10)) * 100);
  }

  getTotalScorePercentage(): number {
    const totalPossible = this.currentWordIndex + 1;
    return Math.round((this.totalScore / (totalPossible * 10)) * 100);
  }

  getScoreMessage(): string {
    const percentage = this.getLevelScorePercentage();
    if (percentage >= 90) return 'Excellent! 🌟';
    if (percentage >= 70) return 'Great Job! 🎉';
    if (percentage >= 50) return 'Good Work! 👍';
    return 'Keep Learning! 📚';
  }

  toggleFullScreen() {
    // This method is called by the GameTemplate component
    // The actual fullscreen functionality is handled by the template
  }
}
