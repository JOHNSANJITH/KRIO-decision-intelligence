import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#06101d", color: "#edf2fb", fontFamily: "Inter, system-ui, sans-serif", padding: 24 }}>
          <div style={{ maxWidth: 720, width: "100%", padding: 24, borderRadius: 20, border: "1px solid rgba(255,255,255,.08)", background: "rgba(13,28,47,.9)", boxShadow: "0 30px 90px rgba(0,0,0,.35)" }}>
            <div style={{ fontSize: 12, color: "#ff9caf", textTransform: "uppercase", letterSpacing: ".12em", fontWeight: 700 }}>Krio runtime error</div>
            <h1 style={{ margin: "10px 0", fontSize: 28 }}>The dashboard could not render.</h1>
            <pre style={{ margin: 0, whiteSpace: "pre-wrap", color: "#a7b6c9", fontSize: 13, lineHeight: 1.6 }}>{String(this.state.error?.stack || this.state.error)}</pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </React.StrictMode>
);
