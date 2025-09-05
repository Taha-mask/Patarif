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
  isSoundEnabled = true; // Activer/désactiver les effets sonores
  private correctSound: HTMLAudioElement | null = null;
  private wrongSound: HTMLAudioElement | null = null;
  
  hiddenRoutes: string[] = ['/gallery', '/canvas/:imageUrl', '/paint', '/math-ladder'];

  @Input() showHeader: boolean = true;
  @Input() showTopIcons: boolean = true;
  @Input() noCardBackground: boolean = false;
  @Input() nogamecontent: boolean = false;
  @Input() isLastQuestion: boolean = false;

  @ViewChild('gameCard', { static: false }) gameCardRef!: ElementRef;

  @Input() level: number = 1;
  @Input() questionsCorrectInLevel: number = 0;
  @Input() currentQuestion: number = 1;
  @Input() timeElapsed: number = 0;
  @Input() currentWord: string = '';
  @Input() difficulty: 'facile' | 'moyen' | 'difficile' = 'facile';
  
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
  @Input() totalQuestions: number = 6;

  @Output() nextWord = new EventEmitter<void>();
  @Output() retry = new EventEmitter<void>();
  @Output() toggleFullScreenEvent = new EventEmitter<void>();

  constructor(private router: Router) {
    // Initialiser les étoiles (3 étoiles vides au départ)
    this.starsArray = Array(3).fill(0).map(() => ({
      filled: false,
      animated: false
    }));
  }

  shouldShowGameHeader(): boolean {
    return this.showHeader && this.router.url !== '/canvas' && this.router.url !== '/gallery';
  }

  toggleFullScreen() {
    const elem = this.gameCardRef?.nativeElement;
    if (elem && !document.fullscreenElement) {
      elem.requestFullscreen();
      elem.classList.add('fullscreen-active');
      const removeClass = () => {
        elem.classList.remove('fullscreen-active');
      };
      document.addEventListener('fullscreenchange', removeClass, { once: true });
    } else if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    this.toggleFullScreenEvent.emit();
  }

  onNextWord() {
    this.nextWord.emit();
  }

  private updateStarsAnimation() {
    // Réinitialiser les étoiles
    this.starsArray = this.starsArray.map((_, index) => ({
      filled: index < this._stars,
      animated: false
    }));

    // Animer les étoiles une par une
    this.starsArray.forEach((_, index) => {
      if (index < this._stars) {
        setTimeout(() => {
          this.starsArray[index].animated = true;
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
      // Initialiser la musique de fond si pas déjà fait
      this.audio = new Audio('assets/audio/music.mp3');
      this.audio.loop = true;
    }

    if (this.isMusicPlaying) {
      this.audio.pause();
    } else {
      this.audio.play().catch(e => console.error('Erreur de lecture de la musique:', e));
    }
    this.isMusicPlaying = !this.isMusicPlaying;
  }

  toggleSound() {
    this.isSoundEnabled = !this.isSoundEnabled;
    if (!this.isSoundEnabled) {
      this.correctSound?.pause();
      if (this.correctSound) this.correctSound.currentTime = 0;

      this.wrongSound?.pause();
      if (this.wrongSound) this.wrongSound.currentTime = 0;
    }
  }

  // Jouer le son de bonne réponse
  playCorrectSound() {
    if (this.isSoundEnabled && this.correctSound) {
      this.correctSound.currentTime = 0;
      this.correctSound.play().catch(e => console.error('Erreur son correct:', e));
    }
  }

  // Jouer le son de mauvaise réponse
  playWrongSound() {
    if (this.isSoundEnabled && this.wrongSound) {
      this.wrongSound.currentTime = 0;
      this.wrongSound.play().catch(e => console.error('Erreur son incorrect:', e));
    }
  }

  ngOnInit() {
    // Initialiser la musique de fond (volume à 30%)
    this.audio = new Audio('assets/audio/music.mp3');
    this.audio.volume = 0.3;
    this.audio.loop = true;

    // Initialiser les effets sonores
    this.correctSound = new Audio('assets/audio/correct.mp3');
    this.wrongSound = new Audio('assets/audio/wrong.mp3');
    
    this.correctSound.volume = 0.7;
    this.wrongSound.volume = 0.7;
  }

  ngOnDestroy() {
    if (this.audio) {
      this.audio.pause();
      this.audio = null;
    }
    if (this.correctSound) {
      this.correctSound.pause();
      this.correctSound = null!;
    }
    if (this.wrongSound) {
      this.wrongSound.pause();
      this.wrongSound = null!;
    }
  }
}
