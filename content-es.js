/* Spanish how-to steps and FAQs written for each calculator.
   Used by build.js in place of the shared TPL.es template, so every
   Spanish page has its own steps and questions. */
module.exports = {
  weight: { es: {
    howto: ["Elija el modo: peso a partir de la longitud de las barras, o a partir del peso total del pedido.", "Seleccione el diámetro de la barra, la longitud por pieza y la cantidad.", "Lea el peso en kg y en toneladas, y la longitud de barra comercial que necesita."],
    faqs: [["¿Cómo se calcula el peso de la varilla?", "Se multiplica la masa por metro del diámetro elegido por la longitud y la cantidad de barras. Por ejemplo, una barra de 12 mm pesa unos 0,888 kg por metro."], ["¿Para qué sirve el modo inverso?", "Úselo cuando conozca el peso total de un pedido y necesite convertirlo en longitud y número de barras comerciales."]] } },
  slab: { es: {
    howto: ["Introduzca la longitud y el ancho de la losa en metros.", "Indique la separación centro a centro en mm, el recubrimiento de borde y el diámetro de la barra.", "Revise el número de barras en cada dirección, la longitud total y el peso."],
    faqs: [["¿Qué separación de barras debo usar en una losa?", "Depende del diseño. Muchas losas residenciales usan entre 150 y 200 mm c/c, pero la separación debe salir de sus planos y de la norma que aplique."], ["¿Cuánto recubrimiento debo dejar en el borde?", "Depende de la exposición del elemento y de la norma de su proyecto. Introduzca el valor que figura en sus planos."]] } },
  footing: { es: {
    howto: ["Introduzca la longitud y el ancho de la zapata en metros.", "Indique la separación c/c, el recubrimiento libre y el diámetro de la barra.", "Revise la parrilla resultante en ambas direcciones y su peso total."],
    faqs: [["¿Las barras van en las dos direcciones?", "Sí. Una zapata se arma en ambos sentidos, y el cálculo suma las barras de cada dirección."], ["¿Qué recubrimiento necesita una zapata?", "Las zapatas en contacto con el terreno suelen requerir más recubrimiento que las losas interiores. Confirme el valor en sus planos."]] } },
  mat: { es: {
    howto: ["Indique la longitud y el ancho de la parrilla en metros.", "Introduzca la separación en ambas direcciones y el desplazamiento desde el borde.", "Lea el número de barras por dirección, los cruces y el peso de la malla."],
    faqs: [["¿Qué diferencia hay entre una parrilla y una losa?", "La parrilla es la malla de barras cruzadas. La losa es el elemento de hormigón que la contiene. Esta calculadora solo estima la malla."], ["¿Para qué sirven los cruces?", "Cada cruce es un punto de unión entre barras. El número de cruces ayuda a estimar el alambre de atado."]] } },
  spacing: { es: {
    howto: ["Introduzca el ancho total disponible en mm.", "Indique el recubrimiento en cada lado y la separación que desea.", "Compare la separación real con la deseada y use el número de barras obtenido."],
    faqs: [["¿Por qué la separación real no coincide con la deseada?", "El número de barras tiene que ser entero. La calculadora reparte las barras en el ancho disponible y muestra la separación que resulta."], ["¿Qué significa separación c/c?", "Es la distancia entre los ejes de dos barras consecutivas, medida de centro a centro."]] } },
  develop: { es: {
    howto: ["Seleccione el diámetro de la barra.", "Elija la resistencia del acero, la del hormigón y el tipo de tensión.", "Lea la longitud de anclaje Ld."],
    faqs: [["¿Qué cambia el tipo de tensión?", "Una barra en tracción necesita más longitud de anclaje que una comprimida. Elija el caso que corresponde a su elemento."], ["¿Por qué la longitud depende del diámetro?", "La adherencia entre la barra y el hormigón depende de su superficie. Cuanto mayor es el diámetro, más longitud hace falta para transmitir la misma fuerza."]] } },
  lap: { es: {
    howto: ["Seleccione el diámetro de la barra.", "Elija la resistencia del acero, la del hormigón y el tipo de empalme.", "Lea la longitud de solape que necesita."],
    faqs: [["¿Qué diferencia hay entre un empalme a tracción y uno a compresión?", "El empalme a tracción transmite esfuerzos de tracción y necesita más solape. El de compresión necesita menos. Confirme cuál aplica en su proyecto."], ["¿Puedo empalmar todas las barras en la misma sección?", "No es recomendable. Los empalmes escalonados reducen la concentración de esfuerzos. La norma fija el porcentaje máximo que puede empalmarse en una misma sección."]] } },
  hook: { es: {
    howto: ["Introduzca la longitud recta de la barra en mm y el diámetro.", "Indique el número de ganchos y de dobleces de 90°, 45° y 135°.", "Use la longitud de corte resultante en su despiece."],
    faqs: [["¿Qué es un gancho de 9d?", "Es un gancho con una prolongación de 9 veces el diámetro de la barra. Se usa como valor de referencia en este cálculo."], ["¿Cómo se descuentan los dobleces?", "Cada doblez resta una longitud fija según su ángulo (45°, 90° o 135°) y el diámetro, para obtener la longitud de corte real."]] } },
  stirrup: { es: {
    howto: ["Introduzca el ancho y el peralte de la sección en mm.", "Indique el recubrimiento libre y el diámetro del estribo.", "Lea la longitud de corte de cada estribo."],
    faqs: [["¿Qué fórmula usa para el corte del estribo?", "Longitud de corte = 2(a+b) + 2×10d − 3×2d − 2×3d, con a y b las dimensiones del estribo y d el diámetro de la barra."], ["¿Por qué se restan los dobleces?", "La longitud medida por la línea de centro de cada tramo es mayor que el corte real. Los dobleces se descuentan para obtener la medida que se corta."]] } },
  column: { es: {
    howto: ["Introduzca la altura, el ancho y el fondo de la columna.", "Indique el número y el diámetro de las barras verticales, y el recubrimiento.", "Defina la separación de los estribos y revise el peso total."],
    faqs: [["¿Para qué sirven los estribos de una columna?", "Sujetan las barras verticales, evitan que se pandeen y resisten el esfuerzo cortante."], ["¿Qué es el solape extra por barra?", "Es la longitud adicional que se suma a cada barra vertical para el empalme con la barra superior. Confírmela con su proyecto."]] } },
  beam: { es: {
    howto: ["Introduzca la longitud, el ancho y el peralte de la viga.", "Indique el número de barras superiores e inferiores y su diámetro.", "Defina la separación de los estribos y lea el peso total."],
    faqs: [["¿Cuántas barras inferiores son habituales?", "Depende del momento flector. Use la cantidad que indique el cálculo estructural. Esta calculadora suma el acero que usted introduce."], ["¿Por qué los estribos se separan más en el centro?", "El cortante es menor en el centro de la viga, por eso la separación suele aumentar hacia allí. Revise la distribución en sus planos."]] } },
  cost: { es: {
    howto: ["Introduzca el peso total de acero en kg.", "Indique el precio por kg y el porcentaje de desperdicio.", "Lea el coste estimado del material."],
    faqs: [["¿Qué porcentaje de desperdicio debo usar?", "Es un valor orientativo que depende de la obra y de los cortes. Para piezas sencillas suele bastar un valor bajo; para piezas con muchos cortes, suba el porcentaje."], ["¿El precio incluye la mano de obra?", "No. Solo calcula el coste del material. La colocación, el transporte y los impuestos se suman por separado."]] } },
  tonnage: { es: {
    howto: ["Seleccione el diámetro de la barra.", "Introduzca la longitud por barra y la cantidad de piezas.", "Lea el tonelaje total del despiece."],
    faqs: [["¿Qué es un despiece?", "Es la lista de barras con su diámetro, longitud y cantidad. Esta calculadora la convierte en un peso total en toneladas."], ["¿Cómo se pasa de kg a toneladas?", "Se divide el peso total en kg entre 1.000."]] } },
  area: { es: {
    howto: ["Seleccione el diámetro de la barra.", "Introduzca el número de barras y, si lo necesita, el ancho y el peralte de la sección.", "Lea el área de una barra, el área total Ast y el porcentaje de acero."],
    faqs: [["¿Qué es el área de acero Ast?", "Es la suma de las áreas de sección de todas las barras de una sección de hormigón."], ["¿Para qué sirve el porcentaje de acero?", "Compara el área de acero con el área de la sección de hormigón. Las normas fijan límites mínimos y máximos. Verifíquelos en su proyecto."]] } },
  quantity: { es: {
    howto: ["Introduzca el área a cubrir en m².", "Indique la separación en ambas direcciones y el diámetro de la barra.", "Lea el peso por m², por ft² y el total."],
    faqs: [["¿Qué pasa si reduzco la separación?", "Aumentan el número de barras y el peso por metro cuadrado. Pruebe varias separaciones para comparar."], ["¿Sirve para cualquier losa?", "Sirve para estimar el acero de una superficie plana. No reemplaza el cálculo estructural."]] } },
  concrete: { es: {
    howto: ["Introduzca la longitud, el ancho y el espesor de la pieza.", "Indique la cuantía de acero en kg por m³ de hormigón.", "Lea el volumen de hormigón y el acero estimado."],
    faqs: [["¿Qué cuantía de acero debo usar?", "Es un valor de anteproyecto que cambia según el elemento. Use el valor de sus planos cuando lo tenga."], ["¿Por qué el volumen sale en m³?", "El hormigón se compra y se mide en metros cúbicos. Multiplique largo, ancho y espesor, todo en metros."]] } },
  driveway: { es: {
    howto: ["Introduzca la longitud y el ancho de la entrada en metros.", "Indique la separación c/c, el recubrimiento libre y el diámetro de la barra.", "Lea el número de barras en ambos sentidos y el peso."],
    faqs: [["¿Una entrada necesita la misma armadura que una losa interior?", "Suele armarse como una losa de hormigón, pero el paso de vehículos puede exigir más acero. Confírmelo con un ingeniero."], ["¿Por qué importa el recubrimiento en una entrada?", "El hormigón expuesto a la humedad y a las sales de deshielo necesita recubrimiento suficiente para proteger el acero de la corrosión."]] } },
  wall: { es: {
    howto: ["Introduzca la longitud y la altura del muro en metros.", "Indique las separaciones vertical y horizontal, el recubrimiento y el diámetro de cada barra.", "Lea el número de barras en cada dirección y el peso total."],
    faqs: [["¿Qué barras son verticales y cuáles horizontales?", "Las verticales van de la base a la coronación. Las horizontales se colocan a lo largo de la longitud del muro."], ["¿Un muro de bloque se arma igual que uno de hormigón?", "No necesariamente. Los muros de bloque tienen requisitos propios de armado y de relleno. Consulte la norma aplicable."]] } },
  pool: { es: {
    howto: ["Introduzca la longitud y la altura del paño de muro de la piscina en metros.", "Indique las separaciones vertical y horizontal, el recubrimiento y los diámetros.", "Lea la armadura de ese paño y repita el cálculo por cada lado."],
    faqs: [["¿Incluye el fondo de la piscina?", "No. Calcula un paño de muro por lado. Para el fondo use la calculadora de losa."], ["¿Por qué hay que repetir el cálculo por cada lado?", "Cada paño tiene su propia longitud y altura. Sume los resultados de todos los lados para obtener el total."]] } },
  chair: { es: {
    howto: ["Introduzca la longitud y el ancho de la losa en metros.", "Indique la separación de la malla de soportes en metros.", "Lea el número de soportes que necesita."],
    faqs: [["¿Qué hacen los soportes o separadores?", "Mantienen la parrilla superior a la altura correcta durante el hormigonado, para que el recubrimiento sea el de proyecto."], ["¿Qué separación de soportes es habitual?", "Depende del peso de la parrilla y de la obra. Use la separación que indique su plan de armado o su ingeniero."]] } },
  tiewire: { es: {
    howto: ["Introduzca la longitud y el ancho de la losa en metros.", "Indique la separación de las barras en ambas direcciones y la longitud de alambre por atado en mm.", "Indique el porcentaje de cruces atados y lea la cantidad de alambre."],
    faqs: [["¿Hay que atar todos los cruces?", "No siempre. En muchas obras se atan los cruces alternos. El porcentaje que introduzca cambia el resultado."], ["¿Qué longitud de alambre por atado debo usar?", "Depende del tamaño de la barra y del método de atado. Introduzca la longitud media que usa en su obra."]] } },
};
