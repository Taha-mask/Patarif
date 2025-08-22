import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-lines-background',
  imports: [],
  templateUrl: './lines-background.component.html',
  styleUrl: './lines-background.component.css'
})
export class LinesBackgroundComponent {
@Input() top: number =0;

}
