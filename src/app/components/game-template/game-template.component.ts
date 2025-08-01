import { Component, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-game-template',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game-template.component.html',
  styleUrls: ['./game-template.component.css']
})
export class GameTemplateComponent {
  @ViewChild('gameCard', { static: false }) gameCardRef!: ElementRef;

  @Input() level: number = 1;
  @Input() score: number = 0;
  @Input() reward: number = 0;
  @Input() stars: number = 0;
  @Input() resultMessage: string = '';
  @Input() showResult: boolean = false;
  @Input() showLevelComplete: boolean = false;
  @Input() imageUrl: string = '';
  @Input() questionText: string = 'Quel est le mot correct ?';

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

  onRetry() {
    this.retry.emit();
  }
}
