import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminContactMessagesComponent } from './admin-contact-messages.component';

describe('AdminContactMessagesComponent', () => {
  let component: AdminContactMessagesComponent;
  let fixture: ComponentFixture<AdminContactMessagesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminContactMessagesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminContactMessagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
