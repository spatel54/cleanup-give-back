import type maplibregl from "maplibre-gl";

import { cartoVoyagerRasterTileUrls } from "./carto-basemap";

/** Carto Voyager raster tiles - shared basemap style for every MapLibre map in web-app. */
export const VOYAGER_RASTER_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    voyager: {
      type: "raster",
      tiles: cartoVoyagerRasterTileUrls(),
      tileSize: 256,
      attribution: "© CARTO © OpenStreetMap",
    },
  },
  layers: [{ id: "voyager", type: "raster", source: "voyager" }],
};
