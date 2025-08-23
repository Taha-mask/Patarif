import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-celebrate-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './celebrate-modal.component.html',
  styleUrl: './celebrate-modal.component.css'
})
export class CelebrateModalComponent {
  @Input() currentLevel: number = 1;
  @Input() score: number = 0;
  @Input() questionsCorrectInLevel: number = 0;
  @Input() questionsPerLevel: number = 5;
  @Input() showLevelComplete: boolean = false;
  
  @Output() nextLevelEvent = new EventEmitter<void>();

  getLevelScorePercentage(): number {
    return Math.round((this.questionsCorrectInLevel / this.questionsPerLevel) * 100);
  }

  getScoreMessage(): string {
    const percentage = this.getLevelScorePercentage();
    if (percentage >= 90) return 'Excellent travail !';
    if (percentage >= 70) return 'Très bien !';
    if (percentage >= 50) return 'Bon travail !';
    return 'Continuez à vous améliorer !';
  }

  nextLevel(): void {
    this.nextLevelEvent.emit();
  }
}
