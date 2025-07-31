import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-category-card',
  imports: [CommonModule, MatIconModule],
  templateUrl: './category-card.component.html',
  styleUrl: './category-card.component.css'
})
export class CategoryCardComponent {
  @Input() bgColor: string = '#ffffff';      
  @Input() bgIcon: string = '';                
  @Input() mainIcon: string = '';            
  @Input() title: string = '';                 
  @Output() cardClick = new EventEmitter();  

  onCardClick() {
    this.cardClick.emit(); 
  }
}
