"""Separate installed application resources from writable user data."""
from dataclasses import dataclass
import os
from pathlib import Path
import sys
from typing import Mapping


@dataclass(frozen=True)
class StoragePaths:
    data_dir: Path

    @property
    def renders_dir(self):
        return self.data_dir / 'renders'

    @property
    def backups_dir(self):
        return self.data_dir / 'backups'

    @property
    def logs_dir(self):
        return self.data_dir / 'logs'

    @property
    def services_dir(self):
        return self.data_dir / 'services'

    @property
    def database_path(self):
        return self.data_dir / 'ultra-studio.sqlite3'

    def create_directories(self):
        for path in (self.data_dir, self.renders_dir, self.backups_dir, self.logs_dir, self.services_dir):
            path.mkdir(parents=True, exist_ok=True)


def resolve_storage_paths(resource_dir, environ: Mapping[str, str] = None, platform=None, home=None):
    env = os.environ if environ is None else environ
    override = env.get('ULTRA_STUDIO_DATA_DIR', '').strip()
    if override:
        directory = Path(override).expanduser()
        if not directory.is_absolute():
            raise ValueError('ULTRA_STUDIO_DATA_DIR must be an absolute path.')
    elif env.get('ULTRA_STUDIO_DESKTOP') == '1':
        user_home = Path.home() if home is None else Path(home)
        if (platform or sys.platform) == 'win32':
            directory = Path(env.get('LOCALAPPDATA') or user_home / 'AppData' / 'Local') / 'UltraStudio'
        else:
            directory = user_home / '.local' / 'share' / 'UltraStudio'
    else:
        # Preserve the existing Docker volume and native development layout.
        directory = Path(resource_dir)
    return StoragePaths(directory.resolve())
