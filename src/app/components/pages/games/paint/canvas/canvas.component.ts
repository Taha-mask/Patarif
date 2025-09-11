import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, HostListener, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { CanvasStateService } from '../canvas-state.service';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-canvas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.css']
})
export class CanvasComponent implements AfterViewInit, OnDestroy {
  @ViewChild('drawingCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('backgroundCanvas', { static: true }) backgroundCanvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('cursorElement', { static: true }) cursorElement!: ElementRef<HTMLDivElement>;
  @ViewChild('canvasWrapper', { static: true }) canvasWrapper!: ElementRef<HTMLDivElement>;

  private ctx!: CanvasRenderingContext2D;
  private backgroundCtx!: CanvasRenderingContext2D;
  private isDrawing = false;
  private lastX = 0;
  private lastY = 0;
  private logoImg: HTMLImageElement | null = null;
  private logoLoaded = false;

  private isBrowser: boolean;
  private resizeObserver: ResizeObserver | null = null;

  constructor(
    private state: CanvasStateService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;

    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    const bg = this.backgroundCanvasRef.nativeElement;
    this.backgroundCtx = bg.getContext('2d')!;

    this.updateSizes();

    this.state.color$.subscribe(c => { this.ctx.strokeStyle = c; this.ctx.fillStyle = c; });
    this.state.size$.subscribe(s => { this.ctx.lineWidth = s; });
    this.state.opacity$.subscribe(o => { this.ctx.globalAlpha = o; });
    this.state.tool$.subscribe(() => this.updateCursor());
    this.state.backgroundImageUrl$.subscribe(url => this.loadBackgroundFromUrl(url));
    this.state.zoom$.subscribe(z => this.applyZoom(z));

    document.addEventListener('canvas-download-png', this.handleDownloadPNG as EventListener);
    document.addEventListener('canvas-download-pdf', this.handleDownloadPDF as EventListener);

    this.saveState();
    this.preloadLogo();

    this.resizeObserver = new ResizeObserver(() => this.updateSizes());
    if (this.canvasWrapper && this.canvasWrapper.nativeElement) this.resizeObserver.observe(this.canvasWrapper.nativeElement);
  }

  ngOnDestroy(): void {
    document.removeEventListener('canvas-download-png', this.handleDownloadPNG as EventListener);
    document.removeEventListener('canvas-download-pdf', this.handleDownloadPDF as EventListener);
    if (this.resizeObserver) this.resizeObserver.disconnect();
  }

  private updateSizes() {
    const canvas = this.canvasRef.nativeElement;
    const bg = this.backgroundCanvasRef.nativeElement;

    const parent = canvas.parentElement as HTMLElement;
    const w = parent.clientWidth;
    const h = parent.clientHeight || 600;

    canvas.width = w;
    canvas.height = h;
    bg.width = w;
    bg.height = h;

    this.updateCursor();
    this.redrawAll();
  }

  private redrawAll() {
    const url = this.state.backgroundImageUrl$.value;
    if (url) {
      this.drawBackgroundUrlToContext(url, this.backgroundCtx, this.backgroundCanvasRef.nativeElement);
    }
  }

  private drawBackgroundUrlToContext(url: string, ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const hRatio = canvas.width / img.width;
      const vRatio = canvas.height / img.height;
      const ratio = Math.min(hRatio, vRatio, 1);
      const centerX = (canvas.width - img.width * ratio) / 2;
      const centerY = (canvas.height - img.height * ratio) / 2;
      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.drawImage(img, 0, 0, img.width, img.height, centerX, centerY, img.width*ratio, img.height*ratio);
    };
    img.onerror = () => { console.warn('background image failed to load', url); };
    img.src = url;
  }

  private preloadLogo(): Promise<void> {
    return new Promise(resolve => {
      this.logoImg = new Image();
      this.logoImg.crossOrigin = 'anonymous';
      this.logoImg.src = '/images/logo-patarif.png';
      this.logoImg.onload = () => { this.logoLoaded = true; resolve(); };
      this.logoImg.onerror = () => { this.logoLoaded = false; resolve(); };
    });
  }

  onPointerDown(e: PointerEvent) {
    e.preventDefault();
    if (e.button === 2) return;
    this.isDrawing = true;
    const pos = this.getEventPosition(e);
    this.lastX = pos.x; this.lastY = pos.y;
    this.ctx.beginPath();
    this.ctx.moveTo(this.lastX, this.lastY);
  }

  onPointerMove(e: PointerEvent) {
    if (!this.isDrawing) return;
    const pos = this.getEventPosition(e);
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.lineWidth = this.state.size$.value;
    this.ctx.globalAlpha = this.state.opacity$.value;
    if (this.state.tool$.value === 'eraser') {
      this.ctx.globalCompositeOperation = 'destination-out';
      this.ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
      this.ctx.globalCompositeOperation = 'source-over';
      this.ctx.strokeStyle = this.state.color$.value;
    }
    this.ctx.lineTo(pos.x, pos.y);
    this.ctx.stroke();
    this.lastX = pos.x; this.lastY = pos.y;
  }

  onPointerUp(e: PointerEvent) {
    if (this.isDrawing) {
      this.isDrawing = false;
      this.saveState();
    }
  }

