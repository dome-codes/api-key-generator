# Corporate Design Farben - Verwendungsanleitung

## Übersicht

Das neue Corporate Design Farbschema wurde integriert. Die Hauptfarbe ist **Rot (#e00)**.

## Verfügbare Farben

### Primärfarbe (Main)
- **CSS-Variable**: `--color-primary` = `#e00`
- **Tailwind**: `bg-primary`, `text-primary`, `border-primary`
- **RGB**: `rgb(var(--color-primary-rgb))` = `rgb(238, 0, 0)`

### Navbar Farben
- `--coyo-navbar`: `#e00` (Hintergrund)
- `--coyo-navbar-active`: `#d50000` (Aktiver Zustand)
- `--coyo-navbar-text`: `#fff` (Text)
- `--color-navbar-border`: `#e00` (Border)

### Button Farben
- `--btn-primary-bg`: `#e00` (Hintergrund)
- `--btn-primary-color`: `#fff` (Text)
- Tailwind: `bg-btn-primary-bg`, `text-btn-primary-color`

### Link Farben
- `--link-color`: `#e00`
- `--color-link`: `#e00`
- Tailwind: `text-link`

### Text Farben
- `--text-color`: `#243243` (Dunkles Grau)
- Tailwind: `text-text`

### Hintergrund Farben
- `--color-background-main`: `#edeeef` (Helles Grau)
- Tailwind: `bg-background-main`

### Farbpalette
- **Grün/Blau**: `--color-green` / `--color-blue` = `#0d8093`
- **Gelb**: `--color-yellow` = `#ffa82e`
- **Orange**: `--color-orange` = `#ff8716`
- **Rot**: `--color-red` = `#991d67`
- **Weiß**: `--color-white` = `#fff`
- **Grau**: `--color-gray` = `#aaa`

Tailwind: `bg-corporate-green`, `text-corporate-yellow`, etc.

## Verwendung

### In Vue-Komponenten (Tailwind CSS)

```vue
<template>
  <!-- Primärfarbe verwenden -->
  <button class="bg-primary text-white hover:bg-primary-hover">
    Primärer Button
  </button>
  
  <!-- Navbar -->
  <nav class="bg-navbar text-navbar-text border-navbar-border">
    Navigation
  </nav>
  
  <!-- Links -->
  <a href="#" class="text-link hover:text-primary-hover">
    Link
  </a>
  
  <!-- Hintergrund -->
  <div class="bg-background-main">
    Hauptinhalt
  </div>
  
  <!-- Corporate Farben -->
  <div class="bg-corporate-green text-white">
    Grün
  </div>
</template>
```

### In CSS/SCSS

```css
/* CSS-Variablen verwenden */
.my-button {
  background-color: var(--color-primary);
  color: var(--btn-primary-color);
}

.my-link {
  color: var(--link-color);
}

.my-background {
  background-color: var(--color-background-main);
}

/* RGB-Varianten für Transparenz */
.my-overlay {
  background-color: rgba(var(--color-primary-rgb), 0.5);
}
```

### In Inline-Styles (Vue)

```vue
<template>
  <div :style="{ backgroundColor: 'var(--color-primary)' }">
    Inline Style
  </div>
</template>
```

## Migration bestehender Komponenten

### Beispiel: Button-Komponente

**Vorher:**
```vue
<button class="bg-blue-600 text-white">Button</button>
```

**Nachher:**
```vue
<button class="bg-primary text-btn-primary-color">Button</button>
```

### Beispiel: Link-Komponente

**Vorher:**
```vue
<a href="#" class="text-blue-600 hover:text-blue-800">Link</a>
```

**Nachher:**
```vue
<a href="#" class="text-link hover:text-primary-hover">Link</a>
```

## Hover- und Active-Zustände

### Primärfarbe
- **Hover**: `bg-primary-hover` oder `#d50000`
- **Active**: `bg-primary-active` oder `#ba0000`

### Kategorie-Farben
- **Hover**: `rgba(var(--cat-primary-bg-hover), 0.8)`
- **Active**: `rgba(var(--cat-primary-bg-active), 0.9)`

## Best Practices

1. **Primärfarbe für Hauptaktionen**: Verwende `bg-primary` für primäre Buttons und wichtige UI-Elemente
2. **Konsistenz**: Nutze die definierten Variablen statt hardcodierter Farben
3. **Accessibility**: Stelle sicher, dass Text-Kontraste ausreichend sind (z.B. weißer Text auf rotem Hintergrund)
4. **Hover-States**: Verwende immer Hover-Varianten für interaktive Elemente

## Verfügbare Tailwind-Klassen

### Hintergrundfarben
- `bg-primary`
- `bg-navbar`
- `bg-btn-primary-bg`
- `bg-background-main`
- `bg-corporate-green`
- `bg-corporate-blue`
- `bg-corporate-yellow`
- `bg-corporate-orange`
- `bg-corporate-red`
- `bg-corporate-gray`
- `bg-corporate-white`

### Textfarben
- `text-primary`
- `text-navbar-text`
- `text-btn-primary-color`
- `text-link`
- `text-text`
- `text-corporate-*` (für alle Corporate-Farben)

### Border-Farben
- `border-primary`
- `border-navbar-border`
- `border-corporate-*` (für alle Corporate-Farben)

## CSS-Variablen Referenz

Alle Variablen sind im `:root` definiert und können überall verwendet werden:

```css
:root {
  --color-primary: #e00;
  --color-primary-rgb: 238, 0, 0;
  --color-navbar-border: #e00;
  --coyo-navbar: #e00;
  --coyo-navbar-active: #d50000;
  --coyo-navbar-text: #fff;
  --text-color: #243243;
  --btn-primary-bg: #e00;
  --btn-primary-bg-rgb: 238, 0, 0;
  --btn-primary-color: #fff;
  --link-color: #e00;
  --link-color-rgb: 238, 0, 0;
  --color-background-main: #edeeef;
  --color-green: #0d8093;
  --color-blue: #0d8093;
  --color-yellow: #ffa82e;
  --color-orange: #ff8716;
  --color-red: #991d67;
  --color-white: #fff;
  --color-gray: #aaa;
}
```
