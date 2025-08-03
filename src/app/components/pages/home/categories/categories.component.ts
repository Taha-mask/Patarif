import { Component } from '@angular/core';
import { CategoryCardComponent } from './category-card/category-card.component';
import { BackgroundComponent } from "../../../background/background.component";
@Component({
  selector: 'app-categories',
  imports: [
    CategoryCardComponent,
    BackgroundComponent
],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.css'
})
export class CategoriesComponent {
  onCardClicked(arg0: string) {
    throw new Error('Method not implemented.');
  }

}
