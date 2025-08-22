import { Component } from '@angular/core';
import { BackgroundComponent } from "../../background/background.component";
import { RouterModule } from '@angular/router';
import { StarsBackgroundComponent } from "../../stars-background/stars-background.component";
import { LinesBackgroundComponent } from "../../lines-background/lines-background.component";
@Component({
  selector: 'app-learning',
  imports: [BackgroundComponent, RouterModule, StarsBackgroundComponent, LinesBackgroundComponent],
  templateUrl: './learning.component.html',
  styleUrl: './learning.component.css'
})
export class LearningComponent {

}
