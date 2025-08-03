import { Component } from '@angular/core';
import { SliderGamesHomePageComponent } from "./slider-games-home-page/slider-games-home-page.component";

@Component({
  selector: 'app-home-games',
  imports: [ SliderGamesHomePageComponent],
  templateUrl: './home-games.component.html',
  styleUrl: './home-games.component.css'
})
export class HomeGamesComponent {
onCardClicked(arg0: string) {
throw new Error('Method not implemented.');
}

}
