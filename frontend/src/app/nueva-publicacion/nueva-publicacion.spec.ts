import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { NuevaPublicacion } from './nueva-publicacion';

describe('NuevaPublicacion', () => {
  let component: NuevaPublicacion;
  let fixture: ComponentFixture<NuevaPublicacion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NuevaPublicacion],
      providers: [provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(NuevaPublicacion);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
