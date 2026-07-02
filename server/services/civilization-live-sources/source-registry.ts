import type {
  CivilizationMeasurementDomainV1,
  CivilizationMeasurementSourceKindV1,
} from "@shared/civilization-source-measurement";

export type CivilizationLiveSourceId =
  | "usgs_earthquake_catalog"
  | "noaa_coops_data_api"
  | "nws_weather_api"
  | "copernicus_marine_toolbox";

export type CivilizationLiveSourceDescriptor = {
  sourceId: CivilizationLiveSourceId;
  sourceKind: CivilizationMeasurementSourceKindV1;
  label: string;
  baseUrl: string;
  measurementDomains: CivilizationMeasurementDomainV1[];
  liveSupport: boolean;
  historySupport: boolean;
  authRequired: boolean;
  defaultCadence: "minutes" | "hourly" | "daily" | "model_run";
  evidenceOnly: true;
};

export type CivilizationLiveSourceRequest =
  | {
      sourceId: "usgs_earthquake_catalog";
      url: string;
      method: "GET";
      sourceKind: "usgs_earthquake";
      sourceRefs: string[];
      params: {
        starttime?: string;
        endtime?: string;
        updatedafter?: string;
        minmagnitude?: number;
        minlatitude?: number;
        maxlatitude?: number;
        minlongitude?: number;
        maxlongitude?: number;
      };
    }
  | {
      sourceId: "noaa_coops_data_api";
      url: string;
      method: "GET";
      sourceKind: "noaa_coops";
      sourceRefs: string[];
      params: {
        station: string;
        product: "water_level" | "one_minute_water_level" | "predictions" | "currents";
        date?: "latest" | "recent" | "today";
        begin_date?: string;
        end_date?: string;
        range?: number;
        datum?: string;
        units?: "english" | "metric";
        time_zone?: "gmt" | "lst" | "lst_ldt";
      };
    }
  | {
      sourceId: "nws_weather_api";
      url: string;
      method: "GET";
      sourceKind: "nws_weather";
      sourceRefs: string[];
      params: {
        endpoint: "points" | "alerts_active" | "stations_observations";
        latitude?: number;
        longitude?: number;
        stationId?: string;
        area?: string;
      };
    }
  | {
      sourceId: "copernicus_marine_toolbox";
      url: string;
      method: "TOOLBOX_OR_AUTHENTICATED_API";
      sourceKind: "copernicus_marine";
      sourceRefs: string[];
      params: {
        datasetId: string;
        variable?: string;
        minimumLongitude?: number;
        maximumLongitude?: number;
        minimumLatitude?: number;
        maximumLatitude?: number;
        startDatetime?: string;
        endDatetime?: string;
      };
    };

export const CIVILIZATION_LIVE_SOURCE_REGISTRY: Record<
  CivilizationLiveSourceId,
  CivilizationLiveSourceDescriptor
> = {
  usgs_earthquake_catalog: {
    sourceId: "usgs_earthquake_catalog",
    sourceKind: "usgs_earthquake",
    label: "USGS Earthquake Catalog and real-time GeoJSON feeds",
    baseUrl: "https://earthquake.usgs.gov/fdsnws/event/1/query",
    measurementDomains: ["seismic_activity"],
    liveSupport: true,
    historySupport: true,
    authRequired: false,
    defaultCadence: "minutes",
    evidenceOnly: true,
  },
  noaa_coops_data_api: {
    sourceId: "noaa_coops_data_api",
    sourceKind: "noaa_coops",
    label: "NOAA CO-OPS tides, water levels, meteorology, and currents",
    baseUrl: "https://api.tidesandcurrents.noaa.gov/api/prod/datagetter",
    measurementDomains: ["tide_height", "water_level", "current_velocity"],
    liveSupport: true,
    historySupport: true,
    authRequired: false,
    defaultCadence: "minutes",
    evidenceOnly: true,
  },
  nws_weather_api: {
    sourceId: "nws_weather_api",
    sourceKind: "nws_weather",
    label: "NOAA National Weather Service API",
    baseUrl: "https://api.weather.gov",
    measurementDomains: ["wind_vector", "weather_alert", "atmospheric_observation"],
    liveSupport: true,
    historySupport: true,
    authRequired: false,
    defaultCadence: "minutes",
    evidenceOnly: true,
  },
  copernicus_marine_toolbox: {
    sourceId: "copernicus_marine_toolbox",
    sourceKind: "copernicus_marine",
    label: "Copernicus Marine Toolbox and data APIs",
    baseUrl: "https://data.marine.copernicus.eu",
    measurementDomains: ["ocean_current", "current_velocity", "water_level"],
    liveSupport: true,
    historySupport: true,
    authRequired: true,
    defaultCadence: "model_run",
    evidenceOnly: true,
  },
};

