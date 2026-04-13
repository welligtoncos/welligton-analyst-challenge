import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../api.config';

export interface Product {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  quantidade: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductPayload {
  nome: string;
  descricao: string;
  preco: number;
  quantidade: number;
  ativo: boolean;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);

  list(): Observable<Product[]> {
    return this.http.get<Product[]>(`${API_BASE_URL}/products`);
  }

  create(payload: ProductPayload): Observable<Product> {
    return this.http.post<Product>(`${API_BASE_URL}/products`, payload);
  }

  update(productId: string, payload: ProductPayload): Observable<Product> {
    return this.http.put<Product>(`${API_BASE_URL}/products/${productId}`, payload);
  }

  delete(productId: string): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/products/${productId}`);
  }
}
