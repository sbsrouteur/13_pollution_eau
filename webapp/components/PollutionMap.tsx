"use client";

import { useState } from "react";
import PollutionMapBaseLayer, {
  AddressInfos,
} from "@/components/PollutionMapBase";
import PollutionMapFilters from "@/components/PollutionMapFilters";
import PollutionMapDetailPanel from "@/components/PollutionMapDetailPanel";
import PollutionMapSearchBox, {
  CommuneFilterResult,
} from "./PollutionMapSearchBox";
import { MAPLIBRE_MAP } from "@/app/config";
import { MapProvider } from "react-map-gl/maplibre";
import MapZoneSelector from "./MapZoneSelector";

export default function PollutionMap() {
  const [period, setPeriod] = useState("dernier_prel");
  const [category, setCategory] = useState("pfas");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [displayMode, setDisplayMode] = useState<"communes" | "udis">("udis");
  const [mapState, setMapState] = useState<{
    longitude: number;
    latitude: number;
    zoom: number;
  }>(MAPLIBRE_MAP.initialViewState);
  const [communeInseeCode, setCommuneInseeCode] = useState<string | null>(null);
  const [addressCoords, setAddressCoords] = useState<AddressInfos | null>(null);
  const [dataPanel, setDataPanel] = useState<Record<
    string,
    string | number | null
  > | null>(null);

  const handleAddressSelect = (result: CommuneFilterResult | null) => {
    if (result) {
      const { center, zoom, communeInseeCode, address } = result;
      setMapState({ longitude: center[0], latitude: center[1], zoom });
      setCommuneInseeCode(communeInseeCode);
      LookupUDI(center);
      setAddressCoords({
        lon: center[0],
        lat: center[1],
        AddressName: address,
      });
    } else {
      setCommuneInseeCode(null);
      setAddressCoords(null);
    }
  };

  return (
    <MapProvider>
      <div className="relative w-full h-full flex flex-col">
        <PollutionMapBaseLayer
          period={period}
          category={category}
          displayMode={displayMode}
          communeInseeCode={communeInseeCode}
          mapState={mapState}
          onMapStateChange={setMapState}
          setDataPanel={setDataPanel}
          selectedAddressCoords={addressCoords}
        />

        <div className="absolute top-4 left-4 right-4 z-10 bg-white p-3 rounded-lg shadow-lg flex justify-between">
          <div className="grow grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <PollutionMapSearchBox
                communeInseeCode={communeInseeCode}
                onAddressFilter={handleAddressSelect}
              />
            </div>
            <div>
              <PollutionMapFilters
                period={period}
                setPeriod={setPeriod}
                category={category}
                setCategory={setCategory}
                // displayMode={displayMode}
                // setDisplayMode={setDisplayMode}
              />
            </div>
          </div>
        </div>

        <div className="absolute top-24 right-12 z-10 p-3">
          <MapZoneSelector />
        </div>

        {/* <div className="absolute bottom-6 right-4 z-10 bg-white p-3 rounded-lg shadow-lg">
        <PollutionMapLegend category={category} />
      </div> */}

        {dataPanel && (
          <PollutionMapDetailPanel
            data={dataPanel}
            onClose={() => setDataPanel(null)}
            className="absolute bottom-6 left-4 z-10 bg-white p-3 rounded-lg shadow-lg max-w-xs"
          />
        )}
      </div>
    </MapProvider>
  );
}

async function LookupUDI(center: [number, number]) {
  /*try {
    const fecthUrl =
      "/api/UDILookup?Lon=" + center[0] + "&Lat=" + center[1] + "";
    console.log("Lookup UDI", fecthUrl);
    const response = await fetch(fecthUrl);
    const UDIInfo = await response.json();

    alert("UDI "+UDIInfo.nomUDI)
  } catch (ex) {}*/
}
