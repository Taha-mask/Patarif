import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BananeComponent } from './banane.component';

describe('BananeComponent', () => {
  let component: BananeComponent;
  let fixture: ComponentFixture<BananeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BananeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BananeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
