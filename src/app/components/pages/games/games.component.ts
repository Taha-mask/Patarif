import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CardsComponent } from '../../cards/cards.component';
import { Card } from '../../../interface/card';
import { BackgroundComponent } from "../../background/background.component";
import { StarsBackgroundComponent } from "../../stars-background/stars-background.component";
import { LinesBackgroundComponent } from "../../lines-background/lines-background.component";
import { AuthService } from '../../../services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-games',
  templateUrl: './games.component.html',
  styleUrls: ['./games.component.css'],
  imports: [BackgroundComponent, CardsComponent, StarsBackgroundComponent, LinesBackgroundComponent, CommonModule],
  standalone: true
})
export class GamesComponent {
  constructor(private router: Router, private authService: AuthService) {}

  // helper: decide if the route/title corresponds to the "colors" game (excluded from auth check)
  private isColorsGame(route?: string, title?: string): boolean {
    if (!route && !title) return false;
    const check = (s?: string) => (s ?? '').toLowerCase();
    const r = check(route);
    const t = check(title);
    // common keywords for colors game (add more if your route/title uses different words)
    const colorKeywords = ['color', 'colour', 'ألوان', 'الوان', 'colors', 'colors-game', '/colors', 'colors'];
    return colorKeywords.some(k => r.includes(k) || t.includes(k));
  }

  // centralised protected navigate
  private async protectedNavigate(route: string, title?: string) {
    // if it's colors game — bypass auth
    if (this.isColorsGame(route, title)) {
      this.router.navigate([route]);
      return;
    }

    // otherwise require login
    const logged = await this.authService.isLoggedIn();
    if (logged) {
      this.router.navigate([route]);
    } else {
      Swal.fire({
        title: 'You need to log in',
        text: 'You must have an account to enter this game.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Login',
        cancelButtonText: 'Cancel'
      }).then(result => {
        if (result.isConfirmed) {
          this.router.navigate(['/login']);
        }
      });
    }
  }

  // used when template calls navigateTo(route)
  async navigateTo(route: string, title?: string) {
    await this.protectedNavigate(route, title);
  }

  async onCardClick(event: {card: Card, index: number}) {
    // If card has an explicit route, use it (and pass card.title so isColorsGame can check)
    if (event.card.route) {
      await this.protectedNavigate(event.card.route, event.card.title);
      return;
    }

    // Fallback index-based mapping (same mapping as your original)
    let route = '';
    let title = event.card.title ?? '';

    if (event.index === 0) {
      route = '/letters-game';
    } else if (event.index === 1) {
      route = '/country-guessing';
    } else if (event.index === 2) {
      route = '/fact-game';
    } else if (event.index === 3) {
      route = '/gallery';
    } else if (event.index === 4) {
      route = '/sort-words';
    } else if (event.index === 5) {
      route = '/guess-eemoji';
    } else if (event.index === 6) {
      route = '/matchint-words';
    } else if (event.index === 7) {
      route = '/math-ladder';
    } else if (event.index === 8) {
      route = '/geo-quiz';
    }

    if (route) {
      await this.protectedNavigate(route, title);
    }
  }

  cardSet1: Card[] = [
    {
      img: '/images/1111.jpg',
      route: '/gallery'
    },
    {
      img: 'images/2222.jpg',
      route: '/math-ladder'
    },
    {
      img: 'images/3333.jpg',
      route: '/geo-quiz'
    }
  ];
  cardSet2: Card[] = [
    {
      title: 'Trier les lettres',
      img: '/images/sort.jpg',
    },
    {
      title: 'Deviner le pays',
      img: '/images/place.jpg',
    },
    {
      title: 'Vrai ou Faux',
      img: '/images/fact.jpg',
    },
    {
      title: 'Peinture',
      img: '/images/paint.jpg',
    },
    {
      title: 'Trier les mots',
      img: '/images/sortword.jpg',
    },
    {
      title: 'Deviner l\'emoji',
      img: '/images/emoji.jpg',
    },
    {
      title: 'Mot à Image',
      img: 'images/matching.jpg',
    },
    {
      title: 'Escalier Mathématique',
      img: 'images/math.jpg',
    },
    {
      title: 'Quiz Géographie',
      img: 'images/map.jpg',
    },
  ];
}
