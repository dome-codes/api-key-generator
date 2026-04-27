const { createApp, watch } = Vue

const STORAGE_KEY = 'octane-example-app-settings-v1'
const TEMPLATE_BASE = '/api/shared_spaces/{sharedSpace}/workspaces/{workspace}'

function safeParseJson(input, fallback = {}) {
  if (!input || !String(input).trim()) return fallback
  try {
    return JSON.parse(input)
  } catch (err) {
    throw new Error(`Ungueltiges JSON: ${err instanceof Error ? err.message : String(err)}`)
  }
}

createApp({
  data() {
    return {
      baseUrl: '',
      sharedSpaceId: '',
      workspaceId: '',
      clientId: '',
      apiKey: '',
      authMode: 'basic',
      persistSecrets: false,
      method: 'GET',
      endpoint: `${TEMPLATE_BASE}/defects`,
      queryText: '{}',
      bodyText: '{\n  "data": []\n}',
      loading: false,
      statusText: 'Noch kein Request',
      statusCode: null,
      durationMs: null,
      responseHeaders: '{}',
      responseBody: '{}',
      branchTicketType: 'defect',
      branchTicketId: '',
      branchTicketTitle: '',
      branchPattern: '{type}/{id}-{slug}',
    }
  },
  computed: {
    statusClass() {
      if (this.statusCode == null) return 'status-neutral'
      if (this.statusCode >= 200 && this.statusCode < 300) return 'status-ok'
      if (this.statusCode >= 400) return 'status-error'
      return 'status-neutral'
    },
    generatedBranchName() {
      const slug = this.slugify(this.branchTicketTitle || `ticket-${this.branchTicketId || 'x'}`)
      const type = this.slugify(this.branchTicketType || 'ticket')
      const id = this.slugify(this.branchTicketId || 'unknown')
      const pattern = this.branchPattern || '{type}/{id}-{slug}'
      return pattern
        .replaceAll('{type}', type)
        .replaceAll('{id}', id)
        .replaceAll('{slug}', slug)
    },
    gitCliCommand() {
      return `git checkout -b "${this.generatedBranchName}"`
    },
    gitlabPayload() {
      const payload = {
        branch: this.generatedBranchName,
        ref: 'main',
      }
      return JSON.stringify(payload, null, 2)
    },
  },
  methods: {
    slugify(value) {
      return String(value || '')
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .replace(/-{2,}/g, '-')
    },
    loadSavedSettings() {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      try {
        const saved = JSON.parse(raw)
        this.baseUrl = saved.baseUrl || ''
        this.sharedSpaceId = saved.sharedSpaceId || ''
        this.workspaceId = saved.workspaceId || ''
        this.clientId = saved.clientId || ''
        this.authMode = saved.authMode || 'basic'
        this.method = saved.method || 'GET'
        this.endpoint = saved.endpoint || `${TEMPLATE_BASE}/defects`
        this.queryText = saved.queryText || '{}'
        this.bodyText = saved.bodyText || '{\n  "data": []\n}'
        this.branchTicketType = saved.branchTicketType || 'defect'
        this.branchTicketId = saved.branchTicketId || ''
        this.branchTicketTitle = saved.branchTicketTitle || ''
        this.branchPattern = saved.branchPattern || '{type}/{id}-{slug}'
        this.persistSecrets = !!saved.persistSecrets
        if (this.persistSecrets) {
          this.apiKey = saved.apiKey || ''
        }
      } catch {
        // ignore invalid storage
      }
    },
    saveSettings() {
      const payload = {
        baseUrl: this.baseUrl,
        sharedSpaceId: this.sharedSpaceId,
        workspaceId: this.workspaceId,
        clientId: this.clientId,
        authMode: this.authMode,
        method: this.method,
        endpoint: this.endpoint,
        queryText: this.queryText,
        bodyText: this.bodyText,
        branchTicketType: this.branchTicketType,
        branchTicketId: this.branchTicketId,
        branchTicketTitle: this.branchTicketTitle,
        branchPattern: this.branchPattern,
        persistSecrets: this.persistSecrets,
        apiKey: this.persistSecrets ? this.apiKey : '',
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    },
    applyTemplate(kind) {
      if (kind === 'listDefects') {
        this.method = 'GET'
        this.endpoint = `${TEMPLATE_BASE}/defects`
        this.queryText = JSON.stringify(
          {
            limit: 25,
            offset: 0,
            fields: 'id,name,phase,severity,owner',
            order_by: 'id DESC',
          },
          null,
          2,
        )
        this.bodyText = '{\n  "data": []\n}'
      } else if (kind === 'createDefect') {
        this.method = 'POST'
        this.endpoint = `${TEMPLATE_BASE}/defects`
        this.queryText = '{}'
        this.bodyText = JSON.stringify(
          {
            data: [
              {
                name: 'Beispiel Defect aus API Tester',
                description: '<p>Automatisch erstellt zum Testen der Octane API</p>',
                severity: { type: 'list_node', id: 'list_node.defect_severity.medium' },
                phase: { type: 'phase', id: 'phase.defect.new' },
              },
            ],
          },
          null,
          2,
        )
      } else if (kind === 'getById') {
        this.method = 'GET'
        this.endpoint = `${TEMPLATE_BASE}/work_items/{id}`
        this.queryText = JSON.stringify({ fields: 'id,name,subtype,phase,owner' }, null, 2)
        this.bodyText = '{\n  "data": []\n}'
      }
      this.saveSettings()
    },
    buildHeaders() {
      const headers = {
        accept: 'application/json',
      }
      if (this.method !== 'GET' && this.method !== 'DELETE') {
        headers['content-type'] = 'application/json'
      }
      if (!this.clientId || !this.apiKey) {
        return headers
      }
      if (this.authMode === 'basic') {
        headers.authorization = `Basic ${btoa(`${this.clientId}:${this.apiKey}`)}`
      } else if (this.authMode === 'headers') {
        headers['ALM-Client-Id'] = this.clientId
        headers['ALM-Api-Key'] = this.apiKey
      } else if (this.authMode === 'bearer') {
        headers.authorization = `Bearer ${this.apiKey}`
      }
      return headers
    },
    applyOctanePathParams(rawPath) {
      return rawPath
        .replaceAll('{sharedSpace}', this.sharedSpaceId || '{sharedSpace}')
        .replaceAll('{workspace}', this.workspaceId || '{workspace}')
    },
    buildUrl() {
      const base = this.baseUrl.trim().replace(/\/+$/, '')
      const templatedPath = this.applyOctanePathParams(this.endpoint.trim())
      const path = templatedPath.startsWith('/') ? templatedPath : `/${templatedPath}`
      const url = new URL(`${base}${path}`)
      const query = safeParseJson(this.queryText, {})
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null && String(value) !== '') {
          url.searchParams.set(key, String(value))
        }
      })
      return url.toString()
    },
    async sendRequest() {
      if (!this.baseUrl.trim()) {
        this.statusText = 'Fehler: Base URL fehlt'
        this.statusCode = 400
        return
      }
      if (!this.sharedSpaceId.trim() || !this.workspaceId.trim()) {
        this.statusText = 'Fehler: Shared Space und Workspace sind Pflicht'
        this.statusCode = 400
        return
      }
      this.loading = true
      this.statusCode = null
      this.statusText = 'Request wird gesendet...'
      this.durationMs = null
      this.responseBody = '{}'
      this.responseHeaders = '{}'
      this.saveSettings()

      const started = performance.now()
      try {
        const url = this.buildUrl()
        const headers = this.buildHeaders()
        const options = {
          method: this.method,
          headers,
        }
        if (this.method !== 'GET' && this.method !== 'DELETE') {
          const parsedBody = safeParseJson(this.bodyText, {})
          options.body = JSON.stringify(parsedBody)
        }

        const response = await fetch(url, options)
        const elapsed = Math.round(performance.now() - started)
        const text = await response.text()
        let parsed = text
        try {
          parsed = text ? JSON.parse(text) : {}
        } catch {
          // keep plain text
        }

        const headerObj = {}
        response.headers.forEach((value, key) => {
          headerObj[key] = value
        })

        this.statusCode = response.status
        this.statusText = `${response.status} ${response.statusText}`
        this.durationMs = elapsed
        this.responseHeaders = JSON.stringify(headerObj, null, 2)
        this.responseBody = JSON.stringify(parsed, null, 2)
      } catch (err) {
        this.statusCode = 500
        this.statusText = 'Netzwerk-/Client-Fehler'
        this.durationMs = Math.round(performance.now() - started)
        this.responseBody = JSON.stringify(
          {
            message: err instanceof Error ? err.message : String(err),
          },
          null,
          2,
        )
      } finally {
        this.loading = false
      }
    },
  },
  mounted() {
    this.loadSavedSettings()
    if (!this.endpoint || this.endpoint === '/v1/health') {
      this.applyTemplate('listDefects')
    }
    watch(
      () => [
        this.baseUrl,
        this.sharedSpaceId,
        this.workspaceId,
        this.clientId,
        this.apiKey,
        this.authMode,
        this.method,
        this.endpoint,
        this.queryText,
        this.bodyText,
        this.branchTicketType,
        this.branchTicketId,
        this.branchTicketTitle,
        this.branchPattern,
        this.persistSecrets,
      ],
      () => this.saveSettings(),
      { deep: true },
    )
  },
}).mount('#app')
