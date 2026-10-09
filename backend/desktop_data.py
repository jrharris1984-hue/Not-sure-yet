"""Export MongoDB documents into a portable SQLite migration snapshot.

Export is read-only. Import explicitly creates a new live SQLite database;
neither operation changes the source database or overwrites an existing file.
"""
import argparse
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import sqlite3
import tempfile

from bson import json_util

SCHEMA_VERSION = 1


def write_snapshot(collections, destination, source_database=''):
    """Stream (collection_name, documents) pairs without dropping BSON types."""
    destination = Path(destination).resolve()
    if destination.exists():
        raise FileExistsError('Choose a new snapshot filename; existing files are never overwritten.')
    destination.parent.mkdir(parents=True, exist_ok=True)
    counts = {}
    with tempfile.TemporaryDirectory(prefix='ultra-migration-', dir=destination.parent) as temporary:
        staged = Path(temporary) / 'snapshot.sqlite3'
        connection = sqlite3.connect(staged)
        try:
            with connection:
                connection.execute('CREATE TABLE metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL)')
                connection.execute('CREATE TABLE collections (name TEXT PRIMARY KEY)')
                connection.execute('CREATE TABLE documents (collection_name TEXT NOT NULL REFERENCES collections(name), document_key TEXT NOT NULL, document_json TEXT NOT NULL, PRIMARY KEY (collection_name, document_key))')
                for name, documents in collections:
                    if not isinstance(name, str) or not name:
                        raise ValueError('Collection names must be nonempty text.')
                    connection.execute('INSERT INTO collections VALUES (?)', (name,))
                    counts[name] = 0
                    for document in documents:
                        if not isinstance(document, dict) or '_id' not in document:
                            raise ValueError('Every source document must have its MongoDB _id.')
                        key = json_util.dumps(document['_id'], json_options=json_util.CANONICAL_JSON_OPTIONS, sort_keys=True)
                        payload = json_util.dumps(document, json_options=json_util.CANONICAL_JSON_OPTIONS)
                        connection.execute('INSERT INTO documents VALUES (?, ?, ?)', (name, key, payload))
                        counts[name] += 1
                metadata = {
                    'schema_version': SCHEMA_VERSION,
                    'source_database': source_database,
                    'created_at': datetime.now(timezone.utc).isoformat(),
                    'collection_counts': counts,
                    'format': 'ultra-studio-migration-snapshot',
                }
                connection.executemany('INSERT INTO metadata VALUES (?, ?)', [(key, json.dumps(value)) for key, value in metadata.items()])
        finally:
            connection.close()
        # Validate before publishing. Exclusive creation also guards against
        # another process choosing the same filename during the export.
        inspect_snapshot(staged)
        created = False
        try:
            with destination.open('xb') as output, staged.open('rb') as source:
                created = True
                while chunk := source.read(1024 * 1024):
                    output.write(chunk)
                output.flush()
                os.fsync(output.fileno())
        except BaseException:
            if created:
                destination.unlink(missing_ok=True)
            raise
    return {'path': str(destination), 'collections': counts, 'documents': sum(counts.values())}


def inspect_snapshot(path):
    """Read and validate a snapshot without changing it or printing its data."""
    path = Path(path).resolve()
    connection = sqlite3.connect(path.as_uri() + '?mode=ro', uri=True)
    try:
        if connection.execute('PRAGMA integrity_check').fetchone()[0] != 'ok':
            raise ValueError('Snapshot integrity check failed.')
        metadata = {key: json.loads(value) for key, value in connection.execute('SELECT key, value FROM metadata')}
        if metadata.get('schema_version') != SCHEMA_VERSION or metadata.get('format') != 'ultra-studio-migration-snapshot':
            raise ValueError('Unsupported migration snapshot format.')
        counts = {name: 0 for name, in connection.execute('SELECT name FROM collections')}
        for name, key, payload in connection.execute('SELECT collection_name, document_key, document_json FROM documents'):
            document = json_util.loads(payload)
            if name not in counts or not isinstance(document, dict) or '_id' not in document:
                raise ValueError('Snapshot contains an invalid document.')
            actual_key = json_util.dumps(document['_id'], json_options=json_util.CANONICAL_JSON_OPTIONS, sort_keys=True)
            if actual_key != key:
                raise ValueError('Snapshot document identity mismatch.')
            counts[name] += 1
        if counts != metadata.get('collection_counts'):
            raise ValueError('Snapshot collection counts do not match its metadata.')
        return {'path': str(path), 'collections': counts, 'documents': sum(counts.values()), 'schema_version': SCHEMA_VERSION}
    finally:
        connection.close()


