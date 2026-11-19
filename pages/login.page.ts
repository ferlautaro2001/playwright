import { Locator, Page } from '@playwright/test';

export class LoginPage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly alertaError: Locator;

  constructor(private readonly page: Page) {
    this.emailInput = this.page.getByLabel('Correo electrónico');
    this.passwordInput = this.page.getByLabel('Contraseña');
    this.submitButton = this.page.getByRole('button', { name: 'Iniciar sesión' });
    this.alertaError = this.page.getByRole('alert');
  }

  async goto(): Promise<void> {
    await this.page.goto('/login');
  }

  async iniciarSesion(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
