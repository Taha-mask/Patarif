import { HomeComponent } from './components/pages/home/home.component';
import { Routes } from '@angular/router';
import { LoginComponent } from './components/account/login/login.component';
import { SignupComponent } from './components/account/signup/signup.component';
import { GamesComponent } from './components/pages/games/games.component';
import { StoriesComponent } from './components/pages/stories/stories.component';
import { LearningComponent } from './components/pages/learning/learning.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { ShopComponent } from './components/pages/shop/shop.component';
import { CountryGuessingComponent } from './components/pages/games/country-guessing/country-guessing.component';
import { LettersGameComponent } from './components/pages/games/letters-game/letters-game.component';
import { FactGameComponent } from './components/pages/games/fact-game/index.js';
import { TomateStoryComponent } from './components/pages/learning/stories/tomate-story/tomate-story.component';
import { CarotteStoryComponent } from './components/pages/learning/stories/carotte-story/carotte-story.component';
import { BananeComponent } from './components/pages/learning/stories/banane/banane.component';
import { ProfileComponent } from './components/pages/profile/profile.component';
import { BrocoliComponent } from './components/pages/learning/stories/brocoli/brocoli.component';
import { FraiseComponent } from './components/pages/learning/stories/fraise/fraise.component';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { AddProductComponent } from './admin-dashboard/add-product/add-product.component';
import { AdminProductsComponent } from './admin-dashboard/admin-products/admin-products.component';
import { AdminOrdersComponent } from './admin-dashboard/admin-orders/admin-orders.component';
import { ProductDetailsComponent } from './components/pages/shop/product-details/product-details.component';
import { CartComponent } from './components/pages/shop/cart/cart.component';
import { GalleryComponent } from './components/pages/games/paint/gallery/gallery.component';
import { CanvasComponent } from './components/pages/games/paint/canvas/canvas.component';
// import { MapComponent } from './components/pages/games/map/map.component';
import { GuessEemojiComponent } from './components/pages/games/guess-eemoji/guess-eemoji.component';
import { SortWordsComponent } from './components/pages/games/sort-words/sort-words.component';
import { MatchintWordsComponent } from './components/pages/games/matchint-words/matchint-words.component';
import { MathLadderComponent } from './components/pages/games/math-ladder/math-ladder.component';
import { GeoQuizComponent } from './components/pages/games/geo-quiz/geo-quiz.component';
import { ContactUsComponent } from './components/pages/contact-us/contact-us.component';
import { AdminContactMessagesComponent } from './admin-dashboard/admin-contact-messages/admin-contact-messages.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full', data: { renderMode: 'client' } },

  // Games
  { path: 'guess-eemoji', component: GuessEemojiComponent },
  { path: 'matchint-words', component: MatchintWordsComponent },
  { path: 'sort-words', component: SortWordsComponent },
  { path: 'gallery', component: GalleryComponent },
  { path: 'canvas/:imageUrl', component: CanvasComponent }, 
  { path: 'letters-game', component: LettersGameComponent },
  { path: 'country-guessing', component: CountryGuessingComponent },
  { path: 'fact-game', component: FactGameComponent },
  { path: 'math-ladder', component: MathLadderComponent },
  { path: 'geo-quiz', component: GeoQuizComponent },

  // Account
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'profile', component: ProfileComponent },

  // Pages
  { path: 'games', component: GamesComponent },
  { path: 'stories', component: StoriesComponent },
  { path: 'learning', component: LearningComponent },
  { path: 'shop', component: ShopComponent },
  { path: 'home', component: HomeComponent },

  // Learning stories
  { path: 'tomate-story', component: TomateStoryComponent },
  { path: 'carotte-story', component: CarotteStoryComponent },
  { path: 'banane-story', component: BananeComponent },
  { path: 'brocoli-story', component: BrocoliComponent },
  { path: 'fraise-story', component: FraiseComponent },

  // Admin
  { path: 'admin-dashboard', component: AdminDashboardComponent },
  { path: 'add-product', component: AddProductComponent },
  { path: 'admin-products', component: AdminProductsComponent },
  { path: 'app-admin-orders', component: AdminOrdersComponent },
  { path: 'contact-messages', component: AdminContactMessagesComponent },

  // Shop
  { 
    path: 'product-details/:id', 
    loadComponent: () => import('./components/pages/shop/product-details/product-details.component')
      .then(m => m.ProductDetailsComponent),
    data: { renderMode: 'client' }
  },
  { path: 'cart', component: CartComponent },
];
