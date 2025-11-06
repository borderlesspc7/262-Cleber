interface FirebaseError {
  code?: string;
  message?: string;
}

export default function getFirebaseErrorMessage(
  error: string | FirebaseError
): string {
  if (typeof error === "string") {
    return error;
  }

  const errorCode = error?.code || "";
  const errorMessage = error?.message || "";

  // Verifica se a mensagem contém informações sobre usuário não encontrado
  if (
    errorMessage.toLowerCase().includes("user-not-found") ||
    errorMessage.toLowerCase().includes("there is no user record")
  ) {
    return "Não existe um usuário cadastrado com este email. Verifique o email ou cadastre-se.";
  }

  switch (errorCode) {
    case "auth/user-not-found":
      return "Não existe um usuário cadastrado com este email. Verifique o email ou cadastre-se.";

    case "auth/wrong-password":
      return "Senha incorreta. Tente novamente.";

    case "auth/invalid-email":
      return "Email inválido. Verifique o formato do email.";

    case "auth/invalid-credential":
      // Firebase pode retornar este código genérico para credenciais inválidas
      // Verificamos a mensagem para ser mais específico
      if (
        errorMessage.toLowerCase().includes("user") ||
        errorMessage.toLowerCase().includes("email")
      ) {
        return "Não existe um usuário cadastrado com este email. Verifique o email ou cadastre-se.";
      }
      return "Email ou senha incorretos. Verifique suas credenciais.";

    case "auth/too-many-requests":
      return "Muitas tentativas. Tente novamente em alguns minutos.";

    case "auth/user-disabled":
      return "Conta desabilitada. Entre em contato com o suporte.";

    case "auth/network-request-failed":
      return "Erro de conexão. Verifique sua internet.";

    case "auth/invalid-api-key":
      return "Erro de configuração. Entre em contato com o suporte.";

    default:
      // Se não reconhecer o código, tenta extrair informação da mensagem
      if (errorMessage) {
        if (
          errorMessage.toLowerCase().includes("user-not-found") ||
          errorMessage.toLowerCase().includes("no user record")
        ) {
          return "Não existe um usuário cadastrado com este email. Verifique o email ou cadastre-se.";
        }
      }
      return "Erro ao fazer login. Verifique suas credenciais e tente novamente.";
  }
}
