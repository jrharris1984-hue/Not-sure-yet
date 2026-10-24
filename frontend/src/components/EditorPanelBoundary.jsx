import { Component } from "react";
export default class EditorPanelBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (!this.state.failed) return this.props.children;
    return <div role="alert" className="pane p-5 space-y-3">
      <h2 className="font-semibold">This editing panel could not open</h2>
      <p className="text-sm text-zinc-400">Your selections are still in the editor. Retry this panel or choose another category.</p>
      <button type="button" className="chip min-h-11" onClick={() => this.setState({ failed: false })}>Retry panel</button>
    </div>;
  }
}
