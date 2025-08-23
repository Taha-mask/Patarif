import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FavProCardComponent } from './fav-pro-card.component';

describe('FavProCardComponent', () => {
  let component: FavProCardComponent;
  let fixture: ComponentFixture<FavProCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FavProCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FavProCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