const appendParams = (baseUrl: string, params: Record<string, string | number | undefined>): string => {
  const url = new URL(baseUrl);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) url.searchParams.set(key, String(value));
  });
  return url.toString();
};

export function planUsgsEarthquakeRequest(
  params: Extract<CivilizationLiveSourceRequest, { sourceId: "usgs_earthquake_catalog" }>["params"],
): Extract<CivilizationLiveSourceRequest, { sourceId: "usgs_earthquake_catalog" }> {
  return {
    sourceId: "usgs_earthquake_catalog",
    method: "GET",
    sourceKind: "usgs_earthquake",
    sourceRefs: ["source:usgs-earthquake-catalog"],
    params,
    url: appendParams(CIVILIZATION_LIVE_SOURCE_REGISTRY.usgs_earthquake_catalog.baseUrl, {
      format: "geojson",
      starttime: params.starttime,
      endtime: params.endtime,
      updatedafter: params.updatedafter,
      minmagnitude: params.minmagnitude,
      minlatitude: params.minlatitude,
      maxlatitude: params.maxlatitude,
      minlongitude: params.minlongitude,
      maxlongitude: params.maxlongitude,
    }),
  };
}

export function planNoaaCoopsRequest(
  params: Extract<CivilizationLiveSourceRequest, { sourceId: "noaa_coops_data_api" }>["params"],
): Extract<CivilizationLiveSourceRequest, { sourceId: "noaa_coops_data_api" }> {
  return {
    sourceId: "noaa_coops_data_api",
    method: "GET",
    sourceKind: "noaa_coops",
    sourceRefs: ["source:noaa-coops-data-api", `station:${params.station}`],
    params,
    url: appendParams(CIVILIZATION_LIVE_SOURCE_REGISTRY.noaa_coops_data_api.baseUrl, {
      station: params.station,
      product: params.product,
      date: params.date,
      begin_date: params.begin_date,
      end_date: params.end_date,
      range: params.range,
      datum: params.datum ?? (params.product.includes("water_level") ? "MLLW" : undefined),
      units: params.units ?? "metric",
      time_zone: params.time_zone ?? "gmt",
      format: "json",
    }),
  };
}

export function planNwsWeatherRequest(
  params: Extract<CivilizationLiveSourceRequest, { sourceId: "nws_weather_api" }>["params"],
): Extract<CivilizationLiveSourceRequest, { sourceId: "nws_weather_api" }> {
  let endpoint = "/alerts/active";
  if (params.endpoint === "points") endpoint = `/points/${params.latitude},${params.longitude}`;
  if (params.endpoint === "stations_observations" && params.stationId) {
    endpoint = `/stations/${params.stationId}/observations/latest`;
  }
  return {
    sourceId: "nws_weather_api",
    method: "GET",
    sourceKind: "nws_weather",
    sourceRefs: ["source:nws-weather-api"],
    params,
    url: appendParams(`${CIVILIZATION_LIVE_SOURCE_REGISTRY.nws_weather_api.baseUrl}${endpoint}`, {
      area: params.endpoint === "alerts_active" ? params.area : undefined,
    }),
  };
}

export function planCopernicusMarineRequest(
  params: Extract<CivilizationLiveSourceRequest, { sourceId: "copernicus_marine_toolbox" }>["params"],
): Extract<CivilizationLiveSourceRequest, { sourceId: "copernicus_marine_toolbox" }> {
  return {
    sourceId: "copernicus_marine_toolbox",
    method: "TOOLBOX_OR_AUTHENTICATED_API",
    sourceKind: "copernicus_marine",
    sourceRefs: ["source:copernicus-marine-toolbox", `dataset:${params.datasetId}`],
    params,
    url: CIVILIZATION_LIVE_SOURCE_REGISTRY.copernicus_marine_toolbox.baseUrl,
  };
}
