import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-inicio',
  imports: [],
  template: `
    <div class="wrap">
      <p>Sessão iniciada.</p>
      <button type="button" (click)="sair()">Sair</button>
    </div>
  `,
  styles: `
    .wrap {
      padding: 2rem;
      font-family: system-ui, sans-serif;
    }
    button {
      margin-top: 1rem;
      padding: 0.5rem 1rem;
      cursor: pointer;
    }
  `,
})
export class InicioComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  sair(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/login');
  }
}
