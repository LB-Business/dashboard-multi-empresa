export type MlOperationType = "venta" | "alquiler" | "alquiler_temporario";
export type MlSaleSubtype = "propiedad_individual" | "emprendimiento";

export type MlPropertyType =
  | "cama_nautica"
  | "campo"
  | "casa"
  | "cochera"
  | "consultorio"
  | "departamento"
  | "galpon"
  | "fondo_comercio"
  | "local"
  | "oficina"
  | "otro"
  | "parcela_nicho_boveda"
  | "ph"
  | "quinta"
  | "terreno"
  | "tiempo_compartido";

export type MlAttributeValueType =
  | "string"
  | "number"
  | "number_unit"
  | "list"
  | "boolean";

export interface MercadoLibreCatalogValue {
  id: string | null;
  name: string;
  metadata?: { value?: boolean };
}

export interface MercadoLibreRequiredAttribute {
  id: string;
  name: string;
  valueType: MlAttributeValueType | string;
  values?: MercadoLibreCatalogValue[];
  allowedUnits?: { id: string; name: string }[];
  defaultUnit?: string | null;
}

export interface MercadoLibreCategoryConfig {
  categoryId: string;
  categoryName: string;
  propertyType: MlPropertyType;
  operation: MlOperationType;
  subtype: MlSaleSubtype | "";
  path: string;
  listingAllowed: boolean;
  buyingModes: string[];
  currencies: string[];
  itemConditions: string[];
  requiredAttributes: MercadoLibreRequiredAttribute[];
}

export const ML_BASE_ATTRIBUTE_IDS = [
  "TOTAL_AREA",
  "COVERED_AREA",
  "ROOMS",
  "BEDROOMS",
  "FULL_BATHROOMS",
  "PARKING_LOTS",
] as const;

