import { settingsService } from "../../modules/settings/settings.service.js";

export function getOvhConfig() {
  return {
    endpoint: settingsService.get("ovh_endpoint") || "eu.api.ovh.com",
    applicationKey: settingsService.get("ovh_application_key") || "",
    applicationSecret: settingsService.get("ovh_application_secret") || "",
    consumerKey: settingsService.get("ovh_consumer_key") || "",
  };
}
