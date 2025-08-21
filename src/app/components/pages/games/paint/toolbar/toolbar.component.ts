import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-toolbar',
  imports: [CommonModule, FormsModule],
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.css'
})
export class ToolbarComponent {
  @Input() currentTool: string = 'brush';
  @Input() brushSize: number = 5;
  @Input() selectedColor: string = '#000000';
  @Input() colorPalette: string[] = [
    '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
    '#FFA500', '#800080', '#FFC0CB', '#A52A2A', '#808080', '#000000',
    '#FFFFFF', '#90EE90', '#FFB6C1', '#DDA0DD', '#F0E68C', '#E6E6FA'
  ];
  
  brushSizes: number[] = [2, 5, 10, 15, 20, 25];

  @Output() toolChange = new EventEmitter<string>();
  @Output() colorChange = new EventEmitter<string>();
  @Output() brushSizeChange = new EventEmitter<number>();
  @Output() clearCanvas = new EventEmitter<void>();
  @Output() saveImage = new EventEmitter<void>();
  @Output() goBack = new EventEmitter<void>();

  selectBrush() {
    this.currentTool = 'brush';
    this.toolChange.emit('brush');
  }

  selectEraser() {
    this.currentTool = 'eraser';
    this.toolChange.emit('eraser');
  }

  selectColor(color: string) {
    this.selectedColor = color;
    this.colorChange.emit(color);
  }

  changeBrushSize(size: number) {
    this.brushSize = size;
    this.brushSizeChange.emit(size);
  }

  onClearCanvas() {
    this.clearCanvas.emit();
  }

  onSaveImage() {
    this.saveImage.emit();
  }

  onGoBack() {
    this.goBack.emit();
  }
}
