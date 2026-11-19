import { test as base, expect } from '@playwright/test';
import { FormularioRecetaPage } from '../pages/formulario-receta.page.js';
import { LoginPage } from '../pages/login.page.js';
import { RecetarioPage } from '../pages/recetario.page.js';

export const CHEF_CREDENTIALS = {
  email: 'chef@sushiexpress.com',
  password: 'Sushi2026!',
};

interface SushiFixtures {
  loginPage: LoginPage;
  recetarioPage: RecetarioPage;
  formularioPage: FormularioRecetaPage;
  chefAutenticado: RecetarioPage;
}

export const test = base.extend<SushiFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  recetarioPage: async ({ page }, use) => {
    await use(new RecetarioPage(page));
  },
  formularioPage: async ({ page }, use) => {
    await use(new FormularioRecetaPage(page));
  },
  chefAutenticado: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    const recetarioPage = new RecetarioPage(page);

    await loginPage.goto();
    await loginPage.iniciarSesion(CHEF_CREDENTIALS.email, CHEF_CREDENTIALS.password);
    await expect(page).toHaveURL(/.*\/recetario/);
    await expect(recetarioPage.encabezadoUsuario).toBeVisible();

    await use(recetarioPage);
  },
});

export { expect };
