import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CarotteStoryComponent } from './carotte-story.component';

describe('CarotteStoryComponent', () => {
  let component: CarotteStoryComponent;
  let fixture: ComponentFixture<CarotteStoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CarotteStoryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CarotteStoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
