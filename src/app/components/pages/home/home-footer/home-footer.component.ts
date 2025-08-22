import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Router } from 'express';

@Component({
  selector: 'app-home-footer',
  imports: [RouterLink],
  templateUrl: './home-footer.component.html',
  styleUrls: ['./home-footer.component.css']
})
export class HomeFooterComponent {
  @Input() color: string = '#6486FF'; // default color
}
