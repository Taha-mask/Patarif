import { Component, OnInit } from '@angular/core';
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
export class FactGameComponent implements OnInit {
  // Helper method to get letter for answer options (A, B, C, D, ...)
  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }

  get isLastQuestion(): boolean {
    return this.currentIndex === this.questions.length - 1;
  }

  questions: Question[] = [
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
      difficulty: 'medium'
    }
  ];

  currentIndex = 0;
  answered = false;
  answerStatus: string[] = [];
  score = 0;
  questionsCorrectInLevel = 0;
  timeElapsed = 0;
  bonusPoints = 0;
  level = 1;

  timerInterval: any;

  get currentQuestion(): Question {
    return this.questions[this.currentIndex];
  }

  get currentWord(): CurrentWord {
    return { 
      difficulty: this.currentQuestion.difficulty,
      correct: this.currentQuestion.options.find(opt => opt.isCorrect)?.text || ''
    };
  }

  get currentDifficulty() {
    return this.currentQuestion.difficulty;
  }

  ngOnInit() {
    this.startTimer();
    this.resetAnswerStatus();
  }

  resetAnswerStatus() {
    this.answerStatus = this.currentQuestion.options.map(() => '');
  }

  checkAnswer(isCorrect: boolean, index: number) {
    if (this.answered) return;

    this.answered = true;

    if (isCorrect) {
      this.answerStatus[index] = 'correct';
      this.score++;
      this.questionsCorrectInLevel++;
      this.bonusPoints = 10; // example bonus
    } else {
      this.answerStatus[index] = 'wrong';
      // highlight correct answer too
      const correctIndex = this.currentQuestion.options.findIndex(o => o.isCorrect);
      if (correctIndex !== -1) {
        this.answerStatus[correctIndex] = 'correct';
      }
    }
  }

  nextQuestion() {
    if (this.currentIndex < this.questions.length - 1) {
      this.currentIndex++;
      this.answered = false;
      this.bonusPoints = 0;
      this.resetAnswerStatus();
    } else {
      console.log('Level complete');
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


}
