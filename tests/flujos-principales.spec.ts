import { CHEF_CREDENTIALS, expect, test } from '../fixtures/test.fixtures.js';

test.describe('Flujos principales de SushiExpress', () => {
  test('Flujo 1: Login con credenciales inválidas y válidas', async ({ page, loginPage, recetarioPage }) => {
    await loginPage.goto();

    // Escenario negativo: credenciales inválidas permanecen en /login y muestran alerta
    await loginPage.iniciarSesion(CHEF_CREDENTIALS.email, 'ClaveIncorrecta99');
    await expect(loginPage.alertaError).toBeVisible();
    await expect(page).toHaveURL(/.*\/login/);

    // Escenario positivo: credenciales válidas redirigen sin recarga completa a /recetario
    await loginPage.iniciarSesion(CHEF_CREDENTIALS.email, CHEF_CREDENTIALS.password);
    await expect(page).toHaveURL(/.*\/recetario/);
    await expect(recetarioPage.encabezadoUsuario).toContainText('Kenji Takahashi');
    await expect(recetarioPage.botonAnadirReceta).toBeVisible();

    const token = await page.evaluate(() => sessionStorage.getItem('sushi_token'));
    expect(token).toBeTruthy();
  });

  test('Flujo 2: Búsqueda y filtrado reactivo en el recetario', async ({ chefAutenticado }) => {
    // Filtrado combinado de texto libre + categoría Rolls
    await chefAutenticado.buscarPorTextoYCategoria('Salmón', 'Rolls');

    await expect(chefAutenticado.tarjetasReceta).toHaveCount(2);
    await expect(chefAutenticado.tarjetasReceta.first()).toContainText('Roll de Salmón');

    // Estado vacío informativo cuando no hay coincidencias
    await chefAutenticado.buscarPorTextoYCategoria('IngredienteInexistenteXYZ', 'Rolls');
    await expect(chefAutenticado.tarjetasReceta).toHaveCount(0);
    await expect(chefAutenticado.estadoVacio).toBeVisible();
  });
});
