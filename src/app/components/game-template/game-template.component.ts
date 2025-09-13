import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GameHeaderComponent } from './game-header/game-header.component';
import { AudioService } from '../../services/audio.service';

@Component({
  selector: 'app-game-template',
  standalone: true,
  imports: [CommonModule, GameHeaderComponent],
  templateUrl: './game-template.component.html',
  styleUrls: ['./game-template.component.css']
})
export class GameTemplateComponent implements OnInit, OnDestroy {
  @ViewChild('gameCard', { static: false }) gameCardRef!: ElementRef;

  @Input() showHeader: boolean = true;
  @Input() showTopIcons: boolean = true;
  @Input() noCardBackground: boolean = false;
  @Input() nogamecontent: boolean = false;
  @Input() isLastQuestion: boolean = false;
  @Input() disableGameContentHeight: boolean = false;

  @Input() level: number = 1;
  @Input() showGameContent: boolean = true;

  @Input() questionsCorrectInLevel: number = 0;
  @Input() currentQuestion: number = 1;
  @Input() timeElapsed: number = 0;
  @Input() currentWord: string = '';
  @Input() difficulty: 'facile' | 'moyen' | 'difficile' = 'facile';
  @Input() resultMessage: string = '';
  @Input() showResult: boolean = false;
  @Input() showLevelComplete: boolean = false;
  @Input() questionText: string = 'Quel est le mot correct ?';
  @Input() totalQuestions: number = 6;

  
  @Output() nextWord = new EventEmitter<void>();
  @Output() retry = new EventEmitter<void>();
  @Output() toggleFullScreenEvent = new EventEmitter<void>();

  constructor(private router: Router, public audioService: AudioService) {
    // إعداد النجوم
  }

  shouldShowGameHeader(): boolean {
    return this.showHeader && this.router.url !== '/canvas' && this.router.url !== '/gallery';
  }

  toggleFullScreen() {
    const elem = this.gameCardRef?.nativeElement;
    if (elem && !document.fullscreenElement) {
      elem.requestFullscreen();
      elem.classList.add('fullscreen-active');
      const removeClass = () => elem.classList.remove('fullscreen-active');
      document.addEventListener('fullscreenchange', removeClass, { once: true });
    } else if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    this.toggleFullScreenEvent.emit();
  }

  toggleMusic() {
    this.audioService.toggleMusic();
  }

  toggleSound() {
    this.audioService.toggleSound();
  }

  onNextWord() { this.nextWord.emit(); }
  onRetry() { this.retry.emit(); }
  closeGame() { this.router.navigate(['/games']); }


  ngOnInit(): void {
    // يمكن تهيئة أي إعدادات إضافية هنا
    this.audioService.init();
  }

  ngOnDestroy(): void {
    // تنظيف الموارد الصوتية
    this.audioService.cleanup();
  }
}
