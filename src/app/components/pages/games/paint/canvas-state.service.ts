import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Tool = 'pen' | 'eraser' | 'brush' | 'marker' | 'spray' | 'calligraphy';
export type BrushShape = 'round' | 'square' | 'calligraphy';

@Injectable({ providedIn: 'root' })
export class CanvasStateService {
  public tool$ = new BehaviorSubject<Tool>('pen');
  public color$ = new BehaviorSubject<string>('#000000');
  public size$ = new BehaviorSubject<number>(5);
  public opacity$ = new BehaviorSubject<number>(1);
  public shape$ = new BehaviorSubject<BrushShape>('round');

  public zoom$ = new BehaviorSubject<number>(1);
  public panOffsetX$ = new BehaviorSubject<number>(0);
  public panOffsetY$ = new BehaviorSubject<number>(0);

  private drawingHistory: string[] = [];
  private historyIndex = -1;
  readonly MAX_HISTORY = 50;

  public backgroundImageUrl$ = new BehaviorSubject<string | null>(null);
  public historyChanged$ = new BehaviorSubject<{ index: number, length: number }>({
    index: this.historyIndex,
    length: this.drawingHistory.length
  });

  saveState(dataUrl: string) {
    if (this.historyIndex < this.drawingHistory.length - 1) {
      this.drawingHistory = this.drawingHistory.slice(0, this.historyIndex + 1);
    }
    this.drawingHistory.push(dataUrl);
    if (this.drawingHistory.length > this.MAX_HISTORY) this.drawingHistory.shift();
    this.historyIndex = this.drawingHistory.length - 1;
    this.historyChanged$.next({ index: this.historyIndex, length: this.drawingHistory.length });
  }

  getHistory(): { index: number, list: string[] } {
    return { index: this.historyIndex, list: [...this.drawingHistory] };
  }

  canUndo(): boolean { return this.historyIndex > 0; }
  canRedo(): boolean { return this.historyIndex < this.drawingHistory.length - 1; }

  undo(): string | null {
    if (!this.canUndo()) return null;
    this.historyIndex--;
    this.historyChanged$.next({ index: this.historyIndex, length: this.drawingHistory.length });
    return this.drawingHistory[this.historyIndex] || null;
  }

  redo(): string | null {
    if (!this.canRedo()) return null;
    this.historyIndex++;
    this.historyChanged$.next({ index: this.historyIndex, length: this.drawingHistory.length });
    return this.drawingHistory[this.historyIndex] || null;
  }

  clearHistory() {
    this.drawingHistory = [];
    this.historyIndex = -1;
    this.historyChanged$.next({ index: this.historyIndex, length: this.drawingHistory.length });
  }

  setBackgroundUrl(url: string | null) {
    this.backgroundImageUrl$.next(url);
  }
}
