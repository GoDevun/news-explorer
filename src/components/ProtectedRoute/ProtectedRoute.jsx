import { Redirect, Route } from 'react-router-dom';

/**
 * Guards a route so only signed-in users can reach it.
 *
 * The token check in App runs asynchronously, so on a page reload `isLoggedIn`
 * is still false for a moment even for a signed-in user. While `isAuthChecking`
 * is true we render nothing instead of redirecting, otherwise refreshing
 * /saved-news would bounce a signed-in user back to the home page.
 */
function ProtectedRoute({ isLoggedIn, isAuthChecking, children, ...routeProps }) {
  return (
    <Route {...routeProps}>
      {isAuthChecking ? null : <>{isLoggedIn ? children : <Redirect to="/" />}</>}
    </Route>
  );
}

export default ProtectedRoute;
