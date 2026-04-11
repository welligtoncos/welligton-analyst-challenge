"""
Rotas HTTP de autenticação — apenas encaminham ao `AuthService` (sem regra de negócio).
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.auth_schema import (
    TokenResponse,
    UserLoginRequest,
    UserRegisterRequest,
    UserResponse,
)
from app.services.auth_service import AuthService

router = APIRouter(
    prefix="/auth",
    tags=["auth"],
    responses={
        200: {"description": "OK"},
        201: {"description": "Recurso criado"},
        400: {"description": "Requisição inválida"},
        401: {"description": "Não autorizado"},
        409: {"description": "Conflito (ex.: e-mail já cadastrado)"},
        422: {"description": "Erro de validação (schema)"},
    },
)


async def get_auth_service(db: AsyncSession = Depends(get_db)) -> AuthService:
    return AuthService(db)


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar usuário",
    description="Valida e-mail único, grava senha com hash bcrypt, retorna dados públicos (sem senha).",
)
async def register(
    payload: UserRegisterRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> UserResponse:
    return await auth_service.register(payload)


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login",
    description="Valida credenciais e retorna access token + refresh token JWT.",
)
async def login(
    payload: UserLoginRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> TokenResponse:
    return await auth_service.login(payload)
