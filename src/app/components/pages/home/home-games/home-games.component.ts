import { Component } from '@angular/core';
import { BackgroundComponent } from "../../../background/background.component";
import { GameCardComponent } from "./game-card/game-card.component";

@Component({
  selector: 'app-home-games',
  imports: [BackgroundComponent, GameCardComponent],
  templateUrl: './home-games.component.html',
  styleUrl: './home-games.component.css'
})
export class HomeGamesComponent {
onCardClicked(arg0: string) {
throw new Error('Method not implemented.');
}

}
