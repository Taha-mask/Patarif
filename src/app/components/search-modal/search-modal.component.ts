import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../supabase.service';

interface SearchItem {
  id?: string;
  title: string;
  category: 'game' | 'story' | 'product';
  route?: string;
  searchTitle?: string;
}

@Component({
  selector: 'app-search-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search-modal.component.html',
  styleUrls: ['./search-modal.component.css']
})
export class SearchModalComponent implements OnInit {
  @Input() visible: boolean = false;
  @Output() close = new EventEmitter<void>();

  query: string = '';

  items: SearchItem[] = [];

  results: { games: SearchItem[]; learning: SearchItem[]; products: SearchItem[] } = {
    games: [], learning: [], products: []
  };

  iconMap: Record<string, string> = {
    game: 'bi-controller',
    story: 'bi-book-half',
    product: 'bi-basket3-fill'
  };

  isReady: boolean = false;

  constructor(
    private supabase: SupabaseService,
    private router: Router
  ) { }

  async ngOnInit() {
    try {
      const products = await this.supabase.getProductsTitles();
      const games: SearchItem[] = [
        { title: 'Letters Game', category: 'game', route: '/letters-game' },
        { title: 'Country Guessing', category: 'game', route: '/country-guessing' },
        { title: 'True or False', category: 'game', route: '/true-or-false' },
        { title: 'Painting', category: 'game', route: '/painting' },
        { title: 'Sort Words', category: 'game', route: '/sort-words' },
        { title: 'Guess Emoji', category: 'game', route: '/guess-emoji' },
        { title: 'Word to Image', category: 'game', route: '/word-to-image' },
        { title: 'Math Ladder', category: 'game', route: '/math-ladder' },
        { title: 'Geo Quiz', category: 'game', route: '/geo-quiz' }
      ];

      const learning: SearchItem[] = [
        { title: 'Tomate Story', category: 'story', route: '/tomate-story' },
        { title: 'Carotte Story', category: 'story', route: '/carotte-story' },
        { title: 'Banane Story', category: 'story', route: '/banane-story' },
        { title: 'Brocoli Story', category: 'story', route: '/brocoli-story' },
        { title: 'Fraise Story', category: 'story', route: '/fraise-story' }
      ];

      const productItems: SearchItem[] = (products || []).map((p: any) => ({
        id: p.id,
        title: (p.title ?? p.name ?? '').toString(),
        category: 'product'
      }));

      this.items = [...games, ...learning, ...productItems];

      // precompute searchable string for every item
      this.items.forEach(i => {
        i.searchTitle = this.normalizeForSearch(i.title);
      });

      this.isReady = true;
      console.debug('Search items loaded:', this.items.length);
    } catch (err) {
      console.error('Error loading search items', err);
      this.items = [];
      this.isReady = true;
    }
  }

  normalizeForSearch(s: string | undefined | null): string {
    if (!s) return '';
    let t = s.toString().trim().toLowerCase();
    t = t.normalize('NFD').replace(/\p{Diacritic}/gu, '');
    return t;
  }

  search(query: string) {
    if (!this.isReady) {
      console.debug('search() called before items ready; ignoring for now.');
      return;
    }

    if (!query || !query.trim()) {
      this.results = { games: [], learning: [], products: [] };
      return;
    }

    const q = this.normalizeForSearch(query);

    const filtered = this.items.filter(item =>
      (item.searchTitle ?? '').includes(q)
    );

    this.results = {
      games: filtered.filter(i => i.category === 'game'),
      learning: filtered.filter(i => i.category === 'story'),
      products: filtered.filter(i => i.category === 'product'),
    };

    console.debug('Search query:', query, '-> found:', filtered.length);
  }

  goTo(item: SearchItem) {
    this.emitClose();

    if (item.category === 'product' && item.id) {
      console.log(item.id);
      this.router.navigate(['/product-details', item.id]);
      // this.router.navigate(['/shop']);
      return;
    }

    if (item.route) {
      this.router.navigate([item.route]);
      return;
    }

    console.warn('goTo: no route or id for item', item);
  }

  emitClose() {
    this.close.emit();
    this.query = '';
    this.results = { games: [], learning: [], products: [] };
  }
}
