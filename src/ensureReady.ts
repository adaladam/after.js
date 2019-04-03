import { matchPath } from 'react-router-dom';
import { AsyncRouteProps } from './types';
import { isLoadableComponent, stripBasename } from './utils';

/**
 * This helps us to make sure all the async code is loaded before rendering.
 */
export async function ensureReady(routes: AsyncRouteProps[], pathname?: string, basename?: string) {
  await Promise.all(
    routes.map(route => {
      let normalizedPath = pathname || window.location.pathname;
      normalizedPath = basename ? stripBasename(normalizedPath, basename) : normalizedPath;

      const match = matchPath(normalizedPath, route);
      if (match && route && route.component && isLoadableComponent(route.component) && route.component.load) {
        return route.component.load();
      }
      return undefined;
    })
  );

  let data;
  if (typeof window !== undefined && !!document) {
    // deserialize state from 'serialize-javascript' format
    data = eval('(' + (document as any).getElementById('server-app-state').textContent + ')');
  }
  return Promise.resolve(data);
}
