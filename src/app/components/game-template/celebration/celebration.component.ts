import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';

/** Payload passed into the celebration component */
export interface CelebrationData {
  level: number;
  questionsCorrect: number;
  totalQuestions: number;
  timeElapsed: number;
  difficulty: 'facile' | 'moyen' | 'difficile';
}

/** Internal confetti piece model used by the template */
interface ConfettiPiece {
  left: number;    // percent
  size: number;    // px
  delay: number;   // s
  rotate: number;  // deg
  color: string;
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
  /** Show/hide the celebration modal */
  @Input() show = false;

  /** Next level number (0 if no next level) */
  @Input() nextLevel = 2;

  /** Celebration stats/data */
  @Input() data: CelebrationData | null = null;

  @Output() close = new EventEmitter<void>();
  @Output() goToNext = new EventEmitter<number>();

  /** Pieces rendered by the template for confetti animation */
  confettiPieces: ConfettiPiece[] = [];

  /** Internal timer reference to auto-clear confetti */
  private confettiTimer: any = null;

  // ------------------------
  // Lifecycle
  // ------------------------
  ngOnChanges(changes: SimpleChanges) {
    // When modal is shown, trigger confetti burst.
    if (changes['show']) {
      if (changes['show'].currentValue === true) {
        this.startConfetti();
      } else {
        this.stopConfetti();
      }
    }

    // Small debug-friendly logs (leave or remove as needed)
    if (changes['data'] && changes['data'].currentValue) {
      // console.debug('Celebration data:', this.data);
    }
  }

  ngOnDestroy() {
    this.stopConfetti();
  }

  // ------------------------
  // UI actions
  // ------------------------
  /** Close button clicked */
  onClose() {
    this.stopConfetti();
    this.close.emit();
  }

  /** Next level button clicked */
  onNextLevel() {
    this.stopConfetti();
    const next = this.nextLevel > 0 ? this.nextLevel : 0;
    this.goToNext.emit(next);
  }

  // ------------------------
  // Time formatter
  // ------------------------
  /** Format seconds to MM:SS */
  formatTime(seconds = 0): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  // ------------------------
  // Confetti helpers
  // ------------------------
  /** Create confetti pieces and schedule cleanup */
  startConfetti() {
    // quick guard: if already running, restart lifetime
    this.stopConfetti();

    const pieces: ConfettiPiece[] = Array.from({ length: CONFETTI_CONFIG.COUNT }, () => ({
      left: Math.random() * 100,
      size: randInt(8, 18),
      delay: Math.random() * 0.4,
      rotate: randInt(0, 360),
      color: CONFETTI_CONFIG.COLORS[randInt(0, CONFETTI_CONFIG.COLORS.length - 1)]
    }));

    this.confettiPieces = pieces;

    // auto-clear after lifespan
    this.confettiTimer = setTimeout(() => this.confettiPieces = [], CONFETTI_CONFIG.LIFESPAN_MS);
  }

  /** Stop confetti immediately and clear timers */
  stopConfetti() {
    if (this.confettiTimer) {
      clearTimeout(this.confettiTimer);
      this.confettiTimer = null;
    }
    if (this.confettiPieces.length) {
      this.confettiPieces = [];
    }
  }
}

/** Small integer helper */
function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
