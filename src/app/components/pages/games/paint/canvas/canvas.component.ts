
// canvas.component.ts (simplified)
import { Component, ElementRef, ViewChild, AfterViewInit, Input, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-canvas',
  template: '<canvas #drawingCanvas></canvas>',
  styleUrls: ['./canvas.component.css']
})
export class CanvasComponent implements AfterViewInit, OnChanges {
  @ViewChild('drawingCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @Input() selectedColor: string = '#000000';
  @Input() selectedTool: string = 'pen';
  private ctx!: CanvasRenderingContext2D;
  private isDrawing = false;

  ngAfterViewInit(): void {
    this.ctx = this.canvasRef.nativeElement.getContext('2d')!;
    this.setupCanvas();
    this.loadImage('/assets/mario-outline.png'); // Example: Load initial image
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedColor'] && this.ctx) {
      this.ctx.strokeStyle = this.selectedColor;
      this.ctx.fillStyle = this.selectedColor;
    }
    // Handle tool changes
  }

  private setupCanvas(): void {
    const canvas = this.canvasRef.nativeElement;
    canvas.width = window.innerWidth * 0.7; // Adjust as needed
    canvas.height = window.innerHeight * 0.8; // Adjust as needed
    this.ctx.lineWidth = 2;
    this.ctx.lineCap = 'round';
    this.ctx.strokeStyle = this.selectedColor;
  }

  private loadImage(src: string): void {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      this.ctx.drawImage(img, 0, 0, this.canvasRef.nativeElement.width, this.canvasRef.nativeElement.height);
    };
  }

  // Add mouse event handlers for drawing logic
}
  