import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SliderCharactersHomeComponent } from './slider-characters-home.component';

describe('SliderCharactersHomeComponent', () => {
  let component: SliderCharactersHomeComponent;
  let fixture: ComponentFixture<SliderCharactersHomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SliderCharactersHomeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SliderCharactersHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
