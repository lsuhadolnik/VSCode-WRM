/* eslint-disable @typescript-eslint/naming-convention */
const cloudUrl = "https://globaldisco.crm.dynamics.com";
const discoUrl = `${cloudUrl}/api/discovery/v2.0/Instances?$select=ApiUrl,FriendlyName`;
import fetch, { RequestInit } from "node-fetch";
import { getServiceToken } from "./DynamicsApiAuth";
import { getDatavserseUrlFromUri } from "./util/dataverseFsUtil";
import { WebResourceMeta, WebresourceType } from "./types";
import { ProgressLocation, window } from "vscode";
import { BasicQuickPickItem } from "./QuickPicks/BasicQuickPickItem";

export async function getDiscoServices(
  token: string
): Promise<{ ApiUrl: string; FriendlyName: string }[]> {
  const req = await fetch(discoUrl, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const resp: any = await req.json();
  console.log(resp);
  if (req.ok) {
    return resp.value;
  } else {
    throw new Error(resp);
  }
}

export async function getWebResources(org: string) {
  const url = `https://${org}/api/data/v9.2/webresourceset?$select=name,webresourcetype,createdon,modifiedon`;
  return (await odataAll(org, url)) as WebResourceMeta[];
}

export async function getWebresourceContent(
  org: string,
  webResourceId: string
) {
  return await odataFetch(
    org,
    `https://${org}/api/data/v9.2/webresourceset(${webResourceId})?$select=content,name`
  );
}

async function odataFetch(
  org: string,
  link: string,
  method?: string,
  body?: string
) {
  const serviceToken = await getServiceToken(org);

  const config = {
    method: method || "GET",
    headers: {
      Authorization: `Bearer ${serviceToken?.accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  } as RequestInit;
  if (body) {
    config.body = body;
  }

  const req = await fetch(link, config);

  if (req.ok) {
    try {
      const json = await req.json();
      return json;
    } catch (e) {
      return [];
    }
  } else {
    const text = await req.text();
    debugger;

    return [];
  }
}

async function odataAll(org: string, link: string) {
  const records = [];
  let currentLink = link;
  while (currentLink) {
    let currentSet = (await odataFetch(org, currentLink)) as any;
    currentLink = currentSet["@odata.nextLink"];

    records.push(...currentSet.value);
  }

  return records;
}

export async function createWebResource(
  org: string,
  name: string,
  content: string,
  type: WebresourceType
) {
  return odataFetch(
    org,
    `https://${org}/api/data/v9.2/webresourceset`,
    "POST",
    JSON.stringify({
      content: Buffer.from(content).toString("base64"),
      name,
      webresourcetype: type,
    })
  );
}

function getPublishXml(webResourceId: string) {
  return `<importexportxml><webresources><webresource>{${webResourceId.toUpperCase()}}</webresource></webresources></importexportxml>`;
}

async function publishWebResource(org: string, webResourceId: string) {
  return odataFetch(
    org,
    `https://${org}/api/data/v9.2/PublishXml`,
    "POST",
    JSON.stringify({
      ParameterXml: getPublishXml(webResourceId),
    })
  );
}

export async function updateWebResource(
  org: string,
  webresourceId: string,
  content: string
) {
  window.withProgress(
    {
      location: ProgressLocation.Window,
      cancellable: false,
      title: "Updating and Publishing...",
    },
    async (progress) => {
      progress.report({ increment: 0 });

      await odataFetch(
        org,
        `https://${org}/api/data/v9.2/webresourceset(${webresourceId})`,
        "PATCH",
        JSON.stringify({
          content: Buffer.from(content).toString("base64"),
        })
      );

      await publishWebResource(org, webresourceId);

      progress.report({ increment: 100 });
    }
  );
}

export async function renameWebResource(
  org: string,
  webresourceId: string,
  newName: string
) {}

export async function deleteWebResource(org: string, webresourceId: string) {}
