import { Component, Input } from '@angular/core';


@Component({
  selector: 'app-game-container',
  imports: [],
  templateUrl: './game-container.component.html',
  styleUrl: './game-container.component.css'
})
export class GameContainerComponent {
  @Input() customStyle: { [key: string]: string } = {};
}
