import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameTemplateComponent } from "../../game-template/game-template.component";
import { ApiService, CountryQuestion } from '../../../services/api.service';

@Component({
  selector: 'app-country-guessing',
  standalone: true,
  imports: [CommonModule, GameTemplateComponent],
  templateUrl: './country-guessing.component.html',
  styleUrls: ['./country-guessing.component.css']
})
export class CountryGuessingComponent implements OnInit {
  questions: CountryQuestion[] = [
    {
      id: 1,
      name: 'France',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
      options: ['France', 'Germany', 'Italy', 'Spain'],
      correctAnswer: 'France',
      hint: 'Land of wine and cheese'
    },
    {
      id: 2,
      name: 'Japan',
      image: 'https://images.unsplash.com/photo-1538970272646-f61fabb3a8a2?w=400&h=300&fit=crop',
      options: ['China', 'Japan', 'Korea', 'Thailand'],
      correctAnswer: 'Japan',
      hint: 'Land of cherry blossoms'
    },
    {
      id: 3,
      name: 'Brazil',
      image: 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=400&h=300&fit=crop',
      options: ['Brazil', 'Argentina', 'Chile', 'Peru'],
      correctAnswer: 'Brazil',
      hint: 'Home of the Amazon rainforest'
    },
    {
      id: 4,
      name: 'Australia',
      image: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400&h=300&fit=crop',
      options: ['Australia', 'New Zealand', 'Fiji', 'Papua New Guinea'],
      correctAnswer: 'Australia',
      hint: 'Land of kangaroos and koalas'
    },
    {
      id: 5,
      name: 'Egypt',
      image: 'https://images.unsplash.com/photo-1543832923-44667a44c804?w=400&h=300&fit=crop',
      options: ['Egypt', 'Morocco', 'Tunisia', 'Algeria'],
      correctAnswer: 'Egypt',
      hint: 'Land of the pyramids'
    }
  ];

  currentLevel = 1;
  questionsPerLevel = 5;
  currentQuestionIndex = 0;
  currentQuestion = this.questions[0];
  selectedAnswer: string | null = null;
  isCorrect: boolean | null = null;
  showResult = false;
  score = 0;
  totalScore = 0;
  showLevelComplete = false;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadQuestions();
  }

  loadQuestions() {
    this.apiService.generateInfiniteCountries().subscribe({
      next: (countries) => {
        this.questions = countries;
        this.startNewGame();
      },
      error: (error) => {
        console.error('Failed to load countries, using fallback:', error);
        this.startNewGame();
      }
    });
  }

  startNewGame() {
    this.currentLevel = 1;
    this.currentQuestionIndex = 0;
    this.score = 0;
    this.totalScore = 0;
    this.showLevelComplete = false;
    this.currentQuestion = this.questions[0];
    this.resetQuestionState();
  }

  resetQuestionState() {
    this.selectedAnswer = null;
    this.isCorrect = null;
    this.showResult = false;
  }

  selectAnswer(answer: string) {
    if (this.showResult) return;

    this.selectedAnswer = answer;
    this.isCorrect = answer === this.currentQuestion.correctAnswer;

    if (this.isCorrect) {
      this.score++;
    }

    this.showResult = true;
  }

  nextQuestion() {
    if (this.currentQuestionIndex < this.questions.length - 1) {
      this.currentQuestionIndex++;
      this.currentQuestion = this.questions[this.currentQuestionIndex];
      this.resetQuestionState();

      if (this.currentQuestionIndex % this.questionsPerLevel === 0) {
        this.completeLevel();
      }
    } else {
      // Infinite gameplay: load more questions and continue
      this.completeLevel();
      this.loadMoreQuestions();
    }
  }

  loadMoreQuestions() {
    // Load more countries for infinite gameplay
    this.apiService.generateInfiniteCountries().subscribe({
      next: (newCountries) => {
        this.questions = [...this.questions, ...newCountries];
        this.currentQuestionIndex++;
        this.currentQuestion = this.questions[this.currentQuestionIndex];
        this.resetQuestionState();
      },
      error: (error) => {
        console.error('Failed to load more countries:', error);
        // Continue with existing questions by cycling through them
        this.currentQuestionIndex = 0;
        this.currentQuestion = this.questions[0];
        this.resetQuestionState();
      }
    });
  }

  completeLevel() {
    this.totalScore += this.score;
    this.showLevelComplete = true;
    this.showResult = false;
  }

  nextLevel() {
    this.currentLevel++;
    this.score = 0; // Reset score for new level
    this.showLevelComplete = false;
  }

  tryAgain() {
    this.resetQuestionState();
  }

  getCurrentLevelQuestions(): CountryQuestion[] {
    const startIndex = (this.currentLevel - 1) * this.questionsPerLevel;
    const endIndex = startIndex + this.questionsPerLevel;
    return this.questions.slice(startIndex, endIndex);
  }

  getLevelScorePercentage(): number {
    return Math.round((this.score / this.questionsPerLevel) * 100);
  }

  getTotalScorePercentage(): number {
    const totalPossible = this.currentQuestionIndex + 1;
    return Math.round((this.totalScore / totalPossible) * 100);
  }

  getScoreMessage(): string {
    const percentage = this.getLevelScorePercentage();
    if (percentage >= 90) return 'Excellent! 🌟';
    if (percentage >= 70) return 'Great Job! 🎉';
    if (percentage >= 50) return 'Good Work! 👍';
    return 'Keep Learning! 📚';
  }

  toggleFullScreen() {
    // This method is called by the GameTemplate component
    // The actual fullscreen functionality is handled by the template
  }
}
