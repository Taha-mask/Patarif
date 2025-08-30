import { Component } from '@angular/core';
import { StarsBackgroundComponent } from "../../stars-background/stars-background.component";
import { LinesBackgroundComponent } from "../../lines-background/lines-background.component";

@Component({
  selector: 'app-contact-us',
  imports: [StarsBackgroundComponent, LinesBackgroundComponent],
  templateUrl: './contact-us.component.html',
  styleUrl: './contact-us.component.css'
})
export class ContactUsComponent {

}
