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
  @ViewChild('backgroundCanvas', { static: false }) backgroundCanvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('cursorElement', { static: false }) cursorElement!: ElementRef<HTMLDivElement>;
  
  private ctx!: CanvasRenderingContext2D;
  private backgroundCtx!: CanvasRenderingContext2D;
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
  
  // Panning state
  private isPanning = false;
  private panStartX = 0;
  private panStartY = 0;
  private panOffsetX = 0;
  private panOffsetY = 0;
  private lastPanX = 0;
  private lastPanY = 0;
  private isSpacePressed = false;
  
  // Touch gesture state
  private isZooming = false;
  private initialDistance = 0;
  private initialZoom = 1;
  private lastTouchCenter = { x: 0, y: 0 };
  private touchStartTime = 0;
  
  // Trackpad gesture state
  private isTrackpadZooming = false;
  private trackpadZoomStartTime = 0;
  private lastWheelTime = 0;
  private wheelAccumulator = 0;
  private trackpadZoomTimeout: any = null;
  private readonly WHEEL_ZOOM_SENSITIVITY = 0.01;
  private readonly WHEEL_ZOOM_THRESHOLD = 0.1;
  private readonly TRACKPAD_ZOOM_TIMEOUT = 150; // ms
  
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
      this.initializeHistory();
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
    
    // إنشاء canvas للخلفية إذا كان موجود في template
    if (this.backgroundCanvasRef?.nativeElement) {
      const backgroundCanvas = this.backgroundCanvasRef.nativeElement;
      this.backgroundCtx = backgroundCanvas.getContext('2d')!;
    }
    
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

    // تحديث حجم الكانفاس الرئيسي
    canvas.width = newWidth;
    canvas.height = newHeight;

    // تحديث حجم background canvas إذا كان موجود
    if (this.backgroundCanvasRef?.nativeElement) {
      const backgroundCanvas = this.backgroundCanvasRef.nativeElement;
      backgroundCanvas.width = newWidth;
      backgroundCanvas.height = newHeight;
      backgroundCanvas.style.width = '100%';
      backgroundCanvas.style.height = '100%';
    }

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
      
      // إعادة رسم الصورة الخلفية على background canvas
      if (this.backgroundImage) {
        this.drawBackgroundImage();
      }
    } else if (this.backgroundImage) {
      // إذا لم يكن هناك محتوى محفوظ ولكن هناك صورة خلفية، ارسمها
      this.drawBackgroundImage();
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
      // 🔥 في Layer System، الممحاة تشتغل عادي على layer الرسم فقط
      this.ctx.globalCompositeOperation = 'destination-out';
    } else {
      this.ctx.globalCompositeOperation = 'source-over';
      this.ctx.strokeStyle = this.selectedColor;
      this.ctx.fillStyle = this.selectedColor;
    }
  }

  private updateDrawingSettingsForContext(ctx: CanvasRenderingContext2D): void {
    ctx.lineCap = this.brushShape === 'square' ? 'square' : 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = this.opacity;
    ctx.lineWidth = this.brushSize * this.pressure;
    
    if (this.currentTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = this.selectedColor;
      ctx.fillStyle = this.selectedColor;
    }
  }

  private setupEventListeners(): void {
    // Keyboard shortcuts
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    
    // Trackpad wheel events for zoom
    this.canvasRef.nativeElement.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });
    
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
    
    // Prevent context menu on right-click
    if ('button' in e && e.button === 2) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Check if we should start panning instead of drawing
    if (this.shouldStartPanning(e)) {
      this.startPanning(e);
      return;
    }
    
    this.isDrawing = true;
    
    const pos = this.getEventPosition(e);
    this.lastX = pos.x;
    this.lastY = pos.y;
    
    // Handle pressure sensitivity
    if ('pressure' in e && e.pressure !== undefined) {
      this.pressure = e.pressure;
    }
    
    // الرسم على background canvas مباشرة
    if (this.backgroundCtx) {
      this.updateDrawingSettingsForContext(this.backgroundCtx);
      
      // Start path
      this.backgroundCtx.beginPath();
      this.backgroundCtx.moveTo(this.lastX, this.lastY);
      
      // Draw initial point for better responsiveness
      this.drawPointOnContext(this.backgroundCtx, this.lastX, this.lastY);
    }
    
    // تحديث العرض المباشر
    this.updateDisplay();
  }

  draw(e: MouseEvent | TouchEvent | PointerEvent): void {
    e.preventDefault();
    
    // Handle panning if we're in pan mode
    if (this.isPanning) {
      this.handlePanning(e);
      return;
    }
    
    if (!this.isDrawing) return;
    
    const pos = this.getEventPosition(e);
    
    if ('pressure' in e && e.pressure !== undefined) {
      this.pressure = e.pressure;
      this.ctx.lineWidth = this.brushSize * this.pressure;
    }
    
    // الرسم على background canvas مباشرة
    if (this.backgroundCtx) {
      this.updateDrawingSettingsForContext(this.backgroundCtx);
      
      switch (this.currentTool) {
        case 'spray':
          this.drawSprayOnContext(this.backgroundCtx, pos.x, pos.y);
          break;
        case 'calligraphy':
          this.drawCalligraphyOnContext(this.backgroundCtx, this.lastX, this.lastY, pos.x, pos.y);
          break;
        default:
          this.drawLineOnContext(this.backgroundCtx, this.lastX, this.lastY, pos.x, pos.y);
      }
    }
    
    this.lastX = pos.x;
    this.lastY = pos.y;
    
    // تحديث العرض المباشر
    this.updateDisplay();
  }

  stopDrawing(): void {
    if (this.isDrawing) {
      this.isDrawing = false;
      this.pressure = 1;
      
      // تحديث العرض النهائي
      this.updateDisplay();
      
      this.saveState();
    }
    
    // Stop panning if we were panning
    if (this.isPanning) {
      this.stopPanning();
    }
  }

  private drawLine(x1: number, y1: number, x2: number, y2: number): void {
    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1);
    this.ctx.lineTo(x2, y2);
    this.ctx.stroke();
  }

  private drawLineOnContext(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number): void {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  private drawPoint(x: number, y: number): void {
    this.ctx.beginPath();
    this.ctx.arc(x, y, this.ctx.lineWidth / 2, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private drawPointOnContext(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.beginPath();
    ctx.arc(x, y, ctx.lineWidth / 2, 0, Math.PI * 2);
    ctx.fill();
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

  private drawSprayOnContext(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    const density = 20;
    const radius = this.brushSize;
    
    for (let i = 0; i < density; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * radius;
      const sprayX = x + Math.cos(angle) * distance;
      const sprayY = y + Math.sin(angle) * distance;
      
      ctx.beginPath();
      ctx.arc(sprayX, sprayY, 1, 0, Math.PI * 2);
      ctx.fill();
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

  private drawCalligraphyOnContext(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number): void {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const width = this.brushSize;
    
    ctx.save();
    ctx.translate(x1, y1);
    ctx.rotate(angle);
    ctx.fillRect(0, -width / 2, Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2), width);
    ctx.restore();
  }

  // ===== PANNING METHODS =====
  private shouldStartPanning(e: MouseEvent | TouchEvent | PointerEvent): boolean {
    // Start panning if:
    // 1. Right mouse button is pressed (always allow right-click pan)
    // 2. Middle mouse button is pressed AND we're zoomed in
    // 3. Spacebar is held AND we're zoomed in
    const isZoomed = this.zoomLevel > 1;
    const isMiddleButton = 'button' in e && e.button === 1; // Middle mouse button
    const isRightButton = 'button' in e && e.button === 2; // Right mouse button
    
    // Right-click always allows panning (even at 100% zoom)
    if (isRightButton) return true;
    
    // Other methods require zoom
    return isZoomed && (isMiddleButton || this.isSpacePressed);
  }

  private startPanning(e: MouseEvent | TouchEvent | PointerEvent): void {
    this.isPanning = true;
    this.isDrawing = false; // Stop any drawing
    
    // Prevent context menu and default behavior
    e.preventDefault();
    e.stopPropagation();
    
    const pos = this.getEventPosition(e);
    this.panStartX = pos.x;
    this.panStartY = pos.y;
    this.lastPanX = pos.x;
    this.lastPanY = pos.y;
    
    // Add panning CSS classes
    this.addPanningClasses();
    
    // Change cursor to indicate panning
    this.updatePanningCursor();
    
    // Add event listeners for mouse up to stop panning
    this.addPanningEventListeners();
  }

  private handlePanning(e: MouseEvent | TouchEvent | PointerEvent): void {
    if (!this.isPanning) return;
    
    const pos = this.getEventPosition(e);
    const deltaX = pos.x - this.lastPanX;
    const deltaY = pos.y - this.lastPanY;
    
    // Update pan offset
    this.panOffsetX += deltaX;
    this.panOffsetY += deltaY;
    
    // Apply pan transform
    this.applyPanTransform();
    
    this.lastPanX = pos.x;
    this.lastPanY = pos.y;
  }

  private stopPanning(): void {
    this.isPanning = false;
    
    // Remove panning CSS classes
    this.removePanningClasses();
    
    // Remove event listeners
    this.removePanningEventListeners();
    
    // Hide visual feedback
    this.hidePanningFeedback();
    
    this.updateCursor(); // Reset to normal cursor
  }

  private applyPanTransform(): void {
    const canvas = this.canvasRef.nativeElement;
    const canvasWrapper = canvas.parentElement;
    
    if (canvasWrapper) {
      // Apply both zoom and pan transforms
      const transform = `scale(${this.zoomLevel}) translate(${this.panOffsetX}px, ${this.panOffsetY}px)`;
      canvasWrapper.style.transform = transform;
      canvasWrapper.style.transformOrigin = 'center center';
    }
  }

  private updatePanningCursor(): void {
    if (this.cursorElement?.nativeElement) {
      const cursor = this.cursorElement.nativeElement;
      cursor.style.cursor = 'grab';
      cursor.style.display = 'none'; // Hide custom cursor during panning
    }
    
    // Update canvas cursor
    const canvas = this.canvasRef.nativeElement;
    canvas.style.cursor = 'grab';
    
    // Add visual feedback for right-click panning
    this.showPanningFeedback();
  }

  private showPanningFeedback(): void {
    // Add a subtle visual indicator that panning is active
    const canvas = this.canvasRef.nativeElement;
    const canvasWrapper = canvas.parentElement;
    
    if (canvasWrapper) {
      canvasWrapper.style.boxShadow = '0 0 20px rgba(255, 68, 68, 0.3)';
      canvasWrapper.style.borderColor = '#ff4444';
    }
  }

  private hidePanningFeedback(): void {
    // Remove visual feedback
    const canvas = this.canvasRef.nativeElement;
    const canvasWrapper = canvas.parentElement;
    
    if (canvasWrapper) {
      canvasWrapper.style.boxShadow = '';
      canvasWrapper.style.borderColor = '';
    }
  }

  private addPanningClasses(): void {
    const canvas = this.canvasRef.nativeElement;
    const canvasWrapper = canvas.parentElement;
    
    if (canvasWrapper) {
      canvasWrapper.classList.add('panning');
      // Add right-click specific class for visual feedback
      canvasWrapper.classList.add('right-click-panning');
    }
    canvas.classList.add('panning');
    canvas.classList.add('right-click-panning');
  }

  private removePanningClasses(): void {
    const canvas = this.canvasRef.nativeElement;
    const canvasWrapper = canvas.parentElement;
    
    if (canvasWrapper) {
      canvasWrapper.classList.remove('panning');
      canvasWrapper.classList.remove('right-click-panning');
    }
    canvas.classList.remove('panning');
    canvas.classList.remove('right-click-panning');
  }

  private addZoomingClasses(): void {
    const canvas = this.canvasRef.nativeElement;
    const canvasWrapper = canvas.parentElement;
    
    if (canvasWrapper) {
      canvasWrapper.classList.add('zooming');
      // Add trackpad specific class if it's trackpad zoom
      if (this.isTrackpadZooming) {
        canvasWrapper.classList.add('trackpad-zooming');
      }
    }
    canvas.classList.add('zooming');
    if (this.isTrackpadZooming) {
      canvas.classList.add('trackpad-zooming');
    }
  }

  private removeZoomingClasses(): void {
    const canvas = this.canvasRef.nativeElement;
    const canvasWrapper = canvas.parentElement;
    
    if (canvasWrapper) {
      canvasWrapper.classList.remove('zooming');
      canvasWrapper.classList.remove('trackpad-zooming');
    }
    canvas.classList.remove('zooming');
    canvas.classList.remove('trackpad-zooming');
  }

  private addPanningEventListeners(): void {
    // Add global mouse up listener to stop panning
    document.addEventListener('mouseup', this.handleGlobalMouseUp.bind(this));
    document.addEventListener('contextmenu', this.handleContextMenu.bind(this));
  }

  private removePanningEventListeners(): void {
    // Remove global mouse up listener
    document.removeEventListener('mouseup', this.handleGlobalMouseUp.bind(this));
    document.removeEventListener('contextmenu', this.handleContextMenu.bind(this));
  }

  private handleGlobalMouseUp(e: MouseEvent): void {
    if (this.isPanning) {
      this.stopPanning();
    }
  }

  private handleContextMenu(e: MouseEvent): void {
    // Prevent context menu during panning
    if (this.isPanning) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  // ===== TRACKPAD ZOOM METHODS =====
  private handleWheel(e: WheelEvent): void {
    e.preventDefault();
    
    // Check if this is a trackpad pinch gesture (Ctrl key is usually held during pinch)
    const isTrackpadPinch = e.ctrlKey || Math.abs(e.deltaY) < 1;
    
    if (isTrackpadPinch) {
      this.handleTrackpadZoom(e);
    } else {
      // Regular scroll wheel - could be used for panning when zoomed
      this.handleScrollWheel(e);
    }
  }

  private handleTrackpadZoom(e: WheelEvent): void {
    const currentTime = Date.now();
    
    // Start trackpad zoom if not already active
    if (!this.isTrackpadZooming) {
      this.isTrackpadZooming = true;
      this.trackpadZoomStartTime = currentTime;
      this.wheelAccumulator = 0;
      this.addZoomingClasses();
    }
    
    // Clear existing timeout
    if (this.trackpadZoomTimeout) {
      clearTimeout(this.trackpadZoomTimeout);
    }
    
    // Accumulate wheel delta for smooth zooming
    this.wheelAccumulator += e.deltaY;
    
    // Calculate zoom factor
    const zoomFactor = 1 - (this.wheelAccumulator * this.WHEEL_ZOOM_SENSITIVITY);
    const newZoom = Math.max(this.MIN_ZOOM, Math.min(this.MAX_ZOOM, this.zoomLevel * zoomFactor));
    
    // Apply zoom
    this.zoomLevel = newZoom;
    
    // Calculate zoom center (mouse position)
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const centerX = e.clientX - rect.left;
    const centerY = e.clientY - rect.top;
    
    // Adjust pan offset to zoom towards mouse position
    this.adjustPanForZoomCenter(centerX, centerY, zoomFactor);
    
    // Apply transforms
    this.applyZoom();
    
    // Reset accumulator for next frame
    this.wheelAccumulator = 0;
    this.lastWheelTime = currentTime;
    
    // Set timeout to stop trackpad zoom
    this.trackpadZoomTimeout = setTimeout(() => {
      this.stopTrackpadZoom();
    }, this.TRACKPAD_ZOOM_TIMEOUT);
  }

  private handleScrollWheel(e: WheelEvent): void {
    // Use scroll wheel for panning when zoomed in
    if (this.zoomLevel > 1) {
      const panSpeed = 2;
      this.panOffsetX -= e.deltaX * panSpeed;
      this.panOffsetY -= e.deltaY * panSpeed;
      this.applyZoom();
    }
  }

  private adjustPanForZoomCenter(centerX: number, centerY: number, zoomFactor: number): void {
    // Calculate the point that should remain stationary during zoom
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    
    // Convert screen coordinates to canvas coordinates
    const canvasX = centerX - rect.width / 2;
    const canvasY = centerY - rect.height / 2;
    
    // Adjust pan offset to keep the zoom center stationary
    this.panOffsetX = this.panOffsetX * zoomFactor + canvasX * (1 - zoomFactor);
    this.panOffsetY = this.panOffsetY * zoomFactor + canvasY * (1 - zoomFactor);
  }

  private stopTrackpadZoom(): void {
    this.isTrackpadZooming = false;
    this.wheelAccumulator = 0;
    
    // Clear timeout
    if (this.trackpadZoomTimeout) {
      clearTimeout(this.trackpadZoomTimeout);
      this.trackpadZoomTimeout = null;
    }
    
    this.removeZoomingClasses();
  }

  // ===== DISPLAY MANAGEMENT =====
  private updateDisplay(): void {
    if (!this.ctx) return;

    const canvas = this.canvasRef.nativeElement;
    
    // مسح الكانفاس الرئيسي
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 1. رسم خطوط الفرشة من background canvas (الطبقة السفلى)
    if (this.backgroundCtx) {
      this.ctx.drawImage(this.backgroundCanvasRef.nativeElement, 0, 0);
    }
    
    // 2. رسم الصورة الخلفية فوق خطوط الفرشة (الطبقة الوسطى)
    if (this.backgroundImage) {
      this.drawBackgroundImageOnMainCanvas();
    }
    
    // 3. الرسم الحالي يبقى على الكانفاس الرئيسي (الطبقة العليا)
    // (لا نحتاج لرسمه لأنه موجود بالفعل)
  }

  private drawBackgroundImageOnMainCanvas(): void {
    if (!this.backgroundImage || !this.ctx) return;
    
    const canvas = this.canvasRef.nativeElement;
    this.drawBackgroundImageOnContext(this.ctx, canvas);
  }

  private drawBackgroundImageOnContext(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
    if (!this.backgroundImage) return;
    
    const img = this.backgroundImage;
    const hRatio = canvas.width / img.width;
    const vRatio = canvas.height / img.height;
    const ratio = Math.min(hRatio, vRatio, 1);

    const centerX = (canvas.width - img.width * ratio) / 2;
    const centerY = (canvas.height - img.height * ratio) / 2;

    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(img, 0, 0, img.width, img.height, centerX, centerY, img.width * ratio, img.height * ratio);
    ctx.restore();
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
    
    // حساب الموضع مع مراعاة التكبير والبانينج بشكل صحيح
    // أولاً: تحويل من إحداثيات الشاشة إلى إحداثيات الكانفاس
    const canvasX = clientX - rect.left;
    const canvasY = clientY - rect.top;
    
    // ثانياً: تطبيق التكبير والبانينج العكسي للحصول على الموضع الصحيح
    const x = (canvasX - this.panOffsetX) / this.zoomLevel;
    const y = (canvasY - this.panOffsetY) / this.zoomLevel;
    
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
  private initializeHistory(): void {
    // Initialize with empty state
    this.drawingHistory = [];
    this.historyIndex = -1;
    this.saveState(); // Save initial empty state
  }

  private saveState(): void {
    if (!this.isBrowser || !this.canvasRef?.nativeElement) return;
    
    try {
      // Create a temporary canvas to combine both canvases
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d')!;
      
      const mainCanvas = this.canvasRef.nativeElement;
      const backgroundCanvas = this.backgroundCanvasRef?.nativeElement;
      
      // Set temp canvas size
      tempCanvas.width = mainCanvas.width;
      tempCanvas.height = mainCanvas.height;
      
      // Fill with white background
      tempCtx.fillStyle = '#ffffff';
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      
      // Draw background canvas first (if exists)
      if (backgroundCanvas) {
        tempCtx.drawImage(backgroundCanvas, 0, 0);
      }
      
      // Draw main canvas on top
      tempCtx.drawImage(mainCanvas, 0, 0);
      
      // Get the combined state
      const state = tempCanvas.toDataURL('image/png');
      
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
          // Clear both canvases
          this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
          if (this.backgroundCtx) {
            this.backgroundCtx.clearRect(0, 0, this.backgroundCanvasRef.nativeElement.width, this.backgroundCanvasRef.nativeElement.height);
          }
          
          // If this is the first state (empty), just clear everything
          if (this.historyIndex === 0) {
            this.updateDisplay();
            return;
          }
          
          // Restore the combined state
          this.ctx.drawImage(img, 0, 0);
          
          // Update display to show the restored state
          this.updateDisplay();
        }
      };
      img.src = this.drawingHistory[this.historyIndex];
    } catch (error) {
      console.error('Error restoring canvas state:', error);
    }
  }

  clearCanvas(): void {
    if (confirm('Are you sure you want to clear the canvas?')) {
      // مسح الكانفاس الرئيسي
      this.ctx.clearRect(0, 0, this.canvasRef.nativeElement.width, this.canvasRef.nativeElement.height);
      
      // مسح background canvas
      if (this.backgroundCtx) {
        this.backgroundCtx.clearRect(0, 0, this.backgroundCanvasRef.nativeElement.width, this.backgroundCanvasRef.nativeElement.height);
      }
      
      // إزالة الصورة الخلفية
      this.backgroundImage = null;
      
      // إعادة تعيين التاريخ
      this.drawingHistory = [];
      this.historyIndex = -1;
      
      // حفظ الحالة الفارغة
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
    
    // 1. رسم خطوط الفرشة من background canvas (الطبقة السفلى)
    if (this.backgroundCtx) {
      finalCtx.drawImage(this.backgroundCanvasRef.nativeElement, 0, 0);
    }

    // 2. رسم الصورة الخلفية فوق خطوط الفرشة (الطبقة الوسطى)
    if (this.backgroundImage) {
      this.drawBackgroundImageOnContext(finalCtx, finalCanvas);
    }

    // 3. رسم الكانفاس الرئيسي (الرسم الحالي) - الطبقة العليا
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
    
    // 1. رسم خطوط الفرشة من background canvas (الطبقة السفلى)
    if (this.backgroundCtx) {
      finalCtx.drawImage(this.backgroundCanvasRef.nativeElement, 0, 0);
    }

    // 2. رسم الصورة الخلفية فوق خطوط الفرشة (الطبقة الوسطى)
    if (this.backgroundImage) {
      this.drawBackgroundImageOnContext(finalCtx, finalCanvas);
    }

    // 3. رسم الكانفاس الرئيسي (الرسم الحالي) - الطبقة العليا
    finalCtx.drawImage(canvas, 0, 0);
    
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

    // جعل الصورة تملأ الصفحة بالكامل
    const imgRatio = finalCanvas.width / finalCanvas.height;
    const pageRatio = a4Width / a4Height;

    let w, h, x, y;
    if (imgRatio > pageRatio) {
      // الصورة أوسع من الصفحة - نملأ العرض
      w = a4Width;
      h = a4Width / imgRatio;
      x = 0;
      y = (a4Height - h) / 2;
    } else {
      // الصورة أطول من الصفحة - نملأ الارتفاع
      h = a4Height;
      w = a4Height * imgRatio;
      x = (a4Width - w) / 2;
      y = 0;
    }

    pdf.addImage(dataUrl, 'PNG', x, y, w, h);

    // إضافة اللوجو في أسفل الصفحة على اليمين
    await this.addPDFWatermark(pdf, a4Width, a4Height);

    // نعمل داونلود
    const fileName = `painting-${new Date().toISOString().slice(0, 10)}.pdf`;
    pdf.save(fileName);
  }



  private async addWatermarkToContext(ctx: CanvasRenderingContext2D, width: number, height: number): Promise<void> {
    const watermarkSize = Math.min(width, height) * 0.15;
      const margin = watermarkSize * 0.1;
      const x = width - watermarkSize - margin;
      const y = height - watermarkSize - margin;
      
    ctx.save();

    // نضمن تحميل اللوجو قبل الرسم
    await this.preloadLogo();

    if (this.logoLoaded && this.logoImg) {
      const logoSize = watermarkSize;
      const logoX = x;
      const logoY = y;
      ctx.drawImage(this.logoImg, logoX, logoY, logoSize, logoSize);
    } else {
      // fallback: نص فقط
      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      ctx.font = `bold ${Math.max(12, watermarkSize * 0.8)}px Arial`;
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

  private async addPDFWatermark(pdf: jsPDF, width: number, height: number): Promise<void> {
    // Watermark size in mm (proportional to A4)
    const watermarkSize = Math.min(width, height) * 0.12; // 12% of page size
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
    
    // Load and draw logo
    const logoImg = new Image();
    logoImg.crossOrigin = 'anonymous';
    logoImg.onload = () => {
      // Draw logo directly without background circle
      const logoSize = canvasSize;
      const logoX = 0;
      const logoY = 0;
      
      // Draw logo
      watermarkCtx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
      
      // Convert canvas to data URL and add to PDF
      const watermarkDataUrl = watermarkCanvas.toDataURL('image/png');
      pdf.addImage(watermarkDataUrl, 'PNG', x, y, watermarkSize, watermarkSize);
    };
    
    logoImg.onerror = () => {
      // Fallback to text-only watermark if image fails to load
      watermarkCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      watermarkCtx.font = `bold ${canvasSize * 0.6}px Arial`;
      watermarkCtx.textAlign = 'center';
      watermarkCtx.textBaseline = 'middle';
      watermarkCtx.fillText('PATARIF', canvasSize / 2, canvasSize / 2);
      
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
    
    // إعادة تعيين التحويلات للماوس
    cursor.style.transform = '';
    cursor.style.left = '';
    cursor.style.top = '';
    
    // إزالة CSS class للشاشات اللمسية
    cursor.classList.remove('touch-cursor');
    
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

  onTouchStart(event: TouchEvent): void {
    event.preventDefault();
    this.touchStartTime = Date.now();
    
    if (event.touches.length === 1) {
      // Single touch - start drawing
      this.startDrawing(event);
    } else if (event.touches.length === 2) {
      // Two touches - start zoom gesture
      this.startTouchZoom(event);
    }
  }

  onTouchMove(event: TouchEvent): void {
    event.preventDefault();
    
    if (event.touches.length === 1) {
      // Single touch - continue drawing
      const touch = event.touches[0];
      this.updateTouchCursorPosition(touch.clientX, touch.clientY);
      this.draw(event);
    } else if (event.touches.length === 2) {
      // Two touches - handle zoom or pan
      this.handleTouchZoom(event);
    }
  }

  onTouchEnd(event: TouchEvent): void {
    event.preventDefault();
    
    if (event.touches.length === 0) {
      // All touches ended
      this.stopDrawing();
      this.stopTouchZoom();
    } else if (event.touches.length === 1) {
      // One touch ended, continue with remaining touch
      this.stopTouchZoom();
    }
  }

  // ===== TOUCH ZOOM METHODS =====
  private startTouchZoom(event: TouchEvent): void {
    if (event.touches.length !== 2) return;
    
    this.isZooming = true;
    this.isDrawing = false; // Stop any drawing
    
    const touch1 = event.touches[0];
    const touch2 = event.touches[1];
    
    // Calculate initial distance between touches
    this.initialDistance = this.getTouchDistance(touch1, touch2);
    this.initialZoom = this.zoomLevel;
    
    // Calculate center point
    this.lastTouchCenter = this.getTouchCenter(touch1, touch2);
    
    // Add zooming CSS classes
    this.addZoomingClasses();
  }

  private handleTouchZoom(event: TouchEvent): void {
    if (event.touches.length !== 2 || !this.isZooming) return;
    
    const touch1 = event.touches[0];
    const touch2 = event.touches[1];
    
    // Calculate current distance
    const currentDistance = this.getTouchDistance(touch1, touch2);
    const currentCenter = this.getTouchCenter(touch1, touch2);
    
    // Calculate zoom factor
    const zoomFactor = currentDistance / this.initialDistance;
    const newZoom = Math.max(this.MIN_ZOOM, Math.min(this.MAX_ZOOM, this.initialZoom * zoomFactor));
    
    // Apply zoom
    this.zoomLevel = newZoom;
    
    // Calculate pan offset to zoom towards the center point
    const deltaX = currentCenter.x - this.lastTouchCenter.x;
    const deltaY = currentCenter.y - this.lastTouchCenter.y;
    
    // Update pan offset
    this.panOffsetX += deltaX;
    this.panOffsetY += deltaY;
    
    // Apply transforms
    this.applyZoom();
    
    // Update last center for next frame
    this.lastTouchCenter = currentCenter;
  }

  private stopTouchZoom(): void {
    this.isZooming = false;
    this.initialDistance = 0;
    this.initialZoom = 1;
    
    // Remove zooming CSS classes
    this.removeZoomingClasses();
  }

  private getTouchDistance(touch1: Touch, touch2: Touch): number {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private getTouchCenter(touch1: Touch, touch2: Touch): { x: number, y: number } {
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2
    };
  }

  private handleTouchPanning(event: TouchEvent): void {
    if (event.touches.length === 2 && this.zoomLevel > 1) {
      // Use two-finger touch for panning
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      
      // Calculate center point between two touches
      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;
      
      if (!this.isPanning) {
        this.startPanning({ clientX: centerX, clientY: centerY, button: 0 } as MouseEvent);
      } else {
        this.handlePanning({ clientX: centerX, clientY: centerY, button: 0 } as MouseEvent);
      }
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
      // حساب الموضع مع مراعاة التكبير والبانينج بشكل صحيح
      // أولاً: تحويل من إحداثيات الشاشة إلى إحداثيات الكانفاس
      const canvasX = clientX - rect.left;
      const canvasY = clientY - rect.top;
      
      // ثانياً: تطبيق التكبير والبانينج العكسي للحصول على الموضع الصحيح
      const x = (canvasX - this.panOffsetX) / this.zoomLevel;
      const y = (canvasY - this.panOffsetY) / this.zoomLevel;
      
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

  private updateTouchCursorPosition(clientX: number, clientY: number): void {
    if (!this.cursorElement?.nativeElement) return;
    
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    
    if (
      clientX >= rect.left &&
      clientX <= rect.right &&
      clientY >= rect.top &&
      clientY <= rect.bottom
    ) {
      // حساب موضع المؤشر للشاشات اللمسية مع مراعاة التكبير والبانينج
      const canvasX = clientX - rect.left;
      const canvasY = clientY - rect.top;
      
      // تطبيق التحويلات العكسية للحصول على الموضع الصحيح
      const x = (canvasX - this.panOffsetX) / this.zoomLevel;
      const y = (canvasY - this.panOffsetY) / this.zoomLevel;
      
      const cursor = this.cursorElement.nativeElement;
      
      // إضافة CSS class للشاشات اللمسية
      cursor.classList.add('touch-cursor');
      
      // تطبيق التحويلات على المؤشر نفسه ليتطابق مع الكانفاس
      const transform = `translate(${x}px, ${y}px) scale(${this.zoomLevel})`;
      cursor.style.transform = transform;
      cursor.style.left = '0px';
      cursor.style.top = '0px';
      cursor.style.display = 'block';
    } else {
      this.hideCursor();
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
      // Handle spacebar for panning
      if (event.code === 'Space' && this.zoomLevel > 1) {
        event.preventDefault();
        this.isSpacePressed = true;
        this.updatePanningCursor();
        return;
      }
      
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

  @HostListener('document:keyup', ['$event'])
  private handleKeyUp(event: KeyboardEvent): void {
    if (!this.isBrowser) return;
    
    try {
      // Handle spacebar release
      if (event.code === 'Space') {
        event.preventDefault();
        this.isSpacePressed = false;
        if (this.isPanning) {
          this.stopPanning();
        }
        this.updateCursor(); // Reset to normal cursor
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
    this.panOffsetX = 0;
    this.panOffsetY = 0;
    this.applyZoom();
  }

  private applyZoom(): void {
    const canvas = this.canvasRef.nativeElement;
    const canvasWrapper = canvas.parentElement;
    
    if (canvasWrapper) {
      // Apply both zoom and pan transforms
      const transform = `scale(${this.zoomLevel}) translate(${this.panOffsetX}px, ${this.panOffsetY}px)`;
      canvasWrapper.style.transform = transform;
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
      if (this.trackpadZoomTimeout) {
        clearTimeout(this.trackpadZoomTimeout);
      }
      window.removeEventListener('keydown', this.handleKeyDown.bind(this));
    }
  }

  private backgroundImage: HTMLImageElement | null = null;

moveCurrentDrawingToBackground(): void {
  if (this.backgroundCtx && this.ctx) {
    // نقل الرسم الحالي من drawingCanvas لـ backgroundCanvas
    this.backgroundCtx.clearRect(0, 0, this.backgroundCanvasRef.nativeElement.width, this.backgroundCanvasRef.nativeElement.height);
    this.backgroundCtx.drawImage(this.canvasRef.nativeElement, 0, 0);
    // مسح drawingCanvas بعد النقل
    this.ctx.clearRect(0, 0, this.canvasRef.nativeElement.width, this.canvasRef.nativeElement.height);
    
    // تحديث العرض
    this.updateDisplay();
    
    // حفظ الحالة الجديدة
    this.saveState();
  }
}

private loadImageToCanvas(imageUrl: string): void {
  const img = new Image();
  img.crossOrigin = 'Anonymous';
  img.onload = () => {
    this.backgroundImage = img; // خزّن الصورة
    
    // تحديث العرض مع الصورة الجديدة
    this.updateDisplay();
    
    this.saveState();
  };
  img.src = imageUrl;
}

private drawBackgroundImage(): void {
  if (!this.backgroundImage) return;
  
  // استخدام background canvas إذا كان متوفر، وإلا استخدام الرئيسي
  const targetCanvas = this.backgroundCanvasRef?.nativeElement || this.canvasRef.nativeElement;
  const targetCtx = this.backgroundCtx || this.ctx;

  // مسح الخلفية أولاً
  targetCtx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);

  const img = this.backgroundImage;
  const hRatio = targetCanvas.width / img.width;
  const vRatio = targetCanvas.height / img.height;
  const ratio = Math.min(hRatio, vRatio, 1);

  const centerX = (targetCanvas.width - img.width * ratio) / 2;
  const centerY = (targetCanvas.height - img.height * ratio) / 2;

  targetCtx.drawImage(img, 0, 0, img.width, img.height, centerX, centerY, img.width * ratio, img.height * ratio);
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