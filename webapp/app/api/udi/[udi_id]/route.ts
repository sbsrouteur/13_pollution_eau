import { NextRequest, NextResponse } from "next/server";
import { Categorie, Data, mockData, UDI } from "@/app/lib/mock-data";
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
  const RetUDIData = await GetUDIAdministrativeData(udi_id);

  if (RetUDIData) {
    return NextResponse.json(RetUDIData, { status: 200 });
  } else {
    return NextResponse.json({ error: "UDI non trouvée" }, { status: 404 });
  }
}

async function GetUDIAdministrativeData(udi_id: string): Promise<UDI | null> {
  const connection = await db.connect();
  try {
    const retUDI: UDI = {
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
      SELECT periode, categorie , resultat , dernier_prel_datetime, nb_parametres
      FROM web__resultats_udi 
      WHERE cdreseau = $1::VARCHAR
      order by periode, categorie
    `);

    prepared1.bindVarchar(1, udi_id);
    prepared2.bindVarchar(1, udi_id);

    const result = await prepared1.runAndReadAll();
    if (result.currentRowCount > 0) {
      const rows = result.getRowObjects();

      if (rows[0].uge_nom) {
        retUDI.nom = rows[0].uge_nom.toString();
      } else {
        throw "Udi must have a name!";
      }

      rows.map((row) => {
        if (row.nomcommune && row.inseecommune) {
          retUDI.communes_desservies.push({
            nom: row.nomcommune.toString(),
            code_insee: row.inseecommune.toString(),
          });
        }
      });

      const result2 = await prepared2.runAndReadAll();
      const data = GetUDIData(udi_id, result2);
      retUDI.data = data;
      return retUDI;
    }

    return null;
  } catch (ex) {
    console.log("exception in GetUDIData for UDI", udi_id, ex);
    return null;
  } finally {
    if (connection) connection.close();
  }
}

function GetUDIData(udi_id: string, result: DuckDBResultReader) {
  const periodes: { [key: string]: Data } = {};

  if (result.currentRowCount > 0) {
    const rows = result.getRowObjects();

    rows.map((row) => {
      if (!row.periode) return;
      const codePeriode: string = row.periode.toString();
      let nomPeriode = codePeriode;
      if (codePeriode?.startsWith("bilan_annuel_")) {
        nomPeriode = codePeriode.substring(13, codePeriode.length);
      }

      //
      if (!periodes[codePeriode]) {
        periodes[codePeriode] = {
          periode: nomPeriode,
          categories: [],
          synthese: [],
        };
      }

      const curPeriode = periodes[codePeriode];
      const dataRecord: Categorie = {
        categorie_id: "",
        categorie: "",
        statut_titre: "",
        statut_description: "",
        statut_couleur: "",
        statut_couleur_background: "",
        statut_picto: null,
        dernier_prelevement_date: "",
        dernier_prelevement_nb_polluants: 0,
        affichage_blocs: false,
        statut_blocs: [],
      };
      let recordDate: Date | null = null;
      if (row.dernier_prel_datetime) {
        recordDate = new Date(row.dernier_prel_datetime.toString());
        dataRecord.dernier_prelevement_date = recordDate.toDateString();
      }

      if (row.categorie) {
        dataRecord.categorie_id = row.categorie?.toString();
        dataRecord.categorie = row.categorie.toString();
      }

      if (row.nb_parametres) {
        dataRecord.dernier_prelevement_nb_polluants = Number(row.nb_parametres);
      }

      if (row.resultat) {
        dataRecord.statut_titre = row.resultat.toString();
      }

      curPeriode.categories.push(dataRecord);
    });
  }

  const retData: Data[] = [];

  for (let x in periodes) {
    retData.push(periodes[x]);
  }
  return retData;
}
