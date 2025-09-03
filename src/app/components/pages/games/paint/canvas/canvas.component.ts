import { Component, ElementRef, ViewChild, AfterViewInit, HostListener, OnDestroy, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GameTemplateComponent } from '../../../../game-template/game-template.component';

type Tool = 'pen' | 'eraser' | 'brush' | 'marker' | 'spray' | 'calligraphy';
type BrushShape = 'round' | 'square' | 'calligraphy';

interface DrawingState {
  tool: Tool;
  color: string;
  size: number;
  opacity: number;
  shape: BrushShape;
}

@Component({
  selector: 'app-canvas',
  standalone: true,
  imports: [CommonModule, FormsModule, GameTemplateComponent],
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.css']
})
export class CanvasComponent implements AfterViewInit, OnDestroy {
  @ViewChild('drawingCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('cursorElement', { static: false }) cursorElement!: ElementRef<HTMLDivElement>;
  
  private ctx!: CanvasRenderingContext2D;
  private isDrawing = false;
  private lastX = 0;
  private lastY = 0;
  private animationFrameId: number | null = null;
  
  // Drawing state
  drawingHistory: string[] = [];
  historyIndex: number = -1;
  private readonly MAX_HISTORY = 50;
  
  // Current drawing settings
  currentTool: Tool = 'pen';
  selectedColor: string = '#000000';
  brushSize: number = 5;
  opacity: number = 1;
  brushShape: BrushShape = 'round';
  
  // UI state
  showColorPalette = false;
  showBrushOptions = false;
  isFullscreen = false;
  hoveredSize: number | null = null;
  
  // Basic colors for the bottom palette
  basicColors = [
    '#ff0000', '#0000ff', '#00bfff', '#00ff00', '#00ffff', 
    '#ffff00', '#ffa500', '#ff69b4', '#dda0dd', '#d3d3d3', 
    '#808080', '#ffffff'
  ];
  
  // Brush presets
  brushPresets = [
    { name: 'Fine', size: 2, shape: 'round' as BrushShape },
    { name: 'Medium', size: 8, shape: 'round' as BrushShape },
    { name: 'Thick', size: 15, shape: 'round' as BrushShape },
    { name: 'Calligraphy', size: 10, shape: 'calligraphy' as BrushShape },
    { name: 'Marker', size: 12, shape: 'square' as BrushShape }
  ];
  
  private isBrowser: boolean;
  private pressure = 1; // For pressure sensitivity

  // Template helper
  get Math() {
    return Math;
  }

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    @Inject(PLATFORM_ID) private platformId: Object,
    private elementRef: ElementRef
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngAfterViewInit(): void {
    if (this.isBrowser) {
      this.setupCanvas();
      this.saveState();
      this.setupEventListeners();
      
      // Load image from query params if provided
      this.route.queryParams.subscribe(params => {
        if (params['image']) {
          const imageUrl = decodeURIComponent(params['image']);
          this.loadImageToCanvas(imageUrl);
        }
      });
    }
  }

  private setupCanvas(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d', { 
      willReadFrequently: true,
      alpha: true 
    })!;
    
    // Set canvas size immediately
    canvas.width = 600;
    canvas.height = 400;
    canvas.style.width = '600px';
    canvas.style.height = '400px';
    
