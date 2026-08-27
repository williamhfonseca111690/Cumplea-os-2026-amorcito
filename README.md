# Quiz Oficial · Plan de Cumpleaños de Adriana 💗

Aplicación web de una sola página: un quiz interactivo de 10 preguntas con estética
romántica y de videojuego (paleta fucsia + azul rey oscuro), sistema de puntaje oculto,
pantalla de carga con suspenso y una revelación final.

## Estructura

```
index.html          Marcado de las 4 pantallas
style.css           Diseño, paleta, animaciones y responsive
script.js           Motor de audio + lógica del quiz
assets/ladrona.mp3  Música de fondo
```

## Cómo ejecutarlo

Abrir `index.html` en cualquier navegador moderno, o servirlo con un servidor estático:

```bash
python -m http.server 8899
```

También está publicado con GitHub Pages.

## Notas técnicas

- **Audio:** arranca con el primer clic en cualquier parte de la página (política de
  autoplay de los navegadores). Usa dos instancias de `Audio` que se alternan: al llegar
  al minuto **2:03** se lanza una copia nueva desde el segundo 0 mientras la anterior
  sigue sonando hasta su final natural, generando un solape de ~4 s. La repetición es
  indefinida.
- **Puntaje oculto:** cada opción suma peso a una de tres rutas internas
  (`penumbra`, `multitud`, `pluvia`). Gana la de mayor puntaje acumulado.
- **Accesibilidad:** navegación por teclado (`1`/`2`/`3` o `A`/`B`/`C`, flechas y `Enter`),
  foco visible y soporte de `prefers-reduced-motion`.
- **Responsive:** móvil primero, con ajustes para pantallas menores a 400 px y mayores
  a 760 px. Respeta `safe-area-inset` en iPhone.
