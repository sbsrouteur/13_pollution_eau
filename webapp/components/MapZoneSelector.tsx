import { Fragment, MouseEventHandler } from "react";
import { Button } from "./ui/button";

export const ZONE_METROPOLE = "0";
export const ZONE_GUADELOUPE = "1";
export const ZONE_MARTINIQUE = "2";
export const ZONE_MAYOTTE = "3";
export const ZONE_LAREUNION = "4";
export const ZONE_GUYANNE = "5";

export default function MapZoneSelector(props: {
  zoneChangeCallback: (zone: number) => void | null;
}) {
  function HandleClick(h: MouseEventHandler<HTMLButtonElement>): void {
    if (props.zoneChangeCallback) {
      const numZone: number = h.currentTarget.getAttribute("value");
      props.zoneChangeCallback(numZone);
    }
  }
  return (
    <>
      <div className="grid gap-2">
        <div className="row grid-cols-3 gap-2 space-x-2">
          <Button
            className="bg-green-500 text-black hover:bg-green-900 hover:text-green-300"
            onClick={HandleClick}
            value={ZONE_METROPOLE}
          >
            Metropole
          </Button>
          <Button
            className="bg-green-500 text-black hover:bg-green-900 hover:text-green-300"
            onClick={HandleClick}
            value={ZONE_GUADELOUPE}
          >
            Guadeloupe
          </Button>
          <Button
            className="bg-green-500 text-black hover:bg-green-900 hover:text-green-300"
            onClick={HandleClick}
            value={ZONE_MARTINIQUE}
          >
            Martinique
          </Button>
        </div>
        <div className="row grid-cols-3 space-x-2 ">
          <Button
            className="bg-green-500 text-black hover:bg-green-900 hover:text-green-300"
            onClick={HandleClick}
            value={ZONE_MAYOTTE}
          >
            Mayotte
          </Button>
          <Button
            className="bg-green-500 text-black hover:bg-green-900 hover:text-green-300"
            onClick={HandleClick}
            value={ZONE_LAREUNION}
          >
            La Réunion
          </Button>
          <Button
            className="bg-green-500 text-black hover:bg-green-900 hover:text-green-300"
            onClick={HandleClick}
            value={ZONE_GUYANNE}
          >
            Guyanne
          </Button>
        </div>
      </div>
    </>
  );
}
