import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CelebrateModalComponent } from './celebrate-modal.component';

describe('CelebrateModalComponent', () => {
  let component: CelebrateModalComponent;
  let fixture: ComponentFixture<CelebrateModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CelebrateModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CelebrateModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
