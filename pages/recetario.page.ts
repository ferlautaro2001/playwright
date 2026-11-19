import { Locator, Page } from '@playwright/test';

export class RecetarioPage {
  readonly encabezadoUsuario: Locator;
  readonly botonAnadirReceta: Locator;
  readonly buscadorInput: Locator;
  readonly categoriaSelect: Locator;
  readonly tarjetasReceta: Locator;
  readonly estadoVacio: Locator;
  readonly notificacionConfirmacion: Locator;

  constructor(private readonly page: Page) {
    this.encabezadoUsuario = this.page.getByTestId('encabezado-usuario');
    this.botonAnadirReceta = this.page.getByRole('button', { name: 'Añadir receta' });
    this.buscadorInput = this.page.getByPlaceholder('Buscar receta...');
    this.categoriaSelect = this.page.getByLabel('Categoría');
    this.tarjetasReceta = this.page.getByTestId('tarjeta-receta');
    this.estadoVacio = this.page.getByTestId('estado-vacio');
    this.notificacionConfirmacion = this.page.getByTestId('notificacion-confirmacion');
  }

  async goto(): Promise<void> {
    await this.page.goto('/recetario');
  }

  async buscarPorTextoYCategoria(texto: string, categoria: string): Promise<void> {
    await this.buscadorInput.fill(texto);
    await this.categoriaSelect.selectOption(categoria);
  }
}
