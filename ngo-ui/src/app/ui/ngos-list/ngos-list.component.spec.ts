import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NgosListComponent } from './ngos-list.component';

describe('NgosListComponent', () => {
  let component: NgosListComponent;
  let fixture: ComponentFixture<NgosListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NgosListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NgosListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
