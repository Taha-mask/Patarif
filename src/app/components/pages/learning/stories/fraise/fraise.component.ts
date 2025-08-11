import { AfterViewInit, Component, ElementRef, HostListener, OnInit, QueryList, ViewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  trigger,
  state,
  style,
  transition,
  animate
} from '@angular/animations';
import { HomeFooterComponent } from "../../../home/home-footer/home-footer.component";

@Component({
  selector: 'app-fraise',
  templateUrl: './fraise.component.html',
  styleUrl: './fraise.component.css',
  imports: [CommonModule, HomeFooterComponent],
  animations: [
    trigger('boxAnimation', [
      state('hidden', style({
        opacity: 0,
        transform: 'scale(0.8)'
      })),
      state('visible', style({
        opacity: 1,
        transform: 'scale(1)'
      })),
      transition('hidden => visible', [
        animate('500ms ease-out')
      ]),
      transition('visible => hidden', [
        animate('500ms ease-in')
      ]),
    ])
  ]

})
export class FraiseComponent {
  sections: string[] = ['section1', 'section2', 'section3', 'section4', 'section5', 'section6', 'section7', 'section8',
    'section9'];
  currentIndex = 0;
  isScrolling = false;

  showBox = false;

  discover() {
    document.getElementById(this.sections[1])?.scrollIntoView({ behavior: 'smooth' });
  }

  toggleBox() {
    this.showBox = !this.showBox;
  }

  ngOnInit() {
    // تأكد من التمركز على أول سكشن عند البداية
    document.getElementById(this.sections[this.currentIndex])?.scrollIntoView({ behavior: 'smooth' });
  }

  scrollToSection(index: number) {
    if (index >= 0 && index < this.sections.length) {
      this.currentIndex = index;
      this.isScrolling = true;

      document.getElementById(this.sections[this.currentIndex])?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest'
      });


      // نمنع التكرار السريع
      setTimeout(() => {
        this.isScrolling = false;
      }, 1000);
    }
  }

  @HostListener('window:keydown.arrowdown', ['$event'])
  onArrowDown(event: KeyboardEvent) {
    if (!this.isScrolling) {
      this.scrollToSection(this.currentIndex + 1);
    }
  }

  @HostListener('window:keydown.arrowup', ['$event'])
  onArrowUp(event: KeyboardEvent) {
    if (!this.isScrolling) {
      this.scrollToSection(this.currentIndex - 1);
    }
  }

  @HostListener('window:wheel', ['$event'])
  onWheel(event: WheelEvent) {
    if (this.isScrolling) return;

    if (event.deltaY > 0) {
      this.scrollToSection(this.currentIndex + 1);
    } else if (event.deltaY < 0) {
      this.scrollToSection(this.currentIndex - 1);
    }
  }


}
