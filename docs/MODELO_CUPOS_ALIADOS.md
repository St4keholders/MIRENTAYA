# Propuesta: modelo de cupos para aliados

*Borrador para discutir. No implica cambios en la base de datos.*

## La idea, traducida del caso Airbnb

En el caso de tu cliente, el dueño no vende noches: le arrienda el inmueble completo a una agencia
por un precio fijo (una semana, un mes) y la agencia revende cada habitación al público final.
El dueño cobra seguro y sin esfuerzo comercial; la agencia asume el riesgo de ocupación a cambio del margen.

Para Stakeholders el "inmueble" es **capacidad contable**: horas de contador convertidas en cupos.

| Airbnb | Stakeholders |
|---|---|
| Inmueble | Capacidad del equipo de contadores en un periodo |
| Habitación / noche | Un **cupo**: una contabilidad mensual de pyme, una nómina de N empleados, una declaración de renta |
| Agencia que arrienda el inmueble | **Aliado** que compra un bloque de cupos |
| Público final | Los clientes del aliado |
| Precio fijo semanal/mensual | Bloque prepagado a precio mayorista |
| Ocupación | **Uso del bloque** (% de cupos usados) |

## Cómo funcionaría

1. **El aliado compra un bloque** (ej. 20 cupos de contabilidad pyme al mes, o 50 declaraciones de renta en temporada),
   prepagado, con descuento sobre el precio de lista y un mínimo de 3 meses.
2. **El aliado revende** a sus clientes con su propio precio, dentro de su oferta, con su marca
   o como "operado por Stakeholders". Su margen es la diferencia.
3. **Stakeholders opera**: los contadores atienden a esos clientes con el mismo ERP. El aliado no toca la contabilidad.
4. **Los cupos no usados vencen** al cierre del periodo (como la noche que la agencia no vendió).
   Para suavizarlo al inicio: se puede pasar hasta un 20 % al mes siguiente.
5. **Renovación por uso real**: si el aliado usó más del 80 % del bloque, se le ofrece uno más grande;
   si usó menos del 50 %, se baja. El tamaño del bloque lo decide lo que pasó, no lo que se prometió.

## Por qué encaja con "conversión por necesidad"

El modelo no depende de que un vendedor convenza a alguien. Se elige al aliado donde **la necesidad ya existe
y tiene fecha**, y el aliado es quien ya tiene la relación con ese cliente en ese momento:

| Aliado | Momento de necesidad de sus clientes | Cupo natural |
|---|---|---|
| Software de POS / facturación electrónica | Empiezan a facturar electrónicamente y necesitan que alguien cuadre | Contabilidad pyme |
| Coworkings e incubadoras | Acaban de crear la SAS | Contabilidad desde el mes 1 |
| Agencias de talento / plataformas de freelancers | Sus freelancers superan topes de renta | Declaración de renta |
| Empresas de vigilancia, aseo o outsourcing | Contratan personal todo el tiempo | Nómina electrónica |
| Gremios y asociaciones sectoriales | Cierres fiscales, cambios de régimen | Bloques en temporada |

## Lo que gana cada uno

- **Stakeholders**: ingreso prepagado y predecible, carga de trabajo planeable para los contadores,
  costo de adquisición casi cero.
- **El aliado**: una línea de producto nueva sin contratar contadores, margen por cupo y clientes más fieles.
- **El cliente final**: contador desde el momento exacto en que lo necesita, comprado donde ya compra.

## Reglas para no perder plata

- Prepago siempre: el riesgo de no vender cupos es del aliado, no de Stakeholders.
- Precio mayorista calculado sobre la parte del contador (hoy 70 %) más un piso para la plataforma.
  El descuento sale del margen de venta que ya no se paga a vendedores, no del pago al contador.
- Cláusula de no captación en ambos sentidos.
- SLA de calidad: tiempos de cierre, respuesta y una persona responsable por cliente.
- Piloto de 3 meses con 1 o 2 aliados antes de abrirlo.

## Cómo lo alimenta la prospección

El mismo módulo de prospección sirve para encontrar aliados, no solo clientes. Búsquedas como
*"Coworking · Medellín"*, *"Software de facturación electrónica · Bogotá"* o *"Empresa de vigilancia · Cali"*
traen los candidatos a aliado ya puntuados.

## Qué haría falta en el sistema (más adelante)

Cuando el modelo se valide con el piloto: una tabla de aliados, bloques por periodo, el vínculo
cliente → aliado → bloque y un indicador de uso del bloque. Nada de esto se ha creado todavía.
