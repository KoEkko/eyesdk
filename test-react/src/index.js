import { createRoot } from "react-dom/client";
import ErrorBoundary from "./ErrorBoundary";
import Main from "./main";
const root = createRoot(document.getElementById("root"));

const App = () => {
  return (
    <ErrorBoundary fallback={<div>error</div>}>
      <Main />
    </ErrorBoundary>
  );
};
root.render(<App />);
