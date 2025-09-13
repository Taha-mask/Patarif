import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CanvasStateService } from '../canvas-state.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  canUndo = false;
  canRedo = false;

  constructor(private router: Router, private state: CanvasStateService) {
    this.state.historyChanged$.subscribe(h => {
      this.canUndo = h.index > 0;
      this.canRedo = h.index < h.length - 1;
    });
  }

  undo() { this.state.undo(); }
  redo() { this.state.redo(); }
  goBack() { this.router.navigate(['/gallery']); }
}
