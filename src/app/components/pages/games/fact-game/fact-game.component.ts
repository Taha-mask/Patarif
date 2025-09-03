import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameTemplateComponent } from '../../../../components/game-template/game-template.component';
import { CelebrationComponent, CelebrationData } from '../../../../components/game-template/celebration/celebration.component';

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
  imports: [CommonModule, GameTemplateComponent, CelebrationComponent],
  templateUrl:'./fact-game.component.html',
  styleUrls: ['./fact-game.component.css']
})
export class FactGameComponent implements OnInit, OnDestroy {
  // Celebration modal
  showCelebration = false;
  celebrationData: CelebrationData | null = null;
  private startTime: number = Date.now();
  // Helper method to get letter for answer options (A, B, C, D, ...)
  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }



  // Questions organized by levels with increasing difficulty
  questionsByLevel: { [key: number]: Question[] } = {
    // Level 1: Basic General Knowledge
    1: [
      {
        text: 'A group of lions is called a pride.',
        options: [
          { text: 'True', isCorrect: true },
          { text: 'False', isCorrect: false }
        ],
        difficulty: 'easy'
      },
      {
        text: 'The Great Wall of China is visible from the Moon.',
        options: [
          { text: 'True', isCorrect: false },
          { text: 'False', isCorrect: true }
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
        text: 'The Earth is the fifth largest planet in our solar system.',
        options: [
          { text: 'True', isCorrect: false },
          { text: 'False', isCorrect: true }
        ],
        difficulty: 'easy'
      },
      {
        text: 'The capital of France is London.',
        options: [
          { text: 'True', isCorrect: false },
          { text: 'False', isCorrect: true }
        ],
        difficulty: 'easy'
      }
    ],
    
    // Level 2: Science and Nature
    2: [
      {
        text: 'The human body has four lungs.',
        options: [
          { text: 'True', isCorrect: false },
          { text: 'False', isCorrect: true }
        ],
        difficulty: 'medium'
      },
      {
        text: 'Lightning is hotter than the surface of the Sun.',
        options: [
          { text: 'True', isCorrect: true },
          { text: 'False', isCorrect: false }
        ],
        difficulty: 'medium'
      },
      {
        text: 'Octopuses have three hearts.',
        options: [
          { text: 'True', isCorrect: true },
          { text: 'False', isCorrect: false }
        ],
        difficulty: 'medium'
      },
      {
        text: 'The chemical symbol for gold is Ag.',
        options: [
          { text: 'True', isCorrect: false },
          { text: 'False', isCorrect: true }
        ],
        difficulty: 'medium'
      },
      {
        text: 'A day on Venus is longer than a year on Venus.',
        options: [
          { text: 'True', isCorrect: true },
          { text: 'False', isCorrect: false }
        ],
        difficulty: 'medium'
      }
    ],
    
    // Level 3: Advanced Knowledge
    3: [
      {
        text: 'The human nose can detect over 1 trillion different scents.',
        options: [
          { text: 'True', isCorrect: true },
          { text: 'False', isCorrect: false }
        ],
        difficulty: 'hard'
      },
      {
        text: 'The total length of your blood vessels could circle the Earth four times.',
        options: [
          { text: 'True', isCorrect: false },
          { text: 'False', isCorrect: true }
        ],
        difficulty: 'hard'
      },
      {
        text: 'Honey never spoils. Archaeologists have found pots of honey in ancient Egyptian tombs that are over 3,000 years old and still perfectly good to eat.',
        options: [
          { text: 'True', isCorrect: true },
          { text: 'False', isCorrect: false }
        ],
        difficulty: 'hard'
      },
      {
        text: 'The shortest war in history was between Britain and Zanzibar on August 27, 1896. Zanzibar surrendered after 38 minutes.',
        options: [
          { text: 'True', isCorrect: true },
          { text: 'False', isCorrect: false }
        ],
        difficulty: 'hard'
      },
      {
        text: 'The Eiffel Tower can be 15 cm taller during the summer due to thermal expansion of the metal.',
        options: [
          { text: 'True', isCorrect: true },
          { text: 'False', isCorrect: false }
        ],
        difficulty: 'hard'
      }
    ]
  };

  // Level & Progress
  currentLevel = 1;
  currentQuestion = 1;
  questionsPerLevel = 5;
  currentIndex = 0;
  answered = false;
  usedQuestionIndices: {[key: number]: number[]} = {}; // Track used question indices per level
  answerStatus: string[] = [];
  score = 0;
  questionsCorrectInLevel = 0;
  timeElapsed = 0;
  bonusPoints = 0;
  showLevelComplete = false;
  selectedAnswer: string | null = null;

  timerInterval: any;

  private _currentQuestionData: Question = this.questionsByLevel[1][0];
  
  get currentQuestionData(): Question {
    return this._currentQuestionData;
  }
  
  set currentQuestionData(question: Question) {
    this._currentQuestionData = question;
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
    this.startTime = Date.now();
    this.startTimer();
    this.resetAnswerStatus();
    this.currentQuestionData = this.getRandomQuestion();
  }

  ngOnDestroy() {
    this.stopTimer();
  }

  private getRandomQuestion(): Question {
    const levelQuestions = this.questionsByLevel[this.currentLevel] || [];
    
    // Initialize used indices array for this level if it doesn't exist
    if (!this.usedQuestionIndices[this.currentLevel]) {
      this.usedQuestionIndices[this.currentLevel] = [];
    }
    
    // If all questions have been used, reset the used indices
    if (this.usedQuestionIndices[this.currentLevel].length >= levelQuestions.length) {
      this.usedQuestionIndices[this.currentLevel] = [];
    }
    
    // Find a random index that hasn't been used yet
    let randomIndex: number;
    do {
      randomIndex = Math.floor(Math.random() * levelQuestions.length);
    } while (this.usedQuestionIndices[this.currentLevel].includes(randomIndex));
    
    // Mark this index as used
    this.usedQuestionIndices[this.currentLevel].push(randomIndex);
    
    return levelQuestions[randomIndex];
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
    // Reset answer state
    this.answered = false;
    this.selectedAnswer = null;
    this.answerStatus = [];

    // Move to next question or level
    this.currentQuestion++;
    if (this.currentQuestion >= this.questionsPerLevel) {
      this.showLevelCompleteScreen();
    } else {
      // Get a new random question for the current level
      this.currentQuestionData = this.getRandomQuestion();
      this.resetAnswerStatus();
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

  showLevelCompleteScreen() {
    this.celebrationData = {
      level: this.currentLevel,
      questionsCorrect: this.questionsCorrectInLevel,
      totalQuestions: this.questionsPerLevel,
      score: this.calculateScore(),
      timeElapsed: Math.floor((Date.now() - this.startTime) / 1000),
      bonusPoints: this.calculateBonusPoints(),
      difficulty: this.currentDifficulty
    };
    this.showCelebration = true;
  }

  onNextLevel(nextLevel: number) {
    this.showCelebration = false;
    this.currentLevel = nextLevel;
    this.questionsCorrectInLevel = 0;
    this.currentQuestion = 1; // Reset to 1 since we're starting a new level
    this.questionsPerLevel = Math.min(5 + this.currentLevel, 10);
    // Reset used questions for the new level
    if (this.usedQuestionIndices[this.currentLevel]) {
      this.usedQuestionIndices[this.currentLevel] = [];
    }
    this.currentQuestionData = this.getRandomQuestion();
    this.startTime = Date.now();
    this.resetAnswerStatus();
  }

  private calculateScore(): number {
    const baseScore = this.questionsCorrectInLevel * 10;
    const difficultyMultiplier = this.currentDifficulty === 'easy' ? 1 : this.currentDifficulty === 'medium' ? 1.5 : 2;
    return Math.floor(baseScore * difficultyMultiplier);
  }

  private calculateBonusPoints(): number {
    const timeBonus = Math.max(0, 30 - Math.floor((Date.now() - this.startTime) / 1000));
    const perfectBonus = this.questionsCorrectInLevel === this.questionsPerLevel ? 20 : 0;
    return timeBonus + perfectBonus;
  }

  nextLevel() {
    this.currentLevel++;
    this.currentQuestion = 1;
    this.currentIndex = 0;
    this.questionsCorrectInLevel = 0;
    this.score = 0;
    this.bonusPoints = 0;
    this.showCelebration = false;
    
    // Check if next level exists
    if (this.questionsByLevel[this.currentLevel]) {
      this.currentQuestionData = this.getRandomQuestion();
      this.resetAnswerStatus();
      this.resetTimer();
      this.startTime = Date.now();
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
