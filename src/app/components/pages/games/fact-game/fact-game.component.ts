import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameTemplateComponent } from '../../../../components/game-template/game-template.component';

interface Option {
  text: string;
  isCorrect: boolean;
}

interface CurrentWord {
  difficulty: 'easy' | 'medium' | 'hard';
  correct: string;
}

interface Question {
  text: string;
  options: Option[];
  difficulty: 'easy' | 'medium' | 'hard';
}

@Component({
  selector: 'app-fact-game',
  standalone: true,
  imports: [CommonModule, GameTemplateComponent],
  templateUrl:'./fact-game.component.html',
  styleUrls: ['./fact-game.component.css']
})
export class FactGameComponent implements OnInit, OnDestroy {
  // Helper method to get letter for answer options (A, B, C, D, ...)
  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }



  // Questions organized by levels
  questionsByLevel: { [key: number]: Question[] } = {
    1: [
      {
        text: 'The Earth revolves around the Sun.',
        options: [
          { text: 'True', isCorrect: true },
          { text: 'False', isCorrect: false }
        ],
        difficulty: 'easy'
      },
      {
        text: 'Cats can fly.',
        options: [
          { text: 'True', isCorrect: false },
          { text: 'False', isCorrect: true }
        ],
        difficulty: 'easy'
      },
      {
        text: 'Water freezes at 0°C.',
        options: [
          { text: 'True', isCorrect: true },
          { text: 'False', isCorrect: false }
        ],
        difficulty: 'easy'
      },
      {
        text: 'The human body has 206 bones.',
        options: [
          { text: 'True', isCorrect: true },
          { text: 'False', isCorrect: false }
        ],
        difficulty: 'easy'
      },
      {
        text: 'Sharks are mammals.',
        options: [
          { text: 'True', isCorrect: false },
          { text: 'False', isCorrect: true }
        ],
        difficulty: 'easy'
      }
    ],
    2: [
      {
        text: 'The speed of light is approximately 300,000 km/s.',
        options: [
          { text: 'True', isCorrect: true },
          { text: 'False', isCorrect: false }
        ],
        difficulty: 'easy'
      },
      {
        text: 'Mount Everest is the tallest mountain on Earth.',
        options: [
          { text: 'True', isCorrect: true },
          { text: 'False', isCorrect: false }
        ],
        difficulty: 'easy'
      },
      {
        text: 'The Great Wall of China is visible from space.',
        options: [
          { text: 'True', isCorrect: false },
          { text: 'False', isCorrect: true }
        ],
        difficulty: 'easy'
      },
      {
        text: 'Dolphins are fish.',
        options: [
          { text: 'True', isCorrect: false },
          { text: 'False', isCorrect: true }
        ],
        difficulty: 'easy'
      },
      {
        text: 'The human brain uses about 20% of the body\'s energy.',
        options: [
          { text: 'True', isCorrect: true },
          { text: 'False', isCorrect: false }
        ],
        difficulty: 'easy'
      }
    ],
    3: [
      {
        text: 'The chemical symbol for gold is Au.',
        options: [
          { text: 'True', isCorrect: true },
          { text: 'False', isCorrect: false }
        ],
        difficulty: 'medium'
      },
      {
        text: 'The smallest country in the world is Vatican City.',
        options: [
          { text: 'True', isCorrect: true },
          { text: 'False', isCorrect: false }
        ],
        difficulty: 'medium'
      },
      {
        text: 'The Amazon rainforest produces 20% of the world\'s oxygen.',
        options: [
          { text: 'True', isCorrect: true },
          { text: 'False', isCorrect: false }
        ],
        difficulty: 'medium'
      },
      {
        text: 'The human heart has four chambers.',
        options: [
          { text: 'True', isCorrect: true },
          { text: 'False', isCorrect: false }
        ],
        difficulty: 'medium'
      },
      {
        text: 'The planet Venus is hotter than Mercury.',
        options: [
          { text: 'True', isCorrect: true },
          { text: 'False', isCorrect: false }
        ],
        difficulty: 'medium'
      }
    ]
  };

  // Level & Progress
  currentLevel = 1;
  currentQuestion = 1;
  questionsPerLevel = 5;
  currentIndex = 0;
  answered = false;
  answerStatus: string[] = [];
  score = 0;
  questionsCorrectInLevel = 0;
  timeElapsed = 0;
  bonusPoints = 0;
  showLevelComplete = false;
  selectedAnswer: string | null = null;

  timerInterval: any;

  get currentQuestionData(): Question {
    const currentLevelQuestions = this.questionsByLevel[this.currentLevel];
    return currentLevelQuestions ? currentLevelQuestions[this.currentIndex] : this.questionsByLevel[1][0];
  }

  get questions(): Question[] {
    return this.questionsByLevel[this.currentLevel] || [];
  }

  get currentWord(): CurrentWord {
    return { 
      difficulty: this.currentQuestionData.difficulty,
      correct: this.currentQuestionData.options.find(opt => opt.isCorrect)?.text || ''
    };
  }

  get currentDifficulty(): 'easy' | 'medium' | 'hard' {
    return this.currentQuestionData.difficulty;
  }

  get isLastQuestion(): boolean {
    return this.currentIndex === this.questionsPerLevel - 1;
  }

  ngOnInit() {
    this.startTimer();
    this.resetAnswerStatus();
  }

  ngOnDestroy() {
    this.stopTimer();
  }

  resetAnswerStatus() {
    this.answerStatus = this.currentQuestionData.options.map(() => '');
  }

  checkAnswer(isCorrect: boolean, index: number) {
    if (this.answered) return;

    this.answered = true;
    this.selectedAnswer = this.currentQuestionData.options[index].text;

    if (isCorrect) {
      this.answerStatus[index] = 'correct';
      this.score++;
      this.questionsCorrectInLevel++;
      this.bonusPoints = 10; // example bonus
      this.playCorrectSound();
    } else {
      this.answerStatus[index] = 'wrong';
      // highlight correct answer too
      const correctIndex = this.currentQuestionData.options.findIndex(o => o.isCorrect);
      if (correctIndex !== -1) {
        this.answerStatus[correctIndex] = 'correct';
      }
      this.playWrongSound();
    }
  }

  nextQuestion() {
    if (this.currentIndex < this.questionsPerLevel - 1) {
      this.currentIndex++;
      this.currentQuestion++;
      this.answered = false;
      this.bonusPoints = 0;
      this.resetAnswerStatus();
    } else {
      this.showLevelComplete = true;
      this.stopTimer();
    }
  }

  getLevelScorePercentage(): number {
    return Math.round((this.questionsCorrectInLevel / this.questionsPerLevel) * 100);
  }

  getScoreMessage(): string {
    const percentage = this.getLevelScorePercentage();
    if (percentage === 100) return 'Parfait ! Vous êtes un expert en faits !';
    if (percentage >= 80) return 'Excellent ! Vous connaissez bien vos faits !';
    if (percentage >= 60) return 'Bon travail ! Continuez à vous entraîner !';
    if (percentage >= 40) return 'Pas mal ! Essayez à nouveau pour vous améliorer !';
    return 'Continuez à vous entraîner ! Vous allez progresser !';
  }

  nextLevel() {
    this.currentLevel++;
    this.currentQuestion = 1;
    this.currentIndex = 0;
    this.questionsCorrectInLevel = 0;
    this.score = 0;
    this.bonusPoints = 0;
    this.showLevelComplete = false;
    
    // Check if next level exists
    if (this.questionsByLevel[this.currentLevel]) {
      this.resetAnswerStatus();
      this.resetTimer();
    } else {
      // Game completed - all levels finished
      console.log('Game completed! All levels finished.');
    }
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
    return `difficulty-${this.currentWord.difficulty}`;
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

  playCorrectSound() {
    const audio = new Audio('/audio/correct.mp3');
    audio.play().catch(err => console.error('Error playing correct sound:', err));
    
    // Stop after 1.5 seconds
    setTimeout(() => {
      audio.pause();
      audio.currentTime = 0;
    }, 1500);
  }

  playWrongSound() {
    const audio = new Audio('/audio/wrong.mp3');
    audio.play().catch(err => console.error('Error playing wrong sound:', err));
    
    // Stop after 2 seconds
    setTimeout(() => {
      audio.pause();
      audio.currentTime = 0;
    }, 2000);
  }

}
