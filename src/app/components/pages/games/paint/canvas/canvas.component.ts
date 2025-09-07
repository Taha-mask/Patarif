import { Component, ElementRef, ViewChild, AfterViewInit, HostListener, OnDestroy, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GameTemplateComponent } from '../../../../game-template/game-template.component';
import jsPDF from 'jspdf';

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
  private resizeTimeout: any = null;

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

  // Zoom state
  zoomLevel: number = 1;
  readonly MIN_ZOOM = 0.1;
  readonly MAX_ZOOM = 5;
  private readonly ZOOM_STEP = 0.1;

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
      this.preloadLogo().catch(() => { });

      this.setupCanvas();
      this.saveState();
      this.setupEventListeners();

      // Load image from query params if provided
      this.route.queryParams.subscribe(params => {
        if (params['imageUrl']) {
          const imageUrl = decodeURIComponent(params['imageUrl']);
          this.loadImageToCanvas(imageUrl);
        }
      });
    }
  }

  private setupCanvas() {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    this.updateCanvasSize();
    this.updateDrawingSettings();
  }

  private updateCanvasSize() {
    const canvas = this.canvasRef.nativeElement;
    const container = canvas.parentElement!;

    // حفظ المحتوى الحالي قبل تغيير الحجم
    const currentImageData = this.ctx ? this.ctx.getImageData(0, 0, canvas.width, canvas.height) : null;

    // Set canvas display size (CSS)
    canvas.style.width = '100%';
    canvas.style.height = '100%';

    // Set canvas drawing buffer size
    const newWidth = container.clientWidth;
    const newHeight = container.clientHeight;

    // تحديث حجم الكانفاس
    canvas.width = newWidth;
    canvas.height = newHeight;

    // إعادة تطبيق إعدادات الرسم
    this.updateDrawingSettings();

    // إعادة رسم المحتوى المحفوظ إذا كان موجوداً
    if (currentImageData && this.ctx) {
      // إنشاء canvas مؤقت لرسم المحتوى القديم
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d')!;
      tempCanvas.width = currentImageData.width;
      tempCanvas.height = currentImageData.height;
      tempCtx.putImageData(currentImageData, 0, 0);

      // رسم المحتوى القديم على الكانفاس الجديد مع الحفاظ على النسب
      const scaleX = newWidth / currentImageData.width;
      const scaleY = newHeight / currentImageData.height;
      const scale = Math.min(scaleX, scaleY, 1); // لا نكبر أكثر من الحجم الأصلي

      const scaledWidth = currentImageData.width * scale;
      const scaledHeight = currentImageData.height * scale;
      const offsetX = (newWidth - scaledWidth) / 2;
      const offsetY = (newHeight - scaledHeight) / 2;

      this.ctx.drawImage(tempCanvas, offsetX, offsetY, scaledWidth, scaledHeight);

      // إعادة رسم الصورة الخلفية إذا كانت موجودة
      if (this.backgroundImage) {
        this.drawBackgroundImage();
      }
    }
  }


  @HostListener('window:resize')
  private onResize(): void {
    // استخدام debounce لتجنب استدعاءات متكررة
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }

    this.resizeTimeout = setTimeout(() => {
      this.updateCanvasSize();
      // لا نحتاج لاستدعاء restoreState() لأن updateCanvasSize() يتعامل مع المحتوى
    }, 100);
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

    // إعادة رسم الصورة فوق التلوين
    this.redrawImageOverDrawing();
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

    // إعادة رسم الصورة فوق التلوين
    this.redrawImageOverDrawing();
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

    // حساب الموضع مع مراعاة التكبير
    const x = (clientX - rect.left) / this.zoomLevel;
    const y = (clientY - rect.top) / this.zoomLevel;

    return { x, y };
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

  clearCanvas(): void {
    if (confirm('Are you sure you want to clear the canvas?')) {
      // مسح الكانفاس بالكامل
      this.ctx.clearRect(0, 0, this.canvasRef.nativeElement.width, this.canvasRef.nativeElement.height);

      // إذا كانت هناك صورة خلفية، ارسمها
      if (this.backgroundImage) {
        this.drawBackgroundImage();
      }

      this.saveState();
    }
  }

  isAppeared = false;

  async downloadImage(): Promise<void> {
    if (!this.isBrowser) return;

    const canvas = this.canvasRef.nativeElement;

    // نعمل نسخة جديدة من الكانڤاس
    const finalCanvas = document.createElement('canvas');
    const finalCtx = finalCanvas.getContext('2d')!;

    finalCanvas.width = canvas.width;
    finalCanvas.height = canvas.height;

    // خلفية بيضاء
    finalCtx.fillStyle = '#ffffff';
    finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

    // الرسم الأصلي
    finalCtx.drawImage(canvas, 0, 0);

    // ✅ اللوجو يظهر فقط وقت التحميل
    this.isAppeared = true;
    if (this.isAppeared) {
      await this.addWatermarkToContext(finalCtx, finalCanvas.width, finalCanvas.height);
    }
    this.isAppeared = false;

    // ناخد الصورة باللوجو
    const dataUrl = finalCanvas.toDataURL('image/png');

    // نعمل لينك للتحميل
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `painting-${new Date().toISOString().slice(0, 10)}.png`;
    link.click();
  }


  async downloadPDF(): Promise<void> {
    if (!this.isBrowser) return;

    const canvas = this.canvasRef.nativeElement;

    // نسخة جديدة من الكانڤاس
    const finalCanvas = document.createElement('canvas');
    const finalCtx = finalCanvas.getContext('2d')!;
    finalCanvas.width = canvas.width;
    finalCanvas.height = canvas.height;

    // خلفية بيضاء
    finalCtx.fillStyle = '#ffffff';
    finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

    // الرسم الأصلي
    finalCtx.drawImage(canvas, 0, 0);

    // ✅ هنا نفعل الظهور مؤقت
    this.isAppeared = true;
    if (this.isAppeared) {
      await this.addWatermarkToContext(finalCtx, finalCanvas.width, finalCanvas.height);
    }
    this.isAppeared = false;

    // نحول لصورة
    const dataUrl = finalCanvas.toDataURL('image/png');

    // نضيف للصورة في PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const a4Width = 210;
    const a4Height = 297;
    const margin = 10;
    const contentWidth = a4Width - margin * 2;
    const contentHeight = a4Height - margin * 2;

    const imgRatio = finalCanvas.width / finalCanvas.height;
    const contentRatio = contentWidth / contentHeight;

    let w, h, x, y;
    if (imgRatio > contentRatio) {
      w = contentWidth;
      h = contentWidth / imgRatio;
      x = margin;
      y = margin + (contentHeight - h) / 2;
    } else {
      h = contentHeight;
      w = contentHeight * imgRatio;
      x = margin + (contentWidth - w) / 2;
      y = margin;
    }

    pdf.addImage(dataUrl, 'PNG', x, y, w, h);

    // نعمل داونلود
    const fileName = `painting-${new Date().toISOString().slice(0, 10)}.pdf`;
    pdf.save(fileName);
  }



  private async addWatermarkToContext(ctx: CanvasRenderingContext2D, width: number, height: number): Promise<void> {
    const watermarkSize = Math.min(width, height) * 0.2;
    const margin = watermarkSize * 0.1;
    const x = width - watermarkSize - margin;
    const y = height - watermarkSize - margin;

    // الخلفية الدائرية
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.beginPath();
    ctx.arc(x + watermarkSize / 2, y + watermarkSize / 2, watermarkSize / 2, 0, Math.PI * 2);
    ctx.fill();

    // الحدود
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = Math.max(2, watermarkSize * 0.02);
    ctx.stroke();

    // نضمن تحميل اللوجو قبل الرسم
    await this.preloadLogo();

    if (this.logoLoaded && this.logoImg) {
      const logoSize = watermarkSize * 0.6;
      const logoX = x + (watermarkSize - logoSize) / 2;
      const logoY = y + (watermarkSize - logoSize) / 2 - watermarkSize * 0.08;
      ctx.drawImage(this.logoImg, logoX, logoY, logoSize, logoSize);


    } else {
      // fallback: نص فقط
      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      ctx.font = `bold ${Math.max(12, watermarkSize * 0.12)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('PATARIF', x + watermarkSize / 2, y + watermarkSize / 2);
    }

    ctx.restore();
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

  private addPDFWatermark(pdf: jsPDF, width: number, height: number): void {
    // Watermark size in mm (proportional to A4)
    const watermarkSize = Math.min(width, height) * 0.15; // 15% of page size
    const margin = 5; // 5mm margin
    const x = width - watermarkSize - margin;
    const y = height - watermarkSize - margin;

    // Create a temporary canvas for the watermark
    const watermarkCanvas = document.createElement('canvas');
    const watermarkCtx = watermarkCanvas.getContext('2d')!;

    // Set canvas size (convert mm to pixels, assuming 96 DPI)
    const dpi = 96;
    const mmToPx = dpi / 25.4;
    const canvasSize = watermarkSize * mmToPx;
    watermarkCanvas.width = canvasSize;
    watermarkCanvas.height = canvasSize;

    // Draw watermark background (semi-transparent circle)
    watermarkCtx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    watermarkCtx.beginPath();
    watermarkCtx.arc(canvasSize / 2, canvasSize / 2, canvasSize / 2, 0, Math.PI * 2);
    watermarkCtx.fill();

    // Draw watermark border
    watermarkCtx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    watermarkCtx.lineWidth = 2;
    watermarkCtx.stroke();

    // Load and draw logo
    const logoImg = new Image();
    logoImg.crossOrigin = 'anonymous';
    logoImg.onload = () => {
      // Calculate logo size (60% of watermark size)
      const logoSize = canvasSize * 0.6;
      const logoX = (canvasSize - logoSize) / 2;
      const logoY = (canvasSize - logoSize) / 2 - canvasSize * 0.05;

      // Draw logo
      watermarkCtx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);

      // Add text below logo
      watermarkCtx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      watermarkCtx.font = `bold ${canvasSize * 0.12}px Arial`;
      watermarkCtx.textAlign = 'center';
      watermarkCtx.textBaseline = 'middle';
      watermarkCtx.fillText('PATARIF', canvasSize / 2, canvasSize / 2 + canvasSize * 0.25);

      // Add smaller text
      watermarkCtx.font = `${canvasSize * 0.08}px Arial`;
      watermarkCtx.fillText('GAMING', canvasSize / 2, canvasSize / 2 + canvasSize * 0.35);

      // Convert canvas to data URL and add to PDF
      const watermarkDataUrl = watermarkCanvas.toDataURL('image/png');
      pdf.addImage(watermarkDataUrl, 'PNG', x, y, watermarkSize, watermarkSize);
    };

    logoImg.onerror = () => {
      // Fallback to text-only watermark if image fails to load
      watermarkCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      watermarkCtx.font = `bold ${canvasSize * 0.15}px Arial`;
      watermarkCtx.textAlign = 'center';
      watermarkCtx.textBaseline = 'middle';
      watermarkCtx.fillText('PATARIF', canvasSize / 2, canvasSize / 2 - canvasSize * 0.05);

      watermarkCtx.font = `${canvasSize * 0.08}px Arial`;
      watermarkCtx.fillText('GAMING', canvasSize / 2, canvasSize / 2 + canvasSize * 0.08);

      // Convert canvas to data URL and add to PDF
      const watermarkDataUrl = watermarkCanvas.toDataURL('image/png');
      pdf.addImage(watermarkDataUrl, 'PNG', x, y, watermarkSize, watermarkSize);
    };

    // Set image source
    logoImg.src = '/images/logo-patarif.png';
  }


  toggleFullscreen(): void {
    if (!document.fullscreenElement) {
      this.canvasRef.nativeElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  // Image loading with error handling
  isLoading = false;
  loadError = '';



  // Cursor management
  private updateCursor(): void {
    if (!this.cursorElement?.nativeElement) return;

    const cursor = this.cursorElement.nativeElement;
    // تطبيق التكبير على حجم المؤشر
    const size = this.brushSize * this.zoomLevel;

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

  onMouseEnter(): void {
    // إعادة تحديث المؤشر عند العودة للكانفاس
    this.updateCursor();
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
      // حساب الموضع مع مراعاة التكبير
      const x = (clientX - rect.left) / this.zoomLevel;
      const y = (clientY - rect.top) / this.zoomLevel;

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

      // Zoom shortcuts
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case '=':
          case '+':
            event.preventDefault();
            this.zoomIn();
            break;
          case '-':
            event.preventDefault();
            this.zoomOut();
            break;
          case '0':
            event.preventDefault();
            this.resetZoom();
            break;
        }
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

  // Zoom functionality
  zoomIn(): void {
    this.zoomLevel = Math.min(this.zoomLevel + this.ZOOM_STEP, this.MAX_ZOOM);
    this.applyZoom();
  }

  zoomOut(): void {
    this.zoomLevel = Math.max(this.zoomLevel - this.ZOOM_STEP, this.MIN_ZOOM);
    this.applyZoom();
  }

  resetZoom(): void {
    this.zoomLevel = 1;
    this.applyZoom();
  }

  private applyZoom(): void {
    const canvas = this.canvasRef.nativeElement;
    const canvasWrapper = canvas.parentElement;

    if (canvasWrapper) {
      // Apply zoom transform to the canvas wrapper
      canvasWrapper.style.transform = `scale(${this.zoomLevel})`;
      canvasWrapper.style.transformOrigin = 'center center';

      // Update cursor size and position based on zoom level
      this.updateCursor();
    }
  }

  getZoomPercentage(): number {
    return Math.round(this.zoomLevel * 100);
  }

  goBack(): void {
    this.router.navigate(['/gallery']);
  }

  ngOnDestroy(): void {
    if (this.isBrowser) {
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
      }
      if (this.resizeTimeout) {
        clearTimeout(this.resizeTimeout);
      }
      window.removeEventListener('keydown', this.handleKeyDown.bind(this));
    }
  }

  private backgroundImage: HTMLImageElement | null = null;

  private loadImageToCanvas(imageUrl: string): void {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      this.backgroundImage = img; // خزّن الصورة
      // مسح الكانفاس أولاً ثم رسم الصورة
      this.ctx.clearRect(0, 0, this.canvasRef.nativeElement.width, this.canvasRef.nativeElement.height);
      this.drawBackgroundImage();
      this.saveState();
    };
    img.src = imageUrl;
  }

  private drawBackgroundImage(): void {
    if (!this.backgroundImage) return;
    const canvas = this.canvasRef.nativeElement;
    const ctx = this.ctx;

    const img = this.backgroundImage;
    const hRatio = canvas.width / img.width;
    const vRatio = canvas.height / img.height;
    const ratio = Math.min(hRatio, vRatio, 1);

    const centerX = (canvas.width - img.width * ratio) / 2;
    const centerY = (canvas.height - img.height * ratio) / 2;

    // رسم الصورة الخلفية مع الحفاظ على النسب
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(img, 0, 0, img.width, img.height, centerX, centerY, img.width * ratio, img.height * ratio);
    ctx.restore();
  }

  private redrawImageOverDrawing(): void {
    if (!this.backgroundImage) return;
    const canvas = this.canvasRef.nativeElement;
    const ctx = this.ctx;

    const img = this.backgroundImage;
    const hRatio = canvas.width / img.width;
    const vRatio = canvas.height / img.height;
    const ratio = Math.min(hRatio, vRatio, 1);

    const centerX = (canvas.width - img.width * ratio) / 2;
    const centerY = (canvas.height - img.height * ratio) / 2;

    // رسم الصورة فوق التلوين مع الحفاظ على النسب
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(img, 0, 0, img.width, img.height, centerX, centerY, img.width * ratio, img.height * ratio);
    ctx.restore();
  }

  // properties
  private logoImg: HTMLImageElement | null = null;
  private logoLoaded = false;

  // استعمل عند الـ ngAfterViewInit لتحميل الشعار مبكراً
  private preloadLogo(): Promise<void> {
    if (this.logoLoaded) return Promise.resolve();
    return new Promise((resolve) => {
      this.logoImg = new Image();
      this.logoImg.crossOrigin = 'anonymous';
      this.logoImg.src = '/images/logo-patarif.png';
      this.logoImg.onload = () => {
        this.logoLoaded = true;
        resolve();
      };
      this.logoImg.onerror = () => {
        console.warn('Logo failed to load, will fallback to text watermark.');
        this.logoLoaded = false;
        resolve();
      };
    });
  }


}