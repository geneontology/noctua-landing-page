export const removeBaristaTokenFromUrl = () => {
  const { pathname, search, hash } = window.location;
  // Drop just that pair and keep every other byte as it was. Decoding the whole
  // URL (as this once did) turned `%26`/`%2B`/`%23` inside other params — a
  // title filter, say — into a real `&`, `+` and `#`, so a reload or a shared
  // link read different filters than the ones on screen.
  const kept = search
    .slice(1)
    .split('&')
    .filter(pair => pair !== '' && pair.split('=')[0] !== 'barista_token');
  const query = kept.length > 0 ? `?${kept.join('&')}` : '';
  window.history.replaceState(null, '', `${pathname}${query}${hash}`);
};

export const parameterize = (params: Record<string, string | null>) => {
  return Object.entries(params)
    .filter(([_, value]) => value !== null)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
};

/**
 * Point a Barista login/logout URL's `return` at the address bar as it is now.
 * Those URLs are built once per token, but the search criteria keep rewriting
 * the address bar, so a `return` captured at first render sent the user back
 * without the search they were on.
 */
export const withCurrentReturn = (url: string): string => {
  const next = new URL(url);
  next.searchParams.set('return', window.location.href);
  return next.toString();
};
