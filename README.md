# Bloque Ganadero Rincon Hondo

Publicacion independiente de la version 2 aprobada de Fincas Cesar.

- Repositorio (publico desde el 16/09/2026 por decision de la propietaria; historial reescrito a un solo commit): https://github.com/lanayagiraldo-a11y/fincas-cesar-rincon-hondo-v2
- Sitio: https://fincas-cesar-rincon-hondo-v2.netlify.app
- Netlify project ID: `14807665-9b12-4374-b0f1-d99c9259ea98`
- Directorio publicable: `dist/`. HTML estatico, sin compilacion.
- Fuente: version aprobada del 16 de septiembre de 2026, commit `583f79ba8fbd38dd244d70c452d251808be1627f`, mas la capa UX del 16 de septiembre de 2026 (noche): `dist/ux.css` y `dist/ux.js` sobre los archivos originales, sin cambiar textos ni cifras.

## Seguridad

Netlify debe mantener la proteccion nativa por contrasena para TODOS los contextos, incluida produccion, vistas previas y enlaces de despliegue. La clave se administra exclusivamente en Netlify y no se guarda en este repositorio. Las reglas noindex son complementarias y no sustituyen la proteccion de acceso.

Solo se incluyen el HTML, estilos, JavaScript, las cuatro fotos en uso (hero en webp y tres en version mejorada entregada por la propietaria el 16/09/2026, sufijo `-v2.jpg`) y ocho mapas editoriales homogeneizados (SVG, PNG y miniaturas). Los iconos Lucide van incrustados como SVG en el HTML (licencia en `dist/assets/vendor/lucide-LICENSE.txt`); no se carga ninguna libreria externa. La lamina en pagina usa el archivo mas ligero de cada mapa (campo `view` en `assets/maps.json`); el visor ampliado siempre usa el SVG. No se incluyen planos originales, documentos fuente, memorias, notas de Obsidian ni credenciales.

## Alcance

Se conservan los cuatro predios, 1.599,9 ha comerciales, 18 reservorios, 4 represas y 18 nacimientos, junto con las referencias y salvedades aprobadas. Los mapas editoriales no constituyen levantamiento topografico ni certificacion de areas o linderos. Se conserva la adaptacion a celular y tableta. Desde la capa UX, toda la informacion se muestra abierta; solo la seccion 08 Referencias es desplegable. No hay seccion de contacto ni Siguientes pasos por decision de la propietaria.

Las publicaciones anteriores de Sites y Netlify permanecen sin cambios.

## Despliegue manual

Antes de publicar, verificar que la proteccion nativa por contrasena siga activa para todos los contextos. Desde esta carpeta, con Netlify CLI autenticada:

```sh
netlify deploy --no-build --prod --dir dist --site 14807665-9b12-4374-b0f1-d99c9259ea98
```

El comando publica solo `dist/`; no la carpeta completa del proyecto.

Ruta alternativa usada el 16/09/2026 (noche), cuando no habia Netlify CLI ni npm instalados: el conector de Netlify entrega un comando `npx -y @netlify/mcp@latest --site-id <id> --proxy-path <url autorizada>` que sube esta carpeta a Netlify y publica `dist/` segun `netlify.toml`. Se ejecuto con `pnpm dlx` y el Node del entorno local. La URL autorizada es temporal y no se guarda.
