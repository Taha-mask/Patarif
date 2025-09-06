import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GameTemplateComponent } from "../../../game-template/game-template.component";
import { SupabaseService } from '../../../../supabase.service';
import { CelebrationComponent, CelebrationData } from '../../../game-template/celebration/celebration.component';
import { AudioService } from '../../../../services/audio.service';

interface Question {
  id: string;
  level: number;
  emojis: string;
  value: string;
  options: string[];
  difficulty: 'facile' | 'moyen' | 'difficile';
}

@Component({
  selector: 'app-guess-eemoji',
  imports: [CommonModule, FormsModule, NgClass, GameTemplateComponent, CelebrationComponent],
  templateUrl: './guess-eemoji.component.html',
  styleUrls: ['./guess-eemoji.component.css']
})
export class GuessEemojiComponent implements OnInit, OnDestroy {

  // Game state
  loading = true;
  questions: Question[] = [];
  currentIndex = 0;
  selectedOption: string | null = null;
  feedback: string | null = null;
  isCorrect: boolean | null = null;
  isChecking: boolean = false;

  // Level and scoring
  level: number = 1;
  questionsCorrectInLevel: number = 0;
  timeElapsed: number = 0;
  bonusPoints: number = 0;
  readonly QUESTIONS_PER_LEVEL = 5;
  private timer: any;

  
  // Celebration modal
  showCelebration = false;
  celebrationData: CelebrationData | null = null;

  constructor(private supabaseService: SupabaseService, private audioService: AudioService) {}

  ngOnInit() {
    this.loadQuestions(this.level);
    this.startTimer();
  }

  ngOnDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  // Load level questions
  async loadQuestions(level: number) {
    this.loading = true;
    try {
      const data = await this.supabaseService.getEmojisQuestions(level);
      this.questions = data.slice(0, this.QUESTIONS_PER_LEVEL).map(q => ({
        id: q.id,
        level: q.level,
        emojis: q.emojis.join(' '),
        value: q.value,
        options: q.chooses,
        difficulty: q.difficulty as 'facile' | 'moyen' | 'difficile'
      }));
      this.currentIndex = 0;
      this.selectedOption = null;
      this.feedback = null;
      this.isCorrect = null;
    } catch (error) {
      console.error('Error loading questions:', error);
    } finally {
      this.loading = false;
    }
  }

  get currentQuestion(): Question {
    return this.questions[this.currentIndex];
  }

  // Called when user selects an option
  
// Called when user selects an option
async checkAnswer(option: string) {
  if (this.isChecking) return;
  this.isChecking = true;

  this.selectedOption = option;
  this.isCorrect = option === this.currentQuestion.value;
  this.feedback = this.isCorrect ? 'Correct! 🎉' : 'Try again! 😢';

  if (this.isCorrect) {
    this.playCorrectSound();
    this.questionsCorrectInLevel++;
  } else {
    this.playWrongSound();
  }

  // Do NOT automatically go to the next question anymore
  // Wait for user to click "Next"

  this.isChecking = false;
}

// Move to the next question (triggered by Next button)
public nextQuestion() {
  if (this.currentIndex + 1 >= this.questions.length) {
    this.showLevelComplete();
  } else {
    this.currentIndex++;
    this.selectedOption = null;
    this.feedback = null;
    this.isCorrect = null;
  }
}


  // Show celebration modal at the end of level
  private showLevelComplete() {
    this.celebrationData = {
      level: this.level,
      questionsCorrect: this.questionsCorrectInLevel,
      totalQuestions: this.QUESTIONS_PER_LEVEL,
      timeElapsed: this.timeElapsed,
      difficulty: this.currentQuestion.difficulty
    };
    this.showCelebration = true;
  }

  // User closes modal
  onCelebrationClose() {
    this.showCelebration = false;
  }

  // User proceeds to next level
  onNextLevel(nextLevel: number) {
    this.showCelebration = false;
    this.level = nextLevel;
    this.questionsCorrectInLevel = 0;
    this.timeElapsed = 0;
    this.loadQuestions(this.level);
  }

  private startTimer() {
    this.timer = setInterval(() => this.timeElapsed++, 1000);
  }

 

  private playCorrectSound() {
    this.audioService.playCorrectSound();
  }

  private playWrongSound() {
    this.audioService.playWrongSound();
  }
  
  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }

  getQuestionCounter(): string {
    return `${this.currentIndex + 1}/${this.QUESTIONS_PER_LEVEL}`;
  }
}
