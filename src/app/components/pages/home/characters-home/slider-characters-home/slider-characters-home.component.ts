import { Component, HostListener, ElementRef, AfterViewInit } from '@angular/core';
import { CarachterCardComponent } from "../carachter-card/carachter-card.component";
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-slider-characters-home',
  imports: [CarachterCardComponent, CommonModule],
  standalone: true,
  templateUrl: './slider-characters-home.component.html',
  styleUrl: './slider-characters-home.component.css'
})
export class SliderCharactersHomeComponent implements AfterViewInit {
  designType: string = 'carousel';

  characters = [
    {
      bgIcon: 'images/characters/yellow_Subtract.png',
      character: 'images/characters/patadogg.png',
      name: 'patadogg',
      raiting: 4.8
    },
    {
      bgIcon: 'images/characters/purple_Subtract.png',
      character: 'images/characters/pata-beauxyeux.png',
      name: 'pata-beauxyeux',
      raiting: 6.0
    },
    {
      bgIcon: 'images/characters/red_Subtract.png',
      character: 'images/characters/bling.png',
      name: 'bling',
      raiting: 5.2
    },
    {
      bgIcon: 'images/characters/blue_Subtract.png',
      character: 'images/characters/cowboy-bananes.png',
      name: 'cowboy-bananes',
      raiting: 5.5
    },
    {
      bgIcon: 'images/characters/red_Subtract.png',
      character: 'images/characters/patafouine.png',
      name: 'patafouine',
      raiting: 6.0
    },
    // ===================== [5]========================
    {
      bgIcon: 'images/characters/yellow_Subtract.png',
      character: 'images/characters/Patafreko.png',
      name: 'Patafreko',
      raiting: 4.8
    },
    {
      bgIcon: 'images/characters/purple_Subtract.png',
      character: 'images/characters/patafreko-armure-seul.png',
      name: 'patafreko-armure-seul',
      raiting: 6.0
    },
    {
      bgIcon: 'images/characters/red_Subtract.png',
      character: 'images/characters/patagaga.png',
      name: 'patagaga',
      raiting: 5.2
    },
    {
      bgIcon: 'images/characters/blue_Subtract.png',
      character: 'images/characters/Patago.png',
      name: 'Patago',
      raiting: 5.5
    },
    {
      bgIcon: 'images/characters/red_Subtract.png',
      character: 'images/characters/Pataiung.png',
      name: 'Pataiung',
      raiting: 6.0
    },
    // ===================== [10]========================
    {
      bgIcon: 'images/characters/yellow_Subtract.png',
      character: 'images/characters/Patajohn.png',
      name: 'Patajohn',
      raiting: 4.8
    },
    {
      bgIcon: 'images/characters/purple_Subtract.png',
      character: 'images/characters/Patakaba.png',
      name: 'Patakaba',
      raiting: 8.0
    },
    {
      bgIcon: 'images/characters/red_Subtract.png',
      character: 'images/characters/Patalee.png',
      name: 'Patalee',
      raiting: 5.2
    },
    {
      bgIcon: 'images/characters/blue_Subtract.png',
      character: 'images/characters/Patalia.png',
      name: 'Patalia',
      raiting: 5.5
    },
    {
      bgIcon: 'images/characters/red_Subtract.png',
      character: 'images/characters/patalia-armure-seule.png',
      name: 'patalia-armure-seule',
      raiting: 6.0
    },
    // ===================== [15]========================
    {
      bgIcon: 'images/characters/yellow_Subtract.png',
      character: 'images/characters/Patalou.png',
      name: 'Patalou',
      raiting: 4.8
    },
    {
      bgIcon: 'images/characters/purple_Subtract.png',
      character: 'images/characters/patalou-armure-seule.png',
      name: 'patalou-armure-seule',
      raiting: 3.0
    },
    {
      bgIcon: 'images/characters/red_Subtract.png',
      character: 'images/characters/Pataluna.png',
      name: 'Pataluna',
      raiting: 5.2
    },
    {
      bgIcon: 'images/characters/blue_Subtract.png',
      character: 'images/characters/pataluna-armure-seule.png',
      name: 'pataluna-armure-seule',
      raiting: 5.5
    },
    {
      bgIcon: 'images/characters/red_Subtract.png',
      character: 'images/characters/patamama.png',
      name: 'patamama',
      raiting: 6.0
    },
    // ===================== [20]========================
    {
      bgIcon: 'images/characters/yellow_Subtract.png',
      character: 'images/characters/Patamed.png',
      name: 'Patamed',
      raiting: 4.8
    },
    {
      bgIcon: 'images/characters/purple_Subtract.png',
      character: 'images/characters/patamed-armure-seul.png',
      name: 'patamed-armure-seul',
      raiting: 1.0
    },
    {
      bgIcon: 'images/characters/red_Subtract.png',
      character: 'images/characters/Patamex.png',
      name: 'Patamex',
      raiting: 5.2
    },
    {
      bgIcon: 'images/characters/blue_Subtract.png',
      character: 'images/characters/Patanash.png',
      name: 'Patanash',
      raiting: 3.5
    },
    {
      bgIcon: 'images/characters/red_Subtract.png',
      character: 'images/characters/Patanouze.png',
      name: 'Patanouze',
      raiting: 1.5
    },
    // ===================== [25]========================
    {
      bgIcon: 'images/characters/yellow_Subtract.png',
      character: 'images/characters/patanouze-armure-seule.png',
      name: 'patanouze-armure-seule',
      raiting: 4.8
    },
    {
      bgIcon: 'images/characters/purple_Subtract.png',
      character: 'images/characters/PataPJ.png',
      name: 'PataPJ',
      raiting: 6.0
    },
    {
      bgIcon: 'images/characters/red_Subtract.png',
      character: 'images/characters/Patapo.png',
      name: 'Patapo',
      raiting: 5.2
    },
    {
      bgIcon: 'images/characters/blue_Subtract.png',
      character: 'images/characters/patapo-armure-seule.png',
      name: 'patapo-armure-seule',
      raiting: 5.5
    },
    {
      bgIcon: 'images/characters/red_Subtract.png',
      character: 'images/characters/pataprano.png',
      name: 'pataprano',
      raiting: 2.0
    },
    // ===================== [30]========================
    {
      bgIcon: 'images/characters/yellow_Subtract.png',
      character: 'images/characters/Patari.png',
      name: 'Patari',
      raiting: 4.8
    },
    {
      bgIcon: 'images/characters/purple_Subtract.png',
      character: 'images/characters/patarif.png',
      name: 'patarif',
      raiting: 6.0
    },
    {
      bgIcon: 'images/characters/red_Subtract.png',
      character: 'images/characters/patarif-armure-seul.png',
      name: 'patarif-armure-seul',
      raiting: 5.2
    },
    {
      bgIcon: 'images/characters/blue_Subtract.png',
      character: 'images/characters/Patarose.png',
      name: 'Patarose',
      raiting: 5.5
    },
    {
      bgIcon: 'images/characters/red_Subtract.png',
      character: 'images/characters/PataUG.png',
      name: 'PataUG',
      raiting: 6.0
    },
    // ===================== [35]========================
    {
      bgIcon: 'images/characters/red_Subtract.png',
      character: 'images/characters/PataUG-autruche.png',
      name: 'PataUG-autruche',
      raiting: 5.2
    },
    {
      bgIcon: 'images/characters/blue_Subtract.png',
      character: 'images/characters/Patazak.png',
      name: 'Patazak',
      raiting: 5.5
    },
    {
      bgIcon: 'images/characters/red_Subtract.png',
      character: 'images/characters/Patazako.png',
      name: 'Patazako',
      raiting: 6.0
    }
    // ===================== [38]========================
  ];
  currentIndex = 2;