def import_snapshot(source, destination):
    """Validate a consistent snapshot copy, then publish a new live database."""
    from sqlite_storage import FORMAT, VERSION, SQLiteDatabase
    import asyncio
    destination = Path(destination).resolve()
    if destination.exists():
        raise FileExistsError('Choose a new database filename; existing files are never overwritten.')
    destination.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='ultra-import-', dir=destination.parent) as temporary:
        staged = Path(temporary) / 'database.sqlite3'
        original = sqlite3.connect(Path(source).resolve().as_uri() + '?mode=ro', uri=True)
        copied = sqlite3.connect(staged)
        try:
            original.backup(copied)
        finally:
            copied.close()
            original.close()
        result = inspect_snapshot(staged)
        connection = sqlite3.connect(staged)
        try:
            with connection:
                connection.execute('ALTER TABLE documents ADD COLUMN app_id TEXT')
                # Preserve the original BSON payload verbatim; index only string application IDs.
                for name, key, payload in connection.execute('SELECT collection_name, document_key, document_json FROM documents'):
                    identifier = json_util.loads(payload).get('id')
                    if isinstance(identifier, str):
                        connection.execute('UPDATE documents SET app_id=? WHERE collection_name=? AND document_key=?', (identifier, name, key))
                connection.executemany('UPDATE metadata SET value=? WHERE key=?', [(json.dumps(FORMAT), 'format'), (json.dumps(VERSION), 'schema_version')])
        finally:
            connection.close()
        database = SQLiteDatabase(staged)
        try:
            # Catch conflicts before publication, rather than at application startup.
            asyncio.run(database.media_corrections.create_index([('source', 1), ('media_id', 1)], unique=True))
        finally:
            database.close()
        created = False
        try:
            with destination.open('xb') as output, staged.open('rb') as input_file:
                created = True
                while chunk := input_file.read(1024 * 1024):
                    output.write(chunk)
                output.flush()
                os.fsync(output.fileno())
        except BaseException:
            if created:
                destination.unlink(missing_ok=True)
            raise
    return {**result, 'path': str(destination), 'format': FORMAT}


def export_mongo(mongo_url, database_name, destination):
    # Delay the driver import so inspect needs no running MongoDB service.
    from pymongo import MongoClient
    if Path(destination).exists():
        raise FileExistsError('Choose a new snapshot filename; existing files are never overwritten.')
    with MongoClient(mongo_url, serverSelectionTimeoutMS=10000) as client:
        database = client[database_name]
        names = sorted(name for name in database.list_collection_names() if not name.startswith('system.'))
        if not names:
            raise ValueError('Source database has no user collections. Check the database name.')
        def collections():
            for name in names:
                with database[name].find({}) as cursor:
                    yield name, cursor
        return write_snapshot(collections(), destination, source_database=database_name)


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest='command', required=True)
    export = commands.add_parser('export', help='Read MongoDB into a new SQLite snapshot. Stop application writes first.')
    export.add_argument('--mongo-url', default=os.environ.get('MONGO_URL', 'mongodb://127.0.0.1:27017'))
    export.add_argument('--database', default=os.environ.get('DB_NAME', 'ultra_studio'))
    export.add_argument('--output', required=True, type=Path)
    inspect = commands.add_parser('inspect', help='Validate a snapshot and print collection counts only.')
    inspect.add_argument('snapshot', type=Path)
    importer = commands.add_parser('import', help='Import a snapshot into a NEW live SQLite database. Stop the application first.')
    importer.add_argument('snapshot', type=Path)
    importer.add_argument('--output', required=True, type=Path)
    args = parser.parse_args(argv)
    try:
        if args.command == 'export':
            result = export_mongo(args.mongo_url, args.database, args.output)
        elif args.command == 'import':
            result = import_snapshot(args.snapshot, args.output)
        else:
            result = inspect_snapshot(args.snapshot)
    except (FileExistsError, ValueError) as error:
        parser.exit(1, f'{error}\n')
    except Exception:
        # Driver exception messages can contain credentials or source documents.
        parser.exit(1, 'Snapshot operation failed. Check the connection, source file, and destination permissions.\n')
    print(json.dumps(result, indent=2))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
