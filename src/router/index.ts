import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { hasPermission, type UserRole } from '@/auth/keycloak'
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
        name: 'PricingManagementAdminConsole',
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
// WICHTIG: Permission-Prüfungen werden im AuthGuard durchgeführt, nicht hier
// Der Router-Guard sollte nicht auf Keycloak-Initialisierung warten, da dies zu Deadlocks führt
// Der AuthGuard ist für die Keycloak-Initialisierung und Permission-Prüfungen zuständig
router.beforeEach(async (to, from, next) => {
  // Public Routes erlauben
  if (to.meta.public) {
    next()
    return
  }

  // Für alle anderen Routes: Navigation durchlassen
  // Der AuthGuard prüft die Berechtigungen nach der Keycloak-Initialisierung
  next()
})

export default router
