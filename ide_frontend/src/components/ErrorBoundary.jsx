import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(err, info) { console.error('Chunk error:', err, info); }

  render() {
    return this.state.hasError
      ? <div style={{ padding: 32, textAlign: 'center' }}>
          <h2>Something went wrong loading this panel.</h2>
          <button onClick={()=>location.reload()}>Retry</button>
        </div>
      : this.props.children;
  }
}
