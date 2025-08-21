import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CountryGuessingComponent } from './country-guessing.component';

describe('CountryGuessingComponent', () => {
  let component: CountryGuessingComponent;
  let fixture: ComponentFixture<CountryGuessingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CountryGuessingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CountryGuessingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
