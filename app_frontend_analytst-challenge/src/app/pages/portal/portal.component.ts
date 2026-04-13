import { HttpErrorResponse } from '@angular/common/http';
import { DecimalPipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DividerModule } from 'primeng/divider';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputSwitchModule } from 'primeng/inputswitch';
import { InputTextModule } from 'primeng/inputtext';
import { PanelModule } from 'primeng/panel';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';

import { AuthService } from '../../services/auth.service';
import { Product, ProductPayload, ProductService } from '../../services/product.service';

@Component({
  selector: 'app-portal',
  imports: [
    ReactiveFormsModule,
    ToolbarModule,
    CardModule,
    ButtonModule,
    TagModule,
    DividerModule,
    AvatarModule,
    PanelModule,
    TableModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
    InputNumberModule,
    InputSwitchModule,
    ToastModule,
    ConfirmDialogModule,
    ProgressSpinnerModule,
    DecimalPipe,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './portal.component.html',
  styleUrl: './portal.component.css',
})
export class PortalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly productsService = inject(ProductService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly router = inject(Router);

  products: Product[] = [];
  loadingProducts = false;
  savingProduct = false;
  dialogVisible = false;
  currentProductId: string | null = null;

  readonly productForm = this.fb.nonNullable.group({
    nome: ['', [Validators.required, Validators.maxLength(200)]],
    descricao: ['', [Validators.maxLength(2000)]],
    preco: [0, [Validators.required, Validators.min(0.01)]],
    quantidade: [0, [Validators.required, Validators.min(0)]],
    ativo: [true],
  });

  ngOnInit(): void {
    this.loadProducts();
  }

  get dialogTitle(): string {
    return this.currentProductId ? 'Editar produto' : 'Novo produto';
  }

  get totalProducts(): number {
    return this.products.length;
  }

  get totalActiveProducts(): number {
    return this.products.filter((item) => item.ativo).length;
  }

  get totalStock(): number {
    return this.products.reduce((sum, item) => sum + item.quantidade, 0);
  }

  openCreateDialog(): void {
    this.currentProductId = null;
    this.productForm.reset({
      nome: '',
      descricao: '',
      preco: 0,
      quantidade: 0,
      ativo: true,
    });
    this.dialogVisible = true;
  }

  openEditDialog(product: Product): void {
    this.currentProductId = product.id;
    this.productForm.reset({
      nome: product.nome,
      descricao: product.descricao ?? '',
      preco: product.preco,
      quantidade: product.quantidade,
      ativo: product.ativo,
    });
    this.dialogVisible = true;
  }

  saveProduct(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    this.savingProduct = true;
    const payload: ProductPayload = this.productForm.getRawValue();
    const request$ = this.currentProductId
      ? this.productsService.update(this.currentProductId, payload)
      : this.productsService.create(payload);

    request$.subscribe({
      next: () => {
        this.savingProduct = false;
        this.dialogVisible = false;
        this.loadProducts();
        this.messageService.add({
          key: 'portal',
          severity: 'success',
          summary: 'Sucesso',
          detail: this.currentProductId
            ? 'Produto atualizado.'
            : 'Produto criado.',
        });
      },
      error: (err: unknown) => {
        this.savingProduct = false;
        this.messageService.add({
          key: 'portal',
          severity: 'error',
          summary: 'Falha ao salvar',
          detail: this.extractErrorMessage(err),
        });
      },
    });
  }

  confirmDelete(product: Product): void {
    this.confirmationService.confirm({
      header: 'Remover produto',
      message: `Deseja remover "${product.nome}"?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Remover',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.deleteProduct(product.id),
    });
  }

  private deleteProduct(productId: string): void {
    this.productsService.delete(productId).subscribe({
      next: () => {
        this.products = this.products.filter((item) => item.id !== productId);
        this.messageService.add({
          key: 'portal',
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Produto removido.',
        });
      },
      error: (err: unknown) => {
        this.messageService.add({
          key: 'portal',
          severity: 'error',
          summary: 'Falha ao remover',
          detail: this.extractErrorMessage(err),
        });
      },
    });
  }

  private loadProducts(): void {
    this.loadingProducts = true;
    this.productsService.list().subscribe({
      next: (data) => {
        this.products = data;
        this.loadingProducts = false;
      },
      error: (err: unknown) => {
        this.loadingProducts = false;
        this.messageService.add({
          key: 'portal',
          severity: 'error',
          summary: 'Falha ao carregar',
          detail: this.extractErrorMessage(err),
        });
      },
    });
  }

  private extractErrorMessage(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      const body = err.error;
      if (body && typeof body === 'object' && 'detail' in body) {
        const detail = (body as { detail: unknown }).detail;
        if (typeof detail === 'string' && detail.length > 0) {
          return detail;
        }
      }
      if (err.status === 0) {
        return 'Sem conexão com a API. Verifique se o backend está ativo.';
      }
      return err.statusText || 'Erro inesperado na API.';
    }
    return 'Não foi possível concluir a operação.';
  }

  sair(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/login');
  }
}
