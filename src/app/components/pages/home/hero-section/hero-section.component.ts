import { Component } from '@angular/core';
import { BackgroundComponent } from "../../../background/background.component";
import { StarsBackgroundComponent } from "../../../stars-background/stars-background.component";

@Component({
  selector: 'app-hero-section',
  imports: [BackgroundComponent, StarsBackgroundComponent],
  templateUrl: './hero-section.component.html',
  styleUrl: './hero-section.component.css'
})
export class HeroSectionComponent {

}


