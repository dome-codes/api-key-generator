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
      mode: 'tags-split',
      target: './src/api/',
      schemas: './src/api/types/',
      client: 'axios',
      // Einheitliche Dateinamen (PascalCase), vermeidet ai vs aI auf case-sensitiven Dateisystemen (Linux)
      namingConvention: 'PascalCase',
      override: {
        mutator: {
          path: './src/axios/api.ts',
        },
        useTypeOverInterfaces: false,
        generate: {
          schemas: true,
        },
      },
    },
  },
}
