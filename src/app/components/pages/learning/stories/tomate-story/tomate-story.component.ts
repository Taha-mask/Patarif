import { Component } from '@angular/core';
import { HomeFooterComponent } from "../../../home/home-footer/home-footer.component";

@Component({
  selector: 'app-tomate-story',
  imports: [HomeFooterComponent],
  templateUrl: './tomate-story.component.html',
  styleUrl: './tomate-story.component.css'
})
export class TomateStoryComponent {
  cover = 'images/learningZone/stories/tomate/cover.png';
  showCloud = false;
  showContent = false;

  get bgStyle() {
    return {
      'background-image': `url('${this.cover}')`,
      'background-size': 'cover',
      'background-position': 'center'
    };
  }

  onDiscoverClick() {
    this.showCloud = true;
    setTimeout(() => {
      this.showContent = true;
    }, 1000); // Show content after cloud animation
  }
}
