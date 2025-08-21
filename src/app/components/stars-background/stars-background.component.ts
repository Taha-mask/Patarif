import { Component, OnInit, HostListener, ViewChild, ElementRef, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stars-background',
  imports: [CommonModule],
  templateUrl: './stars-background.component.html',
  styleUrl: './stars-background.component.css'
})
export class StarsBackgroundComponent{
@Input() top: number =0;
}
