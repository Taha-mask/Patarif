import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../header/header.component';
import { ToolbarComponent } from '../toolbar/toolbar.component';
import { ImageReceiverComponent } from '../image-receiver/image-receiver.component';
import { CanvasComponent } from '../canvas/canvas.component';
import { GameTemplateComponent } from '../../../../game-template/game-template.component';

@Component({
  selector: 'app-drawing-page',
  standalone: true,
  imports: [CommonModule, HeaderComponent, ToolbarComponent, ImageReceiverComponent, CanvasComponent, GameTemplateComponent],
  templateUrl: './drawing-page.component.html',
  styleUrls: ['./drawing-page.component.css']
})
export class DrawingPageComponent {}
