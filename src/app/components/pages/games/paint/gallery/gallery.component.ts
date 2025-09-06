import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { GameTemplateComponent } from "../../../../game-template/game-template.component";
import animauxData from '../../../../../../../public/images/Final images/Animals/animals.json';
import lieuxData from '../../../../../../../public/images/Final images/Places/places.json';
import objetsData from '../../../../../../../public/images/Final images/Things/things.json';
import plantesData from '../../../../../../../public/images/Final images/Plants/plants.json';
import personnagesData from '../../../../../../../public/images/Final images/Characters/characters.json';
import nourritureData from '../../../../../../../public/images/Final images/Food&Drinks/food.json';
import transportData from '../../../../../../../public/images/Final images/Transportation/transportation.json';
import patarifData from '../../../../../../../public/images/Final images/Patarif/patarif.json';

interface Carte {
  titre: string;
  img: string;
}

interface Categorie {
  nom: string;
  images: Carte[];
}

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule, GameTemplateComponent],
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.css']
})
export class GalleryComponent implements OnInit {
  imageSelectionneeUrl: string = '';
  estChargement: boolean = false;
  private estGlissant: boolean = false;
  private startX: number = 0;
  private scrollGauche: number = 0;

  constructor(private router: Router, private route: ActivatedRoute) {}

  selectionnerImage(image: Carte): void {
    this.imageSelectionneeUrl = image.img; // mettre à jour la sélection
    this.router.navigate(['../canvas'], { 
      relativeTo: this.route,
      queryParams: { imageUrl: encodeURIComponent(image.img) }
    });
  }  

  categories: Categorie[] = [
    {
      nom: 'Patarif',
      images: patarifData.map((fileName: string, index: number) => ({
        titre: `Patarif ${index + 1}`,
        img: `images/Final images/Patarif/${fileName}`
      }))
    },
    {
      nom: 'Animaux',
      images: animauxData.map((fileName: string, index: number) => ({
        titre: `Animal ${index + 1}`,
        img: `images/Final images/Animals/${fileName}`
      }))
    },
    {
      nom: 'Lieux',
      images: lieuxData.map((fileName: string, index: number) => ({
        titre: `Lieu ${index + 1}`,
        img: `images/Final images/Places/${fileName}`
      }))
    },
    {
      nom: 'Objets',
      images: objetsData.map((fileName: string, index: number) => ({
        titre: `Objet ${index + 1}`,
        img: `images/Final images/Things/${fileName}`
      }))
    },
    {
      nom: 'Plantes',
      images: plantesData.map((fileName: string, index: number) => ({
        titre: `Plante ${index + 1}`,
        img: `images/Final images/Plants/${fileName}`
      }))
    },
    {
      nom: 'Personnages',
      images: personnagesData.map((fileName: string, index: number) => ({
        titre: `Personnage ${index + 1}`,
        img: `images/Final images/Characters/${fileName}`
      }))
    },
    {
      nom: 'Nourriture',
      images: nourritureData.map((fileName: string, index: number) => ({
        titre: `Nourriture ${index + 1}`,
        img: `images/Final images/Food&Drinks/${fileName}`
      }))
    },
    {
      nom: 'Transport',
      images: transportData.map((fileName: string, index: number) => ({
        titre: `Transport ${index + 1}`,
        img: `images/Final images/Transportation/${fileName}`
      }))
    }
  ];

  ngOnInit(): void {}

  estImageSelectionnee(imageUrl: string): boolean {
    return this.imageSelectionneeUrl === imageUrl;
  }

  get totalImages(): number {
    return this.categories.reduce((sum, category) => sum + category.images.length, 0);
  }

  // Méthodes pour le défilement par glissement de la souris
  onMouseDown(event: MouseEvent, scrollContainer: HTMLElement): void {
    this.estGlissant = true;
    this.startX = event.pageX - scrollContainer.offsetLeft;
    this.scrollGauche = scrollContainer.scrollLeft;
    scrollContainer.style.cursor = 'grabbing';
    scrollContainer.style.userSelect = 'none';
  }

  onMouseLeave(scrollContainer: HTMLElement): void {
    this.estGlissant = false;
    scrollContainer.style.cursor = 'grab';
    scrollContainer.style.userSelect = 'auto';
  }

  onMouseUp(scrollContainer: HTMLElement): void {
    this.estGlissant = false;
    scrollContainer.style.cursor = 'grab';
    scrollContainer.style.userSelect = 'auto';
  }

  onMouseMove(event: MouseEvent, scrollContainer: HTMLElement): void {
    if (!this.estGlissant) return;
    event.preventDefault();
    const x = event.pageX - scrollContainer.offsetLeft;
    const deplacement = (x - this.startX) * 2;
    scrollContainer.scrollLeft = this.scrollGauche - deplacement;
  }
}
