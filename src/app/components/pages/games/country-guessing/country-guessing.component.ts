import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, style, animate, transition } from '@angular/animations';

import { GameTemplateComponent } from '../../../game-template/game-template.component';
import { CelebrationComponent } from '../../../game-template/celebration/celebration.component';
import { SupabaseService } from '../../../../supabase.service';

// ====== TYPES ======
interface Question {
  image: string;
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
  // ====== GAME CONFIGURATION ======
  readonly QUESTIONS_PER_LEVEL = 5;

  constructor(private supabaseService: SupabaseService) {}

  // ====== GAME STATE ======
  currentLevel = 1;
  currentQuestionIndex = 0;
  currentQuestionNumber = 1;
  currentQuestionData!: Question;

  score = 0;
  bonusPoints = 0;
  questionsCorrectInLevel = 0;

  selectedAnswer: string | null = null;
  isCorrect = false;
  showResult = false;
  showLevelComplete = false;
  isLoading = true;

  // ====== TIMER STATE ======
  timeElapsed = 0;
  private levelStartTime = 0;
  private timerInterval?: any;

  // ====== QUESTIONS ======
  questionsByLevel: { [key: number]: Question[] } = {};
  usedQuestionIndices: { [key: number]: number[] } = {};

  get currentDifficulty(): 'easy' | 'medium' | 'hard' {
    return this.currentQuestionData?.difficulty || 'easy';
  }

  // ====== LIFECYCLE ======
  ngOnInit(): void {
    this.initLevel();
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  // ========================
  // LEVEL FLOW
  // ========================
  private async initLevel(): Promise<void> {
    this.resetLevelState();
    await this.loadQuestions();
    this.setCurrentQuestion();
    this.startTimer();
    this.isLoading = false;
  }

  private resetLevelState(): void {
    this.currentQuestionNumber = 1;
    this.questionsCorrectInLevel = 0;
    this.timeElapsed = 0;
    this.levelStartTime = Date.now();
    this.usedQuestionIndices[this.currentLevel] = [];
    this.stopTimer();
  }

  completeLevel(): void {
    this.stopTimer();
    this.showLevelComplete = true;

    const timeBonus = Math.max(0, 300 - this.timeElapsed) * 2;
    this.bonusPoints = timeBonus;
    this.score += timeBonus;
  }

  onNextLevel(): void {
    this.currentLevel++;
    this.isLoading = true;   // 🔥 أظهر لودينج مباشرة
    this.showLevelComplete = false;
    this.initLevel();
  }

  onCloseCelebration(): void {
    this.showLevelComplete = false;
  }

  // ========================
  // TIMER HANDLING
  // ========================
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

  // ========================
  // QUESTIONS HANDLING
  // ========================
  private async loadQuestions(): Promise<void> {
    try {
      const data = await this.supabaseService.getQuestions(this.currentLevel);

      this.questionsByLevel[this.currentLevel] = data.map((q: any) => ({
        image: q.image,
        options: q.chooses,
        correctAnswer: q.value,
        difficulty: q.difficulty,
        level: q.level
      }));
    } catch (err) {
      console.error('Error loading questions:', err);
      // fallback
      this.questionsByLevel[this.currentLevel] = [{
        image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
        options: ['France', 'Italie', 'Espagne', 'Allemagne'],
        correctAnswer: 'France',
        difficulty: 'easy',
        level: this.currentLevel
      }];
    }
  }

  private setCurrentQuestion(): void {
    const questions = this.questionsByLevel[this.currentLevel];
    if (!questions || questions.length === 0) {
      console.warn('No questions available for this level');
      this.completeLevel();
      return;
    }
  
    // لو خلصت كل الأسئلة
    if (this.usedQuestionIndices[this.currentLevel].length >= questions.length) {
      console.warn('All questions used in this level');
      this.completeLevel();
      return;
    }
  
    let randomIndex: number;
    do {
      randomIndex = Math.floor(Math.random() * questions.length);
    } while (this.usedQuestionIndices[this.currentLevel].includes(randomIndex));
  
    this.usedQuestionIndices[this.currentLevel].push(randomIndex);
    this.currentQuestionData = questions[randomIndex];
  
    this.selectedAnswer = null;
    this.showResult = false;
  }
  

  nextQuestion(): void {
    this.currentQuestionNumber++;
    this.currentQuestionIndex++;

    if (this.currentQuestionNumber > this.QUESTIONS_PER_LEVEL) {
      this.completeLevel();
    } else {
      this.setCurrentQuestion();
    }
  }

  selectAnswer(option: string): void {
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

  // ========================
  // HELPERS
  // ========================
  private playSound(filePath: string, duration: number = 2000): void {
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
    return Math.round(
      (this.questionsCorrectInLevel / this.QUESTIONS_PER_LEVEL) * 100
    );
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
}
