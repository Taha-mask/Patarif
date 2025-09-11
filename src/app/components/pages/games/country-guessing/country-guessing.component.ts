import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, style, animate, transition } from '@angular/animations';

import { GameTemplateComponent } from '../../../game-template/game-template.component';
import { CelebrationComponent } from '../../../game-template/celebration/celebration.component';
import { SupabaseService } from '../../../../supabase.service';
import { AudioService } from '../../../../services/audio.service';
import { Router } from '@angular/router';
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
  private readonly GAME_ID = 2; // DB game id for this game

  // ====== GAME STATE ======
  currentLevel = 1;
  currentQuestionNumber = 1; // 1-based index within the level
  currentQuestionData!: Question;

  score = 0;
  bonusPoints = 0;
  questionsCorrectInLevel = 0;

  selectedAnswer: string | null = null;
  isCorrect = false;
  showResult = false;
  showLevelComplete = false;
  isLoading = true;

  // if true -> we've reached the end (no more levels/questions)
  gameFinished = false;

  // ====== TIMER ======
  timeElapsed = 0;
  private levelStartTime = 0;
  private timerInterval?: any;

  // ====== QUESTIONS STORAGE ======
  questionsByLevel: { [key: number]: Question[] } = {};
  usedQuestionIndices: { [key: number]: number[] } = {};

  // Public getter used by the template: returns the difficulty of the
  // currently displayed question (avoids template binding errors when
  // currentQuestionData is not yet initialized).
  get currentDifficulty(): 'facile' | 'moyen' | 'difficile' {
    return (this.currentQuestionData && this.currentQuestionData.difficulty) ? this.currentQuestionData.difficulty : 'facile';
  }

  constructor(private supabaseService: SupabaseService, private audioService: AudioService, private router: Router) {}

  // ====== LIFECYCLE ======
  async ngOnInit(): Promise<void> {
    this.isLoading = true;

    // restore saved progress (best-effort)
    try {
      const progress = await this.supabaseService.getPlayerProgress(this.GAME_ID);
      if (progress && progress.level && progress.level >= 1) {
        this.currentLevel = Math.max(1, progress.level);
      }

      // try to load questions for the restored level
      const hasQuestions = await this.loadQuestions(this.currentLevel);
      if (!hasQuestions) {
        // no questions for this level -> treat as final completion
        this.gameFinished = true;
        this.showLevelComplete = true;
        this.isLoading = false;
        return;
      }

      // restore question number if available
      if (progress && typeof progress.question_num === 'number' && progress.question_num >= 1) {
        const qnum = Math.max(1, Math.min(this.QUESTIONS_PER_LEVEL, progress.question_num));
        this.currentQuestionNumber = qnum;
        // approximate previously used indices so we don't repeat them immediately
        this.markRandomUsedIndices(this.currentLevel, qnum - 1);
      } else {
        // ensure DB row exists (best-effort)
        try { await this.supabaseService.savePlayerProgress(this.GAME_ID, this.currentLevel, this.currentQuestionNumber); } catch (_) {}
        this.usedQuestionIndices[this.currentLevel] = [];
      }
    } catch (err) {
      console.error('Error restoring progress:', err);
      this.currentLevel = 1;
      this.currentQuestionNumber = 1;
      this.usedQuestionIndices[this.currentLevel] = [];
    }

    // initialize the first visible question
    this.setCurrentQuestion();
    this.startTimer();
    this.isLoading = false;
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  // ====== HELPERS (timer) ======
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

  // ====== QUESTIONS LOADING & UTILITIES ======
  /**
   * Load questions for a given level and store locally.
   * Returns true if questions were loaded and length > 0.
   */
  private async loadQuestions(level: number): Promise<boolean> {
    try {
      const data = await this.supabaseService.getQuestions(level);
      const mapped = (data || []).map((q: any) => ({
        image: q.image,
        options: q.chooses,
        correctAnswer: q.value,
        difficulty: q.difficulty,
        level: q.level
      }));

      this.questionsByLevel[level] = mapped;
      // ensure used indices array exists
      if (!Array.isArray(this.usedQuestionIndices[level])) this.usedQuestionIndices[level] = [];

      return mapped.length > 0;
    } catch (err) {
      console.error('Error loading questions:', err);
      // fallback to a small built-in question to avoid breaking the flow
      this.questionsByLevel[level] = [
        {
          image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
          options: ['France', 'Italie', 'Espagne', 'Allemagne'],
          correctAnswer: 'France',
          difficulty: 'facile',
          level
        }
      ];
      this.usedQuestionIndices[level] = [];
      return true;
    }
  }

  private shuffleArray<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }

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
   * Choose a random unused question for the current level and prepare it.
   * If there are no questions available for the level, mark game as finished
   * (prevents an infinite loop of "completeLevel" -> "initLevel" -> no questions).
   */
  private setCurrentQuestion(): void {
    const questions = this.questionsByLevel[this.currentLevel];

    if (!questions || questions.length === 0) {
      console.warn('No questions available for level', this.currentLevel);
      // treat this as the natural end of the game (final celebration)
      this.gameFinished = true;
      this.showLevelComplete = true;
      this.stopTimer();
      return;
    }

    if (!Array.isArray(this.usedQuestionIndices[this.currentLevel])) {
      this.usedQuestionIndices[this.currentLevel] = [];
    }

    const used = this.usedQuestionIndices[this.currentLevel];

    // If we've exhausted questions for this level, finish the level normally.
    if (used.length >= questions.length || this.currentQuestionNumber > this.QUESTIONS_PER_LEVEL) {
      this.completeLevel();
      return;
    }

    const available = questions.map((_, i) => i).filter(i => !used.includes(i));
    const rand = available[Math.floor(Math.random() * available.length)];
    const q = questions[rand];

    // mark used
    this.usedQuestionIndices[this.currentLevel].push(rand);

    // shuffle options
    this.currentQuestionData = { ...q, options: this.shuffleArray(q.options) };

    // reset UI state for the new question
    this.selectedAnswer = null;
    this.showResult = false;
    this.isCorrect = false;
  }

  // ====== GAME FLOW ======
  async nextQuestion(): Promise<void> {
    // progress to next question number
    this.currentQuestionNumber++;

    if (this.currentQuestionNumber > this.QUESTIONS_PER_LEVEL) {
      // level finished
      await this.completeLevel();
      return;
    }

    // save progress (best-effort, non-blocking)
    this.supabaseService.savePlayerProgress(this.GAME_ID, this.currentLevel, this.currentQuestionNumber)
      .catch(err => console.warn('savePlayerProgress error:', err));

    // show next question
    this.setCurrentQuestion();
  }

  /**
   * Called when a level is finished. Shows celebration and awards time bonus.
   * If later the player requests to go to the next level, initLevel will try
   * to load questions; if none exist we will detect that and show final completion.
   */
  async completeLevel(): Promise<void> {
    this.stopTimer();
    this.showLevelComplete = true;

    const timeBonus = Math.max(0, 300 - this.timeElapsed) * 2;
    this.bonusPoints = timeBonus;
    this.score += timeBonus;

    // Save progress: move player to next level (best-effort). We do not force
    // loading the next level here to avoid immediately discovering that there
    // are no more questions and entering a loop. initLevel handles that check.
    try {
      const nextLevel = this.currentLevel + 1;
      await this.supabaseService.savePlayerProgress(this.GAME_ID, nextLevel, 1);
    } catch (err) {
      console.warn('Failed to save progress on level completion:', err);
    }
  }

  /**
   * User clicked "Next Level" in the celebration dialog.
   * Try to initialize the next level; if there are no questions for it we will
   * mark the game as finished and show the final celebration.
   */
  async onNextLevel(): Promise<void> {
    if (this.gameFinished) return;

    // Check if a next level actually exists before incrementing the current level.
    const nextLevel = this.currentLevel + 1;

    // Attempt to load questions for the next level. If none exist, treat as final end
    // of the game: show final completion and navigate back to the games listing.
    const hasNext = await this.loadQuestions(nextLevel);
    if (!hasNext) {
      // Final completion: stop timer, mark finished and show final celebration briefly
      this.stopTimer();
      this.gameFinished = true;
      this.showLevelComplete = true;
      this.isLoading = false;

      // Navigate back to games page after a short delay so player can see the final message.
      // (Adjust or remove delay if you prefer immediate navigation.)
      setTimeout(() => {
        this.router.navigate(['/games']).catch(err => console.warn('Navigation error:', err));
      }, 1200);
      return;
    }

    // Next level exists: apply it and initialize.
    this.currentLevel = nextLevel;
    this.isLoading = true;
    this.showLevelComplete = false;

    // loadQuestions already called above for nextLevel and populated questionsByLevel.
    // Reset level-specific state and start the next level.
    this.resetLevelState();
    this.setCurrentQuestion();
    this.startTimer();
    this.isLoading = false;
  

    // start the new level
    this.resetLevelState();
    this.setCurrentQuestion();
    this.startTimer();
    this.isLoading = false;
  }

  onCloseCelebration(): void {
    // simply hide the celebration overlay (if not final)
    if (this.gameFinished) return; // keep final celebration visible or handle separately if desired
    this.showLevelComplete = false;
  }

  private resetLevelState(): void {
    this.currentQuestionNumber = 1;
    this.questionsCorrectInLevel = 0;
    this.timeElapsed = 0;
    this.levelStartTime = Date.now();
    this.usedQuestionIndices[this.currentLevel] = [];
    this.stopTimer();
  }

  // ====== ANSWER HANDLING ======
  selectAnswer(option: string): void {
    if (this.showResult || !this.currentQuestionData) return;

    this.selectedAnswer = option;
    this.isCorrect = option === this.currentQuestionData.correctAnswer;
    this.showResult = true;

    if (this.isCorrect) {
      // play correct sound and update counters
      this.audioService.playCorrectSound?.();
      this.score++;
      this.questionsCorrectInLevel++;

      // save progress immediately (best-effort)
      this.supabaseService.savePlayerProgress(this.GAME_ID, this.currentLevel, this.currentQuestionNumber)
        .catch(err => console.warn('Failed to save progress after correct answer:', err));
    } else {
      this.audioService.playWrongSound?.();
    }
  }

  // ====== MISC HELPERS ======
  getOptionLetter(index: number): string { return String.fromCharCode(65 + index); }

  getLevelScorePercentage(): number {
    return Math.round((this.questionsCorrectInLevel / this.QUESTIONS_PER_LEVEL) * 100);
  }

  getCelebrationData() {
    return {
      level: this.currentLevel,
      questionsCorrect: this.questionsCorrectInLevel,
      totalQuestions: this.QUESTIONS_PER_LEVEL,
      score: this.score,
      timeElapsed: this.timeElapsed,
      bonusPoints: this.bonusPoints,
      difficulty: this.currentQuestionData?.difficulty || 'facile'
    };
  }
}
