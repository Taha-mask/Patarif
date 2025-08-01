import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameTemplateComponent } from "../../game-template/game-template.component";
import { ApiService, ProcessedQuestion } from '../../../services/api.service';

interface FactQuestion {
  id: number;
  statement: string;
  isTrue: boolean;
  explanation?: string;
  level: number;
}

@Component({
  selector: 'app-fact-game',
  standalone: true,
  imports: [CommonModule, GameTemplateComponent],
  templateUrl: './fact-game.component.html',
  styleUrls: ['./fact-game.component.css']
})
export class FactGameComponent implements OnInit {
  // Fallback questions if API fails
  fallbackQuestions: FactQuestion[] = [
    {
      id: 1,
      statement: "Elephants can fly",
      isTrue: false,
      explanation: "Elephants are mammals and cannot fly!",
      level: 1
    },
    {
      id: 2,
      statement: "The sun is a star",
      isTrue: true,
      explanation: "Yes! The sun is our closest star.",
      level: 1
    },
    {
      id: 3,
      statement: "Fish can breathe underwater",
      isTrue: true,
      explanation: "Fish have gills that help them breathe underwater!",
      level: 1
    },
    {
      id: 4,
      statement: "Cars can talk",
      isTrue: false,
      explanation: "Cars are machines and cannot talk!",
      level: 1
    },
    {
      id: 5,
      statement: "Rainbows have seven colors",
      isTrue: true,
      explanation: "Rainbows have red, orange, yellow, green, blue, indigo, and violet!",
      level: 1
    }
  ];

  // API-based questions
  apiQuestions: ProcessedQuestion[] = [];
  questions: FactQuestion[] = [];
  isLoading = true;
  useApiQuestions = true; // Toggle between API and fallback questions

  currentLevel = 1;
  questionsPerLevel = 5;
  currentQuestionIndex = 0;
  currentQuestion: FactQuestion = this.fallbackQuestions[0];
  selectedAnswer: boolean | null = null;
  isCorrect: boolean | null = null;
  showResult = false;
  score = 0;
  totalScore = 0;
  showConfetti = false;
  showLevelComplete = false;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadQuestions();
  }

  async loadQuestions() {
    this.isLoading = true;

    if (this.useApiQuestions) {
      try {
        // Use infinite questions generator
        this.apiService.generateInfiniteQuestions().subscribe({
          next: (apiQuestions) => {
            this.apiQuestions = apiQuestions;
            this.convertApiQuestionsToFactQuestions();
            this.startNewGame();
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Failed to load API questions, using fallback:', error);
            this.useApiQuestions = false;
            this.questions = this.fallbackQuestions;
            this.startNewGame();
            this.isLoading = false;
          }
        });
      } catch (error) {
        console.error('Error loading questions:', error);
        this.useApiQuestions = false;
        this.questions = this.fallbackQuestions;
        this.startNewGame();
        this.isLoading = false;
      }
    } else {
      this.questions = this.fallbackQuestions;
      this.startNewGame();
      this.isLoading = false;
    }
  }

  convertApiQuestionsToFactQuestions() {
    this.questions = this.apiQuestions.map((apiQ, index) => {
      // Convert multiple choice to true/false format
      // For simplicity, we'll create true/false statements based on the question
      const isTrue = Math.random() > 0.5; // Randomly assign true/false

      return {
        id: apiQ.id,
        statement: apiQ.question,
        isTrue: isTrue,
        explanation: isTrue ?
          `Correct! ${apiQ.correctAnswer} is the right answer.` :
          `Actually, the correct answer is ${apiQ.correctAnswer}.`,
        level: Math.floor(index / this.questionsPerLevel) + 1
      };
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
    this.showConfetti = false;
  }

  selectAnswer(answer: boolean) {
    if (this.showResult) return;

    this.selectedAnswer = answer;
    this.isCorrect = answer === this.currentQuestion.isTrue;

    if (this.isCorrect) {
      this.score++;
      this.showConfetti = true;
      setTimeout(() => {
        this.showConfetti = false;
      }, 3000);
    }

    this.showResult = true;
  }

  nextQuestion() {
    if (this.currentQuestionIndex < this.questions.length - 1) {
      this.currentQuestionIndex++;
      this.currentQuestion = this.questions[this.currentQuestionIndex];
      this.resetQuestionState();

      // Check if level is completed (every 5 questions)
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
    if (this.useApiQuestions) {
      this.apiService.generateInfiniteQuestions().subscribe({
        next: (newApiQuestions) => {
          const newFactQuestions = newApiQuestions.map((apiQ, index) => {
            const isTrue = Math.random() > 0.5;
            return {
              id: this.questions.length + index + 1,
              statement: apiQ.question,
              isTrue: isTrue,
              explanation: isTrue ?
                `Correct! ${apiQ.correctAnswer} is the right answer.` :
                `Actually, the correct answer is ${apiQ.correctAnswer}.`,
              level: Math.floor((this.questions.length + index) / this.questionsPerLevel) + 1
            };
          });

          this.questions = [...this.questions, ...newFactQuestions];
          this.currentQuestionIndex++;
          this.currentQuestion = this.questions[this.currentQuestionIndex];
          this.resetQuestionState();
        },
        error: (error) => {
          console.error('Failed to load more questions:', error);
          // Continue with existing questions by cycling through them
          this.currentQuestionIndex = 0;
          this.currentQuestion = this.questions[0];
          this.resetQuestionState();
        }
      });
    } else {
      // For fallback questions, cycle through them
      this.currentQuestionIndex = 0;
      this.currentQuestion = this.questions[0];
      this.resetQuestionState();
    }
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

  reloadQuestions() {
    this.useApiQuestions = !this.useApiQuestions;
    this.loadQuestions();
  }

  getCurrentLevelQuestions(): FactQuestion[] {
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
