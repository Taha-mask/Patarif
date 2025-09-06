import { Component, ElementRef, OnInit, OnDestroy, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { SupabaseService } from '../../../../supabase.service';
import { GameTemplateComponent } from '../../../game-template/game-template.component';
import { CelebrationComponent } from '../../../game-template/celebration/celebration.component';
import { AudioService } from '../../../../services/audio.service';
type GameDifficulty = 'facile' | 'moyen' | 'difficile';

interface PointDef {
  id?: string;
  name: string;
  x: number;
  y: number;
  chooses?: string[];
  difficulty?: GameDifficulty;
}

@Component({
  selector: 'app-geo-quiz',
  standalone: true,
  imports: [CommonModule, HttpClientModule, GameTemplateComponent, CelebrationComponent],
  templateUrl: './geo-quiz.component.html',
  styleUrls: ['./geo-quiz.component.css']
})
export class GeoQuizComponent implements OnInit, OnDestroy {
  @ViewChild('svgHost', { static: true }) svgHost!: ElementRef<HTMLDivElement>;

  // ===== GAME STATE =====
  loading = true;
  points: PointDef[] = [];
  currentQuestionIndex = 0;
  currentQuestion!: PointDef;
  options: string[] = [];
  selectedAnswer: string | null = null;
  answerStatus: string[] = [];
  answered = false;
  score = 0;
  bonusPoints = 0;
  feedback: { text: string; ok: boolean } | null = null;
  level = 1;
  showCelebration = false;

  // ===== SVG / MAP =====
  svgUrl = '/images/WorldMap_forTheGame.svg';
  svgText = '';
  svgEl?: SVGSVGElement;
  markerEl?: SVGCircleElement;
  highlightedPath?: SVGElement | null;
  usingPathMode = true;
  viewBox = { w: 1000, h: 500 };

  // ===== TIMER =====
  timeElapsed = 0;
  private timerInterval: any;

  // ===== AUDIO =====
 

  constructor(private http: HttpClient, private supabase: SupabaseService, private cdr: ChangeDetectorRef, private audioService: AudioService) {}

  ngOnInit(): void {
    this.initializeGame();
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  // =========================
  // INITIALIZATION
  // =========================
  private async initializeGame(): Promise<void> {
    this.loading = true;
    this.cdr.detectChanges();
    try {
      await this.loadSvg();

      const maps = await this.supabase.getGeoMapByLevel(this.level);
      this.points = maps.map(m => ({
        id: m.id,
        name: m.value || '',
        x: m.location[0] || 0,   // <-- استخدم الرقم مباشرة
        y: m.location[1] || 0,   // <-- استخدم الرقم مباشرة
        chooses: m.chooses || [],
        difficulty: m.difficulty as GameDifficulty || 'facile'
      }));
      
      

      this.currentQuestionIndex = 0;
      this.setCurrentQuestion();
      this.startTimer();
    } catch (err) {
      console.error('Game initialization failed:', err);
      this.feedback = { text: 'Error loading game', ok: false };
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  private async loadSvg(): Promise<void> {
    const txt = await this.http.get(this.svgUrl, { responseType: 'text' }).toPromise();
    this.svgText = txt || '';
    this.svgHost.nativeElement.innerHTML = this.svgText;
    this.svgEl = this.svgHost.nativeElement.querySelector('svg') || undefined;

    if (!this.svgEl) throw new Error('SVG not found');
    const vb = (this.svgEl.getAttribute('viewBox') || '').split(/\s+|,/).map(Number);
    if (vb.length >= 4 && !vb.some(isNaN)) this.viewBox = { w: vb[2], h: vb[3] };
    this.svgEl.style.pointerEvents = 'auto';
  }

  // =========================
  // QUESTION HANDLING
  // =========================
  private setCurrentQuestion(): void {
    if (this.currentQuestionIndex < this.points.length) {
      this.currentQuestion = this.points[this.currentQuestionIndex];
      this.options = this.generateOptions(this.currentQuestion.name, 3);
      this.placeMarker(this.currentQuestion.x, this.currentQuestion.y);
      this.answered = false;
      this.selectedAnswer = null;
      this.feedback = null;
      this.bonusPoints = 0;
      this.answerStatus = [];
    } else {
      // انتهت كل الأسئلة لهذا المستوى
      this.showCelebration = true;
      this.stopTimer();
    }
  }

  /**
 * Handles user answer selection and updates game state accordingly
 * @param choice The selected answer text
 * @param index The index of the selected answer in the options array
 */
selectAnswer(choice: string, index: number): void {
  // Prevent multiple answers
  if (this.answered || !this.currentQuestion || !this.options?.length) {
    return;
  }

  this.answered = true;
  this.selectedAnswer = choice;

  // Normalize strings for comparison
  const normalizedChoice = choice?.toLowerCase().trim() || '';
  const normalizedCorrect = this.currentQuestion.name?.toLowerCase().trim() || '';
  const isCorrect = normalizedChoice === normalizedCorrect;

  // Update answer status for the selected option
  this.answerStatus = [...this.answerStatus]; // Ensure change detection
  this.answerStatus[index] = isCorrect ? 'correct' : 'wrong';

  if (isCorrect) {
    this.handleCorrectAnswer();
  } else {
    this.handleIncorrectAnswer(normalizedCorrect);
  }

  this.highlightCorrectPath();
  this.cdr.detectChanges(); // Trigger change detection
}

/**
 * Handles logic for correct answer
 */
private handleCorrectAnswer(): void {
  this.score++;
  this.bonusPoints = this.calculateBonusPoints();
  this.feedback = { text: '✅ Correct!', ok: true };
  this.playSound('correct');
}

/**
 * Handles logic for incorrect answer
 * @param normalizedCorrect The correct answer in normalized form
 */
private handleIncorrectAnswer(normalizedCorrect: string): void {
  this.feedback = { 
    text: `❌ Wrong! Correct: ${this.currentQuestion.name}`, 
    ok: false 
  };
  this.playSound('wrong');
  this.highlightCorrectOption(normalizedCorrect);
}

/**
 * Highlights the correct answer option
 * @param normalizedCorrect The correct answer in normalized form
 */
private highlightCorrectOption(normalizedCorrect: string): void {
  const correctIndex = this.options.findIndex(
    opt => (opt?.toLowerCase().trim() || '') === normalizedCorrect
  );
  
  if (correctIndex >= 0) {
    this.answerStatus[correctIndex] = 'correct';
  }
}

/**
 * Calculates bonus points based on time elapsed
 * @returns The calculated bonus points
 */
private calculateBonusPoints(): number {
  const timeBonus = 10 - Math.floor(this.timeElapsed / 10);
  return Math.max(0, timeBonus);
}

/**
 * Plays sound based on answer correctness
 * @param type The type of sound to play ('correct' or 'wrong')
 */
private playSound(type: 'correct' | 'wrong'): void {
  try {
    const sound = type === 'correct' ? this.playCorrectSound() : this.playWrongSound();
  } catch (error) {
    console.error('Error in playSound:', error);
  }
}

  nextQuestion(): void {
    this.clearHighlight();
  
    this.currentQuestionIndex++;
  
    if (this.currentQuestionIndex >= this.points.length) {
      // انتهت كل الأسئلة لهذا المستوى
      this.showCelebration = true;
      this.stopTimer();
    } else {
      this.setCurrentQuestion();
    }
  
    this.cdr.detectChanges();
  }
  
  // =========================
  // SVG HANDLING
  // =========================
  private placeMarker(cx: number, cy: number): void {
    if (!this.svgEl) return;
    this.markerEl?.remove();
    const svgns = 'http://www.w3.org/2000/svg';
    const circle = document.createElementNS(svgns, 'circle');
    circle.setAttribute('cx', String(cx));
    circle.setAttribute('cy', String(cy));
    circle.setAttribute('r', '8');
    circle.setAttribute('class', 'map-marker');
    circle.setAttribute('fill', '#e74c3c');
    circle.setAttribute('stroke', '#fff');
    circle.setAttribute('stroke-width', '2');
    circle.style.cursor = 'pointer';
    this.svgEl.appendChild(circle);
    this.markerEl = circle;
  }

  private highlightCorrectPath(): void {
    if (!this.usingPathMode || !this.svgEl || !this.currentQuestion) return;
    const paths = Array.from(this.svgEl.querySelectorAll<SVGPathElement>('path[id]'));
    const found = paths.find(p => this.humanizeId(p.getAttribute('id') || '') === this.currentQuestion.name);
    if (found) {
      found.classList.add('country-highlight');
      this.highlightedPath = found;
    }
  }

  private clearHighlight(): void {
    this.markerEl?.remove();
    if (this.highlightedPath) {
      this.highlightedPath.classList.remove('country-highlight');
      this.highlightedPath = null;
    }
  }

  private humanizeId(id: string): string {
    return id.replace(/[_-]+/g, ' ').replace(/\b\w/g, s => s.toUpperCase());
  }

  // =========================
  // HELPERS
  // =========================
  private generateOptions(correctName: string, distractorCount = 3): string[] {
    const names = new Set<string>([correctName]);
    const pool = this.points.map(p => p.name).filter(n => n !== correctName);
    while (names.size <= distractorCount) {
      if (pool.length === 0) break;
      const idx = Math.floor(Math.random() * pool.length);
      names.add(pool.splice(idx, 1)[0]);
    }
    const opts = Array.from(names);
    return opts.sort(() => Math.random() - 0.5);
  }

  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }

  formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  getQuestionNumber(): number {
    return this.currentQuestionIndex + 1;
  }

  getTotalQuestions(): number {
    return this.points.length;
  }

  // =========================
  // TIMER
  // =========================
  private startTimer(): void {
    this.timeElapsed = 0;
    this.timerInterval = setInterval(() => this.timeElapsed++, 1000);
  }

  private stopTimer(): void {
    clearInterval(this.timerInterval);
  }

  // =========================
  // AUDIO
  // =========================


  private playCorrectSound() {
    this.audioService.playCorrectSound();
  }

  private playWrongSound() {
    this.audioService.playWrongSound();
  }
  /**
 * Helper method to play audio with proper error handling
 * @param audio The HTMLAudioElement to play
 * @returns Promise that resolves when audio starts playing
 */
private async playAudio(audio: HTMLAudioElement): Promise<void> {
  if (!audio) {
    console.warn('Audio element not initialized');
    return;
  }

  try {
    // Reset audio to start if it's already playing
    if (!audio.paused) {
      audio.pause();
      audio.currentTime = 0;
    }

    // Play the sound and handle potential autoplay restrictions
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
      await playPromise.catch(error => {
        // Handle autoplay restrictions
        if (error.name === 'NotAllowedError' || error.name === 'NotSupportedError') {
          console.warn('Autoplay prevented. User interaction required to play sounds.');
        } else {
          console.error('Error playing audio:', error);
        }
      });
    }
  } catch (error) {
    console.error('Unexpected error in playAudio:', error);
  }
}

  // =========================
  // CELEBRATION / NEXT LEVEL
  // =========================
  onNextLevel(level: number): void {
    this.showCelebration = false;
    if (level > 0) {
      this.level = level;
      this.score = 0;
      this.initializeGame();
    } else {
      console.log('Game completed!');
    }
  }

  onCloseCelebration(): void {
    this.showCelebration = false;
  }
}
