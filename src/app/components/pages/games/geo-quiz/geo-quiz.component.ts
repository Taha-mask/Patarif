import { Component, ElementRef, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { SupabaseService } from '../../../../supabase.service';
import { GameTemplateComponent } from '../../../game-template/game-template.component';
import { CelebrationComponent } from '../../../game-template/celebration/celebration.component';

type GameDifficulty = 'easy' | 'medium' | 'hard';

interface PointDef {
  id?: string;
  name: string;
  x: number;
  y: number;
}

interface CurrentWord {
  difficulty: GameDifficulty;
  correct: string;
}

@Component({
  selector: 'app-geo-quiz',
  standalone: true,
  imports: [CommonModule, HttpClientModule, CelebrationComponent, GameTemplateComponent],
  templateUrl: './geo-quiz.component.html',
  styleUrls: ['./geo-quiz.component.css']
})
export class GeoQuizComponent implements OnInit, OnDestroy {
  @ViewChild('svgHost', { static: true }) svgHost!: ElementRef<HTMLDivElement>;

  // ===== GAME STATE =====
  loading = true;
  points: PointDef[] = [];
  correctPoint?: PointDef;
  options: string[] = [];
  questionsCorrectInLevel = 0;
  currentQuestion = 1;
  totalQuestions = 5;
  selectedAnswer: string | null = null;
  answerStatus: string[] = [];
  answered = false;
  score = 0;
  attempts = 0;
  feedback: { text: string; ok: boolean } | null = null;
  currentDifficulty: GameDifficulty = 'easy';
  currentWord: CurrentWord = { difficulty: 'easy', correct: '' };
  bonusPoints = 0;

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
  private correctAudio = new Audio('/audio/correct.mp3');
  private wrongAudio = new Audio('/audio/wrong.mp3');

  constructor(private http: HttpClient, private supabase: SupabaseService) {}

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
    try {
      await this.loadSvg();
      const maps = await this.supabase.getGeoMapByLevel(1);
      this.points = maps.map(m => ({
        id: m.id,
        name: m.value,
        x: parseFloat(m.chooses?.[0] || '0'),
        y: parseFloat(m.chooses?.[1] || '0')
      }));

      this.resetQuestion();
      this.startTimer();
    } catch (err) {
      console.error('Game initialization failed:', err);
      this.feedback = { text: 'Error loading game', ok: false };
    } finally {
      this.loading = false;
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
  // QUESTION / GAME LOGIC
  // =========================
  resetQuestion(): void {
    this.answered = false;
    this.selectedAnswer = null;
    this.feedback = null;
    this.bonusPoints = 0;
    this.answerStatus = [];
    this.correctPoint = this.pickRandomTarget();
    this.options = this.generateOptions(this.correctPoint.name, 3);
    this.currentWord = { difficulty: this.currentDifficulty, correct: this.correctPoint.name };
    this.placeMarker(this.correctPoint.x, this.correctPoint.y);
  }

  selectAnswer(choice: string, index: number): void {
    if (this.answered) return;
    if (!this.correctPoint) return;

    this.answered = true;
    this.selectedAnswer = choice;
    this.attempts++;

    const isCorrect = choice.toLowerCase().trim() === this.correctPoint.name.toLowerCase().trim();
    if (isCorrect) {
      this.answerStatus[index] = 'correct';
      this.score++;
      this.questionsCorrectInLevel++;
      this.bonusPoints = Math.max(0, 10 - Math.floor(this.timeElapsed / 10));
      this.feedback = { text: '✅ Correct!', ok: true };
      this.playCorrectSound();
      
      // Move to next question after delay
      setTimeout(() => this.nextQuestion(), 1000);
    } else {
      this.answerStatus[index] = 'wrong';
      this.feedback = { text: `❌ Wrong! Correct: ${this.correctPoint.name}`, ok: false };
      this.playWrongSound();
      
      // Move to next question after delay
      setTimeout(() => this.nextQuestion(), 1500);
    }

    this.highlightCorrectPath();
  }
  
  // Alias for template compatibility
  checkAnswer(choice: string, index: number): void {
    this.selectAnswer(choice, index);
  }
  
  // Alias for template compatibility
  nextRound(): void {
    this.nextQuestion();
  }

 

  private pickRandomTarget(): PointDef {
    if (this.points.length === 0) throw new Error('No points available');
    return this.points[Math.floor(Math.random() * this.points.length)];
  }

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

  // =========================
  // SVG / MAP HANDLING
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
    if (!this.usingPathMode || !this.svgEl || !this.correctPoint) return;
    const paths = Array.from(this.svgEl.querySelectorAll<SVGPathElement>('path[id]'));
    const found = paths.find(p => this.humanizeId(p.getAttribute('id') || '') === this.correctPoint!.name);
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
  private playCorrectSound(): void {
    this.correctAudio.currentTime = 0;
    this.correctAudio.play().catch(() => {});
  }

  private playWrongSound(): void {
    this.wrongAudio.currentTime = 0;
    this.wrongAudio.play().catch(() => {});
  }

  // =========================
  // UI HELPERS
  // =========================
  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }

  getLevelScorePercentage(): number {
    return Math.round((this.score / 5) * 100);
  }

  getScoreMessage(): string {
    const pct = this.getLevelScorePercentage();
    if (pct === 100) return 'Parfait ! Expert en géographie !';
    if (pct >= 80) return 'Excellent !';
    if (pct >= 60) return 'Bon travail !';
    if (pct >= 40) return 'Pas mal !';
    return 'Continuez à vous entraîner !';
  }

  getDifficultyClass(): string {
    return `difficulty-${this.currentWord.difficulty}`;
  }

  formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }


  // inside GeoQuizComponent
level = 1;
totalQuestionsPerLevel = 5;
showCelebration = false;

// called after user clicks "Next Question"
nextQuestion(): void {
  this.clearHighlight();
  if (this.answered) {
    // increment questions correct in level
    if (this.selectedAnswer?.toLowerCase().trim() === this.correctPoint?.name.toLowerCase().trim()) {
      this.questionsCorrectInLevel++;
    }

    // Check if level is completed
    this.checkLevelCompletion();
  }
  
  // reset question state for next
  this.resetQuestion();
}

// Check if the current level is completed
private checkLevelCompletion(): void {
  if (this.questionsCorrectInLevel >= this.totalQuestionsPerLevel) {
    // stop the timer
    this.stopTimer();

    // show celebration modal
    this.showCelebration = true;
  }
}
private resetTimer(): void {
  this.stopTimer();
  this.startTimer();
}

// Celebration modal handlers
onCloseCelebration(): void {
  this.showCelebration = false;
}

onNextLevel(level: number): void {
  this.showCelebration = false;

  if (level > 0) {
    // Increase level and reset stats
    this.showCelebration = false;

    // زود المستوى +1 دايمًا
    this.level += 1;
  
    // reset الحالة
    this.questionsCorrectInLevel = 0;
    this.currentQuestion = 1;
    this.score = 0;
    this.attempts = 0;
    this.resetTimer();
    this.resetQuestion();
  } else {
    // Game completed
    console.log('Game completed!');
  }
}

}
