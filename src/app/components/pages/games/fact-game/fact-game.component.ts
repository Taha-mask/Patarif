import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { GameTemplateComponent } from '../../../../components/game-template/game-template.component';
import { CelebrationComponent, CelebrationData } from '../../../../components/game-template/celebration/celebration.component';
import { SupabaseService } from '../../../../supabase.service';
import { AudioService } from '../../../../services/audio.service';

export interface FactQuestion {
  level: number;
  questionText: string;
  difficulty: 'facile' | 'moyen' | 'difficile';
  answers: { text: string; isCorrect: boolean }[];
}

@Component({
  selector: 'app-fact-game',
  standalone: true,
  imports: [CommonModule, GameTemplateComponent, CelebrationComponent, RouterLink],
  templateUrl: './fact-game.component.html',
  styleUrls: ['./fact-game.component.css']
})
export class FactGameComponent implements OnInit, OnDestroy {
  // ====== CONFIG =====
  readonly MAX_LEVEL = 5;
  readonly QUESTIONS_PER_LEVEL = 5;
  // set DB game id for this component (change to your real id)
  private readonly GAME_ID = 3;

  constructor(private supabase: SupabaseService, private router: Router, private audioService: AudioService) {}

  private playCorrectSound() { this.audioService.playCorrectSound(); }
  private playWrongSound() { this.audioService.playWrongSound(); }

  // ===== GAME STATE =====
  currentLevel = 1;
  currentQuestionIndex = 0;
  currentQuestion!: FactQuestion;
  questionsCorrectInLevel = 0;
  score = 0;

  questionsByLevel: Record<number, FactQuestion[]> = {};
  usedQuestions: Record<number, Set<string>> = {};

  answered = false;
  answerStatus: string[] = [];
  selectedAnswer: string | null = null;

  // ===== CELEBRATION =====
  showCelebration = false;
  celebrationData: CelebrationData | null = null;

  // ===== TIMER =====
  timeElapsed = 0;
  startTime = 0;
  timerInterval: any;

  isLoading = true;

  // ---- LIFECYCLE ----
  async ngOnInit() {
    this.isLoading = true;
    // Try restore progress first
    try {
      const progress = await this.supabase.getPlayerProgress(this.GAME_ID);
      if (progress && progress.level && progress.level >= 1) {
        this.currentLevel = Math.max(1, progress.level);
      } else {
        this.currentLevel = 1;
      }
      // start level with restored question number if available
      const startQuestionNum = progress && progress.question_num ? Math.max(1, Math.min(this.QUESTIONS_PER_LEVEL, progress.question_num)) : 1;
      await this.startLevel(startQuestionNum);
      // If there was no DB row, create initial one
      if (!progress) {
        await this.supabase.savePlayerProgress(this.GAME_ID, 1, 1);
      }
    } catch (err) {
      console.error('Error restoring progress:', err);
      // fallback to default start
      this.currentLevel = 1;
      await this.startLevel(1);
      try { await this.supabase.savePlayerProgress(this.GAME_ID, 1, 1); } catch (_) {}
    }

    this.startTimer();
    this.isLoading = false;
  }

  ngOnDestroy() {
    this.stopTimer();
  }

  // ========================
  // LEVEL FLOW
  // ========================
  /**
   * Starts (or restores) a level.
   * @param startQuestionNum - 1-based question number to resume at (default 1).
   */
  private async startLevel(startQuestionNum: number = 1) {
    this.isLoading = true;
    this.currentQuestionIndex = 0;
    this.questionsCorrectInLevel = 0;

    if (!this.usedQuestions[this.currentLevel]) this.usedQuestions[this.currentLevel] = new Set();

    await this.loadQuestionsForLevel(this.currentLevel);

    // If restoring mid-level, mark (startQuestionNum - 1) random questions as already used
    if (startQuestionNum > 1) {
      this.markRandomUsedQuestionTexts(this.currentLevel, startQuestionNum - 1);
      this.currentQuestionIndex = startQuestionNum - 1;
    } else {
      this.usedQuestions[this.currentLevel] = new Set();
      this.currentQuestionIndex = 0;
    }

    // set currentQuestionNumber implicitly via currentQuestionIndex
    this.setCurrentQuestion();
    this.isLoading = false;

    // reset timer for this level
    this.resetTimer();
  }

  private async loadQuestionsForLevel(level: number) {
    try {
      const data = await this.supabase.getQuestionsByLevel(level);
      this.questionsByLevel[level] = data.map((q: any) => ({
        level: q.level,
        questionText: q.question,
        difficulty: q.difficulty,
        answers: [
          { text: 'True', isCorrect: q.value === true },
          { text: 'False', isCorrect: q.value === false }
        ]
      }));
    } catch (err) {
      console.error('Error loading questions:', err);
      // fallback single question
      this.questionsByLevel[level] = [
        {
          level,
          questionText: 'A group of lions is called a pride.',
          difficulty: 'facile',
          answers: [
            { text: 'True', isCorrect: true },
            { text: 'False', isCorrect: false }
          ]
        }
      ];
    }
  }

