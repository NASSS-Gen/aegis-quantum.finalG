import { InternetIdentityProvider } from "@caffeineai/core-infrastructure";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// BigInt values returned from the backend actor are serialized at the
// boundary by the agent bindings; we do not patch BigInt.prototype here.
// Any BigInt -> JSON conversion is handled where the data crosses the
// actor boundary, not globally on the prototype.
const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <InternetIdentityProvider>
      <App />
    </InternetIdentityProvider>
  </QueryClientProvider>,
);
