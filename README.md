# 📚 Plantillas CS

App interna para gestionar plantillas de respuesta del equipo de atención al cliente.

**Stack:** React + Vite + TypeScript + Tailwind CSS + Supabase

---

## 🚀 Configuración (sigue este orden)

### 1. Supabase

1. Crea cuenta en [supabase.com](https://supabase.com)
2. Crea nuevo proyecto → anota URL y claves en **Settings → API**
3. Ve a **SQL Editor** → ejecuta todo el contenido de `supabase_schema.sql`

### 2. Google OAuth

1. Ve a [console.cloud.google.com](https://console.cloud.google.com)
2. Crea proyecto → **APIs & Services → Credentials → OAuth 2.0 Client ID**
3. En **Authorized redirect URIs** añade: `https://TU_PROYECTO.supabase.co/auth/v1/callback`
4. En Supabase → **Authentication → Providers → Google** → pega Client ID y Secret

### 3. Variables de entorno en Netlify

En Netlify → Site → **Environment variables** añade:

```
VITE_SUPABASE_URL=https://TU_PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key
```

### 4. Primer admin

Después de hacer login por primera vez, ejecuta en Supabase → SQL Editor:

```sql
UPDATE public.profiles SET role = 'admin' WHERE email = 'tu@email.com';
```

### 5. URL de redirección en Supabase

En Supabase → **Authentication → URL Configuration**:
- **Site URL**: tu URL de Netlify (ej: `https://plantillas-cs.netlify.app`)
- **Redirect URLs**: añade `https://plantillas-cs.netlify.app`

---

## 👥 Roles

| Rol | Permisos |
|---|---|
| `viewer` | Ver y copiar plantillas |
| `editor` | Crear y editar sus plantillas |
| `admin` | Todo + gestionar usuarios |
# rebuild
# vercel
