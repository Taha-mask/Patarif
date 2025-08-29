import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-admin-prodoucts-product-card',
  imports: [CommonModule],
  templateUrl: './admin-prodoucts-product-card.component.html',
  styleUrl: './admin-prodoucts-product-card.component.css'
})
export class AdminProdouctsProductCardComponent {
  @Input() img!: string;
  @Input() title!: string;
  @Input() category!: string;
  @Input() stock!: number;
  @Input() price!: number;
}
