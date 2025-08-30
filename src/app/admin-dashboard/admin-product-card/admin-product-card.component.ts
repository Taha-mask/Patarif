import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-admin-product-card',
  imports: [CommonModule],
  templateUrl: './admin-product-card.component.html',
  styleUrl: './admin-product-card.component.css'
})
export class AdminProductCardComponent {
  @Input() img!: string;
  @Input() title!: string;
  @Input() price!: number;
  @Input() isAlmostFinished!: boolean;
}
