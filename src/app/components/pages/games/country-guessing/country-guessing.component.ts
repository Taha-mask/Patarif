import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, style, animate, transition } from '@angular/animations';
import { GameTemplateComponent } from '../../../game-template/game-template.component';
import { CelebrationComponent } from '../../../game-template/celebration/celebration.component';

interface Question {
  image: string;
  hint: string;
  options: string[];
  correctAnswer: string;
  difficulty: 'easy' | 'medium' | 'hard';
  level:number;
}

@Component({
  selector: 'app-country-guessing',
  standalone: true,
  imports: [CommonModule, GameTemplateComponent, CelebrationComponent],
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
  // Game Configuration
  readonly QUESTIONS_PER_LEVEL = 5;
  
  // Game State
  currentLevel = 1;
  currentQuestion = 1;
  questionsCorrectInLevel = 0;
  score = 0;
  bonusPoints = 0;
  timeElapsed = 0;
  levelStartTime = 0;
  timerInterval: any;
  currentQuestionIndex = 0;
  currentQuestionData!: Question;
  usedQuestionIndices: {[key: number]: number[]} = {}; // Track used question indices per level
  
  get currentDifficulty() {
    return this.currentQuestionData?.difficulty || 'easy';
  }
  selectedAnswer: string | null = null;
  isCorrect = false;
  showResult = false;
  isLoading = true;
  showLevelComplete = false;

  // Question List organized by levels
  questionsByLevel: { [key: number]: Question[] } = {};

  ngOnInit() {
    this.loadQuestions();
    this.startLevel();
  }

  ngOnDestroy() {
    this.stopTimer();
  }

  // Timer methods
  private startTimer(): void {
    this.levelStartTime = Date.now();
    this.timerInterval = setInterval(() => {
      this.timeElapsed = Math.floor((Date.now() - this.levelStartTime) / 1000);
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = undefined;
    }
  }

  private resetTimer(): void {
    this.timeElapsed = 0;
    this.levelStartTime = Date.now();
  }

  startLevel() {
    this.isLoading = true;
    this.currentQuestion = 1;
    this.questionsCorrectInLevel = 0;
    this.timeElapsed = 0;
    this.levelStartTime = Date.now();
    // Reset used questions for this level
    if (this.usedQuestionIndices[this.currentLevel]) {
      this.usedQuestionIndices[this.currentLevel] = [];
    }
    this.loadQuestions();
    this.startTimer();
  }

  loadQuestions() {
    this.questionsByLevel = {
      1: [
        {
          image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
          hint: 'Connue pour la Tour Eiffel',
          options: ['France', 'Italie', 'Espagne', 'Allemagne'],
          correctAnswer: 'France',
          difficulty: 'easy',
          level:1
        },
        {
          image: 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=400&h=300&fit=crop',
          hint: 'Maison de la forêt amazonienne',
          options: ['Brésil', 'Argentine', 'Chili', 'Pérou'],
          correctAnswer: 'Brésil',
          difficulty: 'easy',
          level:1
        },
        {
          image: 'https://images.unsplash.com/photo-1543832923-44667a44c804?w=400&h=300&fit=crop',
          hint: 'Terre des pyramides',
          options: ['Égypte', 'Maroc', 'Tunisie', 'Algérie'],
          correctAnswer: 'Égypte',
          difficulty: 'easy',
          level:1
        },
        {
          image: 'https://images.unsplash.com/photo-1538970272646-f61fabb3a8a2?w=400&h=300&fit=crop',
          hint: 'Pays du Soleil Levant',
          options: ['Japon', 'Chine', 'Corée du Sud', 'Thaïlande'],
          correctAnswer: 'Japon',
          difficulty: 'easy',
          level:1
        },
        {
          image: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400&h=300&fit=crop',
          hint: 'Terre des kangourous et des koalas',
          options: ['Australie', 'Nouvelle-Zélande', 'Fidji', 'Papouasie-Nouvelle-Guinée'],
          correctAnswer: 'Australie',
          difficulty: 'easy',
          level:1
        }
      ],
      2: [
        {
          image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&h=300&fit=crop',
          hint: 'Pays de la pizza et des pâtes',
          options: ['Italie', 'Espagne', 'Grèce', 'Portugal'],
          correctAnswer: 'Italie',
          difficulty: 'easy',
          level:2
        },
        {
          image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9e1?w=400&h=300&fit=crop',
          hint: 'Pays du tango',
          options: ['Argentine', 'Chili', 'Uruguay', 'Paraguay'],
          correctAnswer: 'Argentine',
          difficulty: 'easy',
          level:2
        },
        {
          image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
          hint: 'Pays de la baguette',
          options: ['France', 'Belgique', 'Suisse', 'Luxembourg'],
          correctAnswer: 'France',
          difficulty: 'easy',
          level:2
        },
        {
          image: 'https://images.unsplash.com/photo-1538970272646-f61fabb3a8a2?w=400&h=300&fit=crop',
          hint: 'Pays des samouraïs',
          options: ['Japon', 'Corée du Sud', 'Chine', 'Mongolie'],
          correctAnswer: 'Japon',
          difficulty: 'easy',
          level:2
        },
        {
          image: 'https://images.unsplash.com/photo-1543832923-44667a44c804?w=400&h=300&fit=crop',
          hint: 'Pays du Nil',
          options: ['Égypte', 'Soudan', 'Éthiopie', 'Kenya'],
          correctAnswer: 'Égypte',
          difficulty: 'easy',
          level:2

        }
      ],
      3: [
        {
          image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&h=300&fit=crop',
          hint: 'Pays de la Renaissance',
          options: ['Italie', 'Espagne', 'France', 'Allemagne'],
          correctAnswer: 'Italie',
          difficulty: 'medium',
          level:3
        },
        {
          image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9e1?w=400&h=300&fit=crop',
          hint: 'Pays des Andes',
          options: ['Chili', 'Pérou', 'Bolivie', 'Équateur'],
          correctAnswer: 'Chili',
          difficulty: 'medium',
          level: 3
        },
        {
          image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
          hint: 'Pays de la mode',
          options: ['France', 'Italie', 'Espagne', 'Belgique'],
          correctAnswer: 'France',
          difficulty: 'medium',
          level: 3
        },
        {
          image: 'https://images.unsplash.com/photo-1538970272646-f61fabb3a8a2?w=400&h=300&fit=crop',
          hint: 'Pays du manga',
          options: ['Japon', 'Corée du Sud', 'Chine', 'Taïwan'],
          correctAnswer: 'Japon',
          difficulty: 'medium',
          level:3
        },
        {
          image: 'https://images.unsplash.com/photo-1543832923-44667a44c804?w=400&h=300&fit=crop',
          hint: 'Pays des pharaons',
          options: ['Égypte', 'Maroc', 'Tunisie', 'Libye'],
          correctAnswer: 'Égypte',
          difficulty: 'medium',
          level:3
        }
      ]
    };
    this.setCurrentQuestion();
    this.isLoading = false;
  }

  setCurrentQuestion() {
    const currentLevelQuestions = this.questionsByLevel[this.currentLevel];
    
    // Initialize used indices array for this level if it doesn't exist
    if (!this.usedQuestionIndices[this.currentLevel]) {
      this.usedQuestionIndices[this.currentLevel] = [];
    }
    
    // If all questions have been used, reset the used indices
    if (this.usedQuestionIndices[this.currentLevel].length >= currentLevelQuestions.length) {
      this.usedQuestionIndices[this.currentLevel] = [];
    }
    
    // Find a random index that hasn't been used yet
    let randomIndex: number;
    do {
      randomIndex = Math.floor(Math.random() * currentLevelQuestions.length);
    } while (this.usedQuestionIndices[this.currentLevel].includes(randomIndex));
    
    // Mark this index as used
    this.usedQuestionIndices[this.currentLevel].push(randomIndex);
    
    // Set the current question
    this.currentQuestionData = currentLevelQuestions[randomIndex];
    this.selectedAnswer = null;
    this.showResult = false;
  }

  selectAnswer(option: string) {
    if (this.showResult) return;
  
    this.selectedAnswer = option;
    this.isCorrect = option === this.currentQuestionData.correctAnswer;
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
    // Move to next question
    this.currentQuestion++;
    this.currentQuestionIndex++;
    
    // If we've reached the end of the level, complete it
    if (this.currentQuestion > this.QUESTIONS_PER_LEVEL) {
      this.completeLevel();
      return;
    }
    
    // Otherwise, set up the next question
    this.setCurrentQuestion();
  }
  
  completeLevel() {
    this.stopTimer();
    this.showLevelComplete = true;
    
    // Calculate bonus points based on time (faster completion = more points)
    const timeBonus = Math.max(0, 300 - this.timeElapsed) * 2; // 300 seconds (5 minutes) max
    this.bonusPoints = timeBonus;
    this.score += timeBonus;
  }

  // Helper method to get option letter (A, B, C, D)
  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }

  // Get level score percentage
  getLevelScorePercentage(): number {
    return Math.round((this.questionsCorrectInLevel / this.QUESTIONS_PER_LEVEL) * 100);
  }

  // Handle closing the celebration modal without starting next level
  onCloseCelebration(): void {
    this.showLevelComplete = false;
  }

  // Handle moving to the next level from celebration
  onNextLevel(): void {
    this.showLevelComplete = false;
    this.currentLevel++;
    // Reset used questions for the new level
    if (this.usedQuestionIndices[this.currentLevel]) {
      this.usedQuestionIndices[this.currentLevel] = [];
    }
    this.startLevel();
  }

  // Get celebration data for the current level
  getCelebrationData() {
    return {
      level: this.currentLevel,
      questionsCorrect: this.questionsCorrectInLevel,
      totalQuestions: this.QUESTIONS_PER_LEVEL,
      score: this.score,
      timeElapsed: this.timeElapsed,
      bonusPoints: this.bonusPoints,
      difficulty: this.currentDifficulty
    };
  }
}
