import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { GameTemplateComponent } from '../../../../components/game-template/game-template.component';
import { CelebrationComponent, CelebrationData } from '../../../../components/game-template/celebration/celebration.component';
import { SupabaseService } from '../../../../supabase.service';

export interface FactQuestion {
  level: number;
  questionText: string;
  difficulty: 'easy' | 'medium' | 'hard';
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
  constructor(
    private supabase: SupabaseService,
    private router: Router
  ) {}

  // ===== GAME CONFIG =====
  readonly MAX_LEVEL = 5;
  readonly QUESTIONS_PER_LEVEL: { [level: number]: number } = { 
    1: 2, 
    2: 5, 
    3: 5,
    4: 5,
    5: 5
  };

  // ===== GAME STATE =====
  currentLevel = 1;
  currentQuestionIndex = 0;
  currentQuestion!: FactQuestion;
  questionsCorrectInLevel = 0;
  score = 0;

  questionsByLevel: { [key: number]: FactQuestion[] } = {};
  usedQuestions: { [key: number]: Set<string> } = {};

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
    this.startLevel();
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
    this.startTime = Date.now();
  }

  async loadQuestionsForLevel(level: number) {
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
      this.questionsByLevel[level] = [
        {
          level,
          questionText: 'A group of lions is called a pride.',
          difficulty: 'easy',
          answers: [
            { text: 'True', isCorrect: true },
            { text: 'False', isCorrect: false }
          ]
        }
      ];
    }
  }

  private setCurrentQuestion() {
    const questions = this.questionsByLevel[this.currentLevel];
    const available = questions.filter(q => !this.usedQuestions[this.currentLevel].has(q.questionText));

    if (available.length === 0) {
      // جميع الأسئلة تم استخدامها → اكمل المستوى
      this.showLevelCompleteScreen();
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
    const maxQuestions = this.QUESTIONS_PER_LEVEL[this.currentLevel] || this.questionsByLevel[this.currentLevel].length;

    if (this.currentQuestionIndex >= maxQuestions) {
      this.showLevelCompleteScreen();
    } else {
      this.setCurrentQuestion();
    }
  }
  showLevelCompleteScreen() {
    this.timeElapsed = Math.floor((Date.now() - this.startTime) / 1000);
    this.celebrationData = {
      level: this.currentLevel,
      questionsCorrect: this.questionsCorrectInLevel,
      totalQuestions: this.QUESTIONS_PER_LEVEL[this.currentLevel] || this.questionsByLevel[this.currentLevel].length,
      timeElapsed: this.timeElapsed,
      difficulty: this.currentQuestion.difficulty
    };
    this.showCelebration = true;
  
    // الانتقال تلقائي بعد 2 ثانية
    setTimeout(() => {
      this.onNextLevel();
    }, 2000); // يمكنك تغيير الوقت حسب الرغبة
  }
  

  async onNextLevel(nextLevel?: number) {
    this.showCelebration = false;
    
    if (nextLevel) {
      this.currentLevel = nextLevel;
    } else {
      // Only increment level if we haven't reached the max level
      if (this.currentLevel < this.MAX_LEVEL) {
        this.currentLevel++;
      } else {
        // Game completed, go back to games list
        this.router.navigate(['/games']);
        return;
      }
    }
    
    this.currentQuestionIndex = 0;
    this.questionsCorrectInLevel = 0;
    this.startTime = Date.now();
    await this.startLevel();
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
    const maxQuestions = this.QUESTIONS_PER_LEVEL[this.currentLevel] || this.questionsByLevel[this.currentLevel]?.length || 5;
    return this.currentQuestionIndex + 1 >= maxQuestions;
  }
}
