import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-carachter-card',
  imports: [],
  templateUrl: './carachter-card.component.html',
  styleUrl: './carachter-card.component.css'
})
export class CarachterCardComponent {
  @Input()  bgIcon: string = '';                
  @Input() character: string = '';            
  @Input() raiting: number = 0;                 
  @Input() isSelected: boolean = false;                 
  @Output() cardClick = new EventEmitter();  

  onCardClick() {
    this.cardClick.emit(); 
  }
}