  private startX: number = 0;
  private endX: number = 0;

  constructor(private el: ElementRef) {}

  ngAfterViewInit() {
    const cards = this.el.nativeElement.querySelector('.cards');

    cards.addEventListener('touchstart', (e: TouchEvent) => {
      this.startX = e.touches[0].clientX;
    });

    cards.addEventListener('touchmove', (e: TouchEvent) => {
      this.endX = e.touches[0].clientX;
    });

    cards.addEventListener('touchend', () => {
      const diff = this.startX - this.endX;
      if (Math.abs(diff) > 50) { // لو السحب كفاية
        if (diff > 0) {
          this.nextSlide(); // سحب لليسار => next
        } else {
          this.prevSlide(); // سحب لليمين => prev
        }
      }
      this.startX = 0;
      this.endX = 0;
    });
  }

  get leftIndex() {
    return this.currentIndex === 0 ? this.characters.length - 1 : this.currentIndex - 1;
  }

  get rightIndex() {
    return this.currentIndex === this.characters.length - 1 ? 0 : this.currentIndex + 1;
  }

  get left2Index() {
    if (this.currentIndex === 0) return this.characters.length - 2;
    if (this.currentIndex === 1) return this.characters.length - 1;
    return this.currentIndex - 2;
  }

  get right2Index() {
    if (this.currentIndex === this.characters.length - 1) return 1;
    if (this.currentIndex === this.characters.length - 2) return 0;
    return this.currentIndex + 2;
  }

  prevSlide() {
    this.currentIndex = (this.currentIndex - 1 + this.characters.length) % this.characters.length;
  }

  nextSlide() {
    this.currentIndex = (this.currentIndex + 1) % this.characters.length;
  }
}
