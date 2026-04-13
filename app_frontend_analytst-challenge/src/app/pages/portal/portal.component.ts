import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { PanelModule } from 'primeng/panel';
import { ProgressBarModule } from 'primeng/progressbar';
import { TagModule } from 'primeng/tag';
import { ToolbarModule } from 'primeng/toolbar';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-portal',
  imports: [
    ToolbarModule,
    CardModule,
    ButtonModule,
    TagModule,
    DividerModule,
    AvatarModule,
    PanelModule,
    ProgressBarModule,
  ],
  templateUrl: './portal.component.html',
  styleUrl: './portal.component.css',
})
export class PortalComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  sair(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/login');
  }
}