  private getEventPosition(e: PointerEvent): { x: number, y: number } {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left);
    const y = (e.clientY - rect.top);
    return { x, y };
  }

  private saveState() {
    try {
      const temp = document.createElement('canvas');
      temp.width = this.canvasRef.nativeElement.width;
      temp.height = this.canvasRef.nativeElement.height;
      const tctx = temp.getContext('2d')!;
      tctx.fillStyle = '#ffffff'; tctx.fillRect(0,0,temp.width,temp.height);
      tctx.drawImage(this.backgroundCanvasRef.nativeElement, 0, 0);
      tctx.drawImage(this.canvasRef.nativeElement, 0, 0);
      const dataUrl = temp.toDataURL('image/png');
      this.state.saveState(dataUrl);
    } catch (err) { console.error('saveState error', err); }
  }

  @HostListener('document:keydown', ['$event'])
  private handleKeyboard(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
      const img = this.state.undo();
      if (img) this.restoreFromDataUrl(img);
    }
    if ((event.ctrlKey || event.metaKey) && event.key === 'y') {
      const img = this.state.redo();
      if (img) this.restoreFromDataUrl(img);
    }
  }

  private restoreFromDataUrl(dataUrl: string) {
    const img = new Image();
    img.onload = () => {
      this.ctx.clearRect(0,0,this.canvasRef.nativeElement.width, this.canvasRef.nativeElement.height);
      this.ctx.drawImage(img, 0, 0);
    };
    img.src = dataUrl;
  }

  private handleDownloadPNG = () => {
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = this.canvasRef.nativeElement.width;
    finalCanvas.height = this.canvasRef.nativeElement.height;
    const fctx = finalCanvas.getContext('2d')!;
    fctx.fillStyle = '#ffffff'; fctx.fillRect(0,0,finalCanvas.width, finalCanvas.height);
    fctx.drawImage(this.backgroundCanvasRef.nativeElement, 0, 0);
    fctx.drawImage(this.canvasRef.nativeElement, 0, 0);
    if (this.logoLoaded && this.logoImg) {
      const watermarkSize = Math.min(finalCanvas.width, finalCanvas.height) * 0.15;
      fctx.drawImage(this.logoImg, finalCanvas.width - watermarkSize - 10, finalCanvas.height - watermarkSize - 10, watermarkSize, watermarkSize);
    }
    const dataUrl = finalCanvas.toDataURL('image/png');
    const link = document.createElement('a'); link.href = dataUrl; link.download = `painting-${new Date().toISOString().slice(0,10)}.png`; link.click();
  }

  private handleDownloadPDF = () => {
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = this.canvasRef.nativeElement.width;
    finalCanvas.height = this.canvasRef.nativeElement.height;
    const fctx = finalCanvas.getContext('2d')!;
    fctx.fillStyle = '#ffffff'; fctx.fillRect(0,0,finalCanvas.width, finalCanvas.height);
    fctx.drawImage(this.backgroundCanvasRef.nativeElement, 0, 0);
    fctx.drawImage(this.canvasRef.nativeElement, 0, 0);

    const dataUrl = finalCanvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const a4Width = 210; const a4Height = 297;
    const imgRatio = finalCanvas.width / finalCanvas.height; const pageRatio = a4Width / a4Height;
    let w: number, h: number, x: number, y: number;
    if (imgRatio > pageRatio) { w = a4Width; h = a4Width / imgRatio; x = 0; y = (a4Height - h) / 2; }
    else { h = a4Height; w = a4Height * imgRatio; x = (a4Width - w) / 2; y = 0; }
    pdf.addImage(dataUrl, 'PNG', x, y, w, h);
    if (this.logoLoaded && this.logoImg) {
      const wm = document.createElement('canvas'); const wmctx = wm.getContext('2d')!;
      const dpi = 96; const mmToPx = dpi / 25.4; const sizeMm = Math.min(a4Width, a4Height) * 0.12; const sizePx = Math.round(sizeMm * mmToPx);
      wm.width = sizePx; wm.height = sizePx;
      wmctx.drawImage(this.logoImg, 0, 0, sizePx, sizePx);
      const wmData = wm.toDataURL('image/png');
      pdf.addImage(wmData, 'PNG', a4Width - sizeMm - 5, a4Height - sizeMm - 5, sizeMm, sizeMm);
    }
    pdf.save(`painting-${new Date().toISOString().slice(0,10)}.pdf`);
  }

  private loadBackgroundFromUrl(url: string | null) {
    if (!url) return;
    this.drawBackgroundUrlToContext(url, this.backgroundCtx, this.backgroundCanvasRef.nativeElement);
    setTimeout(() => this.saveState(), 250);
  }

  moveCurrentDrawingToBackground() {
    this.backgroundCtx.drawImage(this.canvasRef.nativeElement, 0, 0);
    this.ctx.clearRect(0,0,this.canvasRef.nativeElement.width, this.canvasRef.nativeElement.height);
    this.saveState();
  }

  private applyZoom(z: number) {
    const wrapper = this.canvasWrapper.nativeElement as HTMLElement;
    wrapper.style.transform = `scale(${z})`;
  }

  private updateCursor() {
    if (!this.cursorElement) return;
    const el = this.cursorElement.nativeElement as HTMLElement;
    const size = Math.max(8, this.state.size$.value);
    el.style.width = `${size}px`;
    el.style.height = `${size}px`;
  }
}
