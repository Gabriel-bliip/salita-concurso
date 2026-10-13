// EDITAR AQUÍ los colores del fondo vectorial y el comportamiento del mapa.
// Los colores de burbujas/controles están en src/index.css, sección MAPA.
export const MAP_COLORS = {
  background: '#f7f0e3', // = --color-canvas in src/index.css
  urban: '#eee6d8',
  park: '#e2e8d7',
  water: '#cfe3dc',
  building: '#e4dbc9',
  street: '#fffdf8',
  avenueBorder: '#d9cbb6',
  avenue: '#fffaf0',
  text: '#776f60',
}

export const MAP_CONFIG = {
  minZoom: 3,
  maxZoom: 19,
  selectionZoom: 15,
  overviewMaxZoom: 15,
  // Distancia en píxeles: aumentar agrupa más lugares; reducir los separa antes.
  clusterRadius: 64,
  // Separación visual al desplegar lugares con coordenadas idénticas.
  spiderfyDistanceMultiplier: 1.5,
  detailZoom: { secondary: 13, local: 14, buildings: 16, streetNames: 14 },
  fallbackCover: '/cowork-placeholder.svg',
}
