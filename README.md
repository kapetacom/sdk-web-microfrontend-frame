# Library for handling microfrontend using Iframes

Specifically for handling navigation between microfrontends using Iframes.

This will handle syncing the url from a parent frame to a child frame and vice versa.

The core functionality is implemented in vanilla javascript - with a single React wrapper at the moment.

## Usage
The react wrapper uses react-router-dom to handle the routing.

### Parent
Use the FrameRouter component to wrap the routes that you want to be rendered in the iframe.
The frame router is essentially a BrowserRouter from ```react-router-dom@v6```
```tsx
import { FrameRouter, FragmentFrame } from '@kapeta/sdk-web-microfrontend-frame';
import { Routes, Route } from 'react-router-dom';

export const App = () => {
  return (
    <FrameRouter>
        <Routes>
          <Route path="/users">
              {/* 
              topPath: Must match the path in the parent that navigates to the FragmentFrame
              basePath: The path to the microfrontend proxy on the parent 
              */}
            <FragmentFrame basePath={'/fragments/users'} topPath={'/users'} />
          </Route>
          <Route path="/todo/*">
            <FragmentFrame basePath={'/fragments/todo'} topPath={'/todo'} />
          </Route>
        </Routes>
    </FrameRouter>
  );
};

```


### Child
The child also uses FrameRouter. Let's assume this example is "users". 

```tsx
import { FrameRouter } from '@kapeta/sdk-web-microfrontend-frame';
import { Routes, Route, Link } from 'react-router-dom';

export const App = () => {
  return (
    <FrameRouter>
        <Routes>
          <Route path="/">
              User home page. This will be loaded when the parent visits "/users"
          </Route>
          <Route path="/settings">
              User settings. This will be loaded when the parent visits "/users/settings"
              <Link to="/">This will send the parent back to "/users"</Link>
          </Route>
        </Routes>
    </FrameRouter>
  );
};

```

