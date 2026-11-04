# Especificação: Document Management System

## 1. Objetivo

Permitir que usuários enviem, listem e baixem documentos armazenados no filesystem local da aplicação, com metadados mantidos em memória.

## 2. Escopo

### Dentro do escopo

- Upload de um documento por requisição.
- Listagem dos documentos associados ao usuário informado na requisição.
- Download de um documento pelo identificador, limitado ao seu dono.
- Interface React para upload, listagem e download.
- Armazenamento local via Multer com `diskStorage`.
- Metadados em memória durante a execução do processo.

### Fora do escopo

- Autenticação, autorização baseada em credenciais ou gestão de contas.
- Armazenamento externo ou em nuvem.
- Persistência durável dos metadados.
- Versionamento, exclusão, busca, compartilhamento ou edição de documentos.
- Paginação e processamento de conteúdo.

## 3. Requisitos funcionais

| ID | Requisito |
| --- | --- |
| RF-01 | Aceitar arquivo no campo `file` de uma requisição `multipart/form-data`. |
| RF-02 | Rejeitar uploads sem arquivo e arquivos acima do limite configurado. |
| RF-03 | Gravar arquivos localmente via Multer `diskStorage`, usando nome interno gerado pelo sistema. |
| RF-04 | Registrar `id`, `originalName`, `size`, `uploadedAt` e `owner` para cada documento. |
| RF-05 | Exigir identificador de usuário não vazio no cabeçalho `X-User-Id`, com até 128 caracteres. |
| RF-06 | Listar somente documentos pertencentes ao usuário da requisição. |
| RF-07 | Permitir download somente ao usuário dono do documento. |
| RF-08 | Responder `404` quando o documento não existir, não pertencer ao usuário ou o arquivo local estiver ausente. |
| RF-09 | Permitir selecionar e enviar um arquivo pelo frontend, apresentar o resultado e atualizar a lista. |
| RF-10 | Apresentar os documentos do usuário e permitir baixar cada documento. |
| RF-11 | Comunicar erros de validação e falhas da API sem expor detalhes internos do servidor. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Arquivos permanecem no filesystem local, em `backend/storage` por padrão. |
| RNF-02 | Upload usa Multer com `diskStorage`; não utilizar provedores externos. |
| RNF-03 | Metadados ficam em memória e podem ser perdidos ao reiniciar o processo. |
| RNF-04 | Limite padrão do upload é 10 MiB, configurável por variável de ambiente. |
| RNF-05 | Diretório de armazenamento é configurável por variável de ambiente e permanece local. |
| RNF-06 | Porta, diretório e limite usam configuração via ambiente, com padrões documentados. |
| RNF-07 | Erros da API seguem formato JSON consistente. |
| RNF-08 | Nome de arquivo recebido nunca é usado como caminho físico de armazenamento. |
| RNF-09 | Dependências seguem `routes -> controllers -> services -> repositories`; camadas internas não dependem de Express. |

## 5. Modelo de dados

Os metadados ficam em memória. `storageName` e `mimeType` são auxiliares internos e não são expostos na API.

| Campo | Tipo | Descrição |
| --- | --- | --- |
| `id` | string | Identificador único gerado pelo sistema. |
| `originalName` | string | Nome original fornecido pelo cliente, usado para apresentação e download. |
| `size` | number | Tamanho do arquivo em bytes. |
| `uploadedAt` | string | Data e hora do upload em ISO 8601. |
| `owner` | string | Identificador recebido em `X-User-Id`. |
| `storageName` | string | Nome interno gerado pelo sistema para localizar o arquivo local. |
| `mimeType` | string | Tipo de mídia informado no upload, mantido como dado auxiliar. |

`owner` é uma identidade provisória, não autenticada. `X-User-Id` não fornece segurança adequada para implantação pública.

## 6. Contratos de API

As rotas do backend usam os caminhos abaixo. O frontend usa o prefixo `/api`, removido pelo proxy de desenvolvimento do Vite. As rotas de documentos exigem `X-User-Id` não vazio, aparado e com até 128 caracteres.

Formato comum de erro:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Descrição segura para o cliente."
  }
}
```

### `POST /upload`

- Entrada: `multipart/form-data`, campo de arquivo `file`; cabeçalho `X-User-Id`.
- Sucesso: `201 Created`, corpo `{ "document": { "id", "originalName", "size", "uploadedAt", "owner" } }`.
- `400 Bad Request`: arquivo ausente ou usuário inválido.
- `413 Payload Too Large`: arquivo acima do limite configurado.
- `500 Internal Server Error`: falha inesperada de armazenamento ou processamento.

### `GET /documents`

- Entrada: cabeçalho `X-User-Id`.
- Sucesso: `200 OK`, corpo `{ "documents": [...] }`, inclusive para lista vazia.
- Cada item contém `id`, `originalName`, `size`, `uploadedAt` e `owner`.
- `400 Bad Request`: cabeçalho ausente ou inválido. Não há paginação no escopo inicial.

### `GET /documents/:id/download`

- Entrada: identificador na URL e cabeçalho `X-User-Id`.
- Sucesso: `200 OK`, conteúdo binário, `Content-Disposition: attachment` e nome de download baseado em `originalName`.
- `400 Bad Request`: identificador ou usuário inválido.
- `404 Not Found`: documento inexistente, de outro usuário ou arquivo local ausente.
- Caminho físico e `storageName` nunca são retornados ao cliente.

Usar códigos estáveis como `VALIDATION_ERROR`, `FILE_TOO_LARGE`, `DOCUMENT_NOT_FOUND` e `INTERNAL_ERROR`. Mensagens não incluem caminhos locais, stack traces ou detalhes internos.

## 7. Decisões arquiteturais e riscos

- `routes` registram endpoints e middleware; `controllers` tratam HTTP e validação de entrada; `services` implementam regras de negócio; `repositories` mantêm metadados e operações sobre arquivos locais.
- Multer com `diskStorage` grava em `backend/storage` por padrão. Nome físico é gerado pelo sistema e separado do nome original.
- O repositório em memória associa documento, dono e nome físico. Reiniciar o processo perde essa associação e pode deixar arquivos órfãos no diretório.
- A identidade pelo cabeçalho `X-User-Id` não autentica o solicitante; não expor o sistema publicamente sem uma camada de autenticação.
- O limite padrão de 10 MiB evita uploads ilimitados. Tipos de arquivo não são restringidos nesta fase; validar conteúdo real fica fora do escopo inicial.
- Falhas de leitura ou ausência de arquivo local devem ser tratadas sem expor caminhos ou erros do filesystem.

## 8. Plano de execução

1. Formalizar contratos, campos, erros, limites e premissas de identidade nesta especificação.
2. Implementar configuração e fluxo de upload no backend, com validação, Multer local, metadados em memória e testes de sucesso e erro.
3. Implementar listagem e download no backend, garantindo isolamento por dono e testes de acesso negado e arquivo ausente.
4. Construir a interface React, serviço `fetch` via `/api`, seleção de usuário, upload, listagem, download e estados de carregamento/erro.
5. Validar integração, configuração por ambiente, build do frontend e contratos do backend; documentar os comandos e limitações operacionais.

As etapas 2 a 5 descrevem a implementação do produto; esta especificação não substitui nem implica execução futura adicional.