import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';

export interface CelebrationData {
  level: number;
  questionsCorrect: number;
  totalQuestions: number;
  score: number;
  timeElapsed: number;
  bonusPoints: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

@Component({
  selector: 'app-celebration',
  standalone: true,
  imports: [CommonModule],
  templateUrl:'./celebration.component.html',
  styleUrls: ['./celebration.component.css'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-out', style({ opacity: 1 }))
      ])
    ])
  ]
})
export class CelebrationComponent implements OnChanges {
  @Input() show: boolean = false;
  @Input() nextLevel: number = 2;
  @Input() data: CelebrationData | null = null;  

  @Output() close = new EventEmitter<void>();
  @Output() goToNext = new EventEmitter<number>();

  onClose() {
    this.close.emit();
  }

  // Format time in MM:SS format
  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log('CelebrationComponent changes:', changes);
    if (changes['show']) {
      console.log('Show changed to:', this.show);
    }
    if (changes['data']) {
      console.log('Data changed to:', this.data);
    }
  }

  onNextLevel() {
    console.log('Next level button clicked, nextLevel:', this.nextLevel);
    // If there's a next level, emit the next level number
    // Otherwise, emit 0 to indicate game completion
    const nextLevel = this.nextLevel > 0 ? this.nextLevel : 0;
    this.goToNext.emit(nextLevel);
  }
}
