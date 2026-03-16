/**
 * Error Handling Centralizado
 * Padroniza erros da aplicacao com contexto, severidade e mensagens amigaveis.
 */

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'DATABASE_ERROR'
  | 'API_ERROR'
  | 'PERMISSION_ERROR'
  | 'PIPELINE_ERROR'
  | 'INVENTORY_ERROR'
  | 'IMPORT_ERROR'
  | 'UNKNOWN_ERROR';

export interface ErrorContext {
  service?: string;
  operation?: string;
  entityId?: string;
  [key: string]: unknown;
}

/**
 * AppError - Erro tipado com contexto estruturado
 */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly severity: ErrorSeverity;
  readonly context: ErrorContext;
  readonly timestamp: string;

  constructor(
    message: string,
    code: ErrorCode = 'UNKNOWN_ERROR',
    severity: ErrorSeverity = 'medium',
    context: ErrorContext = {}
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.severity = severity;
    this.context = context;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Mensagens amigaveis por codigo de erro
 */
const USER_MESSAGES: Record<ErrorCode, string> = {
  VALIDATION_ERROR: 'Os dados informados sao invalidos. Verifique e tente novamente.',
  NOT_FOUND: 'O item solicitado nao foi encontrado.',
  DATABASE_ERROR: 'Erro ao acessar o banco de dados. Tente novamente em instantes.',
  API_ERROR: 'Erro na comunicacao com servico externo. Tente novamente.',
  PERMISSION_ERROR: 'Voce nao tem permissao para realizar esta acao.',
  PIPELINE_ERROR: 'Erro no processamento do pipeline. Verifique os dados e tente novamente.',
  INVENTORY_ERROR: 'Erro na operacao de estoque. Verifique as quantidades.',
  IMPORT_ERROR: 'Erro na importacao. Verifique o arquivo e tente novamente.',
  UNKNOWN_ERROR: 'Ocorreu um erro inesperado. Tente novamente.',
};

export interface HandledError {
  userMessage: string;
  code: ErrorCode;
  severity: ErrorSeverity;
  context: ErrorContext;
  timestamp: string;
}

/**
 * handleError - Processa um erro, loga e retorna mensagem amigavel
 */
export function handleError(error: unknown, fallbackContext?: ErrorContext): HandledError {
  if (error instanceof AppError) {
    console.error(
      `[AppError] [${error.severity.toUpperCase()}] ${error.code}: ${error.message}`,
      error.context
    );

    return {
      userMessage: USER_MESSAGES[error.code],
      code: error.code,
      severity: error.severity,
      context: error.context,
      timestamp: error.timestamp,
    };
  }

  // Erro generico (Error nativo ou desconhecido)
  const message = error instanceof Error ? error.message : String(error);
  const context = fallbackContext ?? {};

  console.error(`[Error] UNKNOWN_ERROR: ${message}`, context);

  return {
    userMessage: USER_MESSAGES.UNKNOWN_ERROR,
    code: 'UNKNOWN_ERROR',
    severity: 'medium',
    context,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Helpers para criar erros tipados rapidamente
 */
export function validationError(message: string, context?: ErrorContext): AppError {
  return new AppError(message, 'VALIDATION_ERROR', 'low', context);
}

export function notFoundError(message: string, context?: ErrorContext): AppError {
  return new AppError(message, 'NOT_FOUND', 'low', context);
}

export function databaseError(message: string, context?: ErrorContext): AppError {
  return new AppError(message, 'DATABASE_ERROR', 'high', context);
}

export function apiError(message: string, context?: ErrorContext): AppError {
  return new AppError(message, 'API_ERROR', 'high', context);
}

export function pipelineError(message: string, context?: ErrorContext): AppError {
  return new AppError(message, 'PIPELINE_ERROR', 'critical', context);
}

export function inventoryError(message: string, context?: ErrorContext): AppError {
  return new AppError(message, 'INVENTORY_ERROR', 'medium', context);
}

export function importError(message: string, context?: ErrorContext): AppError {
  return new AppError(message, 'IMPORT_ERROR', 'medium', context);
}
