"""Select storage explicitly; existing Docker installations default to MongoDB."""
import os
from pathlib import Path


def open_storage(paths, environ=None):
    env = os.environ if environ is None else environ
    provider = env.get('ULTRA_STUDIO_STORAGE', 'mongo').strip().lower()
    if provider == 'sqlite':
        from sqlite_storage import SQLiteDatabase
        override = env.get('ULTRA_STUDIO_SQLITE_PATH', '').strip()
        path = Path(override).expanduser() if override else paths.database_path
        if not path.is_absolute():
            raise ValueError('ULTRA_STUDIO_SQLITE_PATH must be an absolute path')
        database = SQLiteDatabase(path)
        return database, database
    if provider != 'mongo':
        raise ValueError('ULTRA_STUDIO_STORAGE must be mongo or sqlite')
    from motor.motor_asyncio import AsyncIOMotorClient
    client = AsyncIOMotorClient(env['MONGO_URL'])
    return client, client[env['DB_NAME']]
