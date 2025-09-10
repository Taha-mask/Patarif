// slider-characters-home.component.ts
import { Component, ElementRef, AfterViewInit, OnInit } from '@angular/core';
import { CarachterCardComponent } from "../carachter-card/carachter-card.component";
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../../../../supabase.service';
import { LoadingComponent } from "../../../../loading/loading.component";

@Component({
  selector: 'app-slider-characters-home',
  imports: [CarachterCardComponent, CommonModule, LoadingComponent],
  standalone: true,
  templateUrl: './slider-characters-home.component.html',
  styleUrl: './slider-characters-home.component.css'
})
export class SliderCharactersHomeComponent implements OnInit, AfterViewInit {
  designType: string = 'carousel';

  characters: Array<{ bgIcon: string; character: string; name: string; raiting: number }> = [];
  currentIndex = 0;

  isLoading: boolean = false; // ✅ loading state

  private startX: number = 0;
  private endX: number = 0;

  // Background icons used for alternating backgrounds
  private bgIcons = [
    'images/characters/yellow_Subtract.png',
    'images/characters/purple_Subtract.png',
    'images/characters/red_Subtract.png',
    'images/characters/blue_Subtract.png'
  ];

  constructor(private el: ElementRef, private supabaseService: SupabaseService) {}

  async ngOnInit() {
    await this.loadCharactersFromDbOrStorage();
  }

  ngAfterViewInit() {
    const cards = this.el.nativeElement.querySelector('.cards');
    if (!cards) return;

    // Touch start
    cards.addEventListener('touchstart', (e: TouchEvent) => {
      this.startX = e.touches[0].clientX;
    });

    // Touch move
    cards.addEventListener('touchmove', (e: TouchEvent) => {
      this.endX = e.touches[0].clientX;
    });

    // Touch end -> detect swipe
    cards.addEventListener('touchend', () => {
      const diff = this.startX - this.endX;
      if (Math.abs(diff) > 50) {
        if (diff > 0) this.nextSlide();
        else this.prevSlide();
      }
      this.startX = 0;
      this.endX = 0;
    });
  }

  // ---------- index helpers ----------
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

  // ---------- load data ----------
  private async loadCharactersFromDbOrStorage() {
    this.isLoading = true; // start loading

    try {
      // Try to get supabase client from the service
      const supabaseClient: any =
        (this.supabaseService as any).supabase ??
        (this.supabaseService as any).client ??
        (this.supabaseService as any);

      if (!supabaseClient) {
        console.error('Supabase client not found on SupabaseService.');
        this.useFallbackHardcoded();
        return;
      }

      // 1) Try to fetch rows from "patarif_characters"
      const { data: rows, error: selectErr } = await supabaseClient
        .from('patarif_characters')
        .select('*')
        .order('name', { ascending: true });

      if (!selectErr && Array.isArray(rows) && rows.length > 0) {
        this.characters = await Promise.all(
          rows.map(async (r: any, idx: number) => {
            const rawImage = r.image ?? '';
            let publicUrl = '';

            // Case 1: image is already a valid URL
            if (typeof rawImage === 'string' && rawImage.startsWith('http')) {
              publicUrl = rawImage;
            } else {
              // Case 2: image stored as a path inside a bucket
              const bucket = 'characters';
              const path =
                typeof rawImage === 'string'
                  ? rawImage.replace(new RegExp(`^${bucket}/`), '')
                  : `${r.name}.png`;

              try {
                const { data: urlData } = supabaseClient.storage.from(bucket).getPublicUrl(path);
                publicUrl = urlData?.publicUrl ?? '';
              } catch {
                const projectRef = (supabaseClient?.url ?? '').replace(/^https?:\/\//, '');
                publicUrl = projectRef
                  ? `https://${projectRef}/storage/v1/object/public/${bucket}/${path}`
                  : `/assets/fallback/${path}`;
              }
            }

            return {
              bgIcon: this.bgIcons[idx % this.bgIcons.length],
              character: publicUrl || `images/characters/${r.name}.png`,
              name: r.name,
              raiting: Number(r.rate ?? 0)
            };
          })
        );

        if (this.currentIndex >= this.characters.length) this.currentIndex = 0;
        return;
      }

      // 2) If no rows, try to list files directly from storage
      const bucket = 'characters';
      const { data: list, error: listErr } = await supabaseClient.storage
        .from(bucket)
        .list('', { limit: 1000 });

      if (!listErr && Array.isArray(list) && list.length > 0) {
        const filtered = list.filter(
          (f: any) =>
            f.name !== '.emptyFolderPlaceholder' && /\.(png|jpg|jpeg|webp)$/i.test(f.name)
        );

        this.characters = filtered.map((file: any, idx: number) => {
          let publicUrl = '';
          try {
            const { data: urlData } = supabaseClient.storage.from(bucket).getPublicUrl(file.name);
            publicUrl = urlData?.publicUrl ?? '';
          } catch {
            const projectRef = (supabaseClient?.url ?? '').replace(/^https?:\/\//, '');
            publicUrl = projectRef
              ? `https://${projectRef}/storage/v1/object/public/${bucket}/${file.name}`
              : `images/characters/${file.name}`;
          }

          const nameWithoutExt = file.name.replace(/^.*[\\/]/, '').replace(/\.[^.]+$/, '');
          return {
            bgIcon: this.bgIcons[idx % this.bgIcons.length],
            character: publicUrl,
            name: nameWithoutExt,
            raiting: 0
          };
        });

        if (this.currentIndex >= this.characters.length) this.currentIndex = 0;
        return;
      }
    } catch (err) {
      console.warn('Error while loading characters:', err);
    } finally {
      this.isLoading = false; // stop loading in all cases
    }

    // 3) Fallback to hardcoded array if nothing is found
    this.useFallbackHardcoded();
    this.isLoading = false;
  }


  
  private useFallbackHardcoded() {
    this.characters = [
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
      }
      // ... add more fallback characters if needed
    ];
  }
}
