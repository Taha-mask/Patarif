import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CarachterCardComponent } from './carachter-card.component';

describe('CarachterCardComponent', () => {
  let component: CarachterCardComponent;
  let fixture: ComponentFixture<CarachterCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CarachterCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CarachterCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
