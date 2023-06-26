export const DATAVERSE_AUTH_TYPE = `dataverse`;

export const DATAVERSE_AUTH_NAME = `Dataverse`;
export const DATAVERSE_SESSIONS_SECRET_KEY = `${DATAVERSE_AUTH_TYPE}.sessions`;

const clientId = "51f81489-12ee-4a9e-aaae-a2591f45987d"; // Client ID of your registered application
const authority = "https://login.microsoftonline.com/organizations"; // Authority URL (e.g., https://login.microsoftonline.com/your_tenant_id)
const cloudUrl = "https://globaldisco.crm.dynamics.com";
const discoUrl = `${cloudUrl}/api/discovery/v2.0/Instances?$select=ApiUrl,FriendlyName`;
const discoServiceScope = cloudUrl + "/.default";

export const msalConfig = {
  auth: {
    clientId: clientId,
    authority: authority,
    redirectUri: "http://localhost",
  },
};

export const discoScopes = [discoServiceScope, "offline_access"];