  private setCurrentQuestion() {
    const questions = this.questionsByLevel[this.currentLevel] || [];
    if (!questions.length) {
      this.showLevelCompleteModal();
      return;
    }

    if (!this.usedQuestions[this.currentLevel]) this.usedQuestions[this.currentLevel] = new Set();

    const available = questions.filter(q => !this.usedQuestions[this.currentLevel].has(q.questionText));

    // If we've used all questions or reached max questions per level => finish
    if (available.length === 0 || this.currentQuestionIndex >= this.QUESTIONS_PER_LEVEL) {
      this.showLevelCompleteModal();
      return;
    }

    const randomIndex = Math.floor(Math.random() * available.length);
    this.currentQuestion = available[randomIndex];
    this.usedQuestions[this.currentLevel].add(this.currentQuestion.questionText);
    this.resetAnswerStatus();
  }

  private resetAnswerStatus() {
    this.answerStatus = this.currentQuestion.answers.map(() => '');
    this.answered = false;
    this.selectedAnswer = null;
  }

  checkAnswer(isCorrect: boolean, index: number) {
    if (this.answered) return;

    this.answered = true;
    this.selectedAnswer = this.currentQuestion.answers[index].text;

    if (isCorrect) {
      this.answerStatus[index] = 'correct';
      this.score++;
      this.questionsCorrectInLevel++;
      this.playCorrectSound();
    } else {
      this.answerStatus[index] = 'wrong';
      const correctIndex = this.currentQuestion.answers.findIndex(a => a.isCorrect);
      if (correctIndex !== -1) this.answerStatus[correctIndex] = 'correct';
      this.playWrongSound();
    }
  }

  /**
   * Advance to the next question.
   * Saves progress for the player (current level + question number).
   */
  async nextQuestion() {
    this.currentQuestionIndex++;

    // If exceeded QUESTIONS_PER_LEVEL -> finish level
    if (this.currentQuestionIndex >= this.QUESTIONS_PER_LEVEL) {
      await this.showLevelCompleteModal();
      return;
    }

    // Save progress: this player is now at question (currentQuestionIndex + 1)
    const currentQuestionNum = this.currentQuestionIndex + 1; // 1-based
    try {
      // best-effort (non-blocking UI)
      this.supabase.savePlayerProgress(this.GAME_ID, this.currentLevel, currentQuestionNum)
        .then(saved => { if (!saved) console.warn('Failed to save progress (nextQuestion)'); })
        .catch(err => console.warn('savePlayerProgress error (nextQuestion):', err));
    } catch (err) {
      console.warn('Error saving progress in nextQuestion:', err);
    }

    // pick new question
    this.setCurrentQuestion();
  }

  private async showLevelCompleteModal() {
    // compute elapsed for the level
    this.timeElapsed = Math.floor((Date.now() - this.startTime) / 1000);
    this.celebrationData = {
      level: this.currentLevel,
      questionsCorrect: this.questionsCorrectInLevel,
      totalQuestions: this.QUESTIONS_PER_LEVEL,
      timeElapsed: this.timeElapsed,
      difficulty: this.currentQuestion?.difficulty || 'facile'
    };
    this.showCelebration = true;

    // Save progress: move player to next level with question_num = 1
    try {
      const nextLevel = Math.min(this.MAX_LEVEL, this.currentLevel + 1);
      await this.supabase.savePlayerProgress(this.GAME_ID, nextLevel, 1);
    } catch (err) {
      console.warn('Failed to save progress on level completion:', err);
    }
  }

  async onNextLevel(event: any) {
    this.showCelebration = false;

    if (this.currentLevel < this.MAX_LEVEL) {
      this.currentLevel++;
      await this.startLevel(1);
    } else {
      // Game completed — optionally clear progress or set to MAX+1 as you want
      this.router.navigate(['/games']);
    }
  }

  // ========================
  // TIMER
  // ========================
  startTimer() {
    this.timeElapsed = 0;
    this.startTime = Date.now();
    this.timerInterval = setInterval(() => this.timeElapsed++, 1000);
  }

  stopTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
  }

  private resetTimer() {
    this.stopTimer();
    this.timeElapsed = 0;
    this.startTime = Date.now();
    this.startTimer();
  }

  // ========================
  // HELPERS
  // ========================
  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }

  get currentCorrectAnswer(): string {
    return this.currentQuestion?.answers.find(a => a.isCorrect)?.text || '';
  }

  get isLastQuestion(): boolean {
    return this.currentQuestionIndex + 1 >= this.QUESTIONS_PER_LEVEL;
  }

  /**
   * Mark `count` distinct random question texts as used for `level`.
   * This is an approximate reconstruction of prior progress when restoring.
   */
  private markRandomUsedQuestionTexts(level: number, count: number): void {
    const questions = this.questionsByLevel[level] || [];
    const total = questions.length;
    if (!this.usedQuestions[level]) this.usedQuestions[level] = new Set();
    if (count <= 0 || total === 0) {
      this.usedQuestions[level] = new Set();
      return;
    }

    const indices = Array.from({ length: total }, (_, i) => i);
    // shuffle indices
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    const chosen = indices.slice(0, Math.min(count, total));
    this.usedQuestions[level] = new Set(chosen.map(i => questions[i].questionText));
  }
}
