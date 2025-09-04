





import { Component, ElementRef, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { GameTemplateComponent } from "../../../game-template/game-template.component";

// ===== INTERFACES =====
type GameDifficulty = 'easy' | 'medium' | 'hard';

interface Question {
  correctAnswer: string;
}

interface PointDef {
  id?: string;         // optional ID (for mapping to a path id)
  name: string;        // display name (country)
  x: number;           // x coordinate in viewBox coords
  y: number;           // y coordinate in viewBox coords
}

interface CurrentWord {
  difficulty: 'easy' | 'medium' | 'hard';
  correct: string;
}

// ===== GAME DATA =====
const GAME_POINTS: PointDef[] = [
  { name: 'Egypt',   x: 560, y: 255 },
  { name: 'Saudi Arabia', x: 610, y: 280 },
  { name: 'Brazil',  x: 300, y: 340 },
  { name: 'United States', x: 140, y: 200 },
  { name: 'India',   x: 720, y: 260 },
  { name: 'Australia', x: 890, y: 440 },
  { name: 'Russia',  x: 700, y: 100 },
  { name: 'Canada',  x: 120, y: 120 },
  { name: 'South Africa', x: 600, y: 420 },
  { name: 'China',   x: 800, y: 200 }
];

@Component({
  selector: 'app-geo-quiz',
  standalone: true,
  imports: [CommonModule, HttpClientModule, GameTemplateComponent],
  templateUrl: './geo-quiz.component.html',
  styleUrls: ['./geo-quiz.component.css']
})
export class GeoQuizComponent implements OnInit, OnDestroy {
  @ViewChild('svgHost', { static: true }) svgHost!: ElementRef<HTMLDivElement>;

  // ===== GAME TEMPLATE PROPERTIES =====
  questionsCorrectInLevel = 0;
  timeElapsed = 0;
  currentQuestion: Question | null = { correctAnswer: '' };
  currentDifficulty: GameDifficulty = 'easy';
  currentWord: CurrentWord = { difficulty: 'easy', correct: '' };
  
  // ===== GAME STATE =====
  loading = true;
  answered = false;
  selectedAnswer: string | null = null;
  answerStatus: string[] = [];
  score = 0;
  attempts = 0;
  feedback: { text: string; ok: boolean } | null = null;
  
  // ===== MAP PROPERTIES =====
  svgUrl = '/images/WorldMap_forTheGame.svg';
  svgText = '';
  svgEl?: SVGSVGElement;
  viewBox = { w: 1000, h: 500 };
  
  // ===== GAME DATA =====
  points = GAME_POINTS;
  correctPoint?: PointDef;
  options: string[] = [];
  markerEl?: SVGCircleElement;
  highlightedPath?: SVGElement | null;
  usingPathMode = true;
  
  // ===== TIMER & BONUS =====
  bonusPoints = 0;
  private timerInterval: any;
  
  // ===== AUDIO =====
  private correctAudio: HTMLAudioElement;
  private wrongAudio: HTMLAudioElement;

  constructor(private http: HttpClient, private hostRef: ElementRef) {
    this.correctAudio = new Audio('/audio/correct.mp3');
    this.wrongAudio = new Audio('/audio/wrong.mp3');
  }

  // ===== LIFECYCLE =====
  ngOnInit(): void {
    this.initializeGame();
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  // ===== INITIALIZATION =====
  private async initializeGame(): Promise<void> {
    await this.loadSvg();
    this.startTimer();
    this.nextRound();
  }

  private async loadSvg(): Promise<void> {
    this.loading = true;
    try {
      const txt = await this.http.get(this.svgUrl, { responseType: 'text' }).toPromise();
      this.svgText = txt || '';
      
      // Insert inline SVG into container
      this.svgHost.nativeElement.innerHTML = this.svgText;
      
      // Grab the inserted SVG element
      const el = this.svgHost.nativeElement.querySelector('svg') as SVGSVGElement | null;
      if (!el) throw new Error('SVG not found in loaded file');
      
      this.svgEl = el;
      
      // Read viewBox if present
      const vb = (this.svgEl.getAttribute('viewBox') || '').split(/\s+|,/).map(Number);
      if (vb.length >= 4 && !vb.some(isNaN)) {
        this.viewBox = { w: vb[2], h: vb[3] };
      } else {
        // Fallback to width/height attributes
        const wAttr = parseFloat(this.svgEl.getAttribute('width') || '100');
        const hAttr = parseFloat(this.svgEl.getAttribute('height') || '500');
        this.viewBox = { w: wAttr, h: hAttr };
      }

      // Enable pointer events on paths for highlighting
      this.svgEl.style.pointerEvents = 'auto';
      this.loading = false;
    } catch (err) {
      console.error('Failed to load SVG', err);
      this.loading = false;
    }
  }

  // ===== GAME LOGIC =====
  nextRound(): void {
    this.clearHighlight();
    this.resetQuestionState();
    
    // Pick target
    const target = this.pickRandomTarget();
    this.correctPoint = target;
    
    // Create/position marker
    this.placeMarker(target.x, target.y);
    
    // Create options (1 correct + 2-3 distractors)
    this.options = this.makeOptions(target.name, 3);
    
    // Update game template properties
    this.updateGameTemplateProperties();
  }

  private resetQuestionState(): void {
    this.answered = false;
    this.selectedAnswer = null;
    this.feedback = null;
    this.bonusPoints = 0;
    this.resetAnswerStatus();
  }

  private resetAnswerStatus(): void {
    this.answerStatus = this.options.map(() => '');
  }

  private updateGameTemplateProperties(): void {
    if (this.correctPoint) {
      this.currentWord = {
        difficulty: this.currentDifficulty,
        correct: this.correctPoint.name
      };
    }
  }

  checkAnswer(choice: string, index: number): void {
    if (this.answered || !this.correctPoint) return;

    this.answered = true;
    this.selectedAnswer = choice;
    this.attempts++;

    const correct = this.correctPoint.name.toLowerCase().trim();
    const isCorrect = choice.toLowerCase().trim() === correct;

    if (isCorrect) {
      this.handleCorrectAnswer(index);
    } else {
      this.handleWrongAnswer(index);
    }
  }

  private handleCorrectAnswer(index: number): void {
    this.answerStatus[index] = 'correct';
    this.score++;
    this.questionsCorrectInLevel++;
    this.bonusPoints = Math.max(0, 10 - Math.floor(this.timeElapsed / 10));
    this.feedback = { text: '✅ Correct!', ok: true };
    this.playCorrectSound();
    
    // Highlight correct path if available
    this.highlightCorrectPath();
    
    // Move to next round after delay
    setTimeout(() => this.nextRound(), 900);
  }

  private handleWrongAnswer(index: number): void {
    this.answerStatus[index] = 'wrong';
    this.feedback = { text: `❌ Not quite — try the next one! (Answer was: ${this.correctPoint!.name})`, ok: false };
    this.playWrongSound();
    
    // Show correct answer briefly
    this.highlightCorrectPath();
    
    // Move to next round after delay
    setTimeout(() => this.nextRound(), 1200);
  }

  private highlightCorrectPath(): void {
    if (this.usingPathMode && this.svgEl && this.correctPoint) {
      const paths = Array.from(this.svgEl.querySelectorAll<SVGPathElement>('path[id]'));
      const found = paths.find(p => this.humanizeId(p.getAttribute('id') || '') === this.correctPoint!.name);
      if (found) {
        found.classList.add('country-highlight');
        this.highlightedPath = found;
        
        // Remove highlight after delay for wrong answers
        if (!this.answered || this.answerStatus.some(status => status === 'wrong')) {
          setTimeout(() => {
            found.classList.remove('country-highlight');
            this.highlightedPath = null;
          }, 1000);
        }
      }
    }
  }

  // ===== UTILITY METHODS =====
  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }

  getLevelScorePercentage(): number {
    return Math.round((this.questionsCorrectInLevel / 5) * 100);
  }

  getScoreMessage(): string {
    const percentage = this.getLevelScorePercentage();
    if (percentage === 100) return 'Parfait ! Vous êtes un expert en géographie !';
    if (percentage >= 80) return 'Excellent ! Vous connaissez bien les pays !';
    if (percentage >= 60) return 'Bon travail ! Continuez à vous entraîner !';
    if (percentage >= 40) return 'Pas mal ! Essayez à nouveau pour vous améliorer !';
    return 'Continuez à vous entraîner ! Vous allez progresser !';
  }

  // ===== MAP LOGIC =====
  private pickRandomTarget(): PointDef {
    if (this.usingPathMode && this.svgEl) {
      const paths = Array.from(this.svgEl.querySelectorAll<SVGPathElement>('path[id]'));
      if (paths.length > 0) {
        const p = paths[Math.floor(Math.random() * paths.length)];
        const id = p.getAttribute('id') || 'unknown';
        
        let cx = 0, cy = 0;
        try {
          const bbox = p.getBBox();
          cx = bbox.x + bbox.width / 2;
          cy = bbox.y + bbox.height / 2;
        } catch (e) {
          console.warn('getBBox failed for path id', id, e);
          return this.pickRandomTargetFromList();
        }
        return { id, name: this.humanizeId(id), x: cx, y: cy } as PointDef;
      }
    }
    return this.pickRandomTargetFromList();
  }

  private pickRandomTargetFromList(): PointDef {
    const idx = Math.floor(Math.random() * this.points.length);
    return this.points[idx];
  }

  private humanizeId(id: string): string {
    return id.replace(/[_-]+/g, ' ').replace(/\b\w/g, s => s.toUpperCase());
  }

  private makeOptions(correctName: string, distractorCount = 3): string[] {
    const names = new Set<string>([correctName]);
    const pool = new Set<string>(this.points.map(p => p.name));
    
    if (this.svgEl) {
      this.svgEl.querySelectorAll<SVGPathElement>('path[id]').forEach(p => {
        const id = p.getAttribute('id');
        if (id) pool.add(this.humanizeId(id));
      });
    }
    
    const arr = Array.from(pool).filter(n => n !== correctName);
    while (names.size <= distractorCount) {
      if (arr.length === 0) break;
      const r = arr[Math.floor(Math.random() * arr.length)];
      names.add(r);
      const i = arr.indexOf(r);
      if (i >= 0) arr.splice(i, 1);
    }
    
    const opts = Array.from(names);
    // Shuffle
    for (let i = opts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [opts[i], opts[j]] = [opts[j], opts[i]];
    }
    return opts;
  }

  private placeMarker(cx: number, cy: number): void {
    if (!this.svgEl) return;
    
    // Remove existing marker
    if (this.markerEl && this.markerEl.parentNode) {
      this.markerEl.remove();
    }
    
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

  private clearHighlight(): void {
    if (!this.svgEl) return;
    
    if (this.markerEl) {
      this.markerEl.remove();
      this.markerEl = undefined;
    }
    
    if (this.highlightedPath) {
      this.highlightedPath.classList.remove('country-highlight');
      this.highlightedPath = null;
    }
  }

  // ===== TIMER MANAGEMENT =====
  private startTimer(): void {
    this.timeElapsed = 0;
    this.timerInterval = setInterval(() => {
      this.timeElapsed++;
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  private resetTimer(): void {
    this.stopTimer();
    this.startTimer();
  }

  // ===== AUDIO =====
  private playCorrectSound(): void {
    this.correctAudio.currentTime = 0;
    this.correctAudio.play().catch(error => {
      console.log('Audio playback failed:', error);
    });
  }

  private playWrongSound(): void {
    this.wrongAudio.currentTime = 0;
    this.wrongAudio.play().catch(error => {
      console.log('Audio playback failed:', error);
    });
  }

  // ===== UI HELPERS =====
  getDifficultyClass(): string {
    return `difficulty-${this.currentWord.difficulty}`;
  }

  getTimeDisplayClass(): string {
    if (this.timeElapsed < 15) return 'time-good';
    if (this.timeElapsed < 30) return 'time-warning';
    return 'time-danger';
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  // ===== MODE TOGGLE =====
  togglePathMode(): void {
    this.usingPathMode = !this.usingPathMode;
    this.nextRound();
  }
}