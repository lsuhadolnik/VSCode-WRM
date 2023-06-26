/* eslint-disable @typescript-eslint/naming-convention */
const cloudUrl = "https://globaldisco.crm.dynamics.com";
const discoUrl = `${cloudUrl}/api/discovery/v2.0/Instances?$select=ApiUrl,FriendlyName`;
import fetch, { RequestInit } from "node-fetch";
import { WebResourceMeta, WebresourceType } from "../types";
import { ProgressLocation, window } from "vscode";
import { Inject, Service } from "typedi";
import { DataverseAuthProvider } from "../Auth/DiscoveryServiceAuthProvider";

@Service()
export class DynamicsDataProvider {
  @Inject()
  private _authProvider!: DataverseAuthProvider;

  public async getDiscoServices(): Promise<
    { ApiUrl: string; FriendlyName: string }[]
  > {
    const req = await fetch(discoUrl, {
      method: "GET",
      headers: {
        Authorization: await this._authProvider.getDiscoveryAuthHeader(),
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

  public async getWebResources(org: string) {
    const url = `https://${org}/api/data/v9.2/webresourceset?$select=name,webresourcetype,createdon,modifiedon`;
    return (await this.odataAll(org, url)) as WebResourceMeta[];
  }

  public async getWebresourceContent(org: string, webResourceId: string) {
    return await this.odataFetch(
      org,
      `https://${org}/api/data/v9.2/webresourceset(${webResourceId})?$select=content,name`
    );
  }

  private async odataFetch(
    org: string,
    link: string,
    method?: string,
    body?: string,
    headers?: boolean
  ) {
    const Authorization = await this._authProvider.getDataverseAuthHeader(org);
    const config = {
      method: method || "GET",
      headers: {
        Authorization,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    } as RequestInit;
    if (body) {
      config.body = body;
    }

    const req = await fetch(link, config);

    if (req.ok) {
      if (headers) {
        return Object.fromEntries(Array.from(req.headers.entries()));
      }

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

  private async odataAll(org: string, link: string) {
    const records = [];
    let currentLink = link;
    while (currentLink) {
      let currentSet = (await this.odataFetch(org, currentLink)) as any;
      currentLink = currentSet["@odata.nextLink"];

      records.push(...currentSet.value);
    }

    return records;
  }

  public async createWebResource(
    org: string,
    name: string,
    content: string,
    type: WebresourceType
  ): Promise<string> {
    return await window.withProgress<string>(
      {
        location: ProgressLocation.Window,
        cancellable: false,
        title: "Creating and Publishing...",
      },
      async (progress) => {
        progress.report({ increment: 0 });

        const headers = await this.odataFetch(
          org,
          `https://${org}/api/data/v9.2/webresourceset`,
          "POST",
          JSON.stringify({
            content: Buffer.from(content).toString("base64"),
            name,
            webresourcetype: type,
          }),
          true
        );

        const id = "";

        debugger;

        progress.report({ increment: 50 });
        await this.publishWebResource(org, id);

        progress.report({ increment: 100 });

        return id;
      }
    );
  }

  private getPublishXml(webResourceId: string) {
    return `<importexportxml><webresources><webresource>{${webResourceId.toUpperCase()}}</webresource></webresources></importexportxml>`;
  }

  private async publishWebResource(org: string, webResourceId: string) {
    return this.odataFetch(
      org,
      `https://${org}/api/data/v9.2/PublishXml`,
      "POST",
      JSON.stringify({
        ParameterXml: this.getPublishXml(webResourceId),
      })
    );
  }

  public async updateWebResource(
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

        await this.odataFetch(
          org,
          `https://${org}/api/data/v9.2/webresourceset(${webresourceId})`,
          "PATCH",
          JSON.stringify({
            content: Buffer.from(content).toString("base64"),
          })
        );

        await this.publishWebResource(org, webresourceId);

        progress.report({ increment: 100 });
      }
    );
  }

  public async renameWebResource(
    org: string,
    webresourceId: string,
    newName: string
  ) {}

  public async deleteWebResource(org: string, webresourceId: string) {}
}
