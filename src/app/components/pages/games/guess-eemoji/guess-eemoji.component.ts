import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GameTemplateComponent } from "../../../game-template/game-template.component";
import { SupabaseService } from '../../../../supabase.service';
import { CelebrationComponent, CelebrationData } from '../../../game-template/celebration/celebration.component';
import { AudioService } from '../../../../services/audio.service';

interface Question {
  id: string;
  level: number;
  emojis: string;
  value: string;
  options: string[];
  difficulty: 'facile' | 'moyen' | 'difficile';
}

@Component({
  selector: 'app-guess-eemoji',
  imports: [CommonModule, FormsModule, NgClass, GameTemplateComponent, CelebrationComponent],
  templateUrl: './guess-eemoji.component.html',
  styleUrls: ['./guess-eemoji.component.css']
})
export class GuessEemojiComponent implements OnInit, OnDestroy {
  // <-- set this to your DB game_id for this game
  private readonly GAME_ID = 5;

  // Game state
  loading = true;
  questions: Question[] = [];
  currentIndex = 0;
  selectedOption: string | null = null;
  feedback: string | null = null;
  isCorrect: boolean | null = null;
  isChecking: boolean = false;

  // Level and scoring
  level: number = 1;
  questionsCorrectInLevel: number = 0;
  timeElapsed: number = 0;
  bonusPoints: number = 0;
  readonly QUESTIONS_PER_LEVEL = 5;
  private timer: any;

  // Celebration modal
  showCelebration = false;
  celebrationData: CelebrationData | null = null;

  constructor(private supabaseService: SupabaseService, private audioService: AudioService) {}

  async ngOnInit() {
    // Try restore progress first
    try {
      const progress = await this.supabaseService.getPlayerProgress(this.GAME_ID);

      if (progress && typeof progress.level === 'number' && progress.level >= 1) {
        this.level = Math.max(1, progress.level);
      } else {
        this.level = 1;
      }

      // Load questions for the resolved level
      await this.loadQuestions(this.level);

      // Restore question index if available
      if (progress && typeof progress.question_num === 'number' && progress.question_num >= 1) {
        // clamp to available questions
        const qnum = Math.max(1, Math.min(progress.question_num, this.questions.length || this.QUESTIONS_PER_LEVEL));
        this.currentIndex = Math.max(0, qnum - 1);
      } else {
        // No saved progress — create initial row (best-effort)
        this.currentIndex = 0;
        try { await this.supabaseService.savePlayerProgress(this.GAME_ID, 1, 1); } catch (err) { /* ignore */ }
      }
    } catch (err) {
      console.error('Error restoring progress:', err);
      // fallback defaults
      this.level = 1;
      await this.loadQuestions(this.level);
      this.currentIndex = 0;
      try { await this.supabaseService.savePlayerProgress(this.GAME_ID, 1, 1); } catch (_) {}
    }

    // prepare UI state for the current question
    this.selectedOption = null;
    this.feedback = null;
    this.isCorrect = null;
    this.loading = false;

    // start timer
    this.startTimer();
  }

  ngOnDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  // Load level questions
  async loadQuestions(level: number) {
    this.loading = true;
    try {
      const data = await this.supabaseService.getEmojisQuestions(level);
      this.questions = data.slice(0, this.QUESTIONS_PER_LEVEL).map((q: any) => ({
        id: q.id,
        level: q.level,
        emojis: Array.isArray(q.emojis) ? q.emojis.join(' ') : q.emojis,
        value: q.value,
        options: q.chooses,
        difficulty: q.difficulty as 'facile' | 'moyen' | 'difficile'
      }));
      // do not overwrite currentIndex here — it's set by the caller (restore logic)
      this.selectedOption = null;
      this.feedback = null;
      this.isCorrect = null;
    } catch (error) {
      console.error('Error loading questions:', error);
      this.questions = [];
    } finally {
      this.loading = false;
    }
  }

  get currentQuestion(): Question {
    return this.questions[this.currentIndex];
  }

  // Called when user selects an option
  async checkAnswer(option: string) {
    if (this.isChecking) return;
    this.isChecking = true;

    this.selectedOption = option;
    this.isCorrect = option === this.currentQuestion.value;
    this.feedback = this.isCorrect ? 'Correct! 🎉' : 'Try again! 😢';

    if (this.isCorrect) {
      this.playCorrectSound();
      this.questionsCorrectInLevel++;
    } else {
      this.playWrongSound();
    }

    // Wait for user to click "Next"
    this.isChecking = false;
  }

  // Move to the next question (triggered by Next button)
  public async nextQuestion() {
    // If last question in the loaded set or reached QUESTIONS_PER_LEVEL -> finish level
    const isLast = this.currentIndex + 1 >= Math.min(this.QUESTIONS_PER_LEVEL, this.questions.length);
    if (isLast) {
      await this.showLevelComplete(); // handles saving next-level progress
      return;
    }

    // advance index
    this.currentIndex++;
    // reset local UI
    this.selectedOption = null;
    this.feedback = null;
    this.isCorrect = null;

    // Save progress: player is now at question (currentIndex+1)
    const currentQuestionNum = this.currentIndex + 1; // 1-based
    // best-effort, non-blocking
    this.supabaseService.savePlayerProgress(this.GAME_ID, this.level, currentQuestionNum)
      .then(saved => { if (!saved) console.warn('Failed to save progress (nextQuestion)'); })
      .catch(err => console.warn('savePlayerProgress error (nextQuestion):', err));
  }

  // Show celebration modal at the end of level
  private async showLevelComplete() {
    // compute time and bonus if needed
    const time = this.timeElapsed;
    const timeBonus = Math.max(0, 300 - time) * 2;
    this.bonusPoints = timeBonus;

    this.celebrationData = {
      level: this.level,
      questionsCorrect: this.questionsCorrectInLevel,
      totalQuestions: this.QUESTIONS_PER_LEVEL,
      timeElapsed: time,
      difficulty: this.currentQuestion?.difficulty
    };
    this.showCelebration = true;

    // Save progress: move player to next level with question_num = 1
    try {
      const nextLevel = this.level + 1;
      // clamp or allow beyond max as you prefer; here we just increment
      await this.supabaseService.savePlayerProgress(this.GAME_ID, nextLevel, 1);
    } catch (err) {
      console.warn('Failed to save progress on level completion:', err);
    }
  }

  // User closes modal
  onCelebrationClose() {
    this.showCelebration = false;
  }

  // User proceeds to next level
  async onNextLevel(nextLevel: number) {
    this.showCelebration = false;
    this.level = nextLevel;
    this.questionsCorrectInLevel = 0;
    this.timeElapsed = 0;
    this.currentIndex = 0;
    this.selectedOption = null;
    this.feedback = null;
    this.isCorrect = null;

    // load new level questions and attempt to create initial DB row for it (best-effort)
    await this.loadQuestions(this.level);
    try { await this.supabaseService.savePlayerProgress(this.GAME_ID, this.level, 1); } catch (_) {}
  }

  private startTimer() {
    this.timer = setInterval(() => this.timeElapsed++, 1000);
  }

  private playCorrectSound() {
    this.audioService.playCorrectSound();
  }

  private playWrongSound() {
    this.audioService.playWrongSound();
  }

  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }

  getQuestionCounter(): string {
    return `${this.currentIndex + 1}/${this.QUESTIONS_PER_LEVEL}`;
  }
}