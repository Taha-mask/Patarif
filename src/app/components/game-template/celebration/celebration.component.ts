import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface CelebrationData {
  level: number;
  questionsCorrect: number;
  totalQuestions: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

@Component({
  selector: 'app-celebration',
  standalone: true,
  imports: [CommonModule],
  templateUrl:'./celebration.component.html',
  styleUrls: ['./celebration.component.css']
})
export class CelebrationComponent {
  @Input() show: boolean = false;
  @Input() nextLevel: number = 2;  

  @Output() close = new EventEmitter<void>();
  @Output() goToNext = new EventEmitter<number>();

  onClose() {
    this.close.emit();
  }

  onNextLevel() {
    this.goToNext.emit(this.nextLevel);
  }
}