export const ML_REAL_ESTATE_CATALOG = [
  {
    "categoryId": "MLA374731",
    "categoryName": "Alquiler",
    "propertyType": "cama_nautica",
    "operation": "alquiler",
    "subtype": "",
    "path": "Inmuebles > Camas Náuticas > Alquiler",
    "listingAllowed": true,
    "buyingModes": [
      "classified"
    ],
    "currencies": [
      "USD",
      "ARS"
    ],
    "itemConditions": [
      "not_specified",
      "new",
      "used"
    ],
    "requiredAttributes": []
  },
  {
    "categoryId": "MLA374732",
    "categoryName": "Venta",
    "propertyType": "cama_nautica",
    "operation": "venta",
    "subtype": "",
    "path": "Inmuebles > Camas Náuticas > Venta",
    "listingAllowed": true,
    "buyingModes": [
      "classified"
    ],
    "currencies": [
      "USD",
      "ARS"
    ],
    "itemConditions": [
      "not_specified",
      "new",
      "used"
    ],
    "requiredAttributes": []
  },
  {
    "categoryId": "MLA6414",
    "categoryName": "Alquiler",
    "propertyType": "campo",
    "operation": "alquiler",
    "subtype": "",
    "path": "Inmuebles > Campos > Alquiler",
    "listingAllowed": true,
    "buyingModes": [
      "classified"
    ],
    "currencies": [
      "USD",
      "ARS"
    ],
    "itemConditions": [
      "not_specified",
      "new",
      "used"
    ],
    "requiredAttributes": [
      {
        "id": "TOTAL_AREA",
        "name": "Superficie total",
        "valueType": "number_unit",
        "values": [],
        "allowedUnits": [
          {
            "id": "ha",
            "name": "ha"
          },
          {
            "id": "m²",
            "name": "m²"
          }
        ],
        "defaultUnit": "ha"
      },
      {
        "id": "LAND_ACCESS",
        "name": "Acceso",
        "valueType": "list",
        "values": [
          {
            "id": "245049",
            "name": "Tierra"
          },
          {
            "id": "245045",
            "name": "Arena"
          },
          {
            "id": "245046",
            "name": "Asfalto"
          },
          {
            "id": "245047",
            "name": "Otro"
          },
          {
            "id": "245048",
            "name": "Ripio"
          }
        ],
        "allowedUnits": [],
        "defaultUnit": null
      },
      {
        "id": "BEDROOMS",
        "name": "Dormitorios",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      },
      {
        "id": "FULL_BATHROOMS",
        "name": "Baños",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      }
    ]
  },
  {
    "categoryId": "MLA6413",
    "categoryName": "Venta",
    "propertyType": "campo",
    "operation": "venta",
    "subtype": "",
    "path": "Inmuebles > Campos > Venta",
    "listingAllowed": true,
    "buyingModes": [
      "classified"
    ],
    "currencies": [
      "USD",
      "ARS"
    ],
    "itemConditions": [
      "not_specified",
      "new",
      "used"
    ],
    "requiredAttributes": [
      {
        "id": "TOTAL_AREA",
        "name": "Superficie total",
        "valueType": "number_unit",
        "values": [],
        "allowedUnits": [
          {
            "id": "ha",
            "name": "ha"
          },
          {
            "id": "m²",
            "name": "m²"
          }
        ],
        "defaultUnit": "ha"
      },
      {
        "id": "LAND_ACCESS",
        "name": "Acceso",
        "valueType": "list",
        "values": [
          {
            "id": "245049",
            "name": "Tierra"
          },
          {
            "id": "245045",
            "name": "Arena"
          },
          {
            "id": "245046",
            "name": "Asfalto"
          },
          {
            "id": "245047",
            "name": "Otro"
          },
          {
            "id": "245048",
            "name": "Ripio"
          }
        ],
        "allowedUnits": [],
        "defaultUnit": null
      },
      {
        "id": "BEDROOMS",
        "name": "Dormitorios",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      },
      {
        "id": "FULL_BATHROOMS",
        "name": "Baños",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      }
    ]
  },
  {
    "categoryId": "MLA1467",
    "categoryName": "Alquiler",
    "propertyType": "casa",
    "operation": "alquiler",
    "subtype": "",
    "path": "Inmuebles > Casas > Alquiler",
    "listingAllowed": true,
    "buyingModes": [
      "classified"
    ],
    "currencies": [
      "ARS",
      "USD"
    ],
    "itemConditions": [
      "not_specified",
      "new",
      "used"
    ],
    "requiredAttributes": [
      {
        "id": "TOTAL_AREA",
        "name": "Superficie total",
        "valueType": "number_unit",
        "values": [],
        "allowedUnits": [
          {
            "id": "m²",
            "name": "m²"
          }
        ],
        "defaultUnit": "m²"
      },
      {
        "id": "COVERED_AREA",
        "name": "Superficie cubierta",
        "valueType": "number_unit",
        "values": [],
        "allowedUnits": [
          {
            "id": "m²",
            "name": "m²"
          }
        ],
        "defaultUnit": "m²"
      },
      {
        "id": "BEDROOMS",
        "name": "Dormitorios",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      },
      {
        "id": "FULL_BATHROOMS",
        "name": "Baños",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      },
      {
        "id": "PARKING_LOTS",
        "name": "Cocheras",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      }
    ]
  },
  {
    "categoryId": "MLA50278",
    "categoryName": "Alquiler Temporario",
    "propertyType": "casa",
    "operation": "alquiler_temporario",
    "subtype": "",
    "path": "Inmuebles > Casas > Alquiler Temporario",
    "listingAllowed": true,
    "buyingModes": [
      "classified"
    ],
    "currencies": [
      "USD",
      "ARS"
    ],
    "itemConditions": [
      "not_specified",
      "new",
      "used"
    ],
    "requiredAttributes": [
      {
        "id": "TOTAL_AREA",
        "name": "Superficie total",
        "valueType": "number_unit",
        "values": [],
        "allowedUnits": [
          {
            "id": "m²",
            "name": "m²"
          }
        ],
        "defaultUnit": "m²"
      },
      {
        "id": "COVERED_AREA",
        "name": "Superficie cubierta",
        "valueType": "number_unit",
        "values": [],
        "allowedUnits": [
          {
            "id": "m²",
            "name": "m²"
          }
        ],
        "defaultUnit": "m²"
      },
      {
        "id": "GUESTS",
        "name": "Huéspedes",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      },
      {
        "id": "BEDROOMS",
        "name": "Dormitorios",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      },
      {
        "id": "FULL_BATHROOMS",
        "name": "Baños",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      },
      {
        "id": "PARKING_LOTS",
        "name": "Cocheras",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      }
    ]
  },
  {
    "categoryId": "MLA401805",
    "categoryName": "Emprendimientos",
    "propertyType": "casa",
    "operation": "venta",
    "subtype": "emprendimiento",
    "path": "Inmuebles > Casas > Venta > Emprendimientos",
    "listingAllowed": true,
    "buyingModes": [
      "classified"
    ],
    "currencies": [
      "USD",
      "ARS"
    ],
    "itemConditions": [
      "new"
    ],
    "requiredAttributes": [
      {
        "id": "MODEL_NAME",
        "name": "Nombre del modelo",
        "valueType": "string",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      },
      {
        "id": "COVERED_AREA",
        "name": "Superficie cubierta",
        "valueType": "number_unit",
        "values": [],
        "allowedUnits": [
          {
            "id": "m²",
            "name": "m²"
          }
        ],
        "defaultUnit": "m²"
      },
      {
        "id": "BEDROOMS",
        "name": "Dormitorios",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      },
      {
        "id": "FULL_BATHROOMS",
        "name": "Baños",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      },
      {
        "id": "PARKING_LOTS",
        "name": "Cocheras",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      },
      {
        "id": "UNIT_NAME",
        "name": "Nombre de la unidad",
        "valueType": "string",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      },
      {
        "id": "TOTAL_AREA",
        "name": "Superficie total",
        "valueType": "number_unit",
        "values": [],
        "allowedUnits": [
          {
            "id": "m²",
            "name": "m²"
          }
        ],
        "defaultUnit": "m²"
      },
      {
        "id": "DEVELOPMENT_NAME",
        "name": "Nombre del emprendimiento",
        "valueType": "string",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      },
      {
        "id": "POSSESSION_STATUS",
        "name": "Estado del proyecto",
        "valueType": "list",
        "values": [
          {
            "id": "242414",
            "name": "Venta en blanco"
          },
          {
            "id": "242413",
            "name": "Entrega inmediata"
          },
          {
            "id": "27191631",
            "name": "Venta en verde"
          },
          {
            "id": "27191632",
            "name": "Pronta entrega"
          }
        ],
        "allowedUnits": [],
        "defaultUnit": null
      }
    ]
  },
  {
    "categoryId": "MLA401685",
    "categoryName": "Propiedades Individuales",
    "propertyType": "casa",
    "operation": "venta",
    "subtype": "propiedad_individual",
    "path": "Inmuebles > Casas > Venta > Propiedades Individuales",
    "listingAllowed": true,
    "buyingModes": [
      "classified"
    ],
    "currencies": [
      "USD",
      "ARS"
    ],
    "itemConditions": [
      "not_specified",
      "new",
      "used"
    ],
    "requiredAttributes": [
      {
        "id": "TOTAL_AREA",
        "name": "Superficie total",
        "valueType": "number_unit",
        "values": [],
        "allowedUnits": [
          {
            "id": "m²",
            "name": "m²"
          }
        ],
        "defaultUnit": "m²"
      },
      {
        "id": "COVERED_AREA",
        "name": "Superficie cubierta",
        "valueType": "number_unit",
        "values": [],
        "allowedUnits": [
          {
            "id": "m²",
            "name": "m²"
          }
        ],
        "defaultUnit": "m²"
      },
      {
        "id": "BEDROOMS",
        "name": "Dormitorios",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      },
      {
        "id": "FULL_BATHROOMS",
        "name": "Baños",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      },
      {
        "id": "PARKING_LOTS",
        "name": "Cocheras",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      }
    ]
  },
  {
    "categoryId": "MLA50542",
    "categoryName": "Alquiler",
    "propertyType": "cochera",
    "operation": "alquiler",
    "subtype": "",
    "path": "Inmuebles > Cocheras > Alquiler",
    "listingAllowed": true,
    "buyingModes": [
      "classified"
    ],
    "currencies": [
      "USD",
      "ARS"
    ],
    "itemConditions": [
      "not_specified",
      "new",
      "used"
    ],
    "requiredAttributes": [
      {
        "id": "TOTAL_AREA",
        "name": "Superficie total",
        "valueType": "number_unit",
        "values": [],
        "allowedUnits": [
          {
            "id": "m²",
            "name": "m²"
          }
        ],
        "defaultUnit": "m²"
      }
    ]
  },
  {
    "categoryId": "MLA50543",
    "categoryName": "Venta",
    "propertyType": "cochera",
    "operation": "venta",
    "subtype": "",
    "path": "Inmuebles > Cocheras > Venta",
    "listingAllowed": true,
    "buyingModes": [
      "classified"
    ],
    "currencies": [
      "USD",
      "ARS"
    ],
    "itemConditions": [
      "not_specified",
      "new",
      "used"
    ],
    "requiredAttributes": [
      {
        "id": "TOTAL_AREA",
        "name": "Superficie total",
        "valueType": "number_unit",
        "values": [],
        "allowedUnits": [
          {
            "id": "m²",
            "name": "m²"
          }
        ],
        "defaultUnit": "m²"
      }
    ]
  },
  {
    "categoryId": "MLA392266",
    "categoryName": "Alquiler",
    "propertyType": "consultorio",
    "operation": "alquiler",
    "subtype": "",
    "path": "Inmuebles > Consultorios > Alquiler",
    "listingAllowed": true,
    "buyingModes": [
      "classified"
    ],
    "currencies": [
      "USD",
      "ARS"
    ],
    "itemConditions": [
      "not_specified",
      "new",
      "used"
    ],
    "requiredAttributes": [
      {
        "id": "TOTAL_AREA",
        "name": "Superficie total",
        "valueType": "number_unit",
        "values": [],
        "allowedUnits": [
          {
            "id": "m²",
            "name": "m²"
          }
        ],
        "defaultUnit": "m²"
      },
      {
        "id": "COVERED_AREA",
        "name": "Superficie cubierta",
        "valueType": "number_unit",
        "values": [],
        "allowedUnits": [
          {
            "id": "m²",
            "name": "m²"
          }
        ],
        "defaultUnit": "m²"
      },
      {
        "id": "FULL_BATHROOMS",
        "name": "Baños",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      },
      {
        "id": "PARKING_LOTS",
        "name": "Cocheras",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      }
    ]
  },
  {
    "categoryId": "MLA392267",
    "categoryName": "Venta",
    "propertyType": "consultorio",
    "operation": "venta",
    "subtype": "",
    "path": "Inmuebles > Consultorios > Venta",
    "listingAllowed": true,
    "buyingModes": [
      "classified"
    ],
    "currencies": [
      "USD",
      "ARS"
    ],
    "itemConditions": [
      "not_specified",
      "new",
      "used"
    ],
    "requiredAttributes": [
      {
        "id": "TOTAL_AREA",
        "name": "Superficie total",
        "valueType": "number_unit",
        "values": [],
        "allowedUnits": [
          {
            "id": "m²",
            "name": "m²"
          }
        ],
        "defaultUnit": "m²"
      },
      {
        "id": "COVERED_AREA",
        "name": "Superficie cubierta",
        "valueType": "number_unit",
        "values": [],
        "allowedUnits": [
          {
            "id": "m²",
            "name": "m²"
          }
        ],
        "defaultUnit": "m²"
      },
      {
        "id": "FULL_BATHROOMS",
        "name": "Baños",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      },
      {
        "id": "PARKING_LOTS",
        "name": "Cocheras",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      }
    ]
  },
  {
    "categoryId": "MLA1473",
    "categoryName": "Alquiler",
    "propertyType": "departamento",
    "operation": "alquiler",
    "subtype": "",
    "path": "Inmuebles > Departamentos > Alquiler",
    "listingAllowed": true,
    "buyingModes": [
      "classified"
    ],
    "currencies": [
      "ARS",
      "USD"
    ],
    "itemConditions": [
      "not_specified",
      "new",
      "used"
    ],
    "requiredAttributes": [
      {
        "id": "TOTAL_AREA",
        "name": "Superficie total",
        "valueType": "number_unit",
        "values": [],
        "allowedUnits": [
          {
            "id": "m²",
            "name": "m²"
          }
        ],
        "defaultUnit": "m²"
      },
      {
        "id": "COVERED_AREA",
        "name": "Superficie cubierta",
        "valueType": "number_unit",
        "values": [],
        "allowedUnits": [
          {
            "id": "m²",
            "name": "m²"
          }
        ],
        "defaultUnit": "m²"
      },
      {
        "id": "ROOMS",
        "name": "Ambientes",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      },
      {
        "id": "BEDROOMS",
        "name": "Dormitorios",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      },
      {
        "id": "FULL_BATHROOMS",
        "name": "Baños",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      },
      {
        "id": "PARKING_LOTS",
        "name": "Cocheras",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      }
    ]
  },
  {
    "categoryId": "MLA50279",
    "categoryName": "Alquiler Temporario",
    "propertyType": "departamento",
    "operation": "alquiler_temporario",
    "subtype": "",
    "path": "Inmuebles > Departamentos > Alquiler Temporario",
    "listingAllowed": true,
    "buyingModes": [
      "classified"
    ],
    "currencies": [
      "USD",
      "ARS"
    ],
    "itemConditions": [
      "not_specified",
      "new",
      "used"
    ],
    "requiredAttributes": [
      {
        "id": "TOTAL_AREA",
        "name": "Superficie total",
        "valueType": "number_unit",
        "values": [],
        "allowedUnits": [
          {
            "id": "m²",
            "name": "m²"
          }
        ],
        "defaultUnit": "m²"
      },
      {
        "id": "COVERED_AREA",
        "name": "Superficie cubierta",
        "valueType": "number_unit",
        "values": [],
        "allowedUnits": [
          {
            "id": "m²",
            "name": "m²"
          }
        ],
        "defaultUnit": "m²"
      },
      {
        "id": "GUESTS",
        "name": "Huéspedes",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      },
      {
        "id": "ROOMS",
        "name": "Ambientes",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      },
      {
        "id": "BEDROOMS",
        "name": "Dormitorios",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      },
      {
        "id": "FULL_BATHROOMS",
        "name": "Baños",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      },
      {
        "id": "PARKING_LOTS",
        "name": "Cocheras",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      }
    ]
  },
  {
    "categoryId": "MLA401806",
    "categoryName": "Emprendimientos",
    "propertyType": "departamento",
    "operation": "venta",
    "subtype": "emprendimiento",
    "path": "Inmuebles > Departamentos > Venta > Emprendimientos",
    "listingAllowed": true,
    "buyingModes": [
      "classified"
    ],
    "currencies": [
      "USD",
      "ARS"
    ],
    "itemConditions": [
      "new"
    ],
    "requiredAttributes": [
      {
        "id": "MODEL_NAME",
        "name": "Nombre del modelo",
        "valueType": "string",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      },
      {
        "id": "COVERED_AREA",
        "name": "Superficie cubierta",
        "valueType": "number_unit",
        "values": [],
        "allowedUnits": [
          {
            "id": "m²",
            "name": "m²"
          }
        ],
        "defaultUnit": "m²"
      },
      {
        "id": "TOTAL_AREA",
        "name": "Superficie total",
        "valueType": "number_unit",
        "values": [],
        "allowedUnits": [
          {
            "id": "m²",
            "name": "m²"
          }
        ],
        "defaultUnit": "m²"
      },
      {
        "id": "ROOMS",
        "name": "Ambientes",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      },
      {
        "id": "BEDROOMS",
        "name": "Dormitorios",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      },
      {
        "id": "FULL_BATHROOMS",
        "name": "Baños",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      },
      {
        "id": "UNIT_NAME",
        "name": "Nombre de la unidad",
        "valueType": "string",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      },
      {
        "id": "PARKING_LOTS",
        "name": "Cocheras",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      },
      {
        "id": "DEVELOPMENT_NAME",
        "name": "Nombre del emprendimiento",
        "valueType": "string",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      },
      {
        "id": "POSSESSION_STATUS",
        "name": "Estado del proyecto",
        "valueType": "list",
        "values": [
          {
            "id": "242414",
            "name": "Venta en blanco"
          },
          {
            "id": "242413",
            "name": "Entrega inmediata"
          },
          {
            "id": "27191631",
            "name": "Venta en verde"
          },
          {
            "id": "27191632",
            "name": "Pronta entrega"
          }
        ],
        "allowedUnits": [],
        "defaultUnit": null
      }
    ]
  },
  {
    "categoryId": "MLA401686",
    "categoryName": "Propiedades Individuales",
    "propertyType": "departamento",
    "operation": "venta",
    "subtype": "propiedad_individual",
    "path": "Inmuebles > Departamentos > Venta > Propiedades Individuales",
    "listingAllowed": true,
    "buyingModes": [
      "classified"
    ],
    "currencies": [
      "USD",
      "ARS"
    ],
    "itemConditions": [
      "not_specified",
      "new",
      "used"
    ],
    "requiredAttributes": [
      {
        "id": "TOTAL_AREA",
        "name": "Superficie total",
        "valueType": "number_unit",
        "values": [],
        "allowedUnits": [
          {
            "id": "m²",
            "name": "m²"
          }
        ],
        "defaultUnit": "m²"
      },
      {
        "id": "COVERED_AREA",
        "name": "Superficie cubierta",
        "valueType": "number_unit",
        "values": [],
        "allowedUnits": [
          {
            "id": "m²",
            "name": "m²"
          }
        ],
        "defaultUnit": "m²"
      },
      {
        "id": "ROOMS",
        "name": "Ambientes",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      },
      {
        "id": "BEDROOMS",
        "name": "Dormitorios",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      },
      {
        "id": "FULL_BATHROOMS",
        "name": "Baños",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      },
      {
        "id": "PARKING_LOTS",
        "name": "Cocheras",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      }
    ]
  },
  {
    "categoryId": "MLA1476",
    "categoryName": "Alquiler",
    "propertyType": "galpon",
    "operation": "alquiler",
    "subtype": "",
    "path": "Inmuebles > Depósitos y Galpones > Alquiler",
    "listingAllowed": true,
    "buyingModes": [
      "classified"
    ],
    "currencies": [
      "USD",
      "ARS"
    ],
    "itemConditions": [
      "not_specified",
      "new",
      "used"
    ],
    "requiredAttributes": [
      {
        "id": "TOTAL_AREA",
        "name": "Superficie total",
        "valueType": "number_unit",
        "values": [],
        "allowedUnits": [
          {
            "id": "m²",
            "name": "m²"
          }
        ],
        "defaultUnit": "m²"
      },
      {
        "id": "COVERED_AREA",
        "name": "Superficie cubierta",
        "valueType": "number_unit",
        "values": [],
        "allowedUnits": [
          {
            "id": "m²",
            "name": "m²"
          }
        ],
        "defaultUnit": "m²"
      },
      {
        "id": "FULL_BATHROOMS",
        "name": "Baños",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      },
      {
        "id": "PARKING_LOTS",
        "name": "Cocheras",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      }
    ]
  },
  {
    "categoryId": "MLA1477",
    "categoryName": "Venta",
    "propertyType": "galpon",
    "operation": "venta",
    "subtype": "",
    "path": "Inmuebles > Depósitos y Galpones > Venta",
    "listingAllowed": true,
    "buyingModes": [
      "classified"
    ],
    "currencies": [
      "USD",
      "ARS"
    ],
    "itemConditions": [
      "not_specified",
      "new",
      "used"
    ],
    "requiredAttributes": [
      {
        "id": "TOTAL_AREA",
        "name": "Superficie total",
        "valueType": "number_unit",
        "values": [],
        "allowedUnits": [
          {
            "id": "m²",
            "name": "m²"
          }
        ],
        "defaultUnit": "m²"
      },
      {
        "id": "COVERED_AREA",
        "name": "Superficie cubierta",
        "valueType": "number_unit",
        "values": [],
        "allowedUnits": [
          {
            "id": "m²",
            "name": "m²"
          }
        ],
        "defaultUnit": "m²"
      },
      {
        "id": "FULL_BATHROOMS",
        "name": "Baños",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      },
      {
        "id": "PARKING_LOTS",
        "name": "Cocheras",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      }
    ]
  },
  {
    "categoryId": "MLA50546",
    "categoryName": "Alquiler",
    "propertyType": "fondo_comercio",
    "operation": "alquiler",
    "subtype": "",
    "path": "Inmuebles > Fondo de Comercio > Alquiler",
    "listingAllowed": true,
    "buyingModes": [
      "classified"
    ],
    "currencies": [
      "USD",
      "ARS"
    ],
    "itemConditions": [
      "not_specified",
      "new",
      "used"
    ],
    "requiredAttributes": [
      {
        "id": "TOTAL_AREA",
        "name": "Superficie total",
        "valueType": "number_unit",
        "values": [],
        "allowedUnits": [
          {
            "id": "m²",
            "name": "m²"
          }
        ],
        "defaultUnit": "m²"
      },
      {
        "id": "COVERED_AREA",
        "name": "Superficie cubierta",
        "valueType": "number_unit",
        "values": [],
        "allowedUnits": [
          {
            "id": "m²",
            "name": "m²"
          }
        ],
        "defaultUnit": "m²"
      },
      {
        "id": "FULL_BATHROOMS",
        "name": "Baños",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      },
      {
        "id": "PARKING_LOTS",
        "name": "Cocheras",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      }
    ]
  },
  {
    "categoryId": "MLA50550",
    "categoryName": "Venta",
    "propertyType": "fondo_comercio",
    "operation": "venta",
    "subtype": "",
    "path": "Inmuebles > Fondo de Comercio > Venta",
    "listingAllowed": true,
    "buyingModes": [
      "classified"
    ],
    "currencies": [
      "USD",
      "ARS"
    ],
    "itemConditions": [
      "not_specified",
      "new",
      "used"
    ],
    "requiredAttributes": [
      {
        "id": "TOTAL_AREA",
        "name": "Superficie total",
        "valueType": "number_unit",
        "values": [],
        "allowedUnits": [
          {
            "id": "m²",
            "name": "m²"
          }
        ],
        "defaultUnit": "m²"
      },
      {
        "id": "COVERED_AREA",
        "name": "Superficie cubierta",
        "valueType": "number_unit",
        "values": [],
        "allowedUnits": [
          {
            "id": "m²",
            "name": "m²"
          }
        ],
        "defaultUnit": "m²"
      },
      {
        "id": "FULL_BATHROOMS",
        "name": "Baños",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      },
      {
        "id": "PARKING_LOTS",
        "name": "Cocheras",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      }
    ]
  },
  {
    "categoryId": "MLA79243",
    "categoryName": "Alquiler",
    "propertyType": "local",
    "operation": "alquiler",
    "subtype": "",
    "path": "Inmuebles > Locales > Alquiler",
    "listingAllowed": true,
    "buyingModes": [
      "classified"
    ],
    "currencies": [
      "USD",
      "ARS"
    ],
    "itemConditions": [
      "not_specified",
      "new",
      "used"
    ],
    "requiredAttributes": [
      {
        "id": "TOTAL_AREA",
        "name": "Superficie total",
        "valueType": "number_unit",
        "values": [],
        "allowedUnits": [
          {
            "id": "m²",
            "name": "m²"
          }
        ],
        "defaultUnit": "m²"
      },
      {
        "id": "COVERED_AREA",
        "name": "Superficie cubierta",
        "valueType": "number_unit",
        "values": [],
        "allowedUnits": [
          {
            "id": "m²",
            "name": "m²"
          }
        ],
        "defaultUnit": "m²"
      },
      {
        "id": "FULL_BATHROOMS",
        "name": "Baños",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      },
      {
        "id": "PARKING_LOTS",
        "name": "Cocheras",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      }
    ]
  },
  {
    "categoryId": "MLA79244",
    "categoryName": "Venta",
    "propertyType": "local",
    "operation": "venta",
    "subtype": "",
    "path": "Inmuebles > Locales > Venta",
    "listingAllowed": true,
    "buyingModes": [
      "classified"
    ],
    "currencies": [
      "USD",
      "ARS"
    ],
    "itemConditions": [
      "not_specified",
      "new",
      "used"
    ],
    "requiredAttributes": [
      {
        "id": "TOTAL_AREA",
        "name": "Superficie total",
        "valueType": "number_unit",
        "values": [],
        "allowedUnits": [
          {
            "id": "m²",
            "name": "m²"
          }
        ],
        "defaultUnit": "m²"
      },
      {
        "id": "COVERED_AREA",
        "name": "Superficie cubierta",
        "valueType": "number_unit",
        "values": [],
        "allowedUnits": [
          {
            "id": "m²",
            "name": "m²"
          }
        ],
        "defaultUnit": "m²"
      },
      {
        "id": "FULL_BATHROOMS",
        "name": "Baños",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      },
      {
        "id": "PARKING_LOTS",
        "name": "Cocheras",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      }
    ]
  },
  {
    "categoryId": "MLA50539",
    "categoryName": "Alquiler",
    "propertyType": "oficina",
    "operation": "alquiler",
    "subtype": "",
    "path": "Inmuebles > Oficinas > Alquiler",
    "listingAllowed": true,
    "buyingModes": [
      "classified"
    ],
    "currencies": [
      "USD",
      "ARS"
    ],
    "itemConditions": [
      "not_specified",
      "new",
      "used"
    ],
    "requiredAttributes": [
      {
        "id": "TOTAL_AREA",
        "name": "Superficie total",
        "valueType": "number_unit",
        "values": [],
        "allowedUnits": [
          {
            "id": "m²",
            "name": "m²"
          }
        ],
        "defaultUnit": "m²"
      },
      {
        "id": "COVERED_AREA",
        "name": "Superficie cubierta",
        "valueType": "number_unit",
        "values": [],
        "allowedUnits": [
          {
            "id": "m²",
            "name": "m²"
          }
        ],
        "defaultUnit": "m²"
      },
      {
        "id": "PARKING_LOTS",
        "name": "Cocheras",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      },
      {
        "id": "FULL_BATHROOMS",
        "name": "Baños",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      }
    ]
  },
  {
    "categoryId": "MLA401804",
    "categoryName": "Emprendimientos",
    "propertyType": "oficina",
    "operation": "venta",
    "subtype": "emprendimiento",
    "path": "Inmuebles > Oficinas > Venta > Emprendimientos",
    "listingAllowed": true,
    "buyingModes": [
      "classified"
    ],
    "currencies": [
      "USD",
      "ARS"
    ],
    "itemConditions": [
      "new"
    ],
    "requiredAttributes": [
      {
        "id": "MODEL_NAME",
        "name": "Nombre del modelo",
        "valueType": "string",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      },
      {
        "id": "COVERED_AREA",
        "name": "Superficie cubierta",
        "valueType": "number_unit",
        "values": [],
        "allowedUnits": [
          {
            "id": "m²",
            "name": "m²"
          }
        ],
        "defaultUnit": "m²"
      },
      {
        "id": "FULL_BATHROOMS",
        "name": "Baños",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      },
      {
        "id": "UNIT_NAME",
        "name": "Nombre de la unidad",
        "valueType": "string",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      },
      {
        "id": "PARKING_LOTS",
        "name": "Cocheras",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      },
      {
        "id": "DEVELOPMENT_NAME",
        "name": "Nombre del emprendimiento",
        "valueType": "string",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      },
      {
        "id": "POSSESSION_STATUS",
        "name": "Estado del proyecto",
        "valueType": "list",
        "values": [
          {
            "id": "242414",
            "name": "Venta en blanco"
          },
          {
            "id": "242413",
            "name": "Entrega inmediata"
          },
          {
            "id": "27191631",
            "name": "Venta en verde"
          },
          {
            "id": "27191632",
            "name": "Pronta entrega"
          }
        ],
        "allowedUnits": [],
        "defaultUnit": null
      }
    ]
  },
  {
    "categoryId": "MLA401684",
    "categoryName": "Propiedades Individuales",
    "propertyType": "oficina",
    "operation": "venta",
    "subtype": "propiedad_individual",
    "path": "Inmuebles > Oficinas > Venta > Propiedades Individuales",
    "listingAllowed": true,
    "buyingModes": [
      "classified"
    ],
    "currencies": [
      "USD",
      "ARS"
    ],
    "itemConditions": [
      "not_specified",
      "new",
      "used"
    ],
    "requiredAttributes": [
      {
        "id": "TOTAL_AREA",
        "name": "Superficie total",
        "valueType": "number_unit",
        "values": [],
        "allowedUnits": [
          {
            "id": "m²",
            "name": "m²"
          }
        ],
        "defaultUnit": "m²"
      },
      {
        "id": "COVERED_AREA",
        "name": "Superficie cubierta",
        "valueType": "number_unit",
        "values": [],
        "allowedUnits": [
          {
            "id": "m²",
            "name": "m²"
          }
        ],
        "defaultUnit": "m²"
      },
      {
        "id": "PARKING_LOTS",
        "name": "Cocheras",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      },
      {
        "id": "FULL_BATHROOMS",
        "name": "Baños",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      }
    ]
  },
  {
    "categoryId": "MLA6395",
    "categoryName": "Alquiler",
    "propertyType": "otro",
    "operation": "alquiler",
    "subtype": "",
    "path": "Inmuebles > Otros Inmuebles > Alquiler",
    "listingAllowed": true,
    "buyingModes": [
      "classified"
    ],
    "currencies": [
      "USD",
      "ARS"
    ],
    "itemConditions": [
      "not_specified",
      "new",
      "used"
    ],
    "requiredAttributes": [
      {
        "id": "TOTAL_AREA",
        "name": "Superficie total",
        "valueType": "number_unit",
        "values": [],
        "allowedUnits": [
          {
            "id": "ha",
            "name": "ha"
          },
          {
            "id": "m²",
            "name": "m²"
          }
        ],
        "defaultUnit": "m²"
      },
      {
        "id": "COVERED_AREA",
        "name": "Superficie cubierta",
        "valueType": "number_unit",
        "values": [],
        "allowedUnits": [
          {
            "id": "m²",
            "name": "m²"
          }
        ],
        "defaultUnit": "m²"
      }
    ]
  },
  {
    "categoryId": "MLA50283",
    "categoryName": "Alquiler Temporario",
    "propertyType": "otro",
    "operation": "alquiler_temporario",
    "subtype": "",
    "path": "Inmuebles > Otros Inmuebles > Alquiler Temporario",
    "listingAllowed": true,
    "buyingModes": [
      "classified"
    ],
    "currencies": [
      "USD",
      "ARS"
    ],
    "itemConditions": [
      "not_specified",
      "new",
      "used"
    ],
    "requiredAttributes": [
      {
        "id": "TOTAL_AREA",
        "name": "Superficie total",
        "valueType": "number_unit",
        "values": [],
        "allowedUnits": [
          {
            "id": "ha",
            "name": "ha"
          },
          {
            "id": "m²",
            "name": "m²"
          }
        ],
        "defaultUnit": "m²"
      },
      {
        "id": "COVERED_AREA",
        "name": "Superficie cubierta",
        "valueType": "number_unit",
        "values": [],
        "allowedUnits": [
          {
            "id": "m²",
            "name": "m²"
          }
        ],
        "defaultUnit": "m²"
      }
    ]
  },
  {
    "categoryId": "MLA6396",
    "categoryName": "Venta",
    "propertyType": "otro",
    "operation": "venta",
    "subtype": "",
    "path": "Inmuebles > Otros Inmuebles > Venta",
    "listingAllowed": true,
    "buyingModes": [
      "classified"
    ],
    "currencies": [
      "USD",
      "ARS"
    ],
    "itemConditions": [
      "not_specified",
      "new",
      "used"
    ],
    "requiredAttributes": [
      {
        "id": "TOTAL_AREA",
        "name": "Superficie total",
        "valueType": "number_unit",
        "values": [],
        "allowedUnits": [
          {
            "id": "m²",
            "name": "m²"
          }
        ],
        "defaultUnit": "m²"
      },
      {
        "id": "COVERED_AREA",
        "name": "Superficie cubierta",
        "valueType": "number_unit",
        "values": [],
        "allowedUnits": [
          {
            "id": "m²",
            "name": "m²"
          }
        ],
        "defaultUnit": "m²"
      }
    ]
  },
  {
    "categoryId": "MLA105181",
    "categoryName": "Alquiler",
    "propertyType": "ph",
    "operation": "alquiler",
    "subtype": "",
    "path": "Inmuebles > PH > Alquiler",
    "listingAllowed": true,
    "buyingModes": [
      "classified"
    ],
    "currencies": [
      "ARS",
      "USD"
    ],
    "itemConditions": [
      "not_specified",
      "new",
      "used"
    ],
    "requiredAttributes": [
      {
        "id": "TOTAL_AREA",
        "name": "Superficie total",
        "valueType": "number_unit",
        "values": [],
        "allowedUnits": [
          {
            "id": "m²",
            "name": "m²"
          }
        ],
        "defaultUnit": "m²"
      },
      {
        "id": "COVERED_AREA",
        "name": "Superficie cubierta",
        "valueType": "number_unit",
        "values": [],
        "allowedUnits": [
          {
            "id": "m²",
            "name": "m²"
          }
        ],
        "defaultUnit": "m²"
      },
      {
        "id": "ROOMS",
        "name": "Ambientes",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      },
      {
        "id": "BEDROOMS",
        "name": "Dormitorios",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      },
      {
        "id": "FULL_BATHROOMS",
        "name": "Baños",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      },
      {
        "id": "PARKING_LOTS",
        "name": "Cocheras",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      }
    ]
  },
  {
    "categoryId": "MLA105180",
    "categoryName": "Alquiler Temporario",
    "propertyType": "ph",
    "operation": "alquiler_temporario",
    "subtype": "",
    "path": "Inmuebles > PH > Alquiler Temporario",
    "listingAllowed": true,
    "buyingModes": [
      "classified"
    ],
    "currencies": [
      "USD",
      "ARS"
    ],
    "itemConditions": [
      "not_specified",
      "new",
      "used"
    ],
    "requiredAttributes": [
      {
        "id": "TOTAL_AREA",
        "name": "Superficie total",
        "valueType": "number_unit",
        "values": [],
        "allowedUnits": [
          {
            "id": "m²",
            "name": "m²"
          }
        ],
        "defaultUnit": "m²"
      },
      {
        "id": "COVERED_AREA",
        "name": "Superficie cubierta",
        "valueType": "number_unit",
        "values": [],
        "allowedUnits": [
          {
            "id": "m²",
            "name": "m²"
          }
        ],
        "defaultUnit": "m²"
      },
      {
        "id": "GUESTS",
        "name": "Huéspedes",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      },
      {
        "id": "ROOMS",
        "name": "Ambientes",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      },
      {
        "id": "BEDROOMS",
        "name": "Dormitorios",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      },
      {
        "id": "FULL_BATHROOMS",
        "name": "Baños",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      },
      {
        "id": "PARKING_LOTS",
        "name": "Cocheras",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      }
    ]
  },
  {
    "categoryId": "MLA105182",
    "categoryName": "Venta",
    "propertyType": "ph",
    "operation": "venta",
    "subtype": "",
    "path": "Inmuebles > PH > Venta",
    "listingAllowed": true,
    "buyingModes": [
      "classified"
    ],
    "currencies": [
      "USD",
      "ARS"
    ],
    "itemConditions": [
      "not_specified",
      "new",
      "used"
    ],
    "requiredAttributes": [
      {
        "id": "TOTAL_AREA",
        "name": "Superficie total",
        "valueType": "number_unit",
        "values": [],
        "allowedUnits": [
          {
            "id": "m²",
            "name": "m²"
          }
        ],
        "defaultUnit": "m²"
      },
      {
        "id": "COVERED_AREA",
        "name": "Superficie cubierta",
        "valueType": "number_unit",
        "values": [],
        "allowedUnits": [
          {
            "id": "m²",
            "name": "m²"
          }
        ],
        "defaultUnit": "m²"
      },
      {
        "id": "ROOMS",
        "name": "Ambientes",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      },
      {
        "id": "BEDROOMS",
        "name": "Dormitorios",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      },
      {
        "id": "FULL_BATHROOMS",
        "name": "Baños",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      },
      {
        "id": "PARKING_LOTS",
        "name": "Cocheras",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      }
    ]
  },
  {
    "categoryId": "MLA50548",
    "categoryName": "Venta",
    "propertyType": "parcela_nicho_boveda",
    "operation": "venta",
    "subtype": "",
    "path": "Inmuebles > Parcelas, Nichos y Bóvedas > Venta",
    "listingAllowed": true,
    "buyingModes": [
      "classified"
    ],
    "currencies": [
      "USD",
      "ARS"
    ],
    "itemConditions": [
      "not_specified",
      "new",
      "used"
    ],
    "requiredAttributes": []
  },
  {
    "categoryId": "MLA50549",
    "categoryName": "Alquiler",
    "propertyType": "quinta",
    "operation": "alquiler",
    "subtype": "",
    "path": "Inmuebles > Quintas > Alquiler",
    "listingAllowed": true,
    "buyingModes": [
      "classified"
    ],
    "currencies": [
      "ARS",
      "USD"
    ],
    "itemConditions": [
      "not_specified",
      "new",
      "used"
    ],
    "requiredAttributes": [
      {
        "id": "TOTAL_AREA",
        "name": "Superficie total",
        "valueType": "number_unit",
        "values": [],
        "allowedUnits": [
          {
            "id": "ha",
            "name": "ha"
          },
          {
            "id": "m²",
            "name": "m²"
          }
        ],
        "defaultUnit": "m²"
      },
      {
        "id": "COVERED_AREA",
        "name": "Superficie cubierta",
        "valueType": "number_unit",
        "values": [],
        "allowedUnits": [
          {
            "id": "m²",
            "name": "m²"
          }
        ],
        "defaultUnit": "m²"
      },
      {
        "id": "LAND_ACCESS",
        "name": "Acceso",
        "valueType": "list",
        "values": [
          {
            "id": "245049",
            "name": "Tierra"
          },
          {
            "id": "245045",
            "name": "Arena"
          },
          {
            "id": "245046",
            "name": "Asfalto"
          },
          {
            "id": "245047",
            "name": "Otro"
          },
          {
            "id": "245048",
            "name": "Ripio"
          }
        ],
        "allowedUnits": [],
        "defaultUnit": null
      },
      {
        "id": "BEDROOMS",
        "name": "Dormitorios",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      },
      {
        "id": "FULL_BATHROOMS",
        "name": "Baños",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      },
      {
        "id": "PARKING_LOTS",
        "name": "Cocheras",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      }
    ]
  },
  {
    "categoryId": "MLA52745",
    "categoryName": "Alquiler Temporario",
    "propertyType": "quinta",
    "operation": "alquiler_temporario",
    "subtype": "",
    "path": "Inmuebles > Quintas > Alquiler Temporario",
    "listingAllowed": true,
    "buyingModes": [
      "classified"
    ],
    "currencies": [
      "USD",
      "ARS"
    ],
    "itemConditions": [
      "not_specified",
      "new",
      "used"
    ],
    "requiredAttributes": [
      {
        "id": "TOTAL_AREA",
        "name": "Superficie total",
        "valueType": "number_unit",
        "values": [],
        "allowedUnits": [
          {
            "id": "ha",
            "name": "ha"
          },
          {
            "id": "m²",
            "name": "m²"
          }
        ],
        "defaultUnit": "m²"
      },
      {
        "id": "COVERED_AREA",
        "name": "Superficie cubierta",
        "valueType": "number_unit",
        "values": [],
        "allowedUnits": [
          {
            "id": "m²",
            "name": "m²"
          }
        ],
        "defaultUnit": "m²"
      },
      {
        "id": "GUESTS",
        "name": "Huéspedes",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      },
      {
        "id": "BEDROOMS",
        "name": "Dormitorios",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      },
      {
        "id": "FULL_BATHROOMS",
        "name": "Baños",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      }
    ]
  },
  {
    "categoryId": "MLA458174",
    "categoryName": "Propiedades Usadas",
    "propertyType": "quinta",
    "operation": "venta",
    "subtype": "propiedad_individual",
    "path": "Inmuebles > Quintas > Venta > Propiedades Usadas",
    "listingAllowed": true,
    "buyingModes": [
      "classified"
    ],
    "currencies": [
      "USD",
      "ARS"
    ],
    "itemConditions": [
      "not_specified",
      "new",
      "used"
    ],
    "requiredAttributes": [
      {
        "id": "TOTAL_AREA",
        "name": "Superficie total",
        "valueType": "number_unit",
        "values": [],
        "allowedUnits": [
          {
            "id": "ha",
            "name": "ha"
          },
          {
            "id": "m²",
            "name": "m²"
          }
        ],
        "defaultUnit": "m²"
      },
      {
        "id": "COVERED_AREA",
        "name": "Superficie cubierta",
        "valueType": "number_unit",
        "values": [],
        "allowedUnits": [
          {
            "id": "m²",
            "name": "m²"
          }
        ],
        "defaultUnit": "m²"
      },
      {
        "id": "LAND_ACCESS",
        "name": "Acceso",
        "valueType": "list",
        "values": [
          {
            "id": "245049",
            "name": "Tierra"
          },
          {
            "id": "245045",
            "name": "Arena"
          },
          {
            "id": "245046",
            "name": "Asfalto"
          },
          {
            "id": "245047",
            "name": "Otro"
          },
          {
            "id": "245048",
            "name": "Ripio"
          }
        ],
        "allowedUnits": [],
        "defaultUnit": null
      },
      {
        "id": "BEDROOMS",
        "name": "Dormitorios",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      },
      {
        "id": "FULL_BATHROOMS",
        "name": "Baños",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      },
      {
        "id": "PARKING_LOTS",
        "name": "Cocheras",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      }
    ]
  },
  {
    "categoryId": "MLA458173",
    "categoryName": "Proyectos",
    "propertyType": "quinta",
    "operation": "venta",
    "subtype": "emprendimiento",
    "path": "Inmuebles > Quintas > Venta > Proyectos",
    "listingAllowed": true,
    "buyingModes": [
      "classified"
    ],
    "currencies": [
      "USD",
      "ARS"
    ],
    "itemConditions": [
      "new"
    ],
    "requiredAttributes": [
      {
        "id": "MODEL_NAME",
        "name": "Nombre del modelo",
        "valueType": "string",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      },
      {
        "id": "TOTAL_AREA",
        "name": "Superficie total",
        "valueType": "number_unit",
        "values": [],
        "allowedUnits": [
          {
            "id": "ha",
            "name": "ha"
          },
          {
            "id": "m²",
            "name": "m²"
          }
        ],
        "defaultUnit": "m²"
      },
      {
        "id": "UNIT_NAME",
        "name": "Nombre de la unidad",
        "valueType": "string",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      },
      {
        "id": "DEVELOPMENT_NAME",
        "name": "Nombre del emprendimiento",
        "valueType": "string",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      },
      {
        "id": "POSSESSION_STATUS",
        "name": "Estado del proyecto",
        "valueType": "list",
        "values": [
          {
            "id": "242414",
            "name": "Venta en blanco"
          },
          {
            "id": "242413",
            "name": "Entrega inmediata"
          },
          {
            "id": "27191631",
            "name": "Venta en verde"
          },
          {
            "id": "27191632",
            "name": "Pronta entrega"
          }
        ],
        "allowedUnits": [],
        "defaultUnit": null
      }
    ]
  },
  {
    "categoryId": "MLA1494",
    "categoryName": "Alquiler",
    "propertyType": "terreno",
    "operation": "alquiler",
    "subtype": "",
    "path": "Inmuebles > Terrenos y Lotes > Alquiler",
    "listingAllowed": true,
    "buyingModes": [
      "classified"
    ],
    "currencies": [
      "USD",
      "ARS"
    ],
    "itemConditions": [
      "not_specified",
      "new",
      "used"
    ],
    "requiredAttributes": [
      {
        "id": "TOTAL_AREA",
        "name": "Superficie total",
        "valueType": "number_unit",
        "values": [],
        "allowedUnits": [
          {
            "id": "ha",
            "name": "ha"
          },
          {
            "id": "m²",
            "name": "m²"
          }
        ],
        "defaultUnit": "m²"
      },
      {
        "id": "LAND_ACCESS",
        "name": "Acceso",
        "valueType": "list",
        "values": [
          {
            "id": "245049",
            "name": "Tierra"
          },
          {
            "id": "245045",
            "name": "Arena"
          },
          {
            "id": "245046",
            "name": "Asfalto"
          },
          {
            "id": "245047",
            "name": "Otro"
          },
          {
            "id": "245048",
            "name": "Ripio"
          }
        ],
        "allowedUnits": [],
        "defaultUnit": null
      }
    ]
  },
  {
    "categoryId": "MLA401803",
    "categoryName": "Emprendimientos",
    "propertyType": "terreno",
    "operation": "venta",
    "subtype": "emprendimiento",
    "path": "Inmuebles > Terrenos y Lotes > Venta > Emprendimientos",
    "listingAllowed": true,
    "buyingModes": [
      "classified"
    ],
    "currencies": [
      "USD",
      "ARS"
    ],
    "itemConditions": [
      "new"
    ],
    "requiredAttributes": [
      {
        "id": "MODEL_NAME",
        "name": "Nombre del modelo",
        "valueType": "string",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      },
      {
        "id": "TOTAL_AREA",
        "name": "Superficie total",
        "valueType": "number_unit",
        "values": [],
        "allowedUnits": [
          {
            "id": "ha",
            "name": "ha"
          },
          {
            "id": "m²",
            "name": "m²"
          }
        ],
        "defaultUnit": "m²"
      },
      {
        "id": "UNIT_NAME",
        "name": "Nombre de la unidad",
        "valueType": "string",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      },
      {
        "id": "DEVELOPMENT_NAME",
        "name": "Nombre del emprendimiento",
        "valueType": "string",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      },
      {
        "id": "POSSESSION_STATUS",
        "name": "Estado del proyecto",
        "valueType": "list",
        "values": [
          {
            "id": "242414",
            "name": "Venta en blanco"
          },
          {
            "id": "242413",
            "name": "Entrega inmediata"
          },
          {
            "id": "27191631",
            "name": "Venta en verde"
          },
          {
            "id": "27191632",
            "name": "Pronta entrega"
          }
        ],
        "allowedUnits": [],
        "defaultUnit": null
      }
    ]
  },
  {
    "categoryId": "MLA401687",
    "categoryName": "Propiedades Individuales",
    "propertyType": "terreno",
    "operation": "venta",
    "subtype": "propiedad_individual",
    "path": "Inmuebles > Terrenos y Lotes > Venta > Propiedades Individuales",
    "listingAllowed": true,
    "buyingModes": [
      "classified"
    ],
    "currencies": [
      "USD",
      "ARS"
    ],
    "itemConditions": [
      "not_specified",
      "new",
      "used"
    ],
    "requiredAttributes": [
      {
        "id": "TOTAL_AREA",
        "name": "Superficie total",
        "valueType": "number_unit",
        "values": [],
        "allowedUnits": [
          {
            "id": "ha",
            "name": "ha"
          },
          {
            "id": "m²",
            "name": "m²"
          }
        ],
        "defaultUnit": "m²"
      },
      {
        "id": "LAND_ACCESS",
        "name": "Acceso",
        "valueType": "list",
        "values": [
          {
            "id": "245049",
            "name": "Tierra"
          },
          {
            "id": "245045",
            "name": "Arena"
          },
          {
            "id": "245046",
            "name": "Asfalto"
          },
          {
            "id": "245047",
            "name": "Otro"
          },
          {
            "id": "245048",
            "name": "Ripio"
          }
        ],
        "allowedUnits": [],
        "defaultUnit": null
      }
    ]
  },
  {
    "categoryId": "MLA52741",
    "categoryName": "Alquiler Temporario",
    "propertyType": "tiempo_compartido",
    "operation": "alquiler_temporario",
    "subtype": "",
    "path": "Inmuebles > Tiempo Compartido > Alquiler Temporario",
    "listingAllowed": true,
    "buyingModes": [
      "classified"
    ],
    "currencies": [
      "USD",
      "ARS"
    ],
    "itemConditions": [
      "not_specified",
      "new",
      "used"
    ],
    "requiredAttributes": [
      {
        "id": "TOTAL_AREA",
        "name": "Superficie total",
        "valueType": "number_unit",
        "values": [],
        "allowedUnits": [
          {
            "id": "m²",
            "name": "m²"
          }
        ],
        "defaultUnit": "m²"
      },
      {
        "id": "COVERED_AREA",
        "name": "Superficie cubierta",
        "valueType": "number_unit",
        "values": [],
        "allowedUnits": [
          {
            "id": "m²",
            "name": "m²"
          }
        ],
        "defaultUnit": "m²"
      },
      {
        "id": "GUESTS",
        "name": "Huéspedes",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      },
      {
        "id": "ROOMS",
        "name": "Ambientes",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      },
      {
        "id": "BEDROOMS",
        "name": "Dormitorios",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      },
      {
        "id": "FULL_BATHROOMS",
        "name": "Baños",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      },
      {
        "id": "PARKING_LOTS",
        "name": "Cocheras",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      }
    ]
  },
  {
    "categoryId": "MLA50537",
    "categoryName": "Venta",
    "propertyType": "tiempo_compartido",
    "operation": "venta",
    "subtype": "",
    "path": "Inmuebles > Tiempo Compartido > Venta",
    "listingAllowed": true,
    "buyingModes": [
      "classified"
    ],
    "currencies": [
      "USD",
      "ARS"
    ],
    "itemConditions": [
      "not_specified",
      "new",
      "used"
    ],
    "requiredAttributes": [
      {
        "id": "TOTAL_AREA",
        "name": "Superficie total",
        "valueType": "number_unit",
        "values": [],
        "allowedUnits": [
          {
            "id": "m²",
            "name": "m²"
          }
        ],
        "defaultUnit": "m²"
      },
      {
        "id": "COVERED_AREA",
        "name": "Superficie cubierta",
        "valueType": "number_unit",
        "values": [],
        "allowedUnits": [
          {
            "id": "m²",
            "name": "m²"
          }
        ],
        "defaultUnit": "m²"
      },
      {
        "id": "GUESTS",
        "name": "Huéspedes",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      },
      {
        "id": "ROOMS",
        "name": "Ambientes",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      },
      {
        "id": "BEDROOMS",
        "name": "Dormitorios",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      },
      {
        "id": "FULL_BATHROOMS",
        "name": "Baños",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      },
      {
        "id": "PARKING_LOTS",
        "name": "Cocheras",
        "valueType": "number",
        "values": [],
        "allowedUnits": [],
        "defaultUnit": null
      }
    ]
  }
] as MercadoLibreCategoryConfig[];

