import { Locator, Page } from '@playwright/test';

export interface DatosRecetaForm {
  nombre: string;
  categoria: string;
  duracionMin: number;
  ingredientes: string[];
  pasos: string[];
}

export class FormularioRecetaPage {
  readonly nombreInput: Locator;
  readonly categoriaSelect: Locator;
  readonly duracionInput: Locator;
  readonly botonAgregarIngrediente: Locator;
  readonly botonAgregarPaso: Locator;
  readonly botonGuardarBorrador: Locator;
  readonly alertaErrorCampos: Locator;

  constructor(private readonly page: Page) {
    this.nombreInput = this.page.getByLabel('Nombre de la receta');
    this.categoriaSelect = this.page.getByLabel('Categoría');
    this.duracionInput = this.page.getByLabel('Duración (min)');
    this.botonAgregarIngrediente = this.page.getByRole('button', { name: 'Agregar ingrediente' });
    this.botonAgregarPaso = this.page.getByRole('button', { name: 'Agregar paso' });
    this.botonGuardarBorrador = this.page.getByRole('button', { name: 'Guardar borrador' });
    this.alertaErrorCampos = this.page.getByTestId('alerta-error-campos');
  }

  async goto(variant?: 'v2'): Promise<void> {
    const query = variant ? `?variant=${variant}` : '';
    await this.page.goto(`/recetas/nueva${query}`);
  }

  async completarReceta(datos: DatosRecetaForm): Promise<void> {
    await this.nombreInput.fill(datos.nombre);
    await this.categoriaSelect.selectOption(datos.categoria);
    await this.duracionInput.fill(String(datos.duracionMin));

    for (let i = 0; i < datos.ingredientes.length; i++) {
      if (i > 0) await this.botonAgregarIngrediente.click();
      await this.page.getByLabel(`Ingrediente ${i + 1}`, { exact: true }).fill(datos.ingredientes[i]);
    }

    for (let i = 0; i < datos.pasos.length; i++) {
      if (i > 0) await this.botonAgregarPaso.click();
      await this.page.getByLabel(`Paso ${i + 1}`, { exact: true }).fill(datos.pasos[i]);
    }
  }
}
