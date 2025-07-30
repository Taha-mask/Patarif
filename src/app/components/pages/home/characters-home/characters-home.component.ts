import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CarachterCardComponent } from "./carachter-card/carachter-card.component";
import { CardsComponent } from "../../../cards/cards.component";
import { CharacterCard } from "../../../../interface/card";
import { SliderCharactersHomeComponent } from "./slider-characters-home/slider-characters-home.component";

@Component({
  selector: 'app-characters-home',
  imports: [CarachterCardComponent, CardsComponent, SliderCharactersHomeComponent],
  templateUrl: './characters-home.component.html',
  styleUrl: './characters-home.component.css'
})
export class CharactersHomeComponent {
characters: CharacterCard[] = [
  {
    bgIcon: 'images/characters/red_Subtract.png',
    character: 'images/characters/patarif0.png',
    raiting: 5.2
  },
  {
    bgIcon: 'images/characters/blue_Subtract.png',
    character: 'images/characters/patarif1.png',
    raiting: 4.8
  },
  {
    bgIcon: 'images/characters/yellow_Subtract.png',
    character: 'images/characters/patarif2.png',
    raiting: 6.0
  }
];
}
