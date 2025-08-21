import { Routes } from '@angular/router';

export const paintRoutes: Routes = [
  {
    path: '',
    redirectTo: 'gallery',
    pathMatch: 'full'
  },
  {
    path: 'gallery',
    loadComponent: () => import('./gallery/gallery.component').then(m => m.GalleryComponent),
    title: 'Paint Gallery - Choose an Image'
  },
  {
    path: 'canvas/:imageUrl',
    loadComponent: () => import('./canvas/canvas.component').then(m => m.CanvasComponent),
    title: 'Paint Canvas - Create Your Art'
  }
];