export const ML_PROPERTY_TYPE_OPTIONS: { value: MlPropertyType; label: string }[] = [
  { value: "casa", label: "Casa" },
  { value: "departamento", label: "Departamento" },
  { value: "terreno", label: "Terreno / Lote" },
  { value: "ph", label: "PH" },
  { value: "local", label: "Local" },
  { value: "oficina", label: "Oficina" },
  { value: "galpon", label: "Depósito / Galpón" },
  { value: "campo", label: "Campo" },
  { value: "quinta", label: "Quinta" },
  { value: "cochera", label: "Cochera" },
  { value: "consultorio", label: "Consultorio" },
  { value: "fondo_comercio", label: "Fondo de comercio" },
  { value: "cama_nautica", label: "Cama náutica" },
  { value: "parcela_nicho_boveda", label: "Parcela, nicho o bóveda" },
  { value: "tiempo_compartido", label: "Tiempo compartido" },
  { value: "otro", label: "Otro inmueble" },
];

export const ML_OPERATION_OPTIONS: { value: MlOperationType; label: string }[] = [
  { value: "venta", label: "Venta" },
  { value: "alquiler", label: "Alquiler" },
  { value: "alquiler_temporario", label: "Alquiler temporario" },
];

export const ML_SUBTYPE_OPTIONS: { value: MlSaleSubtype; label: string }[] = [
  { value: "propiedad_individual", label: "Propiedad individual / usada" },
  { value: "emprendimiento", label: "Emprendimiento / proyecto" },
];

