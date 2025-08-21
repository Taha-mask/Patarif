import { Component } from '@angular/core';
import { LinesBackgroundComponent } from "../../../lines-background/lines-background.component";
import { StarsBackgroundComponent } from "../../../stars-background/stars-background.component";

@Component({
  selector: 'app-introduction',
  imports: [LinesBackgroundComponent, StarsBackgroundComponent],
  templateUrl: './introduction.component.html',
  styleUrl: './introduction.component.css'
})
export class IntroductionComponent {

}
