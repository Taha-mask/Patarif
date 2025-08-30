import { NgForOf } from '@angular/common';
import { Component, AfterViewInit, QueryList, ViewChildren, ElementRef } from '@angular/core';

@Component({
  selector: 'app-background',
  templateUrl: './background.component.html',
  standalone: true,
  styleUrl: './background.component.css',
  imports: [NgForOf]
})
export class BackgroundComponent{
}
