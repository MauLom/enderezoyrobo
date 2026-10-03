# Ejemplos de CSV

`manabox-ejemplo.csv` y `moxfield-ejemplo.csv` siguen las columnas de los exports de ManaBox y Moxfield, pero **no son exports reales**: los IDs de Scryfall y de ManaBox son inventados y algunas combinaciones de set y número no existen. Sirven para probar el parser.

El parser se confirmó a mano con exports reales de ambas aplicaciones (#17). Si cambia el formato de alguna, conviene agregar aquí un export real recortado a unas pocas cartas y una prueba que lo importe.

`inventario-ejemplo.csv` e `inventario-con-errores.csv` siguen la plantilla de inventario (`public/plantilla-inventario.csv`) y sirven para probar "Mi inventario" (`/inventario`, casos en `docs/08`). El de ejemplo trae cartas con y sin set, una de dos caras, idioma, foil y un precio con `$` y comas; el de errores trae una carta que no existe, una condición y una cantidad inválidas, una carta repetida con otro precio y un set que no existe (aviso).
