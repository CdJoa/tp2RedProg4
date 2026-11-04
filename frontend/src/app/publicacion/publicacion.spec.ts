import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { Publicacion } from './publicacion';

describe('Publicacion', () => {
  let component: Publicacion;
  let fixture: ComponentFixture<Publicacion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Publicacion],
      providers: [provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(Publicacion);
    // El componente necesita una publicación (input.required)
    fixture.componentRef.setInput('publicacion', {
      _id: '1',
      titulo: 'Hola',
      descripcion: 'Una publicación de prueba',
      imagen: '',
      meGusta: [],
      cantidadMeGusta: 0,
      createdAt: '2026-01-01T00:00:00.000Z',
      usuario: { _id: 'u1', nombre: 'Ana', apellido: 'García', nombreUsuario: 'anag', imagenPerfil: '' },
    });
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
