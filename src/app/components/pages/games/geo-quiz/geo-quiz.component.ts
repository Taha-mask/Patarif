import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { GameTemplateComponent } from "../../../game-template/game-template.component";

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

@Component({
  selector: 'app-geo-quiz',
  standalone: true,
  imports: [CommonModule, HttpClientModule, GameTemplateComponent],
  templateUrl: './geo-quiz.component.html',
  styleUrls: ['./geo-quiz.component.css']
})
export class GeoQuizComponent implements OnInit {
  @ViewChild('svgHost', { static: true }) svgHost!: ElementRef<HTMLDivElement>;

  // Game template properties
  questionsCorrectInLevel = 0;
  timeElapsed = 0;
  currentQuestion: Question | null = { correctAnswer: '' };
  currentDifficulty: GameDifficulty = 'easy';
  loading = true;
  
  // Map properties
  svgUrl = '/images/WorldMap_forTheGame.svg'; // path used in template; change if needed
  svgText = '';          // raw SVG markup (inlined)
  svgEl?: SVGSVGElement; // reference to inserted SVG element
  viewBox = { w: 1000, h: 500 }; // default - will be read from SVG

  // Game data: list of predefined points in viewBox coords (x,y)
  points: PointDef[] = [
    // Example entries (you should replace/add correct coordinates for your SVG viewBox)
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

  // Game state
  correctPoint?: PointDef;
  options: string[] = [];
  markerEl?: SVGCircleElement;
  highlightedPath?: SVGElement | null;
  score = 0;
  attempts = 0;
  feedback: { text: string; ok: boolean } | null = null;
  usingPathMode = true; // alternate mode: try to pick a country by path id if available


  constructor(private http: HttpClient, private hostRef: ElementRef) {}

  ngOnInit(): void {
    this.loadSvg().then(() => {
      // start first round after SVG is loaded & inserted
      this.nextRound();
      // watch resize to reposition marker if needed (marker is in SVG so scales automatically)
      window.addEventListener('resize', () => { /* nothing special needed with viewBox */ });
    });
  }

  /** Load SVG text and inline it into the DOM so we can manipulate its paths */
  async loadSvg() {
    this.loading = true;
    try {
      const txt = await this.http.get(this.svgUrl, { responseType: 'text' }).toPromise();
      this.svgText = txt || '';
      // Insert inline SVG into container
      this.svgHost.nativeElement.innerHTML = this.svgText;
      // grab the inserted svg element
      const el = this.svgHost.nativeElement.querySelector('svg') as SVGSVGElement | null;
      if (!el) throw new Error('SVG not found in loaded file');
      this.svgEl = el;
      // read viewBox if present
      const vb = (this.svgEl.getAttribute('viewBox') || '').split(/\s+|,/).map(Number);
      if (vb.length >= 4 && !vb.some(isNaN)) {
        this.viewBox = { w: vb[2], h: vb[3] };
      } else {
        // fallback to width/height attributes
        const wAttr = parseFloat(this.svgEl.getAttribute('width') || '1000');
        const hAttr = parseFloat(this.svgEl.getAttribute('height') || '500');
        this.viewBox = { w: wAttr, h: hAttr };
      }

      // make sure SVG has pointer-events enabled on paths for highlighting
      this.svgEl.style.pointerEvents = 'auto';
      this.loading = false;
    } catch (err) {
      console.error('Failed to load SVG', err);
      this.loading = false;
    }
  }

  /** Choose a random predefined point or (if usingPathMode) choose a random path-country from SVG */
  pickRandomTarget() {
    if (this.usingPathMode && this.svgEl) {
      // try to find <path> elements with id attributes that look like country identifiers
      const paths = Array.from(this.svgEl.querySelectorAll<SVGPathElement>('path[id]'));
      if (paths.length > 0) {
        // pick a random path element
        const p = paths[Math.floor(Math.random() * paths.length)];
        const id = p.getAttribute('id') || 'unknown';
        // compute bbox centroid (safe for many shapes)
        let cx = 0, cy = 0;
        try {
          const bbox = p.getBBox();
          cx = bbox.x + bbox.width / 2;
          cy = bbox.y + bbox.height / 2;
        } catch (e) {
          // getBBox may fail for some SVGs; fallback to random from points
          console.warn('getBBox failed for path id', id, e);
          return this.pickRandomTargetFromList();
        }
        return { id, name: this.humanizeId(id), x: cx, y: cy } as PointDef;
      }
    }

    // fallback: pick random from predefined points list
    return this.pickRandomTargetFromList();
  }

  private pickRandomTargetFromList(): PointDef {
    const idx = Math.floor(Math.random() * this.points.length);
    return this.points[idx];
  }

  /** Convert an ID like "UNITED_STATES" or "us" into a readable name (best-effort) */
  private humanizeId(id: string) {
    return id.replace(/[_-]+/g, ' ').replace(/\b\w/g, s => s.toUpperCase());
  }

  nextRound() {
    this.clearHighlight();
    this.feedback = null;

    // pick target
    const target = this.pickRandomTarget();
    this.correctPoint = target;
    // create/position marker
    this.placeMarker(target.x, target.y);

    // create options (1 correct + 2–3 distractors)
    this.options = this.makeOptions(target.name, 3);
  }

  /** Create N options including the correct one; shuffle */
  makeOptions(correctName: string, distractorCount = 3): string[] {
    const names = new Set<string>([correctName]);
    // pool: from points' names + path ids (humanized) if any
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
      // remove picked to avoid repeats
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

  /** Place an SVG circle marker at viewBox coordinates (cx,cy) */
  placeMarker(cx: number, cy: number) {
    if (!this.svgEl) return;
    // remove existing marker
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
    // some styling for pointer
    circle.style.cursor = 'pointer';

    // Append to top of SVG so visible
    this.svgEl.appendChild(circle);
    this.markerEl = circle;
  }

  clearHighlight() {
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

  /** User selects an option */
  pickOption(choice: string) {
    if (!this.correctPoint) return;
    const correct = this.correctPoint.name.toLowerCase().trim();
    this.attempts++;
    if (choice.toLowerCase().trim() === correct) {
      this.score++;
      this.feedback = { text: '✅ Correct!', ok: true };
      // highlight correct path if path mode is available
      if (this.usingPathMode && this.svgEl) {
        // try find a path whose humanized ID matches the correct name
        const paths = Array.from(this.svgEl.querySelectorAll<SVGPathElement>('path[id]'));
        const found = paths.find(p => this.humanizeId(p.getAttribute('id') || '') === this.correctPoint!.name);
        if (found) {
          found.classList.add('country-highlight');
          this.highlightedPath = found;
        }
      }
      // small delay then next round
      setTimeout(() => this.nextRound(), 900);
    } else {
      this.feedback = { text: `❌ Not quite — try the next one! (Answer was: ${this.correctPoint.name})`, ok: false };
      // show correct highlight briefly
      if (this.usingPathMode && this.svgEl) {
        const paths = Array.from(this.svgEl.querySelectorAll<SVGPathElement>('path[id]'));
        const found = paths.find(p => this.humanizeId(p.getAttribute('id') || '') === this.correctPoint!.name);
        if (found) {
          found.classList.add('country-highlight');
          this.highlightedPath = found;
          setTimeout(() => { found.classList.remove('country-highlight'); this.highlightedPath = null; }, 1000);
        }
      }
      // proceed to next round after short pause
      setTimeout(() => this.nextRound(), 1200);
    }
  }

  /** Toggle mode: use path id centroids or predefined points */
  togglePathMode() {
    this.usingPathMode = !this.usingPathMode;
    this.nextRound();
  }
}
