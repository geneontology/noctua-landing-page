export const removeBaristaTokenFromUrl = () => {
  const url = new URL(window.location.href);
  url.searchParams.delete('barista_token');
  const newUrl = decodeURIComponent(url.href);
  window.history.replaceState(null, '', newUrl);
};

export const parameterize = (params: Record<string, string | null>) => {
  return Object.entries(params)
    .filter(([_, value]) => value !== null)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
};