# Guía de pruebas: Disponibilidad y Reservas

## Flujo recomendado de prueba manual

### 1. Configurar servicios

1. Navegar a `/admin/servicios`
2. Crear al menos dos servicios:
   - **Revisión corta** — 30 minutos, activo
   - **Revisión completa** — 60 minutos, activo
3. Verificar que aparecen en la grilla con su duración
4. Probar el switch de activo/inactivo en un servicio
5. Probar editar nombre/descripción
6. Probar crear un servicio con duración inválida (< 5 min) → debe mostrar error

---

### 2. Configurar disponibilidad

1. Navegar a `/admin/disponibilidad`
2. **Tab Presencial**:
   - Activar Lunes → agregar bloques `10:00–12:00` y `15:00–18:00`
   - Activar Martes → agregar bloque `09:00–13:00`
   - Dejar Miércoles desactivado
3. **Tab Online**:
   - Activar Lunes → agregar bloque `08:00–20:00`
   - Activar Miércoles → agregar bloque `10:00–14:00`
4. Guardar cambios → debe aparecer toast de éxito
5. Recargar la página → la configuración debe persistir

#### Validaciones a probar:
- Intentar agregar bloque con hora inicio ≥ hora término → debe mostrar error en el diálogo
- Intentar agregar bloque que se solape con uno existente → debe mostrar error con detalle del conflicto
- Desactivar un día que tenía bloques → los bloques deben desaparecer al guardar
- Volver a activar el día → comienza sin bloques

---

### 3. Crear reservas desde el Calendario

1. Navegar a `/admin/reservas`
2. **Tab Calendario**:
   - Seleccionar el próximo Lunes (debe estar habilitado)
   - Seleccionar modalidad: **Presencial**, servicio: **Revisión corta (30 min)**
   - Deben aparecer slots: `10:00–10:30`, `10:30–11:00`, `11:00–11:30`, `11:30–12:00`, `15:00–15:30`, etc.
   - Hacer clic en `10:00–10:30` → se abre diálogo de nueva reserva
   - Llenar nombre, email y confirmar → debe aparecer toast de éxito
   - El slot `10:00–10:30` debe aparecer marcado como no disponible
3. Cambiar a modalidad **Online** con el mismo Lunes y servicio:
   - El slot `10:00–10:30` también debe aparecer no disponible (capacidad global = 1)
4. Seleccionar el próximo Miércoles:
   - Presencial: no debe mostrar slots (día desactivado)
   - Online: debe mostrar slots para bloque `10:00–14:00`

#### Casos borde:
- Seleccionar un servicio de **60 minutos** en un bloque de `10:00–12:00`: debe generar `10:00–11:00` y `11:00–12:00`
- Seleccionar un día sin disponibilidad configurada → mensaje "No hay horarios disponibles"
- No seleccionar servicio → mensaje "Selecciona un servicio para ver los horarios"

---

### 4. Gestión de reservas en la Lista

1. Navegar a `/admin/reservas` → Tab **Lista**
2. Verificar que la reserva creada en el paso anterior aparece con estado "Confirmada"
3. Probar filtro por modalidad: solo debe mostrar reservas de la modalidad seleccionada
4. Probar filtro por estado
5. Cancelar una reserva → estado cambia a "Cancelada"
6. Volver al calendario y confirmar que el slot cancelado vuelve a estar disponible

---

### 5. Reglas de negocio clave a verificar

| Regla | Cómo verificar |
|-------|---------------|
| Capacidad global = 1 | Crear reserva presencial 10:00–10:30 Lunes. Verificar que la misma hora aparece bloqueada en online. |
| No solapamiento de bloques | Intentar agregar bloque 11:00–13:00 cuando ya existe 10:00–12:00 → debe rechazar. |
| Generación de slots exacta | Bloque 10:00–12:00, servicio 30 min → debe generar exactamente 4 slots. Servicio 45 min → 2 slots (10:00–10:45 y 10:45–11:30). |
| Día desactivado | Desactivar un día con bloques, guardar. El día no debe generar slots en reservas. |
| Slots en múltiples bloques | Lunes con bloques 10:00–12:00 y 15:00–18:00 → slots deben aparecer de ambos bloques sin mezclar. |
