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
  // ====== CONFIG ======
  readonly QUESTIONS_PER_LEVEL = 5;
  // set the DB game id for this game
  private readonly GAME_ID = 2; // <-- change this to the correct game_id for country-guessing

  constructor(private supabaseService: SupabaseService, private audioService: AudioService) {}

  private playCorrectSound() {
    this.audioService.playCorrectSound();
  }

  private playWrongSound() {
    this.audioService.playWrongSound();
  }
  // ====== GAME STATE ======
  currentLevel = 1;
  currentQuestionIndex = 0;     // index in the questions array for the current level
  currentQuestionNumber = 1;    // 1-based question number within the level
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
  async ngOnInit(): Promise<void> {
    this.isLoading = true;

    // 1) try to restore saved progress
    try {
      const progress = await this.supabaseService.getPlayerProgress(this.GAME_ID);
      if (progress && progress.level && progress.level >= 1) {
        // clamp level to at least 1
        this.currentLevel = Math.max(1, progress.level);
      } else {
        this.currentLevel = 1;
      }

      // 2) load questions for the restored level
      await this.loadQuestions();

      // 3) restore question number & used indices if available
      if (progress && typeof progress.question_num === 'number' && progress.question_num >= 1) {
        // clamp question number to [1, QUESTIONS_PER_LEVEL]
        let qnum = Math.max(1, Math.min(this.QUESTIONS_PER_LEVEL, progress.question_num));
        this.currentQuestionNumber = qnum;
        // reconstruct an approximate used-question set by randomly choosing (qnum - 1) indices
        this.markRandomUsedIndices(this.currentLevel, qnum - 1);
        // set the index for the current question (we'll pick a fresh one when setCurrentQuestion runs)
        this.currentQuestionIndex = this.currentQuestionNumber - 1;
      } else {
        // no saved progress: create initial DB row and defaults
        await this.supabaseService.savePlayerProgress(this.GAME_ID, 1, 1);
        this.currentLevel = 1;
        this.currentQuestionNumber = 1;
        this.currentQuestionIndex = 0;
        this.usedQuestionIndices[this.currentLevel] = [];
      }
    } catch (err) {
      console.error('Error restoring player progress:', err);
      // fallback to defaults
      this.currentLevel = 1;
      this.currentQuestionNumber = 1;
      this.currentQuestionIndex = 0;
      this.usedQuestionIndices[this.currentLevel] = [];
      // try to create initial DB row (best-effort)
      try { await this.supabaseService.savePlayerProgress(this.GAME_ID, 1, 1); } catch (_) {}
    }

    // 4) initialize UI for current question
    this.setCurrentQuestion();
    this.startTimer();
    this.isLoading = false;
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

  async completeLevel(): Promise<void> {
    this.stopTimer();
    this.showLevelComplete = true;

    const timeBonus = Math.max(0, 300 - this.timeElapsed) * 2;
    this.bonusPoints = timeBonus;
    this.score += timeBonus;

    // Save progress: move player to next level with question_num = 1
    try {
      const nextLevel = this.currentLevel + 1;
      await this.supabaseService.savePlayerProgress(this.GAME_ID, nextLevel, 1);
    } catch (err) {
      console.warn('Failed to save progress on level completion:', err);
    }
  }

  onNextLevel(): void {
    this.currentLevel++;
    this.isLoading = true;   // 🔥 show loading immediately
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
   * Helper: mark `count` distinct random indices in usedQuestionIndices[level]
   * This reconstructs previously-used questions approximately when restoring progress.
   */
  private markRandomUsedIndices(level: number, count: number): void {
    const questions = this.questionsByLevel[level] || [];
    const total = questions.length;
    if (!this.usedQuestionIndices[level]) this.usedQuestionIndices[level] = [];
    if (count <= 0 || total === 0) {
      this.usedQuestionIndices[level] = [];
      return;
    }

    const indices = Array.from({ length: total }, (_, i) => i);
    // shuffle and pick first `count`
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    this.usedQuestionIndices[level] = indices.slice(0, Math.min(count, total));
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

  // ========================
  // NAVIGATION
  // ========================
  async nextQuestion(): Promise<void> {
    this.currentQuestionNumber++;
    this.currentQuestionIndex++;

    if (this.currentQuestionNumber > this.QUESTIONS_PER_LEVEL) {
      // finished level
      await this.completeLevel();
    } else {
      // save progress: player is now on this.currentQuestionNumber for currentLevel
      try {
        // best-effort save, don't block UI
        this.supabaseService.savePlayerProgress(this.GAME_ID, this.currentLevel, this.currentQuestionNumber)
          .then(saved => { if (!saved) console.warn('Failed to save progress (nextQuestion)'); })
          .catch(err => console.warn('savePlayerProgress error:', err));
      } catch (err) {
        console.warn('Error saving progress in nextQuestion:', err);
      }

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

    // 🔥 Save progress immediately on correct answer
    this.supabaseService.savePlayerProgress(this.GAME_ID, this.currentLevel, this.currentQuestionNumber)
      .catch(err => console.warn('Failed to save progress after correct answer:', err));
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
