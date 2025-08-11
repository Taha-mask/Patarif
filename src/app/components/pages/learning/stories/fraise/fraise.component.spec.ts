import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FraiseComponent } from './fraise.component';

describe('FraiseComponent', () => {
  let component: FraiseComponent;
  let fixture: ComponentFixture<FraiseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FraiseComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FraiseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
