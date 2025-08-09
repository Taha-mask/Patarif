import { Component, OnInit, AfterViewInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeroSectionComponent } from './hero-section/hero-section.component';
import { IntroductionComponent } from './introduction/introduction.component';
import { BackgroundComponent } from '../../background/background.component';
import { CategoriesComponent } from "./categories/categories.component";
import { HomeGamesComponent } from './home-games/home-games.component';
import { CharactersHomeComponent } from "./characters-home/characters-home.component";
import { HomeFooterComponent } from "./home-footer/home-footer.component";
import { StarsBackgroundComponent } from '../../stars-background/stars-background.component';
import { SupabaseService } from '../../../supabase.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    HeroSectionComponent,
    IntroductionComponent,
    BackgroundComponent,
    CategoriesComponent,
    HomeGamesComponent,
    CharactersHomeComponent,
    HomeFooterComponent,
    StarsBackgroundComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, AfterViewInit {


  constructor(private supabase: SupabaseService) { }
ngOnInit() {
  const welcomeMessage = localStorage.getItem('welcomeMessage');
  if (welcomeMessage) {
    const { title, text, icon } = JSON.parse(welcomeMessage);
    Swal.fire({ title, text, icon });
    localStorage.removeItem('welcomeMessage');
  }
}


  ngAfterViewInit() {
    this.initializeScrollAnimations();
  }

  private initializeScrollAnimations() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate');
          // Add aos-animate class for AOS compatibility
          entry.target.classList.add('aos-animate');
        }
      });
    }, observerOptions);

    // Observe all component animation elements
    const animatedElements = document.querySelectorAll('.component-animation');
    animatedElements.forEach(element => {
      observer.observe(element);
    });
  }
}
