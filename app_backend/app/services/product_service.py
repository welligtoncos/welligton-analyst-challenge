"""
Regras de negócio do CRUD de produtos.
"""

from collections.abc import Sequence
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.repositories.product_repository import ProductRepository
from app.schemas.product_schema import (
    ProductCreateRequest,
    ProductResponse,
    ProductUpdateRequest,
)


class ProductService:
    def __init__(self, db: AsyncSession) -> None:
        self._products = ProductRepository(db)

    async def create(self, data: ProductCreateRequest) -> ProductResponse:
        product = await self._products.create(
            nome=data.nome,
            descricao=data.descricao,
            preco=data.preco,
            quantidade=data.quantidade,
            ativo=data.ativo,
        )
        return ProductResponse.model_validate(product)

    async def list_all(self) -> Sequence[ProductResponse]:
        products = await self._products.list_all()
        return [ProductResponse.model_validate(item) for item in products]

    async def get_by_id(self, product_id: UUID) -> ProductResponse:
        product = await self._products.get_by_id(product_id)
        if product is None:
            raise NotFoundError("Produto não encontrado.")
        return ProductResponse.model_validate(product)

    async def update(self, product_id: UUID, data: ProductUpdateRequest) -> ProductResponse:
        product = await self._products.get_by_id(product_id)
        if product is None:
            raise NotFoundError("Produto não encontrado.")

        changes = data.model_dump(exclude_unset=True)
        for key, value in changes.items():
            if isinstance(value, str):
                value = value.strip()
            setattr(product, key, value)

        updated = await self._products.update(product)
        return ProductResponse.model_validate(updated)

    async def delete(self, product_id: UUID) -> None:
        deleted = await self._products.delete(product_id)
        if not deleted:
            raise NotFoundError("Produto não encontrado.")
