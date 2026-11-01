export const DESKTOP_WORKSPACES = [
  { id: "home", label: "Home", path: "/" },
  { id: "create", label: "Create", path: "/create" },
  { id: "characters", label: "Characters", path: "/library" },
  { id: "shoots", label: "Shoots", path: "/shoots" },
  { id: "projects", label: "Projects", path: "/projects" },
  { id: "library", label: "Library", path: "/gallery" },
];

export const MOBILE_WORKSPACES = ["home", "create", "projects", "library"];
export const EDITOR_CATEGORIES = ["Cast", "Appearance", "Wardrobe", "Pose", "Scene", "Camera", "Lighting", "Style"];
export const SECONDARY_DESTINATIONS = [
  { id: "media", label: "Media", path: "/media" },
  { id: "tools", label: "Tools", path: "/tools" },
  { id: "queue", label: "Queue", path: "/queue" },
  { id: "settings", label: "Settings", path: "/settings" },
];
export const getMobileWorkspaces = () => DESKTOP_WORKSPACES.filter(item => MOBILE_WORKSPACES.includes(item.id));
