import { Component } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GameTemplateComponent } from "../../../game-template/game-template.component";

interface CurrentWord {
  difficulty: 'easy' | 'medium' | 'hard';
  text: string;
  correct: string;
}

interface Question {
  emojis: string;
  answer: string;
  options: string[];
}

@Component({
  selector: 'app-guess-eemoji',
  imports: [CommonModule, FormsModule, NgClass, GameTemplateComponent],
  templateUrl: './guess-eemoji.component.html',
  styleUrl: './guess-eemoji.component.css'
})
export class GuessEemojiComponent {

  questions: Question[] = [
    { 
      emojis: '🐪🌵☀️', 
      answer: 'desert',
      options: ['beach', 'desert', 'mountain', 'forest']
    },
    { 
      emojis: '🍏🍎🍐', 
      answer: 'fruits',
      options: ['vegetables', 'fruits', 'sweets', 'drinks']
    },
    { 
      emojis: '⚽🥅', 
      answer: 'football',
      options: ['basketball', 'tennis', 'football', 'golf']
    },
    { 
      emojis: '🚗🛣️', 
      answer: 'car',
      options: ['bike', 'train', 'car', 'plane']
    }
  ];

  currentIndex = 0;
  selectedOption: string | null = null;
  feedback: string | null = null;
  isCorrect: boolean | null = null;
  
  // Game state properties
  level: number = 1;
  questionsCorrectInLevel: number = 0;
  timeElapsed: number = 0;
  currentWord: CurrentWord = {
    difficulty: 'easy',
    text: '',
    correct: ''
  };

  // Audio for correct and wrong answers
  private correctAudio: HTMLAudioElement;
  private wrongAudio: HTMLAudioElement;

  constructor() {
    this.correctAudio = new Audio('/audio/correct.mp3');
    this.wrongAudio = new Audio('/audio/wrong.mp3');
  }

  get currentDifficulty() {
    return this.currentWord.difficulty;
  }
  bonusPoints: number = 0;
  private timer: any;

  get currentQuestion(): Question {
    return this.questions[this.currentIndex];
  }

  // Initialize game
  ngOnInit() {
    this.startTimer();
  }
  
  // Clean up timer on destroy
  ngOnDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  // Play correct sound
  private playCorrectSound() {
    this.correctAudio.currentTime = 0;
    this.correctAudio.play().catch(error => {
      console.log('Audio playback failed:', error);
    });
  }

  // Play wrong sound
  private playWrongSound() {
    this.wrongAudio.currentTime = 0;
    this.wrongAudio.play().catch(error => {
      console.log('Audio playback failed:', error);
    });
  }
  
  // Timer methods
  private startTimer() {
    this.timer = setInterval(() => {
      this.timeElapsed++;
    }, 1000);
  }
  
  // Format time as MM:SS
  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }
  
  // Get time display class based on time elapsed
  getTimeDisplayClass(): string {
    if (this.timeElapsed < 30) return 'text-success';
    if (this.timeElapsed < 60) return 'text-warning';
    return 'text-danger';
  }
  
  // Get difficulty class based on level
  getDifficultyClass(): string {
    if (this.level <= 3) return 'text-success';
    if (this.level <= 6) return 'text-warning';
    return 'text-danger';
  }
  
  private getDifficultyText(): string {
    if (this.level <= 3) return 'easy';
    if (this.level <= 6) return 'medium';
    return 'hard';
  }

  checkAnswer(option: string): void {
    this.selectedOption = option;
    this.isCorrect = option === this.currentQuestion.answer;
    this.feedback = this.isCorrect ? 'Correct! 🎉' : 'Try again! 😢';
    
    if (this.isCorrect) {
      this.playCorrectSound(); // Play correct sound
      this.questionsCorrectInLevel++;
      if (this.questionsCorrectInLevel >= 5) {
        this.level++;
        this.questionsCorrectInLevel = 0;
      }
      
      // Add bonus points based on time
      if (this.timeElapsed < 10) {
        this.bonusPoints += 10;
      } else if (this.timeElapsed < 20) {
        this.bonusPoints += 5;
      }
      
      // Update current word
      this.currentWord = {
        difficulty: this.getDifficultyText() as 'easy' | 'medium' | 'hard',
        text: this.currentQuestion.answer,
        correct: this.currentQuestion.answer
      };
      
      // Move to next question after a delay
      setTimeout(() => {
        this.nextQuestion();
      }, 1500);
    } else {
      this.playWrongSound(); // Play wrong sound
    }
  }

  nextQuestion(): void {
    this.currentIndex = (this.currentIndex + 1) % this.questions.length;
    this.selectedOption = null;
    this.feedback = null;
    this.isCorrect = null;
  }

  // ===== UTILITY METHODS =====
  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }

  getLevelScorePercentage(): number {
    return Math.round((this.questionsCorrectInLevel / 5) * 100);
  }

  getScoreMessage(): string {
    const percentage = this.getLevelScorePercentage();
    if (percentage === 100) return 'Parfait ! Vous êtes un expert en emojis !';
    if (percentage >= 80) return 'Excellent ! Vous connaissez bien vos emojis !';
    if (percentage >= 60) return 'Bon travail ! Continuez à vous entraîner !';
    if (percentage >= 40) return 'Pas mal ! Essayez à nouveau pour vous améliorer !';
    return 'Continuez à vous entraîner ! Vous allez progresser !';
  }
}