# Gestor de Pendientes - GitHub Pages

Esta version esta preparada para GitHub Pages.

## Importante

GitHub Pages solo publica archivos estaticos: HTML, CSS y JavaScript. Por eso esta version no usa PHP ni SQLite.

Los usuarios y tareas se guardan en el navegador de cada laptop con `localStorage`.

Eso significa:

- Funciona gratis en GitHub Pages.
- Se puede abrir desde cualquier laptop.
- Cada laptop tendra sus propios datos locales.
- No sirve como base de datos compartida entre varias secretarias.

Para una base de datos compartida necesitas un backend externo como Supabase, Firebase, Render, Railway, Vercel Functions o un hosting con PHP.

## Como publicarlo

1. Crea un repositorio en GitHub.
2. Sube estos archivos a la raiz del repositorio:
   - `index.html`
   - `styles.css`
   - `app.js`
   - `.nojekyll`
3. En GitHub entra a `Settings`.
4. Entra a `Pages`.
5. En `Build and deployment`, selecciona `Deploy from a branch`.
6. Selecciona la rama `main` y la carpeta `/ (root)`.
7. Guarda.
8. Espera unos minutos.

Tu sitio quedara en una direccion parecida a:

```text
https://tuusuario.github.io/nombre-del-repositorio/
```
