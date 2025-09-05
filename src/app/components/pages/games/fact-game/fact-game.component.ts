import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { GameTemplateComponent } from '../../../../components/game-template/game-template.component';
import { CelebrationComponent, CelebrationData } from '../../../../components/game-template/celebration/celebration.component';
import { SupabaseService } from '../../../../supabase.service';

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
  constructor(private supabase: SupabaseService, private router: Router) {}

  // ===== GAME CONFIG =====
  readonly MAX_LEVEL = 5;
  readonly QUESTIONS_PER_LEVEL = 5;
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

  // ===== AUDIO =====
  private correctAudio = new Audio('/audio/correct.mp3');
  private wrongAudio = new Audio('/audio/wrong.mp3');

  isLoading = true;

  // ---- LIFECYCLE ----
  async ngOnInit() {
    await this.startLevel();
    this.startTimer();
  }

  ngOnDestroy() {
    this.stopTimer();
  }

  // ========================
  // LEVEL FLOW
  // ========================
  private async startLevel() {
    this.isLoading = true;
    this.currentQuestionIndex = 0;
    this.questionsCorrectInLevel = 0;
  
    if (!this.usedQuestions[this.currentLevel]) this.usedQuestions[this.currentLevel] = new Set();
  
    await this.loadQuestionsForLevel(this.currentLevel);
    this.setCurrentQuestion();
    this.isLoading = false;
  
    // إعادة ضبط التايمر لكل مستوى
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
      // Fallback single question
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
    const available = questions.filter(q => !this.usedQuestions[this.currentLevel].has(q.questionText));

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

  nextQuestion() {
    this.currentQuestionIndex++;
    this.setCurrentQuestion();
  }

  private showLevelCompleteModal() {
    this.timeElapsed = Math.floor((Date.now() - this.startTime) / 1000);
    this.celebrationData = {
      level: this.currentLevel,
      questionsCorrect: this.questionsCorrectInLevel,
      totalQuestions: this.QUESTIONS_PER_LEVEL,
      timeElapsed: this.timeElapsed,
      difficulty: this.currentQuestion?.difficulty || 'facile'
    };
    this.showCelebration = true;
  }

  async onNextLevel(event: any) {
    this.showCelebration = false;

    if (this.currentLevel < this.MAX_LEVEL) {
      this.currentLevel++;
      await this.startLevel();
    } else {
      this.router.navigate(['/games']); // Game completed
    }
  }

  // ========================
  // TIMER
  // ========================
  startTimer() {
    this.timeElapsed = 0;
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
  // AUDIO
  // ========================
  private playCorrectSound() {
    this.correctAudio.currentTime = 0;
    this.correctAudio.play().catch(() => {});
  }

  private playWrongSound() {
    this.wrongAudio.currentTime = 0;
    this.wrongAudio.play().catch(() => {});
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
}
