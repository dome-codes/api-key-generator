# Keycloak-Bypass für Development

## Aktivierung

### Option 1: Environment Variable (empfohlen)
```bash
export VITE_BYPASS_KEYCLOAK=true
npm run frontend:dev
```

### Option 2: Browser Console
Öffne die Browser-Konsole und führe aus:
```javascript
localStorage.setItem('bypassKeycloak', 'true')
location.reload()
```

### Option 3: .env.local hinzufügen
Füge zu `.env.local` hinzu:
```
VITE_BYPASS_KEYCLOAK=true
```

## Deaktivierung
```javascript
localStorage.removeItem('bypassKeycloak')
location.reload()
```

## Mock-API starten
```bash
BYPASS_KEYCLOAK=true node mock-api.js
# oder
npm run dev  # Startet Mock-API + Frontend parallel
```
