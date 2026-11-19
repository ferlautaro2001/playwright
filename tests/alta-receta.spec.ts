import { expect, test } from '../fixtures/test.fixtures.js';
import { obtenerLocatorAdaptativo } from '../helpers/adaptive-locator.js';

test.describe('Flujo 3: Alta de receta con adaptación dinámica LLM', () => {
  test('Valida campos obligatorios, crea registro en Borrador y recupera botón renombrado', async ({
    page,
    chefAutenticado,
    recetarioPage,
    formularioPage,
  }, testInfo) => {
    // Navegamos desde el recetario y activamos variant=v2 para simular el cambio de plantilla UI
    await chefAutenticado.botonAnadirReceta.click();
    await expect(page).toHaveURL(/.*\/recetas\/nueva/);
    await formularioPage.goto('v2');

    // 1. Validación negativa con formulario vacío (usando locator adaptativo)
    const botonGuardar = await obtenerLocatorAdaptativo(
      page,
      formularioPage.botonGuardarBorrador,
      'hacer clic en el botón para guardar la nueva receta como borrador'
    );
    await botonGuardar.click();
    await expect(formularioPage.alertaErrorCampos).toBeVisible();

    // 2. Alta válida con datos aislados mediante marca de tiempo y proyecto
    const nombreUnico = `Nigiri Especial ${testInfo.project.name} ${Date.now()}`;
    await formularioPage.completarReceta({
      nombre: nombreUnico,
      categoria: 'Nigiris',
      duracionMin: 25,
      ingredientes: ['Salmón fresco 45 g', 'Arroz shari 36 g'],
      pasos: ['Moldear el arroz shari', 'Asentar el corte de salmón y sellar'],
    });

    // Esperamos el POST /api/recetas -> 201 Created para validar red y persistencia
    const [postResponse] = await Promise.all([
      page.waitForResponse(
        (res) => res.url().includes('/api/recetas') && res.request().method() === 'POST'
      ),
      botonGuardar.click(),
    ]);
    expect(postResponse.status()).toBe(201);

    await expect(page).toHaveURL(/.*\/recetario/);
    await expect(recetarioPage.notificacionConfirmacion).toBeVisible();

    const nuevaTarjeta = recetarioPage.tarjetasReceta.filter({ hasText: nombreUnico });
    await expect(nuevaTarjeta).toBeVisible();
    await expect(nuevaTarjeta).toContainText('Borrador');
  });
});
