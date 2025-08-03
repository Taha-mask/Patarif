import { Component } from '@angular/core';
import { BackgroundComponent } from "../../../background/background.component";
import { GameCardComponent } from "./game-card/game-card.component";
import { SliderGamesHomePageComponent } from "./slider-games-home-page/slider-games-home-page.component";
import { StarsBackgroundComponent } from '../../../stars-background/stars-background.component';

@Component({
  selector: 'app-home-games',
  imports: [BackgroundComponent, GameCardComponent, SliderGamesHomePageComponent, StarsBackgroundComponent],
  templateUrl: './home-games.component.html',
  styleUrl: './home-games.component.css'
})
export class HomeGamesComponent {
onCardClicked(arg0: string) {
throw new Error('Method not implemented.');
}

}
