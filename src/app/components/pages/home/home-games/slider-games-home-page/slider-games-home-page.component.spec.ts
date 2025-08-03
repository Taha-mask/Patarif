import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SliderGamesHomePageComponent } from './slider-games-home-page.component';

describe('SliderGamesHomePageComponent', () => {
  let component: SliderGamesHomePageComponent;
  let fixture: ComponentFixture<SliderGamesHomePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SliderGamesHomePageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SliderGamesHomePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
