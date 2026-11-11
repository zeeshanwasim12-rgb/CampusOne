import { api, absoluteUrl } from './api';

/** Toggle a bookmark. Returns the new bookmarked state. */
export async function toggleBookmark(resourceId) {
  const { data } = await api.post(`/bookmarks/${resourceId}`);
  return data.data.bookmarked;
}

/**
 * Ask the API for a (possibly presigned) download URL and open it. Works for
 * both the S3 driver (absolute presigned URL) and the local driver (API route).
 */
export async function downloadResource(resourceId) {
  const { data } = await api.get(`/resources/${resourceId}/download`);
  const url = absoluteUrl(data.data.url);
  window.open(url, '_blank', 'noopener');
  return data.data;
}

/** Upload a resource (multipart). `fields` is a plain object; `file` is a File. */
export async function uploadResource(fields, file) {
  const fd = new FormData();
  Object.entries(fields).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') fd.append(k, v);
  });
  fd.append('file', file);
  const { data } = await api.post('/resources', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
}
