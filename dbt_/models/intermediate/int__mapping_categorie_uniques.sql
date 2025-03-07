SELECT
    cdparametresiseeaux,
    STRING_AGG(DISTINCT categorie) AS categorie,
    STRING_AGG(DISTINCT cdparametre) AS cdparametre_list,
    STRING_AGG(DISTINCT libmajparametre) AS libmajparametre_list,
    STRING_AGG(DISTINCT libminparametre) AS libminparametre_list,
    STRING_AGG(DISTINCT casparam) AS casparam_list,
    COUNT(DISTINCT cdparametre) AS nb_cdparametre,
    COUNT(DISTINCT libmajparametre) AS nb_libmajparametre,
    COUNT(DISTINCT libminparametre) AS nb_libminparametre,
    COUNT(DISTINCT casparam) AS nb_casparam,
    COUNT(DISTINCT categorie) AS nb_categorie
FROM
    {{ ref('mapping_categories') }}
GROUP BY
    cdparametresiseeaux
