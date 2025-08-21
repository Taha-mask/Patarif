import { Component, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-game-template',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game-template.component.html',
  styleUrls: ['./game-template.component.css']
})
export class GameTemplateComponent {
  constructor(
    private router: Router
  ) {
    // Initialize stars array with 3 empty stars
    this.starsArray = Array(3).fill(0).map(() => ({
      filled: false,
      animated: false
    }));
  }

  @ViewChild('gameCard', { static: false }) gameCardRef!: ElementRef;

  @Input() level: number = 1;
  @Input() score: number = 0;
  private _stars: number = 0;
  starsArray: {filled: boolean, animated: boolean}[] = [];

  @Input()
  set stars(value: number) {
    this._stars = Math.min(Math.max(0, value), 3);
    this.updateStarsAnimation();
  }

  get stars(): number {
    return this._stars;
  }
  @Input() resultMessage: string = '';
  @Input() showResult: boolean = false;
  @Input() showLevelComplete: boolean = false;
  @Input() questionText: string = 'Quel est le mot correct ?';
  @Input() totalQuestions: number = 5;

  @Output() nextWord = new EventEmitter<void>();
  @Output() retry = new EventEmitter<void>();
  @Output() toggleFullScreenEvent = new EventEmitter<void>();

  toggleFullScreen() {
    const elem = this.gameCardRef?.nativeElement;
    if (elem && !document.fullscreenElement) {
      elem.requestFullscreen();
      elem.classList.add('fullscreen-active');
      const removeClass = () => {
        elem.classList.remove('fullscreen-active');
        document.removeEventListener('fullscreenchange', removeClass);
      };
      document.addEventListener('fullscreenchange', removeClass);
    } else if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    this.toggleFullScreenEvent.emit();
  }

  onNextWord() {
    this.nextWord.emit();
  }

  private updateStarsAnimation() {
    // Reset all stars
    this.starsArray = this.starsArray.map((_, index) => ({
      filled: index < this._stars,
      animated: false
    }));

    // Animate stars one by one
    this.starsArray.forEach((_, index) => {
      if (index < this._stars) {
        setTimeout(() => {
          this.starsArray[index].animated = true;
          // Remove animation class after animation completes
          setTimeout(() => {
            this.starsArray[index].animated = false;
          }, 1000);
        }, index * 300);
      }
    });
  }

  onRetry() {
    this.retry.emit();
  }

  closeGame() {
    this.router.navigate(['/games']);
  }
}
