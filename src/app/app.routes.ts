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
import { GalleryComponent } from './components/pages/games/paint/gallery/gallery.component';
import { CanvasComponent } from './components/pages/games/paint/canvas/canvas.component';
// import { MapComponent } from './components/pages/games/map/map.component';
import { GuessEemojiComponent } from './components/pages/games/guess-eemoji/guess-eemoji.component';
import { SortWordsComponent } from './components/pages/games/sort-words/sort-words.component';
import { MatchintWordsComponent } from './components/pages/games/matchint-words/matchint-words.component';
export const routes: Routes = [
  { path: 'guess-eemoji', component: GuessEemojiComponent },
  { path: 'matchint-words', component: MatchintWordsComponent },
  { path: 'gallery', component: GalleryComponent },
  { path: 'canvas/:imageUrl', component: CanvasComponent },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'games', component: GamesComponent },
  { path: 'letters-game', component: LettersGameComponent },
  { path: 'country-guessing', component: CountryGuessingComponent },
  { path: 'fact-game', component: FactGameComponent },
  { path: 'stories', component: StoriesComponent },
  { path: 'learning', component: LearningComponent },
  { path: 'shop', component: ShopComponent },
  { path: 'home', component: HomeComponent },
  { path: 'tomate-story', component: TomateStoryComponent },
  { path: 'carotte-story', component: CarotteStoryComponent },
  { path: 'banane-story', component: BananeComponent },
  { path: 'brocoli-story', component: BrocoliComponent},
  { path: 'fraise-story', component: FraiseComponent },
  // { path: 'map', component: MapComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'sort-words', component: SortWordsComponent },
];