    this.updateDrawingSettings();
  }

  @HostListener('window:resize')
  private resizeCanvas(): void {
    const canvas = this.canvasRef.nativeElement;
    
    // Set canvas size to match CSS dimensions
    canvas.width = 600;
    canvas.height = 400;
    
    // Set display size for crisp rendering
    canvas.style.width = '600px';
    canvas.style.height = '400px';
    
    this.updateDrawingSettings();
  }

  private updateDrawingSettings(): void {
    if (!this.ctx) return;
    
    this.ctx.lineCap = this.brushShape === 'square' ? 'square' : 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.globalAlpha = this.opacity;
    this.ctx.lineWidth = this.brushSize;
    
    if (this.currentTool === 'eraser') {
      this.ctx.globalCompositeOperation = 'destination-out';
    } else {
      this.ctx.globalCompositeOperation = 'source-over';
      this.ctx.strokeStyle = this.selectedColor;
      this.ctx.fillStyle = this.selectedColor;
    }
  }

  private setupEventListeners(): void {
    // Keyboard shortcuts
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    
    // Pressure sensitivity for supported devices
    if ('PointerEvent' in window) {
      this.canvasRef.nativeElement.addEventListener('pointerdown', this.handlePointerDown.bind(this));
      this.canvasRef.nativeElement.addEventListener('pointermove', this.handlePointerMove.bind(this));
      this.canvasRef.nativeElement.addEventListener('pointerup', this.handlePointerUp.bind(this));
    }
  }

  // Enhanced drawing methods with pressure sensitivity
  startDrawing(e: MouseEvent | TouchEvent | PointerEvent): void {
    e.preventDefault();
    this.isDrawing = true;
    
    const pos = this.getEventPosition(e);
    this.lastX = pos.x;
    this.lastY = pos.y;
    
    // Handle pressure sensitivity
    if ('pressure' in e && e.pressure !== undefined) {
      this.pressure = e.pressure;
      this.ctx.lineWidth = this.brushSize * this.pressure;
    }
    
    this.updateDrawingSettings();
    
    // Start path
    this.ctx.beginPath();
    this.ctx.moveTo(this.lastX, this.lastY);
    
    // Draw initial point for better responsiveness
    this.drawPoint(this.lastX, this.lastY);
  }

  draw(e: MouseEvent | TouchEvent | PointerEvent): void {
    if (!this.isDrawing) return;
    e.preventDefault();
    
    const pos = this.getEventPosition(e);
    
    // Handle pressure sensitivity
    if ('pressure' in e && e.pressure !== undefined) {
      this.pressure = e.pressure;
      this.ctx.lineWidth = this.brushSize * this.pressure;
    }
    
    this.updateDrawingSettings();
    
    // Draw based on tool
    switch (this.currentTool) {
      case 'spray':
        this.drawSpray(pos.x, pos.y);
        break;
      case 'calligraphy':
        this.drawCalligraphy(this.lastX, this.lastY, pos.x, pos.y);
        break;
      default:
        this.drawLine(this.lastX, this.lastY, pos.x, pos.y);
    }
    
    this.lastX = pos.x;
    this.lastY = pos.y;
  }

  stopDrawing(): void {
    if (this.isDrawing) {
      this.isDrawing = false;
      this.pressure = 1;
      this.saveState();
    }
  }

  private drawLine(x1: number, y1: number, x2: number, y2: number): void {
    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1);
    this.ctx.lineTo(x2, y2);
    this.ctx.stroke();
  }

  private drawPoint(x: number, y: number): void {
    this.ctx.beginPath();
    this.ctx.arc(x, y, this.ctx.lineWidth / 2, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private drawSpray(x: number, y: number): void {
    const density = 20;
    const radius = this.brushSize;
    
    for (let i = 0; i < density; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * radius;
      const sprayX = x + Math.cos(angle) * distance;
      const sprayY = y + Math.sin(angle) * distance;
      
      this.ctx.beginPath();
      this.ctx.arc(sprayX, sprayY, 1, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  private drawCalligraphy(x1: number, y1: number, x2: number, y2: number): void {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const width = this.brushSize;
    
    this.ctx.save();
    this.ctx.translate(x1, y1);
    this.ctx.rotate(angle);
    this.ctx.fillRect(0, -width / 2, Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2), width);
    this.ctx.restore();
  }

  private getEventPosition(e: MouseEvent | TouchEvent | PointerEvent): { x: number, y: number } {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    
    let clientX: number, clientY: number;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as MouseEvent | PointerEvent).clientX;
      clientY = (e as MouseEvent | PointerEvent).clientY;
    }
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }

  // Tool selection methods
  selectTool(tool: Tool): void {
    this.currentTool = tool;
    this.updateDrawingSettings();
    this.updateCursor();
  }

  setBrushSize(size: number): void {
    this.brushSize = Math.max(1, Math.min(100, size));
    this.updateDrawingSettings();
    this.updateCursor();
  }

  setOpacity(opacity: number): void {
    this.opacity = Math.max(0.1, Math.min(1, opacity));
    this.updateDrawingSettings();
  }

  setBrushShape(shape: BrushShape): void {
    this.brushShape = shape;
    this.updateDrawingSettings();
  }

  setColor(color: string): void {
    this.selectedColor = color;
    this.updateDrawingSettings();
    this.updateCursor();
  }

  selectPresetColor(color: string): void {
    this.setColor(color);
    this.showColorPalette = false;
  }

  selectBrushPreset(preset: any): void {
    this.brushSize = preset.size;
    this.brushShape = preset.shape;
    this.updateDrawingSettings();
    this.updateCursor();
    this.showBrushOptions = false;
  }

  // History management
  private saveState(): void {
    if (!this.isBrowser || !this.canvasRef?.nativeElement) return;
    
    try {
      const canvas = this.canvasRef.nativeElement;
      const state = canvas.toDataURL('image/png');
      
      // Remove future states if we're in the middle of history
      if (this.historyIndex < this.drawingHistory.length - 1) {
        this.drawingHistory = this.drawingHistory.slice(0, this.historyIndex + 1);
      }
      
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
      img.src = this.drawingHistory[this.historyIndex];
    } catch (error) {
      console.error('Error restoring canvas state:', error);
    }
  }

  // Canvas operations
  clearCanvas(): void {
    if (confirm('Are you sure you want to clear the canvas?')) {
      this.ctx.clearRect(0, 0, this.canvasRef.nativeElement.width, this.canvasRef.nativeElement.height);
      this.saveState();
    }
  }

  downloadImage(): void {
    if (!this.isBrowser) return;
    
    const canvas = this.canvasRef.nativeElement;
    
    // Create a new canvas for the final image with watermark
    const finalCanvas = document.createElement('canvas');
    const finalCtx = finalCanvas.getContext('2d')!;
    
    // Set final canvas size
    finalCanvas.width = canvas.width;
    finalCanvas.height = canvas.height;
    
    // Draw the original canvas
    finalCtx.drawImage(canvas, 0, 0);
    
    // Add watermark synchronously
    this.addWatermarkSync(finalCtx, finalCanvas.width, finalCanvas.height);
    
    // Convert to data URL and download
    const dataUrl = finalCanvas.toDataURL('image/png');
    
    const link = document.createElement('a');
    link.download = `painting-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = dataUrl;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  private addWatermark(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    // Create watermark image
    const watermarkCanvas = document.createElement('canvas');
    const watermarkCtx = watermarkCanvas.getContext('2d')!;
    
    // Set watermark canvas size
    const watermarkSize = Math.min(width, height) * 0.2; // 20% of canvas size
    watermarkCanvas.width = watermarkSize;
    watermarkCanvas.height = watermarkSize;
    
    // Draw watermark background (semi-transparent circle)
    watermarkCtx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    watermarkCtx.beginPath();
    watermarkCtx.arc(watermarkSize / 2, watermarkSize / 2, watermarkSize / 2, 0, Math.PI * 2);
    watermarkCtx.fill();
    
    // Draw watermark border
    watermarkCtx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    watermarkCtx.lineWidth = 2;
    watermarkCtx.stroke();
    
    // Load and draw logo image
    const logoImg = new Image();
    logoImg.crossOrigin = 'anonymous';
    logoImg.onload = () => {
      // Calculate logo size (60% of watermark size)
      const logoSize = watermarkSize * 0.6;
      const logoX = (watermarkSize - logoSize) / 2;
      const logoY = (watermarkSize - logoSize) / 2 - watermarkSize * 0.05;
      
      // Draw logo
      watermarkCtx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
      
      // Add text below logo
      watermarkCtx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      watermarkCtx.font = `bold ${watermarkSize * 0.12}px Arial`;
      watermarkCtx.textAlign = 'center';
      watermarkCtx.textBaseline = 'middle';
      watermarkCtx.fillText('PATARIF', watermarkSize / 2, watermarkSize / 2 + watermarkSize * 0.25);
      
      // Add smaller text
      watermarkCtx.font = `${watermarkSize * 0.08}px Arial`;
      watermarkCtx.fillText('GAMING', watermarkSize / 2, watermarkSize / 2 + watermarkSize * 0.35);
      
      // Position watermark in bottom-right corner
      const margin = watermarkSize * 0.1;
      const x = width - watermarkSize - margin;
      const y = height - watermarkSize - margin;
      
      // Draw watermark on final canvas
      ctx.drawImage(watermarkCanvas, x, y);
    };
    
    logoImg.onerror = () => {
      // Fallback to text-only watermark if image fails to load
      watermarkCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      watermarkCtx.font = `bold ${watermarkSize * 0.15}px Arial`;
      watermarkCtx.textAlign = 'center';
      watermarkCtx.textBaseline = 'middle';
      watermarkCtx.fillText('PATARIF', watermarkSize / 2, watermarkSize / 2 - watermarkSize * 0.05);
      
      watermarkCtx.font = `${watermarkSize * 0.08}px Arial`;
      watermarkCtx.fillText('GAMING', watermarkSize / 2, watermarkSize / 2 + watermarkSize * 0.08);
      
      // Position watermark in bottom-right corner
      const margin = watermarkSize * 0.1;
      const x = width - watermarkSize - margin;
      const y = height - watermarkSize - margin;
      
      // Draw watermark on final canvas
      ctx.drawImage(watermarkCanvas, x, y);
    };
    
    // Set image source
    logoImg.src = '/images/PataUG1.svg';
  }

  private addWatermarkSync(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const watermarkSize = Math.min(width, height) * 0.2;
    const margin = watermarkSize * 0.1;
    const x = width - watermarkSize - margin;
    const y = height - watermarkSize - margin;
  
    // Background circle
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(x + watermarkSize / 2, y + watermarkSize / 2, watermarkSize / 2, 0, Math.PI * 2);
    ctx.fill();
  
    // Border
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
  
    // --- Load and draw logo ---
    const logoImg = new Image();
    logoImg.src = '/images/logo-patarif.png';
    logoImg.onload = () => {
      const logoSize = watermarkSize * 0.6;
      const logoX = x + (watermarkSize - logoSize) / 2;
      const logoY = y + (watermarkSize - logoSize) / 2 - watermarkSize * 0.1;
  
      ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
  
      // Add text below logo
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.font = `bold ${watermarkSize * 0.12}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('PATARIF', x + watermarkSize / 2, y + watermarkSize / 2 + watermarkSize * 0.25);
  
      ctx.font = `${watermarkSize * 0.08}px Arial`;
      ctx.fillText('GAMING', x + watermarkSize / 2, y + watermarkSize / 2 + watermarkSize * 0.35);
    };
  
    logoImg.onerror = () => {
      // fallback: only text
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.font = `bold ${watermarkSize * 0.15}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('PATARIF', x + watermarkSize / 2, y + watermarkSize / 2);
    };
  }
  

  toggleFullscreen(): void {
    if (!document.fullscreenElement) {
      this.canvasRef.nativeElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  // Image loading
  private loadImageToCanvas(imageUrl: string): void {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = this.canvasRef.nativeElement;
      this.ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const hRatio = canvas.width / img.width;
      const vRatio = canvas.height / img.height;
      const ratio = Math.min(hRatio, vRatio, 1);
      
      const centerX = (canvas.width - img.width * ratio) / 2;
      const centerY = (canvas.height - img.height * ratio) / 2;
      
      this.ctx.drawImage(
        img, 
        0, 0, img.width, img.height,
        centerX, centerY, 
        img.width * ratio, 
        img.height * ratio
      );
      
      this.saveState();
    };
    img.src = imageUrl;
  }

  // Cursor management
  private updateCursor(): void {
    if (!this.cursorElement?.nativeElement) return;
    
    const cursor = this.cursorElement.nativeElement;
    const size = this.brushSize;
    
    cursor.style.width = `${size}px`;
    cursor.style.height = `${size}px`;
    
    if (this.currentTool === 'eraser') {
      cursor.className = 'cursor eraser';
      cursor.style.border = '2px solid #ff0000';
      cursor.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
    } else {
      cursor.className = 'cursor pen';
      cursor.style.backgroundColor = this.selectedColor;
      cursor.style.border = 'none';
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
    
    if (
      clientX >= rect.left &&
      clientX <= rect.right &&
      clientY >= rect.top &&
      clientY <= rect.bottom
    ) {
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      
      const cursor = this.cursorElement.nativeElement;
      cursor.style.left = `${Math.round(x)}px`;
      cursor.style.top = `${Math.round(y)}px`;
      cursor.style.display = 'block';
    } else {
      this.hideCursor();
    }
  }

  private hideCursor(): void {
    if (this.cursorElement?.nativeElement) {
      this.cursorElement.nativeElement.style.display = 'none';
    }
  }

  // Pointer events for pressure sensitivity
  private handlePointerDown(e: PointerEvent): void {
    this.startDrawing(e);
  }

  private handlePointerMove(e: PointerEvent): void {
    this.draw(e);
  }

  private handlePointerUp(e: PointerEvent): void {
    this.stopDrawing();
  }

  // Keyboard shortcuts
  @HostListener('document:keydown', ['$event'])
  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.isBrowser) return;
    
    try {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'z':
            event.preventDefault();
            if (event.shiftKey) {
              this.redo();
            } else {
              this.undo();
            }
            break;
          case 'y':
            event.preventDefault();
            this.redo();
            break;
          case 's':
            event.preventDefault();
            this.downloadImage();
            break;
        }
      }
      
      // Tool shortcuts
      switch (event.key) {
        case 'b':
          this.selectTool('brush');
          break;
        case 'e':
          this.selectTool('eraser');
          break;
        case 'p':
          this.selectTool('pen');
          break;
        case 'm':
          this.selectTool('marker');
          break;
        case 's':
          if (!event.ctrlKey && !event.metaKey) {
            this.selectTool('spray');
          }
          break;
      }
    } catch (error) {
      console.error('Error handling keyboard event:', error);
    }
  }

  openColorPicker(): void {
    const colorPicker = document.querySelector('.hidden-color-picker') as HTMLInputElement;
    if (colorPicker) {
      colorPicker.click();
    }
  }

  goBack(): void {
    this.router.navigate(['/gallery']);
  }

  ngOnDestroy(): void {
    if (this.isBrowser) {
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
      }
      window.removeEventListener('keydown', this.handleKeyDown.bind(this));
    }
  }
}