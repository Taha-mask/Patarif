import { Component, Input, ElementRef, ViewChild, AfterViewInit, HostListener, OnChanges, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Card } from '../../interface/card';
@Component({
  selector: 'app-cards',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cards.component.html',
  styleUrls: ['./cards.component.css']
})
export class CardsComponent implements AfterViewInit, OnChanges {
  @Input() cards: Card[] = [];
  @Input() designType: 'carousel' | 'list' = 'carousel';
  @Output() cardClick = new EventEmitter<{card: Card, index: number}>();
  @ViewChild('listCardsContainer') listCardsContainer!: ElementRef;

  currentIndex = 0;
  listStartIndex = 0;
  cardsPerPage = 5;

  // Mouse and touch drag variables
  isDragging = false;
  startX = 0;
  scrollLeft = 0;
  minDragDistance = 10; // Minimum drag distance to start scrolling (in pixels)

  @HostListener('window:resize')
  onResize() {
    this.updateCardsPerPage();
  }

 ngAfterViewInit() {
  this.updateCardsPerPage();
  // Add a small delay to ensure the DOM is fully rendered
  setTimeout(() => {
    if (this.designType === 'list' && this.listCardsContainer) {
      this.setupDragScroll();

      // ✅ Generate gradient overlays for list cards
      this.visibleCards.forEach(card => this.generateGradient(card));
    }
  }, 100);
}



ngOnChanges() {
  if (this.designType === 'list' && this.listCardsContainer) {
    setTimeout(() => {
      this.setupDragScroll();

      // ✅ Generate gradient overlays for list cards
      this.visibleCards.forEach(card => this.generateGradient(card));
    }, 100);
  }
}


  updateCardsPerPage() {
    if (typeof window !== 'undefined') {
      const screenWidth = window.innerWidth;
      const cardWidth = 244; // Width of each card
      const gap = 20; // Gap between cards
      const containerPadding = 40; // Total padding (20px on each side)

      // Calculate available width
      const availableWidth = screenWidth - containerPadding;

      // Calculate how many cards can fit
      const cardsThatFit = Math.floor(availableWidth / (cardWidth + gap));

      // Set minimum and maximum bounds
      this.cardsPerPage = Math.max(1, Math.min(cardsThatFit, 8));

      // Adjust listStartIndex if it exceeds the new limit
      if (this.listStartIndex + this.cardsPerPage > this.cards.length) {
        this.listStartIndex = Math.max(0, this.cards.length - this.cardsPerPage);
      }
    }
  }

  setupDragScroll() {
    const container = this.listCardsContainer.nativeElement;

    if (!container) {
      console.warn('Container not found for drag scroll');
      return;
    }

    console.log('Setting up drag scroll for container:', container);

    // Mouse events
    container.addEventListener('mousedown', (e: MouseEvent) => {
      console.log('Mouse down event triggered');
      this.isDragging = true;
      this.startX = e.pageX - container.offsetLeft;
      this.scrollLeft = container.scrollLeft;
      container.classList.add('dragging');
      e.preventDefault();
    });

    container.addEventListener('mousemove', (e: MouseEvent) => {
      if (!this.isDragging) return;
      e.preventDefault();
      const x = e.pageX - container.offsetLeft;
      const walk = (x - this.startX) * 1.5;
      if (Math.abs(walk) > this.minDragDistance) {
        container.scrollLeft = this.scrollLeft - walk;
      }
    });

    container.addEventListener('mouseup', () => {
      console.log('Mouse up event triggered');
      this.isDragging = false;
      container.classList.remove('dragging');
    });

    container.addEventListener('mouseleave', () => {
      this.isDragging = false;
      container.classList.remove('dragging');
    });

    // Touch events for mobile
    container.addEventListener('touchstart', (e: TouchEvent) => {
      this.isDragging = true;
      this.startX = e.touches[0].pageX - container.offsetLeft;
      this.scrollLeft = container.scrollLeft;
      container.classList.add('dragging');
    });

    container.addEventListener('touchmove', (e: TouchEvent) => {
      if (!this.isDragging) return;
      e.preventDefault();
      const x = e.touches[0].pageX - container.offsetLeft;
      const walk = (x - this.startX) * 1.5;
      if (Math.abs(walk) > this.minDragDistance) {
        container.scrollLeft = this.scrollLeft - walk;
      }
    });

    container.addEventListener('touchend', () => {
      this.isDragging = false;
      container.classList.remove('dragging');
    });

    // Prevent context menu on right click
    container.addEventListener('contextmenu', (e: Event) => e.preventDefault());
  }

  get leftIndex() {
    return (this.currentIndex - 1 + this.cards.length) % this.cards.length;
  }

  get rightIndex() {
    return (this.currentIndex + 1) % this.cards.length;
  }

  get visibleCards() {
    if (this.designType === 'list') {
      return this.cards; // Show all cards instead of slicing
    }
    return this.cards;
  }

  prevSlide() {
    if (this.designType === 'carousel' && this.cards.length) {
      this.currentIndex = (this.currentIndex - 1 + this.cards.length) % this.cards.length;
    } else if (this.designType === 'list') {
      if (this.listStartIndex <= 0) {
        // Loop to the end
        this.listStartIndex = Math.max(0, this.cards.length - this.cardsPerPage);
      } else {
        this.listStartIndex = Math.max(0, this.listStartIndex - 1);
      }
      this.updateScrollPosition();
    }
  }

  nextSlide() {
    if (this.designType === 'carousel' && this.cards.length) {
      this.currentIndex = (this.currentIndex + 1) % this.cards.length;
    } else if (this.designType === 'list') {
      if (this.listStartIndex + this.cardsPerPage >= this.cards.length) {
        // Loop back to the beginning
        this.listStartIndex = 0;
      } else {
        this.listStartIndex = Math.min(
          this.cards.length - this.cardsPerPage,
          this.listStartIndex + 1
        );
      }
      this.updateScrollPosition();
    }
  }

  canGoPrev(): boolean {
    if (this.designType === 'carousel') {
      return this.cards.length > 0;
    } else {
      return this.cards.length > this.cardsPerPage; // Always allow if there are more cards than shown
    }
  }

  canGoNext(): boolean {
    if (this.designType === 'carousel') {
      return this.cards.length > 0;
    } else {
      return this.cards.length > this.cardsPerPage; // Always allow if there are more cards than shown
    }
  }

  updateScrollPosition() {
    if (this.listCardsContainer) {
      const container = this.listCardsContainer.nativeElement;
      const cardWidth = container.querySelector('.list-card')?.offsetWidth || 244;
      const gap = 20; // Match the CSS gap
      container.scrollLeft = this.listStartIndex * (cardWidth + gap);
    }
  }

  onCardClick(card: Card, index: number) {
    this.cardClick.emit({ card, index });
  }


   generateGradient(card: Card) {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = card.img;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0, img.width, img.height);

      const imageData = ctx?.getImageData(0, 0, img.width, img.height);
      if (!imageData) return;

      const data = imageData.data;
      const colorCount: Record<string, number> = {};

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const key = `${r},${g},${b}`;
        colorCount[key] = (colorCount[key] || 0) + 1;
      }

      // Sort colors by count (most frequent)
      const sortedColors = Object.keys(colorCount).sort((a, b) => colorCount[b] - colorCount[a]);
      const topColors = sortedColors.slice(0, 3).map(c => `rgb(${c})`);

      card.gradient = `linear-gradient(to bottom, ${topColors.join(', ')})`;
    };
  }


}
