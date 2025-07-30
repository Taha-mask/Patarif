import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-game-card',
  imports: [CommonModule],
  templateUrl: './game-card.component.html',
  styleUrl: './game-card.component.css'
})
export class GameCardComponent {
  @Input()  bgIcon: string = 'images/Subtract.png';                
  @Input() mainIcon: string = '';            
  @Input() title: string = '';           
  @Input() titleHtml: string = '';      
  @Input() raiting: number = 0;                 
  @Input() isSelected: boolean = false;                 
  @Output() cardClick = new EventEmitter();  

  onCardClick() {
    this.cardClick.emit(); 
  }
}
