import { AfterViewInit, Component, ElementRef, HostListener, QueryList, ViewChildren } from '@angular/core';
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
  selector: 'app-carotte-story',
  imports: [CommonModule, HomeFooterComponent],
  templateUrl: './carotte-story.component.html',
  styleUrl: './carotte-story.component.css',
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
export class CarotteStoryComponent implements AfterViewInit {
  @ViewChildren('section') sections!: QueryList<ElementRef>;
  private currentSectionIndex: number = 0;
  private isScrolling: boolean = false;

  ngAfterViewInit(): void {
    // التمرير إلى القسم الأول عند تحميل الصفحة
    this.scrollToSection(this.currentSectionIndex);
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (this.isScrolling) return;

    if (event.key === 'ArrowDown' && this.currentSectionIndex < this.sections.length - 1) {
      this.currentSectionIndex++;
      this.scrollToSection(this.currentSectionIndex);
    } else if (event.key === 'ArrowUp' && this.currentSectionIndex > 0) {
      this.currentSectionIndex--;
      this.scrollToSection(this.currentSectionIndex);
    }
  }

  @HostListener('window:wheel', ['$event'])
  handleWheelEvent(event: WheelEvent) {
    if (this.isScrolling) return;

    if (event.deltaY > 0 && this.currentSectionIndex < this.sections.length - 1) {
      // التمرير لأسفل
      this.currentSectionIndex++;
      this.scrollToSection(this.currentSectionIndex);
    } else if (event.deltaY < 0 && this.currentSectionIndex > 0) {
      // التمرير لأعلى
      this.currentSectionIndex--;
      this.scrollToSection(this.currentSectionIndex);
    }
  }

  private scrollToSection(index: number) {
    this.isScrolling = true;
    const section = this.sections.toArray()[index].nativeElement;
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // تأخير لمنع التمرير المتكرر أثناء التمرير السلس
    setTimeout(() => {
      this.isScrolling = false;
    }, 1000); // يمكنك تعديل الوقت حسب الحاجة
  }
}