export function getMercadoLibreCategoryConfig(categoryId: string) {
  return ML_REAL_ESTATE_CATALOG.find((item) => item.categoryId === categoryId) || null;
}

export function getKnownCategoryId(
  propertyType: MlPropertyType,
  operationType: MlOperationType,
  saleSubtype: MlSaleSubtype,
) {
  const exact = ML_REAL_ESTATE_CATALOG.find(
    (item) =>
      item.propertyType === propertyType &&
      item.operation === operationType &&
      item.subtype === saleSubtype,
  );

  if (exact) return exact.categoryId;

  const withoutSubtype = ML_REAL_ESTATE_CATALOG.find(
    (item) =>
      item.propertyType === propertyType &&
      item.operation === operationType &&
      !item.subtype,
  );

  if (withoutSubtype) return withoutSubtype.categoryId;

  const fallback = ML_REAL_ESTATE_CATALOG.find(
    (item) => item.propertyType === propertyType && item.operation === operationType,
  );

  return fallback?.categoryId || "";
}

export function getCategoryLabel(categoryId: string) {
  if (!categoryId) return "Categoría no mapeada todavía. Cargá el categoryId manual.";

  return getMercadoLibreCategoryConfig(categoryId)?.path || "Categoría manual personalizada.";
}

export function categoryHasSubtypes(
  propertyType: MlPropertyType,
  operationType: MlOperationType,
) {
  return ML_REAL_ESTATE_CATALOG.some(
    (item) =>
      item.propertyType === propertyType &&
      item.operation === operationType &&
      (item.subtype === "propiedad_individual" || item.subtype === "emprendimiento"),
  );
}

