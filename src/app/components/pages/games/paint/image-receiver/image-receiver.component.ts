import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { CanvasStateService } from '../canvas-state.service';

@Component({
  selector: 'app-image-receiver',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './image-receiver.component.html',
  styleUrls: ['./image-receiver.component.css']
})
export class ImageReceiverComponent implements OnInit {
  @Input() inputImageUrl?: string | null;

  constructor(private route: ActivatedRoute, private state: CanvasStateService) {}

  ngOnInit(): void {
    if (this.inputImageUrl) {
      this.state.setBackgroundUrl(this.inputImageUrl);
      return;
    }

    this.route.queryParams.subscribe(params => {
      if (params['imageUrl']) {
        const imageUrl = decodeURIComponent(params['imageUrl']);
        this.state.setBackgroundUrl(imageUrl);
      }
    });
  }
}
