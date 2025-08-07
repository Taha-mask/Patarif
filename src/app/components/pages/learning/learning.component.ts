import { Component } from '@angular/core';
import { BackgroundComponent } from "../../background/background.component";
import { RouterModule } from '@angular/router';
@Component({
  selector: 'app-learning',
  imports: [BackgroundComponent, RouterModule],
  templateUrl: './learning.component.html',
  styleUrl: './learning.component.css'
})
export class LearningComponent {

}
