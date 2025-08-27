import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminProdouctsProductCardComponent } from './admin-prodoucts-product-card.component';

describe('AdminProdouctsProductCardComponent', () => {
  let component: AdminProdouctsProductCardComponent;
  let fixture: ComponentFixture<AdminProdouctsProductCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminProdouctsProductCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminProdouctsProductCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
