export default {
  api: {
    input: {
      target: './openapi.yaml', // Pfad zur OpenAPI-Spezifikation
      filters: {
        mode: 'include', // Nur die angegebenen Tags generieren
        tags: ['apikeys', 'usage', 'admin'], // Tags, die generiert werden sollen
      },
    },
    output: {
      mode: 'tags-split', // Generiere Dateien basierend auf Tags
      target: './src/api/', // Zielordner für generierte APIs
      schemas: './src/api/types/', // Zielordner für generierte Schemas
      client: 'axios', // Verwende Axios als HTTP-Client
      override: {
        mutator: {
          path: './src/axios/api.ts',
        },
        // Erzwinge Schema-Generierung für alle verwendeten Schemas
        useTypeOverInterfaces: false,
        // Generiere alle Schemas, auch wenn sie nicht direkt referenziert werden
        generate: {
          schemas: true,
        },
      },
    },
  },
}
