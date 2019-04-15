import * as React from 'react';
import * as ReactDOMServer from 'react-dom/server';
import Helmet from 'react-helmet';
import { matchPath, StaticRouter } from 'react-router-dom';
import { Document as DefaultDoc } from './Document';
import { After } from './After';
import { loadInitialProps } from './loadInitialProps';
import * as utils from './utils';
import * as url from 'url';
import { Request, Response } from 'express';
import { Assets, AsyncRouteProps } from './types';
import { Location } from 'history';

const modPageFn = function <Props>(Page: React.ComponentType<Props>) {
  return (props: Props) => <Page {...props} />;
};

/*
 The customRenderer parameter is a (potentially async) function that can be set to return 
 more than just a rendered string.
 If present, it will be used instead of the default ReactDOMServer renderToString function.
 It has to return an object of shape { html, ... }, in which html will be used as the rendered string
 Other props will be also pass to the Document component
  */
export interface AfterRenderOptions<T, TExtra = {}> {
  req: Request;
  res: Response;
  assets: Assets;
  routes: AsyncRouteProps[];
  basename?: string;
  location?: Location,
  document?: typeof DefaultDoc;
  extra?: TExtra,
  customRenderer?: (element: React.ReactElement<T>) => { html: string };
}

export async function render<T, TExtra = {}>(options: AfterRenderOptions<T, TExtra>) {
  const { req, res, routes, assets, basename, extra, location, document: Document, customRenderer, ...rest } = options;
  const Doc = Document || DefaultDoc;

  const context = {};
  const renderPage = async (fn = modPageFn) => {
    // By default, we keep ReactDOMServer synchronous renderToString function
    const defaultRenderer = (element: React.ReactElement<T>) => ({ html: ReactDOMServer.renderToString(element) });
    const renderer = customRenderer || defaultRenderer;
    const asyncOrSyncRender = renderer(
      <StaticRouter location={req.url} context={context} basename={basename || ''}>
        {fn(After)({ routes, data })}
      </StaticRouter>
    );

    const renderedContent = utils.isPromise(asyncOrSyncRender) ? await asyncOrSyncRender : asyncOrSyncRender;
    const helmet = Helmet.renderStatic();

    return { helmet, ...renderedContent };
  };

  const normalizedUrl = basename ? utils.stripBasename(req.url, basename) : req.url;
  const { match, data } = await loadInitialProps(routes, url.parse(normalizedUrl).pathname as string, {
    req,
    res,
    extra,
    location,
    ...rest
  });

  if (!match) {
    res.status(404);
    return;
  }

  if (match.path === '**') {
    res.status(404);
  } else if (match && match.redirectTo && match.path) {
    res.redirect(301, req.originalUrl.replace(match.path, match.redirectTo));
    return;
  }

  const reactRouterMatch = matchPath(normalizedUrl, match);

  const { html, ...docProps } = await Doc.getInitialProps({
    req,
    res,
    assets,
    renderPage,
    data,
    helmet: Helmet.renderStatic(),
    match: reactRouterMatch,
    ...rest
  });

  const doc = ReactDOMServer.renderToStaticMarkup(<Doc {...docProps} />);
  return `<!doctype html>${doc.replace('DO_NOT_DELETE_THIS_YOU_WILL_BREAK_YOUR_APP', html)}`;
}
