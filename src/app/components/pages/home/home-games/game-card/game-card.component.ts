import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-game-card',
  imports: [],
  templateUrl: './game-card.component.html',
  styleUrl: './game-card.component.css'
})
export class GameCardComponent {
  @Input()  bgIcon: string = 'images/Subtract.png';                
  @Input() mainIcon: string = '';            
  @Input() title: string = '';                 
  @Output() cardClick = new EventEmitter();  

  onCardClick() {
    this.cardClick.emit(); 
  }
}
