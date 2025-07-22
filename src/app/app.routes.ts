import { HomeComponent } from './components/pages/home/home.component';
import { Routes } from '@angular/router';
import { LoginComponent } from './components/account/login/login.component';
import { SignupComponent } from './components/account/signup/signup.component';
import { GamesComponent } from './components/pages/games/games.component';
import { StoriesComponent } from './components/pages/stories/stories.component';
import { LearningComponent } from './components/pages/learning/learning.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { ShopComponent } from './components/pages/shop/shop.component';
import path from 'path';


export const routes: Routes = [
  { path: '', redirectTo: 'signup', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'games', component: GamesComponent },
  { path: 'stories', component: StoriesComponent },
  { path: 'learning', component: LearningComponent },
  { path: 'shop', component: ShopComponent },
  { path: 'home', component: HomeComponent },

];
