import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, style, animate, transition } from '@angular/animations';

import { GameTemplateComponent } from '../../../game-template/game-template.component';
import { CelebrationComponent } from '../../../game-template/celebration/celebration.component';
import { SupabaseService } from '../../../../supabase.service';
import { AudioService } from '../../../../services/audio.service';

// ====== TYPES ======
interface Question {
  image: string;
  options: string[];
  correctAnswer: string;
  difficulty: 'facile' | 'moyen' | 'difficile';
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

  constructor(private supabaseService: SupabaseService, private audioService: AudioService) {}

  private playCorrectSound() {
    this.audioService.playCorrect();
  }

  private playWrongSound() {
    this.audioService.playWrong();
  }
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

  get currentDifficulty(): 'facile' | 'moyen' | 'difficile' {
    return this.currentQuestionData?.difficulty || 'facil';
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
        difficulty: 'facile',
        level: this.currentLevel
      }];
    }
  }

  /**
   * Shuffles an array using Fisher-Yates algorithm
   * @param array The array to shuffle
   * @returns A new shuffled array
   */
  private shuffleArray<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }

  /**
   * Sets the current question by selecting a random unused question from the current level
   * and shuffling its options
   */
  private setCurrentQuestion(): void {
    try {
      const questions = this.questionsByLevel[this.currentLevel];
      
      // Validate questions array
      if (!questions?.length) {
        console.warn('No questions available for this level');
        this.completeLevel();
        return;
      }
      
      // Initialize used indices array for this level if it doesn't exist
      if (!Array.isArray(this.usedQuestionIndices[this.currentLevel])) {
        this.usedQuestionIndices[this.currentLevel] = [];
      }
      
      const usedIndices = this.usedQuestionIndices[this.currentLevel];
      
      // Check if we've used all questions
      if (usedIndices.length >= questions.length) {
        console.warn('All questions used in this level');
        this.completeLevel();
        return;
      }
      
      // Get available question indices
      const availableIndices = questions
        .map((_, index) => index)
        .filter(index => !usedIndices.includes(index));
      
      // Select a random question from available ones
      const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
      const selectedQuestion = questions[randomIndex];
      
      // Mark question as used
      this.usedQuestionIndices[this.currentLevel].push(randomIndex);
      
      // Shuffle options while ensuring the correct answer is included
      const shuffledOptions = this.shuffleArray(selectedQuestion.options);
      
      // Update current question data with shuffled options
      this.currentQuestionData = {
        ...selectedQuestion,
        options: shuffledOptions
      };
      
      // Reset answer state
      this.selectedAnswer = null;
      this.showResult = false;
      this.isCorrect = false;
      
    } catch (error) {
      console.error('Error setting current question:', error);
      this.completeLevel();
    }
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
