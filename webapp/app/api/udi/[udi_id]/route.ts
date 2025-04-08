import { NextRequest, NextResponse } from "next/server";
import { Data, mockData, UDI } from "@/app/lib/mock-data";
import { UUID } from "crypto";
import db from "@/app/lib/duckdb";
import { DuckDBPreparedStatement, Json } from "@duckdb/node-api";
import { DuckDBResultReader } from "@duckdb/node-api/lib/DuckDBResultReader";

export async function GET(request: NextRequest) {
  const { pathname } = new URL(request.url);
  const udi_id = pathname.split("/").pop();

  if (!udi_id) {
    return NextResponse.json(
      { error: "Paramètre UDI manquant" },
      { status: 400 },
    );
  }
  const RetUDIData = udi_id ? await GetUDIAdministrativeData(udi_id) : null;

  if (RetUDIData) {
    return NextResponse.json(RetUDIData, { status: 200 });
  } else {
    return NextResponse.json({ error: "UDI non trouvée" }, { status: 404 });
  }
}

async function GetUDIAdministrativeData(udi_id: string): UDI | null {
  const connection = await db.connect();
  try {
    let retUDI: UDI = {
      id: udi_id,
      communes_desservies: [],
      nom: "",
      data: [],
    };

    const prepared1 = await connection.prepare(`
      SELECT distinct ins_nom, uge_nom , inseecommune, nomcommune
      FROM atlasante_udi 
      join int__lien_commune_cdreseau on cdreseau = code_udi
      WHERE code_udi = $1::VARCHAR      
    `);

    const prepared2 = await connection.prepare(`
      SELECT periode, categorie , resultat , dernier_prel_datetime
      FROM web__resultats_udi 
      WHERE cdreseau = $1::VARCHAR
      order by periode, categorie
    `);

    prepared1.bindVarchar(1, udi_id);
    prepared2.bindVarchar(1, udi_id);

    const result = await prepared1.runAndReadAll();
    if (result.currentRowCount > 0) {
      const rows = result.getRowObjectsJson();

      retUDI.nom = rows[0].uge_nom;

      rows.map((row) => {
        console.log("CurRow", row);
        retUDI.communes_desservies.push({
          nom: row.nomcommune,
          code_insee: row.inseecommune,
        });
      });

      const result2 = await prepared2.runAndReadAll();
      retUDI.data = GetUDIData(udi_id, result2);

      return retUDI;
    }

    return null;
  } catch (ex) {
    console.log("exception in GetUDIData for UDI", udi_id, ex);
    return null;
  }
}

function GetUDIData(udi_id: string, result: DuckDBResultReader): Data[] {
  const localMap = {};
  const cats = {};
  const retData: Data[] = [];

  if (result.currentRowCount > 0) {
    const rows = result.getRowObjectsJson();

    rows.map((row) => {
      if (!localMap[row.periode]) {
        localMap[row.periode] = [
          { categorie: row.categorie, resultat: row.resultat },
        ];
      } else {
        localMap[row.periode].push({
          categorie: row.categorie,
          resultat: row.resultat,
        });
      }

      if (!cats[row.categorie]) {
        cats[row.categorie] = {
          categorie_id: row.categorie,
          categorie: row.categorie,
          dernier_prelevement_date: row.dernier_prel_datetime,
        };
      } else if (
        cats[row.categorie] == null ||
        cats[row.categorie].dernier_prelevement_date < row.dernier_prel_datetime
      ) {
        cats[row.categorie].dernier_prelevement_date =
          row.dernier_prel_datetime;
      }
    });
    retData.categories = localMap;
  }
  console.log("returning ", retData);

  return retData;
}
