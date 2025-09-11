import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CanvasStateService, Tool } from '../canvas-state.service';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.css']
})
export class ToolbarComponent {
  basicColors = ['#ff0000','#0000ff','#00bfff','#00ff00','#00ffff','#ffff00','#ffa500','#ff69b4','#dda0dd','#d3d3d3','#808080','#ffffff'];

  currentTool: Tool = 'pen';
  color = '#000000';
  size = 5;
  zoomPercent = 100;

  constructor(private state: CanvasStateService) {
    this.state.tool$.subscribe(t => this.currentTool = t);
    this.state.color$.subscribe(c => this.color = c);
    this.state.size$.subscribe(s => this.size = s);
    this.state.zoom$.subscribe(z => this.zoomPercent = Math.round(z * 100));
  }

  selectTool(tool: Tool) { this.state.tool$.next(tool); }
  setColor(c: string) { this.state.color$.next(c); }
  setSize(s: number) { this.state.size$.next(s); }
  zoomIn() { this.state.zoom$.next(Math.min(5, this.state.zoom$.value + 0.1)); }
  zoomOut() { this.state.zoom$.next(Math.max(0.1, this.state.zoom$.value - 0.1)); }

  downloadPNG() { document.dispatchEvent(new CustomEvent('canvas-download-png')); }
  downloadPDF() { document.dispatchEvent(new CustomEvent('canvas-download-pdf')); }

  openColorPicker() {
    const inp = document.querySelector('input[type=color]') as HTMLInputElement | null;
    if (inp) inp.click();
  }
}
