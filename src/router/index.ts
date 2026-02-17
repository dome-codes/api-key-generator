import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { hasPermission, type UserRole, whenKeycloakInit } from '@/auth/keycloak'
import AuthGuard from '@/components/auth/AuthGuard.vue'
import HomeView from '../views/HomeView.vue'

// Route-Meta-Typen
declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    requiredPermissions?: string[]
    requiredRole?: UserRole
    public?: boolean
  }
}

const routes: RouteRecordRaw[] = [
  // Public Routes
  {
    path: '/about',
    name: 'about',
    meta: { public: true },
    // route level code-splitting
    component: () => import('../views/AboutView.vue'),
  },
  // Root – AuthGuard (Keycloak + gültiger Nutzer), „Nicht autorisiert“ zentral hier
  {
    path: '/',
    component: AuthGuard,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'home',
        component: HomeView,
        meta: { requiresAuth: true },
      },
      {
        path: 'nicht-autorisiert',
        name: 'NichtAutorisiert',
        component: () => import('../views/NichtAutorisiert.vue'),
        meta: { requiresAuth: false },
      },
      {
        path: 'admin/preise',
        name: 'PricingManagement',
        component: () => import('../views/admin/PricingManagementView.vue'),
        meta: {
          requiresAuth: true,
          requiredPermissions: ['canUseAdminFeatures'],
        },
      },
    ],
  },
  // Admin-Console – gleicher AuthGuard, Redirect „nicht autorisiert“ → /
  {
    path: '/admin-console',
    component: AuthGuard,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'AdminHome',
        component: HomeView,
        meta: { requiresAuth: true },
      },
      {
        path: 'nicht-autorisiert',
        redirect: { name: 'NichtAutorisiert' },
      },
      {
        path: 'admin/preise',
        name: 'PricingManagement',
        component: () => import('../views/admin/PricingManagementView.vue'),
        meta: {
          requiresAuth: true,
          requiredPermissions: ['canUseAdminFeatures'],
        },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// Navigation Guard für globale Auth-Prüfung
router.beforeEach(async (to, from, next) => {
  // Public Routes erlauben
  if (to.meta.public) {
    next()
    return
  }

  // Prüfe ob Route Auth benötigt
  if (to.meta.requiresAuth !== false) {
    // Warte auf Keycloak-Initialisierung, bevor Permission-Prüfungen durchgeführt werden
    // Dies verhindert, dass Permission-Prüfungen fehlschlagen, wenn Keycloak noch nicht bereit ist
    try {
      await whenKeycloakInit
    } catch (error) {
      // Wenn Keycloak-Initialisierung fehlschlägt, weiterleiten
      console.error('Keycloak-Initialisierung fehlgeschlagen:', error)
    }

    // Prüfe spezifische Berechtigungen
    if (to.meta.requiredPermissions && to.meta.requiredPermissions.length > 0) {
      const hasAllPermissions = to.meta.requiredPermissions.every((permission) =>
        hasPermission(permission as any),
      )
      if (!hasAllPermissions) {
        next({ name: 'NichtAutorisiert' })
        return
      }
    }

    // Prüfe spezifische Rolle
    if (to.meta.requiredRole) {
      const { getHighestRole } = await import('@/auth/keycloak')
      const userRole = getHighestRole()
      if (userRole !== to.meta.requiredRole) {
        next({ name: 'NichtAutorisiert' })
        return
      }
    }
  }

  next()
})

export default router
