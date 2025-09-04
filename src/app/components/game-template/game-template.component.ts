import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GameHeaderComponent } from './game-header/game-header.component';
@Component({
  selector: 'app-game-template',
  standalone: true,
  imports: [CommonModule, GameHeaderComponent],
  templateUrl: './game-template.component.html',
  styleUrls: ['./game-template.component.css']
})
export class GameTemplateComponent implements OnInit, OnDestroy {
  private audio: HTMLAudioElement | null = null;
  isMusicPlaying = false;
  hiddenRoutes: string[] = ['/gallery', '/canvas/:imageUrl', '/paint', '/math-ladder'];
  @Input() showHeader: boolean = true;
  @Input() showTopIcons: boolean = true;
  @Input() noCardBackground: boolean = false;
  @Input() nogamecontent: boolean = false;


  shouldShowGameHeader(): boolean {
    return this.showHeader && this.router.url !== '/canvas' && this.router.url !== '/gallery';
  }
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
  @Input() questionsCorrectInLevel: number = 0;
  @Input() currentQuestion: number = 1;
  @Input() timeElapsed: number = 0;
  @Input() currentWord: string = '';
  @Input() bonusPoints: number = 0;
  @Input() difficulty: 'easy' | 'medium' | 'hard' = 'easy';
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

  toggleMusic() {
    if (!this.audio) {
      // Initialize audio if not already done
      this.audio = new Audio('/audio/Billie Eilish - WILDFLOWER (Official Lyric Video).mp3');
      this.audio.loop = true;
    }

    if (this.isMusicPlaying) {
      this.audio.pause();
    } else {
      this.audio.play().catch(e => console.error('Error playing music:', e));
    }
    this.isMusicPlaying = !this.isMusicPlaying;
  }

  ngOnInit() {
    // Initialize audio with volume set to 30%
    this.audio = new Audio('/audio/Billie Eilish - WILDFLOWER (Official Lyric Video).mp3');
    this.audio.volume = 0.3;
    this.audio.loop = true;
  }

  ngOnDestroy() {
    // Clean up audio when component is destroyed
    if (this.audio) {
      this.audio.pause();
      this.audio = null;
    }
  }
}
