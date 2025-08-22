import { Component, ElementRef, ViewChild, AfterViewInit, HostListener, OnDestroy, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GameTemplateComponent } from '../../../../game-template/game-template.component';
type Tool = 'pen' | 'eraser';

@Component({
  selector: 'app-canvas',
  standalone: true,
  imports: [CommonModule, FormsModule, GameTemplateComponent],
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.css']
})
export class CanvasComponent implements AfterViewInit, OnDestroy {
  @ViewChild('coloringCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('cursorElement', { static: false }) cursorElement!: ElementRef<HTMLDivElement>;
  private ctx!: CanvasRenderingContext2D;
  private cursorVisible = false;
  private isDrawing = false;
  private points: {x: number, y: number}[] = [];
  private animationFrameId: number | null = null;
  drawingHistory: string[] = [];
  historyIndex: number = -1;
  private readonly MAX_HISTORY = 50;
  
  selectedColor: string = '#000000';
  brushSize: number = 5;
  currentTool: Tool = 'pen';
  isEraser: boolean = false;
  
  // Color presets
  colorPresets: string[] = [
    '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff',
    '#ffff00', '#00ffff', '#ff00ff', '#ff8000', '#8000ff',
    '#0080ff', '#ff0080', '#80ff00', '#00ff80', '#ff8000'
  ];

  private isBrowser: boolean;

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object,
    private elementRef: ElementRef
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngAfterViewInit(): void {
    if (this.isBrowser) {
      this.setupCanvas();
      this.saveState();
      this.setupCursor();
    }
  }

  private setupCursor(): void {
    if (this.cursorElement) {
      this.updateCursor();
    }
  }

  private updateCursor(): void {
    if (!this.cursorElement?.nativeElement) return;
    
    const cursor = this.cursorElement.nativeElement;
    const size = this.brushSize * 2; // Double the size for better visibility
    
    cursor.style.width = `${size}px`;
    cursor.style.height = `${size}px`;
    
    if (this.isEraser) {
      cursor.style.border = '2px solid #ff0000';
      cursor.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
    } else {
      cursor.style.backgroundColor = this.selectedColor;
      cursor.style.opacity = '0.5';
    }
  }

  onMouseMove(event: MouseEvent): void {
    this.updateCursorPosition(event.clientX, event.clientY);
    this.draw(event);
  }

  onMouseLeave(): void {
    this.hideCursor();
  }

  onTouchMove(event: TouchEvent): void {
    event.preventDefault();
    if (event.touches.length > 0) {
      const touch = event.touches[0];
      this.updateCursorPosition(touch.clientX, touch.clientY);
      this.draw(event);
    }
  }

  private updateCursorPosition(clientX: number, clientY: number): void {
    if (!this.cursorElement?.nativeElement) return;
    
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    
    // Only show cursor when inside canvas
    if (
      clientX >= rect.left &&
      clientX <= rect.right &&
      clientY >= rect.top &&
      clientY <= rect.bottom
    ) {
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      
      this.cursorElement.nativeElement.style.left = `${x}px`;
      this.cursorElement.nativeElement.style.top = `${y}px`;
      
      if (!this.cursorVisible) {
        this.cursorElement.nativeElement.style.display = 'block';
        this.cursorVisible = true;
      }
    } else {
      this.hideCursor();
    }
  }

  private hideCursor(): void {
    if (this.cursorElement?.nativeElement && this.cursorVisible) {
      this.cursorElement.nativeElement.style.display = 'none';
      this.cursorVisible = false;
    }
  }

  private setupCanvas(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.strokeStyle = this.selectedColor;
    this.ctx.lineWidth = this.brushSize;
    this.ctx.globalCompositeOperation = 'source-over';

    this.resizeCanvas();
    
    // Add keyboard event listeners
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  @HostListener('window:resize')
  private resizeCanvas(): void {
    const canvas = this.canvasRef.nativeElement;
    const container = canvas.parentElement!;
    
    const size = Math.min(container.clientWidth - 40, 600);
    canvas.width = size;
    canvas.height = size;
    
    this.ctx.lineWidth = this.brushSize;
    this.ctx.strokeStyle = this.selectedColor;
  }

  // Drawing methods
  startDrawing(e: MouseEvent | TouchEvent): void {
    e.preventDefault();
    this.isDrawing = true;
    this.points = [];
    const pos = this.getMousePos(e);
    this.points.push(pos);
    
    this.ctx.globalCompositeOperation = this.currentTool === 'eraser' ? 'destination-out' : 'source-over';
  }

  draw(e: MouseEvent | TouchEvent): void {
    if (!this.isDrawing) return;
    e.preventDefault();
    
    const pos = this.getMousePos(e);
    this.points.push(pos);
    
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    this.animationFrameId = requestAnimationFrame(() => this.drawSmooth());
  }

  private drawSmooth(): void {
    if (this.points.length < 3) return;
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(this.points[0].x, this.points[0].y);

    for (let i = 1; i < this.points.length - 2; i++) {
      const xc = (this.points[i].x + this.points[i + 1].x) / 2;
      const yc = (this.points[i].y + this.points[i + 1].y) / 2;
      ctx.quadraticCurveTo(this.points[i].x, this.points[i].y, xc, yc);
    }

    const last = this.points.length - 1;
    ctx.quadraticCurveTo(
      this.points[last - 1].x,
      this.points[last - 1].y,
      this.points[last].x,
      this.points[last].y
    );

    ctx.stroke();
  }

  stopDrawing(): void {
    if (this.isDrawing) {
      this.isDrawing = false;
      this.points = [];
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }
      // Save state after drawing is complete
      this.saveState();
    }
  }

  clearCanvas(): void {
    this.ctx.clearRect(0, 0, this.canvasRef.nativeElement.width, this.canvasRef.nativeElement.height);
  }

  onColorChange(): void {
    this.ctx.strokeStyle = this.selectedColor;
    this.ctx.globalCompositeOperation = 'source-over';
  }
  
  setBrushSize(size: number): void {
    this.brushSize = size;
    this.ctx.lineWidth = size;
    this.updateCursor();
  }

  selectTool(tool: Tool): void {
    this.currentTool = tool;
    this.isEraser = tool === 'eraser';
    this.ctx.globalCompositeOperation = this.isEraser ? 'destination-out' : 'source-over';
    this.updateCursor();
    this.ctx.strokeStyle = this.isEraser ? 'rgba(0,0,0,1)' : this.selectedColor;
  }
  
  toggleEraser(): void {
    this.isEraser = !this.isEraser;
    this.selectTool(this.isEraser ? 'eraser' : 'pen');
  }
  
  setColor(color: string): void {
    if (this.isEraser) return;
    this.selectedColor = color;
    this.ctx.strokeStyle = color;
    this.updateCursor();
  }
  
  selectPresetColor(color: string): void {
    this.setColor(color);
    this.ctx.globalCompositeOperation = 'source-over';
  }
  
  goBack(): void {
    this.router.navigate(['/gallery']);
  }
  
  ngOnDestroy(): void {
    if (this.isBrowser) {
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
      }
      // Clean up event listeners
      window.removeEventListener('keydown', this.handleKeyDown.bind(this));
    }
  }

  onBrushSizeChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.brushSize = parseInt(target.value, 10);
    this.ctx.lineWidth = this.brushSize;
  }

  private getMousePos(e: MouseEvent | TouchEvent): { x: number, y: number } {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as MouseEvent).clientX;
      clientY = (e as MouseEvent).clientY;
    }

    return { x: clientX - rect.left, y: clientY - rect.top };
  }


  private saveState(): void {
    if (!this.isBrowser || !this.canvasRef?.nativeElement) return;
    
    try {
      // Save current canvas state to history
      const canvas = this.canvasRef.nativeElement;
      const state = canvas.toDataURL('image/png');
      
      // If we're in the middle of the history, remove future states
      if (this.historyIndex < this.drawingHistory.length - 1) {
        this.drawingHistory = this.drawingHistory.slice(0, this.historyIndex + 1);
      }
      
      // Add new state to history
      this.drawingHistory.push(state);
      
      // Limit history size
      if (this.drawingHistory.length > this.MAX_HISTORY) {
        this.drawingHistory.shift();
      } else {
        this.historyIndex = this.drawingHistory.length - 1;
      }
    } catch (error) {
      console.error('Error saving canvas state:', error);
    }
  }

  undo(): void {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.restoreState();
    }
  }

  redo(): void {
    if (this.historyIndex < this.drawingHistory.length - 1) {
      this.historyIndex++;
      this.restoreState();
    }
  }

  private restoreState(): void {
    if (!this.isBrowser || this.drawingHistory.length === 0 || this.historyIndex < 0) return;
    
    try {
      const img = new Image();
      img.onload = () => {
        if (this.ctx) {
          this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
          this.ctx.drawImage(img, 0, 0);
        }
      };
      img.onerror = (error) => {
        console.error('Error loading canvas state:', error);
      };
      img.src = this.drawingHistory[this.historyIndex];
    } catch (error) {
      console.error('Error restoring canvas state:', error);
    }
  }

  @HostListener('document:keydown', ['$event'])
  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.isBrowser) return;
    
    try {
      if (event.ctrlKey && event.key === 'z') {
        event.preventDefault();
        this.undo();
      } else if (event.ctrlKey && event.key === 'y') {
        event.preventDefault();
        this.redo();
      }
    } catch (error) {
      console.error('Error handling keyboard event:', error);
    }
  }
}
