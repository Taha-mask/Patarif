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
  
  get currentDifficulty() {
    return this.currentQuestion?.difficulty || 'easy';
  }
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
        hint: 'Connue pour la Tour Eiffel',
        options: ['France', 'Italie', 'Espagne', 'Allemagne'],
        correctAnswer: 'France',
        difficulty: 'easy'
      },
      {
        image: 'https://images.unsplash.com/photo-1538970272646-f61fabb3a8a2?w=400&h=300&fit=crop',
        hint: 'Pays du Soleil Levant',
        options: ['Japon', 'Chine', 'Corée du Sud', 'Thaïlande'],
        correctAnswer: 'Japon',
        difficulty: 'medium'
      },
      {
        image: 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=400&h=300&fit=crop',
        hint: 'Maison de la forêt amazonienne',
        options: ['Brésil', 'Argentine', 'Chili', 'Pérou'],
        correctAnswer: 'Brésil',
        difficulty: 'easy'
      },
      {
        image: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400&h=300&fit=crop',
        hint: 'Terre des kangourous et des koalas',
        options: ['Australie', 'Nouvelle-Zélande', 'Fidji', 'Papouasie-Nouvelle-Guinée'],
        correctAnswer: 'Australie',
        difficulty: 'hard'
      },
      {
        image: 'https://images.unsplash.com/photo-1543832923-44667a44c804?w=400&h=300&fit=crop',
        hint: 'Terre des pyramides',
        options: ['Égypte', 'Maroc', 'Tunisie', 'Algérie'],
        correctAnswer: 'Égypte',
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
      this.playSound('/audio/correct.mp3', 1500); // play for 1.5 sec
      this.score++;
      this.questionsCorrectInLevel++;
    } else {
      this.playSound('/audio/wrong.mp3', 2000); // play for 2 sec
    }
  }
  
  playSound(filePath: string, duration: number = 2000) {
    const audio = new Audio(filePath);
    audio.play().catch(err => console.error('Error playing sound:', err));
  
    // Stop after "duration"
    setTimeout(() => {
      audio.pause();
      audio.currentTime = 0; // reset to beginning
    }, duration);
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
    const percentage = this.getLevelScorePercentage();
    if (percentage === 100) return 'Parfait ! Vous êtes un expert en géographie !';
    if (percentage >= 80) return 'Excellent ! Vous connaissez bien les pays !';
    if (percentage >= 60) return 'Bon travail ! Continuez à vous entraîner !';
    if (percentage >= 40) return 'Pas mal ! Essayez à nouveau pour vous améliorer !';
    return 'Continuez à vous entraîner ! Vous allez progresser !';
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
