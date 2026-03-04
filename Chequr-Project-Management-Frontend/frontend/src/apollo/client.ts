import {
  ApolloClient,
  InMemoryCache,
  ApolloLink,
  Observable,
} from '@apollo/client';
import { ErrorLink } from '@apollo/client/link/error';
import { CombinedGraphQLErrors } from '@apollo/client/errors';
import UploadHttpLink from 'apollo-upload-client/UploadHttpLink.mjs';
import { setContext } from '@apollo/client/link/context';

import { store } from '../redux/store';
import { setToken, logout } from '../redux/slices/authSlice';
import { REFRESH_TOKEN_MUTATION } from '../graphql/auth.mutation';

const graphqlUrl = import.meta.env.VITE_GRAPHQL_URL;

const httpLink = new UploadHttpLink({
  uri: graphqlUrl || '/graphql',
  headers: {
    "Apollo-Require-Preflight": "true"
  },
  credentials: 'include',
});

const authLink = setContext((_, { headers }) => {
  const state = store.getState();
  const token = state.auth.token;
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    }
  }
});

const authAfterware = new ApolloLink((operation, forward) => {
  return new Observable((observer) => {
    const subscription = forward(operation).subscribe({
      next: (result) => {
        const context = operation.getContext();
        const headers: Headers | undefined = context.response?.headers;

        const token = headers?.get('authorization');
        if (token) {
          const actualToken = token.replace('Bearer ', '');
          store.dispatch(setToken(actualToken));
        }

        observer.next(result);
      },
      error: (err: unknown) => observer.error(err),
      complete: () => observer.complete(),
    });

    return () => subscription.unsubscribe();
  });
});

// Track if a refresh is already in progress to avoid duplicate calls
let isRefreshing = false;
let pendingRequests: Array<{
  forward: ApolloLink.ForwardFunction;
  operation: ApolloLink.Operation;
  observer: any;
}> = [];

const errorLink = new ErrorLink(({ error, operation, forward }) => {
  // Only handle GraphQL auth errors
  if (!CombinedGraphQLErrors.is(error)) return;

  const hasAuthError = error.errors.some(
    (err) =>
      err.extensions?.code === 'UNAUTHENTICATED' ||
      err.message?.toLowerCase().includes('unauthorized') ||
      err.message?.toLowerCase().includes('jwt expired')
  );

  if (!hasAuthError) return;

  // Don't try to refresh if the failing operation IS the refresh
  if (operation.operationName === 'RefreshToken') {
    store.dispatch(logout());
    window.location.href = '/login';
    return;
  }

  if (!isRefreshing) {
    isRefreshing = true;

    // Use a minimal client to call refresh (avoids circular error handling)
    const refreshClient = new ApolloClient({
      link: ApolloLink.from([authAfterware, httpLink]),
      cache: new InMemoryCache(),
    });

    return new Observable((observer) => {
      refreshClient
        .mutate({ mutation: REFRESH_TOKEN_MUTATION })
        .then((res) => {
          isRefreshing = false;

          if ((res.data as any)?.refreshToken?.user) {
            // Retry the original failed operation
            forward(operation).subscribe(observer);

            // Retry all queued operations
            pendingRequests.forEach(({ forward: fwd, operation: op, observer: obs }) => {
              fwd(op).subscribe(obs);
            });
            pendingRequests = [];
          } else {
            store.dispatch(logout());
            window.location.href = '/login';
            observer.error(error);
          }
        })
        .catch(() => {
          isRefreshing = false;
          pendingRequests = [];
          store.dispatch(logout());
          window.location.href = '/login';
          observer.error(error);
        });
    });
  } else {
    // Queue this operation while a refresh is already in flight
    return new Observable((observer) => {
      pendingRequests.push({ forward, operation, observer });
    });
  }
});

export const client = new ApolloClient({
  link: ApolloLink.from([authLink, errorLink, authAfterware, httpLink]),
  cache: new InMemoryCache(),
});
