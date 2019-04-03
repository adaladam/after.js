import { AsyncRouteableComponent, AsyncRouteComponentType } from "./types";

/** @private is the given object a Function? */
export const isFunction = (obj: any) => 'function' === typeof obj;

/** @private is the given object an Object? */
export const isObject = (obj: any) => obj !== null && typeof obj === 'object';

/** @private is the given object/value a promise? */
export const isPromise = (value: any): boolean =>
  isObject(value) && isFunction(value.then);

/** @private Guard cluase to narrow the AsyncRouteableComponent union type on getInitialProps */
export function isAsyncComponent(Component: AsyncRouteableComponent): Component is AsyncRouteComponentType<any> {
  return (<AsyncRouteComponentType<any>>Component).getInitialProps !== undefined;
}

/** @private Guard cluase to narrow the AsyncRouteableComponent union type on load */
export function isLoadableComponent(Component: AsyncRouteableComponent): Component is AsyncRouteComponentType<any> {
  return (<AsyncRouteComponentType<any>>Component).load !== undefined;
}

/** @private Check if specified path has a prefix */
export function hasBasename(path: string, prefix: string) {
  return (
    path.toLowerCase().indexOf(prefix.toLowerCase()) === 0 &&
    '/?#'.indexOf(path.charAt(prefix.length)) !== -1
  );
}

/** @private Strip prefix from a specified path */
export function stripBasename(path: string, prefix: string) {
  return hasBasename(path, prefix) ? path.substr(prefix.length) : path;
}