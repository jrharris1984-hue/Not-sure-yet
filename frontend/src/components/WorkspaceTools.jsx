export default function WorkspaceTools({compact,children}) {
  if (!compact) return <>{children}</>;
  return <details className="workspace-tools" data-testid="workspace-tools">
    <summary>Tools <span>Character, randomizers, pins & assistant</span></summary>
    <div className="workspace-tools-content">{children}</div>
  </details>;
}
