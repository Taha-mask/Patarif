import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';

export interface CelebrationData {
  level: number;
  questionsCorrect: number;
  totalQuestions: number;
  timeElapsed: number;
  difficulty: 'facile' | 'moyen' | 'difficile';
}

interface ConfettiPiece {
  left: number;
  size: number;
  delay: number;
  rotate: number;
  color: string;
}

interface SadPiece {
  left: number;
  size: number;
  delay: number;
}

const CONFETTI_CONFIG = {
  COUNT: 36,
  LIFESPAN_MS: 2200,
  COLORS: ['#FF6B6B', '#FFD166', '#6EE7B7', '#60A5FA', '#A78BFA', '#F472B6', '#FBBF24', '#34D399']
} as const;

@Component({
  selector: 'app-celebration',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './celebration.component.html',
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
export class CelebrationComponent implements OnChanges, OnDestroy {
  @Input() show = false;
  @Input() nextLevel = 2;
  @Input() data: CelebrationData | null = null;

  @Output() close = new EventEmitter<void>();
  @Output() goToNext = new EventEmitter<number>();

  confettiPieces: ConfettiPiece[] = [];
  sadPieces: SadPiece[] = [];

  private confettiTimer: any = null;
  private sadTimer: any = null;

  /** Determine pass/fail: passed when correct >= ceil(total/2) */
  get isPassed(): boolean {
    if (!this.data) return false;
    const halfCeil = Math.ceil(this.data.totalQuestions / 2);
    return (this.data.questionsCorrect ?? 0) >= halfCeil;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['show']) {
      if (changes['show'].currentValue === true) {
        // choose visual based on pass/fail
        if (this.isPassed) {
          this.startConfetti();
        } else {
          this.startSad();
        }
      } else {
        this.stopConfetti();
        this.stopSad();
      }
    }

    if (changes['data'] && changes['data'].currentValue) {
      // nothing extra needed here
    }
  }

  ngOnDestroy() {
    this.stopConfetti();
    this.stopSad();
  }

  onClose() {
    this.stopConfetti();
    this.stopSad();
    this.close.emit();
  }

  onNextLevel() {
    this.stopConfetti();
    this.stopSad();
    // if passed, go to next level; if failed, emit 0 or keep same level to retry
    const next = this.isPassed ? (this.nextLevel > 0 ? this.nextLevel : 0) : 0;
    this.goToNext.emit(next);
  }

  formatTime(seconds = 0): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  startConfetti() {
    this.stopConfetti();
    const pieces: ConfettiPiece[] = Array.from({ length: CONFETTI_CONFIG.COUNT }, () => ({
      left: Math.random() * 100,
      size: randInt(8, 18),
      delay: Math.random() * 0.4,
      rotate: randInt(0, 360),
      color: CONFETTI_CONFIG.COLORS[randInt(0, CONFETTI_CONFIG.COLORS.length - 1)]
    }));
    this.confettiPieces = pieces;
    this.confettiTimer = setTimeout(() => this.confettiPieces = [], CONFETTI_CONFIG.LIFESPAN_MS);
  }

  stopConfetti() {
    if (this.confettiTimer) { clearTimeout(this.confettiTimer); this.confettiTimer = null; }
    if (this.confettiPieces.length) { this.confettiPieces = []; }
  }

  // ---------- sad "teardrops" ----------
  startSad() {
    this.stopSad();
    // create a few slow teardrops
    const COUNT = 10;
    this.sadPieces = Array.from({ length: COUNT }, () => ({
      left: Math.random() * 100,
      size: randInt(6, 14),
      delay: Math.random() * 0.6
    }));
    // auto-clear after the animation (let them loop each time component reopens)
    this.sadTimer = setTimeout(() => this.sadPieces = [], 2000);
  }

  stopSad() {
    if (this.sadTimer) { clearTimeout(this.sadTimer); this.sadTimer = null; }
    if (this.sadPieces.length) { this.sadPieces = []; }
  }
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
