import * as React from 'react';
import { Switch, Route, withRouter, match as Match, RouteComponentProps, matchPath } from 'react-router-dom';
import { loadInitialProps } from './loadInitialProps';
import { History, Location } from 'history';
import { AsyncRouteProps } from './types';

export interface AfterpartyProps extends RouteComponentProps<any> {
  history: History;
  location: Location;
  data?: Promise<any>[];
  routes: AsyncRouteProps[];
  match: Match<any>;
  errorPage?: string;
}

export interface AfterpartyState {
  data?: Promise<any>[];
  previousLocation: Location | null;
}

class Afterparty extends React.Component<AfterpartyProps, AfterpartyState> {
  prefetcherCache: any;

  constructor(props: AfterpartyProps) {
    super(props);

    this.state = {
      data: props.data,
      previousLocation: null
    };

    this.prefetcherCache = {};
  }

  componentDidUpdate(prevProps: AfterpartyProps, prevState: AfterpartyState) {
    const route = this.props.routes.find(r => matchPath(this.props.location.pathname, r) != null);
    const prevRoute = this.props.routes.find(r => matchPath(prevProps.location.pathname, r) != null);

    let navigated = route !== prevRoute;
    if (navigated) {
      window.scrollTo(0, 0);
      this.setState({
        // save the location so we can render the old screen
        previousLocation: prevProps.location,
        data: undefined // unless you want to keep it
      });

      const { children, data, match, routes, history, location, staticContext, errorPage, ...rest } = this.props;
      loadInitialProps(this.props.routes, this.props.location.pathname, {
        location: this.props.location,
        history: this.props.history,
        ...rest
      }).then(({ data }) => {
        this.setState({ previousLocation: null, data });
      }).catch((e: any) => {
        console.log(e);
        if (errorPage) {
          this.props.history.replace(errorPage);
        }
      });
    }
  }

  prefetch = (pathname: string) => {
    loadInitialProps(this.props.routes, pathname, {
      history: this.props.history
    })
      .then(({ data }) => {
        this.prefetcherCache = {
          ...this.prefetcherCache,
          [pathname]: data
        };
      })
      .catch((e) => console.log(e));
  };

  render() {
    const { previousLocation, data } = this.state;
    const { location } = this.props;
    const initialData = this.prefetcherCache[location.pathname] || data;

    return (
      <Switch>
        {this.props.routes.map((r, i) => (
          <Route
            key={`route--${i}`}
            path={r.path}
            exact={r.exact}
            location={previousLocation || location}
            render={(props) =>
              React.createElement(r.component, {
                ...initialData,
                history: props.history,
                location: previousLocation || location,
                match: props.match,
                prefetch: this.prefetch
              })
            }
          />
        ))}
      </Switch>
    );
  }
}
export const After = withRouter(Afterparty);
