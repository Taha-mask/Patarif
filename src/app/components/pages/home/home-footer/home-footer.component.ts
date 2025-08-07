import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-home-footer',
  imports: [],
  templateUrl: './home-footer.component.html',
  styleUrl: './home-footer.component.css',
  host: {
    '[style.background-color]': 'color'
  }
})
export class HomeFooterComponent {
  @Input() color: string = '#FFFFFF';
}
