import { Component, OnInit, HostListener, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Star {
  id: number;
  top: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
}

@Component({
  selector: 'app-stars-background',
  imports: [CommonModule],
  templateUrl: './stars-background.component.html',
  styleUrl: './stars-background.component.css'
})
export class StarsBackgroundComponent implements OnInit {
  @ViewChild('starsContainer', { static: true }) starsContainer!: ElementRef;
  
  stars: Star[] = [];
  private scrollY = 0;
  private readonly STAR_COUNT = 10; // Generate 20 stars
  private windowWidth = 0;
  private windowHeight = 0;

  ngOnInit() {
    this.updateWindowDimensions();
    this.generateStars();
  }

  @HostListener('window:scroll', ['$event'])
  onScroll() {
    this.scrollY = window.scrollY;
    this.updateStarsPosition();
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.updateWindowDimensions();
    this.regenerateStars();
  }

  private updateWindowDimensions() {
    this.windowWidth = window.innerWidth;
    this.windowHeight = window.innerHeight;
  }

  private generateStars() {
    this.stars = [];
    for (let i = 0; i < this.STAR_COUNT; i++) {
      const size = 200 + Math.random() * 200; // Random size between 200-400px
      const maxTop = this.windowHeight - size;
      const maxLeft = this.windowWidth - size;
      
      this.stars.push({
        id: i,
        top: Math.random() * maxTop, // Ensure star stays within viewport height
        left: Math.random() * maxLeft, // Ensure star stays within viewport width
        delay: Math.random() * 3,
        duration: 3 + Math.random() * 3,
        size: size
      });
    }
  }

  private regenerateStars() {
    this.generateStars();
  }

  private updateStarsPosition() {
    // Parallax effect - stars move at different speeds based on scroll
    this.stars.forEach((star, index) => {
      const parallaxSpeed = 0.05 + (index % 3) * 0.05; // Reduced speed for smoother movement
      let newTop = star.top - (this.scrollY * parallaxSpeed);
      
      // Constrain star within viewport bounds
      const maxTop = this.windowHeight - star.size;
      const maxLeft = this.windowWidth - star.size;
      
      // Keep star within vertical bounds
      if (newTop < 0) {
        newTop = 0;
      } else if (newTop > maxTop) {
        newTop = maxTop;
      }
      
      // Keep star within horizontal bounds
      if (star.left < 0) {
        star.left = 0;
      } else if (star.left > maxLeft) {
        star.left = maxLeft;
      }
      
      star.top = newTop;
    });
  }

  trackByStar(index: number, star: Star): number {
    return star.id;
  }
}
