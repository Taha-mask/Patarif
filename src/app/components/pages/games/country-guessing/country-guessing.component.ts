import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, style, animate, transition } from '@angular/animations';
import { GameTemplateComponent } from '../../../game-template/game-template.component';
import { CelebrationComponent } from '../../../game-template/celebration/celebration.component';

interface Question {
  image: string;
  hint: string;
  options: string[];
  correctAnswer: string;
  difficulty: 'easy' | 'medium' | 'hard';
  level: number;
}

@Component({
  selector: 'app-country-guessing',
  standalone: true,
  imports: [CommonModule, GameTemplateComponent, CelebrationComponent],
  templateUrl: './country-guessing.component.html',
  styleUrls: ['./country-guessing.component.css'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('400ms ease-in', style({ opacity: 1 }))
      ])
    ])
  ]
})
export class CountryGuessingComponent implements OnInit, OnDestroy {
  // ===== GAME CONFIGURATION =====
  readonly QUESTIONS_PER_LEVEL = 5;
  
  // ===== GAME STATE =====
  currentLevel = 1;
  currentQuestion = 1;
  questionsCorrectInLevel = 0;
  score = 0;
  bonusPoints = 0;
  timeElapsed = 0;
  levelStartTime = 0;
  timerInterval: any;
  currentQuestionIndex = 0;
  currentQuestionData!: Question;
  usedQuestionIndices: {[key: number]: number[]} = {};
  selectedAnswer: string | null = null;
  isCorrect = false;
  showResult = false;
  isLoading = true;
  showLevelComplete = false;
  questionsByLevel: { [key: number]: Question[] } = {};

  get currentDifficulty() {
    return this.currentQuestionData?.difficulty || 'easy';
  }

  // ===== LIFECYCLE HOOKS =====
  ngOnInit() {
    this.loadQuestions();
    this.startLevel();
  }

  ngOnDestroy() {
    this.stopTimer();
  }

  // ===== TIMER MANAGEMENT =====
  private startTimer(): void {
    this.levelStartTime = Date.now();
    this.timerInterval = setInterval(() => {
      this.timeElapsed = Math.floor((Date.now() - this.levelStartTime) / 1000);
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = undefined;
    }
  }

  private resetTimer(): void {
    this.timeElapsed = 0;
    this.levelStartTime = Date.now();
  }

  // ===== GAME FLOW =====
  startLevel() {
    this.isLoading = true;
    this.currentQuestion = 1;
    this.questionsCorrectInLevel = 0;
    this.timeElapsed = 0;
    this.levelStartTime = Date.now();
    
    if (this.usedQuestionIndices[this.currentLevel]) {
      this.usedQuestionIndices[this.currentLevel] = [];
    }
    
    this.loadQuestions();
    this.startTimer();
  }

  selectAnswer(option: string) {
    if (this.showResult) return;
  
    this.selectedAnswer = option;
    this.isCorrect = option === this.currentQuestionData.correctAnswer;
    this.showResult = true;
  
    if (this.isCorrect) {
      this.playSound('/audio/correct.mp3', 1500);
      this.score++;
      this.questionsCorrectInLevel++;
    } else {
      this.playSound('/audio/wrong.mp3', 2000);
    }
  }

  nextQuestion() {
    this.currentQuestion++;
    this.currentQuestionIndex++;
    
    if (this.currentQuestion > this.QUESTIONS_PER_LEVEL) {
      this.completeLevel();
      return;
    }
    
    this.setCurrentQuestion();
  }
  
  completeLevel() {
    this.stopTimer();
    this.showLevelComplete = true;
    
    const timeBonus = Math.max(0, 300 - this.timeElapsed) * 2;
    this.bonusPoints = timeBonus;
    this.score += timeBonus;
  }

  // ===== CELEBRATION MODAL =====
  onCloseCelebration(): void {
    this.showLevelComplete = false;
  }

  onNextLevel(): void {
    this.showLevelComplete = false;
    this.currentLevel++;
    
    if (this.usedQuestionIndices[this.currentLevel]) {
      this.usedQuestionIndices[this.currentLevel] = [];
    }
    
    this.startLevel();
  }

  getCelebrationData() {
    return {
      level: this.currentLevel,
      questionsCorrect: this.questionsCorrectInLevel,
      totalQuestions: this.QUESTIONS_PER_LEVEL,
      score: this.score,
      timeElapsed: this.timeElapsed,
      bonusPoints: this.bonusPoints,
      difficulty: this.currentDifficulty
    };
  }

  // ===== QUESTION MANAGEMENT =====
  private loadQuestions() {
    this.questionsByLevel = {
      1: [
        {
          image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
          hint: 'Connue pour la Tour Eiffel',
          options: ['France', 'Italie', 'Espagne', 'Allemagne'],
          correctAnswer: 'France',
          difficulty: 'easy',
          level: 1
        },
        // ... (other questions remain the same)
      ],
      2: [
        // ... (level 2 questions)
      ],
      3: [
        // ... (level 3 questions)
      ]
    };
    
    this.setCurrentQuestion();
    this.isLoading = false;
  }

  private setCurrentQuestion() {
    const currentLevelQuestions = this.questionsByLevel[this.currentLevel];
    
    if (!this.usedQuestionIndices[this.currentLevel]) {
      this.usedQuestionIndices[this.currentLevel] = [];
    }
    
    if (this.usedQuestionIndices[this.currentLevel].length >= currentLevelQuestions.length) {
      this.usedQuestionIndices[this.currentLevel] = [];
    }
    
    let randomIndex: number;
    do {
      randomIndex = Math.floor(Math.random() * currentLevelQuestions.length);
    } while (this.usedQuestionIndices[this.currentLevel].includes(randomIndex));
    
    this.usedQuestionIndices[this.currentLevel].push(randomIndex);
    this.currentQuestionData = currentLevelQuestions[randomIndex];
    this.selectedAnswer = null;
    this.showResult = false;
  }

  // ===== HELPER METHODS =====
  private playSound(filePath: string, duration: number = 2000) {
    const audio = new Audio(filePath);
    audio.play().catch(err => console.error('Error playing sound:', err));
  
    setTimeout(() => {
      audio.pause();
      audio.currentTime = 0;
    }, duration);
  }

  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }

  getLevelScorePercentage(): number {
    return Math.round((this.questionsCorrectInLevel / this.QUESTIONS_PER_LEVEL) * 100);
  }
}