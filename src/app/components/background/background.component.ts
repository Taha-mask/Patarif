import { Component, AfterViewInit, QueryList, ViewChildren, ElementRef } from '@angular/core';

@Component({
  selector: 'app-background',
  templateUrl: './background.component.html',
  styleUrl: './background.component.css'
})
export class BackgroundComponent implements AfterViewInit {
  @ViewChildren('circle') circles!: QueryList<ElementRef>;

  ngAfterViewInit() {
    if (typeof window !== 'undefined') {
      setInterval(() => {
        this.circles.forEach(circle => {
          const el = circle.nativeElement as HTMLElement;
          // Random top and left within window bounds (minus circle size)
          const size = 300;
          const top = Math.random() * (window.innerHeight - size);
          const left = Math.random() * (window.innerWidth - size);
          el.style.top = `${top}px`;
          el.style.left = `${left}px`;
          el.style.right = '';
        });
      }, 3000);
    }
  }
}
