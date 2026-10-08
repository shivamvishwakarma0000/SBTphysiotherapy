import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            background: "#041B2B",
            color: "#ffffff",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            textAlign: "center",
            fontFamily: "system-ui, -apple-system, sans-serif"
          }}
        >
          <div
            style={{
              maxWidth: "460px",
              width: "100%",
              background: "#0A2942",
              border: "1.5px solid rgba(56, 189, 248, 0.4)",
              borderRadius: "20px",
              padding: "32px 24px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.5)"
            }}
          >
            <div style={{ fontSize: "42px", marginBottom: "12px" }}>🩺</div>
            <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#ffffff", margin: "0 0 8px 0" }}>
              Vindhy Physio & Rehab Center
            </h2>
            <p style={{ fontSize: "14px", color: "#93c5fd", margin: "0 0 20px 0", lineHeight: "1.5" }}>
              {this.props.fallbackMessage || "Your health portal session is ready. Tap below to continue smoothly."}
            </p>
            <button
              onClick={this.handleReset}
              style={{
                width: "100%",
                padding: "13px 20px",
                background: "linear-gradient(135deg, #0878C9, #065b99)",
                color: "#ffffff",
                border: "none",
                borderRadius: "12px",
                fontSize: "15px",
                fontWeight: "700",
                cursor: "pointer",
                boxShadow: "0 4px 16px rgba(8, 120, 201, 0.4)"
              }}
            >
              🔄 Reload Portal
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
