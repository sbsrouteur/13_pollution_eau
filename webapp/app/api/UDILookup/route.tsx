// an api route fetching data

import db from "@/app/lib/duckdb";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lonParam = searchParams.get("Lon");
    const latParam = searchParams.get("Lat");

    if (lonParam == null || latParam == null) {
      return NextResponse.json(
        { message: "Invalid parameters" },
        { status: 403 },
      );
    }
    const lon = parseFloat(lonParam);
    const lat = parseFloat(latParam);

    if (isNaN(lon) || isNaN(lat)) {
      return NextResponse.json(
        { message: "Invalid parameters" },
        { status: 403 },
      );
    }
    
    const connection = await db.connect();
    await connection.run("INSTALL spatial;LOAD spatial;");
    await connection.run("INSTALL json;LOAD json;");
    const querySql =
      "SELECT * EXCLUDE(geom) FROM atlasante_udi WHERE ST_Contains(geom, ST_GeomFromText( 'POINT(" +
      lon +
      " " +
      lat +
      ")' ))";
    const result = await connection.runAndReadAll(querySql);
    console.log(result);
    if (result.currentRowCount) {
      return NextResponse.json(
        { udis: result.getRowObjectsJson() },
        { status: 200 },
      );
    } else {
      return NextResponse.json(
        { message: "Aucune udi ne correspond à ces coordonnées" },
        { status: 400 },
      );
    }
  } catch (error) {
    console.log("db error", error);
    return NextResponse.json({ message: error }, { status: 403 });
  }
}
