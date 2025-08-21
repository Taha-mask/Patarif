import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, style, animate, transition } from '@angular/animations';
import { GameTemplateComponent } from '../../../game-template/game-template.component';

interface Question {
  image: string;
  hint: string;
  options: string[];
  correctAnswer: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

@Component({
  selector: 'app-country-guessing',
  standalone: true,
  imports: [CommonModule, GameTemplateComponent],
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
  // Level & Progress
  currentLevel = 1;
  questionsPerLevel = 5;
  questionsCorrectInLevel = 0;

  // Score & Bonus
  score = 0;
  bonusPoints = 0;

  // Timer
  timeElapsed = 0;
  timerInterval: any;

  // Game State
  currentQuestionIndex = 0;
  currentQuestion!: Question;
  selectedAnswer: string | null = null;
  isCorrect = false;
  showResult = false;
  isLoading = true;
  showLevelComplete = false;

  // Question List
  questions: Question[] = [];

  ngOnInit() {
    this.loadQuestions();
  }

  ngOnDestroy() {
    clearInterval(this.timerInterval);
  }

  loadQuestions() {
    this.isLoading = true;
    this.questions = [
      {
        image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
        hint: 'Known for the Eiffel Tower',
        options: ['France', 'Italy', 'Spain', 'Germany'],
        correctAnswer: 'France',
        difficulty: 'easy'
      },
      {
        image: 'https://images.unsplash.com/photo-1538970272646-f61fabb3a8a2?w=400&h=300&fit=crop',
        hint: 'Land of the Rising Sun',
        options: ['Japan', 'China', 'South Korea', 'Thailand'],
        correctAnswer: 'Japan',
        difficulty: 'medium'
      },
      {
        image: 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=400&h=300&fit=crop',
        hint: 'Home of the Amazon rainforest',
        options: ['Brazil', 'Argentina', 'Chile', 'Peru'],
        correctAnswer: 'Brazil',
        difficulty: 'easy'
      },
      {
        image: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400&h=300&fit=crop',
        hint: 'Land of kangaroos and koalas',
        options: ['Australia', 'New Zealand', 'Fiji', 'Papua New Guinea'],
        correctAnswer: 'Australia',
        difficulty: 'hard'
      },
      {
        image: 'https://images.unsplash.com/photo-1543832923-44667a44c804?w=400&h=300&fit=crop',
        hint: 'Land of the pyramids',
        options: ['Egypt', 'Morocco', 'Tunisia', 'Algeria'],
        correctAnswer: 'Egypt',
        difficulty: 'medium'
      }
    ];
    this.currentQuestionIndex = 0;
    this.questionsCorrectInLevel = 0;
    this.setCurrentQuestion();
    this.resetTimer();
    this.isLoading = false;
  }

  setCurrentQuestion() {
    this.currentQuestion = this.questions[this.currentQuestionIndex];
    this.selectedAnswer = null;
    this.showResult = false;
  }

  selectAnswer(option: string) {
    if (this.showResult) return;
    this.selectedAnswer = option;
    this.isCorrect = option === this.currentQuestion.correctAnswer;
    this.showResult = true;

    if (this.isCorrect) {
      this.score++;
      this.questionsCorrectInLevel++;
      this.calculateBonus();
    } else {
      this.bonusPoints = 0;
    }
  }

  calculateBonus() {
    const timeBonus = Math.max(0, 10 - this.timeElapsed); // quicker answers = more bonus
    this.bonusPoints = timeBonus;
    this.score += this.bonusPoints;
  }

  nextQuestion() {
    if (this.currentQuestionIndex + 1 < this.questions.length) {
      this.currentQuestionIndex++;
      this.setCurrentQuestion();
      this.resetTimer();
    } else {
      this.showLevelComplete = true;
      clearInterval(this.timerInterval);
    }
  }

  getLevelScorePercentage(): number {
    return Math.round((this.questionsCorrectInLevel / this.questionsPerLevel) * 100);
  }

  getScoreMessage(): string {
    if (this.questionsCorrectInLevel === this.questionsPerLevel) return 'Perfect score! 🌟';
    if (this.questionsCorrectInLevel >= this.questionsPerLevel / 2) return 'Good job! 👍';
    return 'Keep practicing! 💪';
  }

  nextLevel() {
    this.currentLevel++;
    this.score = 0;
    this.bonusPoints = 0;
    this.showLevelComplete = false;
    this.loadQuestions();
  }
  startTimer() {
    this.timeElapsed = 0;
    this.timerInterval = setInterval(() => {
      this.timeElapsed++;
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  resetTimer() {
    this.stopTimer();
    this.timeElapsed = 0;
    this.startTimer();
  }
  getDifficultyClass(): string {
    return `difficulty-${this.currentQuestion.difficulty}`;
  }

  getTimeDisplayClass(): string {
    if (this.timeElapsed < 15) return 'time-good';
    if (this.timeElapsed < 30) return 'time-warning';
    return 'time-danger';
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }


}
