import { google } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/drive.readonly"];

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!email || !key) {
    throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_PRIVATE_KEY");
  }

  return new google.auth.JWT({
    email,
    key,
    scopes: SCOPES,
  });
}

const drive = () => google.drive({ version: "v3", auth: getAuth() });

export interface DriveFolder {
  id: string;
  name: string;
}

export interface DriveDoc {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  webViewLink: string;
}

export async function listSubfolders(parentFolderId: string): Promise<DriveFolder[]> {
  const res = await drive().files.list({
    q: `'${parentFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: "files(id, name)",
    orderBy: "name",
  });

  return (res.data.files || []).map((f) => ({
    id: f.id!,
    name: f.name!,
  }));
}

export async function listDocsInFolder(folderId: string): Promise<DriveDoc[]> {
  const res = await drive().files.list({
    q: `'${folderId}' in parents and trashed = false and (mimeType = 'application/vnd.google-apps.document' or mimeType = 'application/pdf')`,
    fields: "files(id, name, mimeType, modifiedTime, webViewLink)",
    orderBy: "modifiedTime desc",
  });

  return (res.data.files || []).map((f) => ({
    id: f.id!,
    name: f.name!,
    mimeType: f.mimeType!,
    modifiedTime: f.modifiedTime!,
    webViewLink: f.webViewLink || "",
  }));
}

export async function exportDocAsHtml(docId: string): Promise<string> {
  const res = await drive().files.export(
    { fileId: docId, mimeType: "text/html" },
    { responseType: "text" }
  );
  return res.data as string;
}
