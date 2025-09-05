import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

type Difficulty = 'easy' | 'medium' | 'hard';

@Component({
  selector: 'app-game-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game-header.component.html',
  styleUrl: './game-header.component.css'
})
export class GameHeaderComponent {
  @Input() level: number = 1;
  @Input() questionsCorrectInLevel: number = 0;
  @Input() currentQuestion: number = 1;
  @Input() timeElapsed: number = 0;
  @Input() currentWord: string = '';
  @Input() difficulty: Difficulty = 'easy';
  @Input() totalQuestions: number = 5;

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  
  getTimeDisplayClass(): string {
    if (this.timeElapsed < 15) return 'time-good';
    if (this.timeElapsed < 30) return 'time-warning';
    return 'time-danger';
  }

  getDifficultyInFrench(): string {
    switch(this.difficulty) {
      case 'easy': return 'FACILE';
      case 'medium': return 'MOYEN';
      case 'hard': return 'DIFFICILE';
      default: return (this.difficulty as string).toUpperCase();
    }
  }
  getDifficultyClass(): string {
    return `difficulty-${this.difficulty}`;
  }
}