export function getRequiredAttributesForCategory(categoryId: string) {
  return getMercadoLibreCategoryConfig(categoryId)?.requiredAttributes || [];
}

export function isBaseMercadoLibreAttribute(attributeId: string) {
  return (ML_BASE_ATTRIBUTE_IDS as readonly string[]).includes(attributeId);
}

export function getRequiredBaseAttributes(categoryId: string) {
  return getRequiredAttributesForCategory(categoryId).filter((attr) =>
    isBaseMercadoLibreAttribute(attr.id),
  );
}

export function getRequiredExtraAttributes(categoryId: string) {
  return getRequiredAttributesForCategory(categoryId).filter(
    (attr) => !isBaseMercadoLibreAttribute(attr.id),
  );
}

export function getDefaultExtraAttributeValue(
  attr: MercadoLibreRequiredAttribute,
  fallbackTitle = "",
) {
  if (attr.id === "LAND_ACCESS") {
    const asphalt = attr.values?.find((value) => value.name.toLowerCase() === "asfalto");
    return asphalt?.id || asphalt?.name || "Asfalto";
  }

  if (attr.id === "POSSESSION_STATUS") {
    const immediate = attr.values?.find((value) =>
      value.name.toLowerCase().includes("entrega inmediata"),
    );
    return immediate?.id || attr.values?.[0]?.id || attr.values?.[0]?.name || "";
  }

  if (["MODEL_NAME", "UNIT_NAME", "DEVELOPMENT_NAME"].includes(attr.id)) {
    return fallbackTitle || "Propiedad";
  }

  if (attr.id === "GUESTS") return "1";

  if (attr.valueType === "list" || attr.valueType === "boolean") {
    return attr.values?.[0]?.id || attr.values?.[0]?.name || "";
  }

  return "";
}

export function buildMercadoLibreAttributeFromValue(
  attr: MercadoLibreRequiredAttribute,
  rawValue: string,
) {
  const value = String(rawValue ?? "").trim();

  if (!value) return null;

  if (attr.valueType === "list" || attr.valueType === "boolean") {
    const option = attr.values?.find(
      (item) => item.id === value || item.name === value,
    );

    return {
      id: attr.id,
      value_id: option?.id || undefined,
      value_name: option?.id ? undefined : option?.name || value,
    };
  }

  if (attr.valueType === "number") {
    return {
      id: attr.id,
      value_name: value,
    };
  }

  if (attr.valueType === "number_unit") {
    const numberValue = Number(value.replace(",", "."));
    const unit = attr.defaultUnit || attr.allowedUnits?.[0]?.id || "m²";

    if (!Number.isFinite(numberValue)) return null;

    return {
      id: attr.id,
      value_name: `${numberValue} ${unit}`,
      value_struct: {
        number: numberValue,
        unit,
      },
      values: [
        {
          id: null,
          name: `${numberValue} ${unit}`,
          struct: {
            number: numberValue,
            unit,
          },
        },
      ],
    };
  }

  return {
    id: attr.id,
    value_name: value,
  };
}
