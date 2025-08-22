import { Component } from '@angular/core';
import { CategoryCardComponent } from './category-card/category-card.component';
import { BackgroundComponent } from "../../../background/background.component";
import { StarsBackgroundComponent } from "../../../stars-background/stars-background.component";
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
@Component({
  selector: 'app-categories',
  imports: [
    CategoryCardComponent,
    BackgroundComponent,
    StarsBackgroundComponent
  ],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.css'
})
export class CategoriesComponent {
  constructor(private router: Router) { }

  onCardClicked(goto: string) {
    if (goto == 'learningCorner') {
      this.router.navigate(['/learning']);
    }
    else if (goto == 'gamesCorner') {
      this.router.navigate(['games']);
    } else if (goto == 'shoppingCorner') {
      this.router.navigate(['shop']);
    } else if (goto == 'storyCorner') {
      // this.router.navigate(['']);
Swal.fire("this page will be available soon");
    }
  }

}
