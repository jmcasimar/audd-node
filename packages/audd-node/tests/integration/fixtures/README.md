# Fixtures para Tests de Integración

Este directorio contiene datos de prueba para los tests de integración de AUDD.

## Archivos

### `dataset-a.json`
Dataset de ejemplo desde "sistema A" con 3 usuarios.

### `dataset-b.json`
Dataset de ejemplo desde "sistema B" con 3 usuarios (con algunas diferencias respecto a A):
- Usuario 1: email cambiado
- Usuario 2: edad incrementada
- Usuario 3: eliminado
- Usuario 4: nuevo

### `dataset.csv`
Mismos datos que `dataset-a.json` en formato CSV.

## Uso

Estos fixtures se usan en los tests de integración para validar:
- Construcción de IR desde diferentes formatos
- Comparación entre datasets
- Generación de planes de resolución
- Aplicación de cambios

## Repetibilidad

Los fixtures son inmutables y están versionados para garantizar que los tests sean repetibles.
