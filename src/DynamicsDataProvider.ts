/* eslint-disable @typescript-eslint/naming-convention */
const cloudUrl = 'https://globaldisco.crm.dynamics.com';
const discoUrl = `${cloudUrl}/api/discovery/v2.0/Instances?$select=ApiUrl,FriendlyName`;
import fetch from 'node-fetch';

export async function getDiscoServices(token: string): Promise<{ApiUrl: string, FriendlyName: string}[]> {
    const req = await fetch(discoUrl, {
        method: 'GET',
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

export async function getWebResources(serviceToken: string, apiUrl: string) {
    const url = `${apiUrl}/api/data/v9.2/webresourceset?$select=name`;
    return await odataAll(url, `Bearer ${serviceToken}`);
}

export async function getWebresourceContent(serviceToken: string, apiUrl: string, webResourceId: string) {
    const url = `${apiUrl}/api/data/v9.2/webresourceset(${webResourceId})?$select=content,name`;
    return await odataFetch(url, `Bearer ${serviceToken}`);
}

async function odataFetch(link: string, Authorization: string) {
    const req = await fetch(link, {
        headers: {
            Authorization,
            'Content-Type': 'application/json;odata=nometadata',
        },
    });

    return await req.json();
}

async function odataAll(link: string, authorization: string) {
    const records = [];
    let currentLink = link;
    while (currentLink) {
        let currentSet = await odataFetch(currentLink, authorization) as any;
        currentLink = currentSet['@odata.nextLink'];

        records.push(...currentSet.value);
    }

    return records;
}