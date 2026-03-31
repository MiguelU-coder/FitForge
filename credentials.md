# Credenciales de Acceso - FitForge

Este documento contiene las credenciales predeterminadas para los diferentes niveles de acceso en el entorno de desarrollo de FitForge.

## 🌍 Usuario Global (Global Admin)
Este usuario tiene acceso a la configuración global de la plataforma, gestión de organizaciones y planes de facturación.

- **Email**: `mmsporify5673@gmail.com`
- **Password**: `Admin1234`
- **Rol**: `GLOBAL_ADMIN`
- **Acceso**: `/admin-global-settings`

## 🏢 Usuario Organizacional (Org Admin)
Este usuario es el administrador de una organización específica (Gym/Centro Deportivo).

- **Email**: `mmgamepass5673@outlook.com`
- **Password**: `c61af860f!g`
- **Organización**: `Resens` (slug: `resens`)
- **Rol**: `ORG_ADMIN`
- **Acceso**: `/admin` (Dashboard de la Organización)

## 🔑 Otros Usuarios Administrativos (Debug)
Encontrados en scripts de sincronización o base de datos:

- **Email**: `mm6035673@icloud.com`
- **Password**: `4ce24ad7ff!g` (Sincronizado vía `sync-pass.js`)
- **Rol**: `GLOBAL_ADMIN` / `ORG_ADMIN` (variante según script)

---

> [!WARNING]
> Estas credenciales son para uso exclusivo en el entorno de **desarrollo local**. Asegúrate de cambiarlas o eliminarlas antes de cualquier despliegue a producción.

> [!TIP]
> Si alguna de estas contraseñas no funciona, puedes resincronizarlas ejecutando:
> - `npx ts-node backend/create-admin.ts` (para el Global Admin)
> - `node backend/sync-pass.js` (para el Org Admin)
