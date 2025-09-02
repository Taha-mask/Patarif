import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GameTemplateComponent } from "../../../../game-template/game-template.component";

interface Card {
  title: string;
  img: string;
}

interface Category {
  name: string;
  images: Card[];
}

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule, GameTemplateComponent],
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.css']
})
export class GalleryComponent implements OnInit {
  selectedImageUrl: string = '';
  isLoading: boolean = false;
  private isDragging: boolean = false;
  private startX: number = 0;
  private scrollLeft: number = 0;

  constructor(private router: Router) {}

  categories: Category[] = [
    {
      name: 'Animals',
      images: [
        { title: 'Cat', img: 'images/card-1.png' },
        { title: 'Dog', img: 'https://cdn.pixabay.com/photo/2016/04/01/10/11/avatar-1299805_960_720.png' },
        { title: 'Fish', img: 'https://cdn.pixabay.com/photo/2012/04/13/20/37/fish-33712_960_720.png' },
        { title: 'Bird', img: 'https://cdn.pixabay.com/photo/2012/04/02/16/03/bird-24859_960_720.png' },
        { title: 'Butterfly', img: 'https://cdn.pixabay.com/photo/2016/03/31/19/50/checklist-1295319_960_720.png' },
        { title: 'Lion', img: 'https://cdn.pixabay.com/photo/2012/04/18/00/07/lion-36299_960_720.png' },
        { title: 'Elephant', img: 'https://cdn.pixabay.com/photo/2012/04/18/00/07/elephant-36300_960_720.png' },
        { title: 'Rabbit', img: 'https://cdn.pixabay.com/photo/2012/04/18/00/07/rabbit-36301_960_720.png' }
      ]
    },
    {
      name: 'Fruits',
      images: [
        { title: 'Apple', img: 'https://cdn.pixabay.com/photo/2012/04/18/13/22/apple-37039_960_720.png' },
        { title: 'Banana', img: 'https://cdn.pixabay.com/photo/2012/04/18/13/22/banana-37040_960_720.png' },
        { title: 'Orange', img: 'https://cdn.pixabay.com/photo/2012/04/18/13/22/orange-37041_960_720.png' },
        { title: 'Grapes', img: 'https://cdn.pixabay.com/photo/2012/04/18/13/22/grapes-37042_960_720.png' },
        { title: 'Strawberry', img: 'https://cdn.pixabay.com/photo/2012/04/18/13/22/strawberry-37043_960_720.png' },
        { title: 'Cherry', img: 'https://cdn.pixabay.com/photo/2012/04/18/13/22/cherry-37044_960_720.png' }
      ]
    },
    {
      name: 'Nature',
      images: [
        { title: 'Tree', img: 'https://cdn.pixabay.com/photo/2017/06/10/07/18/list-2389219_960_720.png' },
        { title: 'Sun', img: 'https://cdn.pixabay.com/photo/2012/04/25/00/26/sun-41116_960_720.png' },
        { title: 'Moon', img: 'https://cdn.pixabay.com/photo/2012/04/25/00/26/moon-41115_960_720.png' },
        { title: 'Flower', img: 'https://cdn.pixabay.com/photo/2017/01/31/13/05/camomile-2023401_960_720.png' },
        { title: 'Cloud', img: 'https://cdn.pixabay.com/photo/2012/04/25/00/26/cloud-41117_960_720.png' },
        { title: 'Mountain', img: 'https://cdn.pixabay.com/photo/2012/04/25/00/26/mountain-41118_960_720.png' }
      ]
    },
    {
      name: 'Objects',
      images: [
        { title: 'House', img: 'https://cdn.pixabay.com/photo/2013/07/12/18/20/house-153112_960_720.png' },
        { title: 'Car', img: 'https://cdn.pixabay.com/photo/2012/04/18/00/07/car-36343_960_720.png' },
        { title: 'Balloon', img: 'https://cdn.pixabay.com/photo/2012/04/18/13/22/balloon-37038_960_720.png' },
        { title: 'Castle', img: 'https://cdn.pixabay.com/photo/2012/04/18/00/07/castle-36297_960_720.png' },
        { title: 'Boat', img: 'https://cdn.pixabay.com/photo/2012/04/18/00/07/boat-36302_960_720.png' },
        { title: 'Airplane', img: 'https://cdn.pixabay.com/photo/2012/04/18/00/07/airplane-36303_960_720.png' }
      ]
    },
    {
      name: 'Symbols',
      images: [
        { title: 'Heart', img: 'https://cdn.pixabay.com/photo/2012/04/26/13/51/heart-41784_960_720.png' },
        { title: 'Star', img: 'https://cdn.pixabay.com/photo/2012/04/18/00/07/star-36298_960_720.png' },
        { title: 'Diamond', img: 'https://cdn.pixabay.com/photo/2012/04/18/00/07/diamond-36304_960_720.png' },
        { title: 'Circle', img: 'https://cdn.pixabay.com/photo/2012/04/18/00/07/circle-36305_960_720.png' },
        { title: 'Triangle', img: 'https://cdn.pixabay.com/photo/2012/04/18/00/07/triangle-36306_960_720.png' },
        { title: 'Square', img: 'https://cdn.pixabay.com/photo/2012/04/18/00/07/square-36307_960_720.png' }
      ]
    }
  ];

  ngOnInit(): void {}

  selectImage(image: Card): void {
    this.isLoading = true;
    this.selectedImageUrl = image.img;
    const encodedImageUrl = encodeURIComponent(image.img);
    this.router.navigate(['/canvas', encodedImageUrl]);
  }

  isImageSelected(imageUrl: string): boolean {
    return this.selectedImageUrl === imageUrl;
  }

  get totalImages(): number {
    return this.categories.reduce((sum, category) => sum + category.images.length, 0);
  }

  // Mouse drag scrolling methods
  onMouseDown(event: MouseEvent, scrollContainer: HTMLElement): void {
    this.isDragging = true;
    this.startX = event.pageX - scrollContainer.offsetLeft;
    this.scrollLeft = scrollContainer.scrollLeft;
    scrollContainer.style.cursor = 'grabbing';
    scrollContainer.style.userSelect = 'none';
  }

  onMouseLeave(scrollContainer: HTMLElement): void {
    this.isDragging = false;
    scrollContainer.style.cursor = 'grab';
    scrollContainer.style.userSelect = 'auto';
  }

  onMouseUp(scrollContainer: HTMLElement): void {
    this.isDragging = false;
    scrollContainer.style.cursor = 'grab';
    scrollContainer.style.userSelect = 'auto';
  }

  onMouseMove(event: MouseEvent, scrollContainer: HTMLElement): void {
    if (!this.isDragging) return;
    event.preventDefault();
    const x = event.pageX - scrollContainer.offsetLeft;
    const walk = (x - this.startX) * 2;
    scrollContainer.scrollLeft = this.scrollLeft - walk;
  }
}