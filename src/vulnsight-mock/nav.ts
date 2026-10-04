export function appPath(raw = window.location.pathname) {
  const path = raw.replace(/^\/pentester-live/, "") || "/";
  return path.startsWith("/") ? path : `/${path}`;
}

export function currentLocation() {
  return `${appPath()}${window.location.search}`;
}

export function navigate(to: string) {
  window.history.pushState({}, "", to);
  window.dispatchEvent(new PopStateEvent("popstate"));
}
