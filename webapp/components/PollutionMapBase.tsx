"use client";

import { useEffect, useMemo, useState } from "react";
import ReactMapGl, {
  MapLayerMouseEvent,
  Marker,
  Popup,
  ViewStateChangeEvent,
} from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Protocol } from "pmtiles";
import { generateColorExpression } from "@/lib/colorMapping";

import { DEFAULT_MAP_STYLE, getDefaultLayers } from "@/app/config";

import { Pin } from "lucide-react";

export type AddressInfos = {
  lon: number;
  lat: number;
  AddressName: string;
};

type PollutionMapBaseLayerProps = {
  period: string;
  category: string;
  displayMode: "communes" | "udis";
  communeInseeCode: string | null;
  mapState: { longitude: number; latitude: number; zoom: number };
  setDataPanel: (data: Record<string, string | number | null> | null) => void;
  onMapStateChange?: (coords: {
    longitude: number;
    latitude: number;
    zoom: number;
  }) => void;
  selectedAddressCoords: AddressInfos | null;
};

export default function PollutionMapBaseLayer({
  period,
  category,
  displayMode,
  communeInseeCode,
  mapState,
  setDataPanel,
  onMapStateChange,
  selectedAddressCoords,
}: PollutionMapBaseLayerProps) {
  const [addressCoords, setAddressCoords] = useState<AddressInfos | null>(null);

  useEffect(() => {
    // adds the support for PMTiles
    const protocol = new Protocol();
    maplibregl.addProtocol("pmtiles", protocol.tile);
    return () => {
      maplibregl.removeProtocol("pmtiles");
    };
  }, []);

  function onClick(event: MapLayerMouseEvent) {
    if (event.features && event.features.length > 0) {
      console.log("zoom level:", mapState.zoom);
      console.log("Properties:", event.features[0].properties);
      setDataPanel(event.features[0].properties);
    }
  }

  if (selectedAddressCoords !== addressCoords) {
    setAddressCoords(selectedAddressCoords);
  }

  function handleMapStateChange(e: ViewStateChangeEvent) {
    if (e.viewState && onMapStateChange) {
      onMapStateChange({
        longitude: e.viewState.longitude,
        latitude: e.viewState.latitude,
        zoom: e.viewState.zoom,
      });
    }
  }

  const mapStyle = useMemo(() => {
    const dynamicLayers: maplibregl.LayerSpecification[] = [
      {
        id: "communes-layer",
        type: "fill",
        source: "communes",
        "source-layer": "data_communes",
        paint: {
          "fill-color": generateColorExpression(category, period),
          "fill-opacity": 0.5,
        },
        layout: {
          visibility: displayMode === "communes" ? "visible" : "none",
        },
        ...(communeInseeCode
          ? {
              filter: ["==", ["get", "commune_code_insee"], communeInseeCode],
            }
          : {}),
      },
      {
        id: "udis-layer",
        type: "fill",
        source: "udis",
        "source-layer": "data_udi",
        paint: {
          "fill-color": generateColorExpression(category, period),
          "fill-opacity": 0.5,
        },
        layout: {
          visibility: displayMode === "udis" ? "visible" : "none",
        },
        // Filter for UDIs if applicable
        // ...(someUdiCode ? { filter: ["==", ["get", "udi_code"], someUdiCode] } : {}),
      },
      {
        id: "udis-border-layer",
        type: "line",
        source: "udis",
        "source-layer": "data_udi",
        paint: {
          "line-color": "#7F7F7F",
          "line-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            0,
            0.0, // At zoom level 0, line width is 0px
            6,
            0.0, // At zoom level 6, line width is 0px
            20,
            2.0, // At zoom level 20, line width is 2.0px
          ],
        },
        layout: {
          visibility: displayMode === "udis" ? "visible" : "none",
        },
      },
    ];

    return {
      ...DEFAULT_MAP_STYLE,
      layers: [...getDefaultLayers(), ...dynamicLayers],
    } as maplibregl.StyleSpecification;
  }, [communeInseeCode, displayMode, category, period]);

  const interactiveLayerIds =
    displayMode === "communes" ? ["communes-layer"] : ["udis-layer"];

  function getCoordsMarker(): unknown {
    return (
      <>
        <Marker longitude={addressCoords.lon} latitude={addressCoords.lat}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1"
            stroke-linecap="round"
            stroke-linejoin="round"
            className="lucide w-8 h-8"
          >
            <path d="M15 22a1 1 0 0 1-1-1v-4a1 1 0 0 1 .445-.832l3-2a1 1 0 0 1 1.11 0l3 2A1 1 0 0 1 22 17v4a1 1 0 0 1-1 1z" />
            <path
              d="M18 10a8 8 0 0 0-16 0c0 4.993 5.539 10.193 7.399 11.799a1 1 0 0 0 .601.2"
              fill="white"
              color="white"
            />
            <path d="M18 22v-3" />
          </svg>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            className="lucide -mt-7 ml-1.5"
          >
            <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" />
          </svg>
        </Marker>
        <Popup
          longitude={addressCoords.lon}
          latitude={addressCoords.lat}
          anchor="bottom"
          className="-mt-5"
          closeButton={false}
        >
          <span className="font-bold ">{addressCoords?.AddressName}</span>
          <br />
          <span className="opacity-35">
            Cette adresse est désservie par une unité de distribution.
          </span>
        </Popup>
      </>
    );
  }

  return (
    <ReactMapGl
      id="map"
      style={{ width: "100%", height: "100%" }}
      mapStyle={mapStyle}
      {...mapState}
      mapLib={maplibregl}
      onClick={onClick}
      onMove={handleMapStateChange}
      interactiveLayerIds={interactiveLayerIds}
    >
      {addressCoords ? getCoordsMarker() : null}
    </ReactMapGl>
  );
}
