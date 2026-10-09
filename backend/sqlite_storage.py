"""SQLite document storage for the queries used by Ultra Studio.

This deliberately supports a bounded Mongo-style API, not arbitrary MongoDB
queries. Unsupported operations raise rather than silently losing data.
"""
import asyncio
from copy import deepcopy
from functools import cmp_to_key
import json
from pathlib import Path
import re
import sqlite3
import threading
from types import SimpleNamespace

from bson import ObjectId, json_util
from pymongo.errors import DuplicateKeyError

FORMAT = 'ultra-studio-sqlite'
VERSION = 1
MISSING = object()


def encode(value):
    return json_util.dumps(value, json_options=json_util.CANONICAL_JSON_OPTIONS, sort_keys=True)


def get_path(document, path):
    value = document
    for part in path.split('.'):
        if isinstance(value, dict):
            value = value.get(part, MISSING)
        elif isinstance(value, list) and part.isdigit():
            value = value[int(part)] if int(part) < len(value) else MISSING
        else:
            return MISSING
    return value


def set_path(document, path, value):
    parts = path.split('.')
    current = document
    for index, part in enumerate(parts[:-1]):
        if isinstance(current, list):
            position = int(part)
            while len(current) <= position:
                current.append(None)
            if current[position] is None:
                current[position] = [] if parts[index + 1].isdigit() else {}
            current = current[position]
        else:
            if part not in current:
                current[part] = [] if parts[index + 1].isdigit() else {}
            current = current[part]
    final = parts[-1]
    if isinstance(current, list):
        while len(current) <= int(final):
            current.append(None)
        current[int(final)] = deepcopy(value)
    else:
        current[final] = deepcopy(value)


def equal(value, expected):
    if value is MISSING:
        return expected is None
    return value == expected or (isinstance(value, list) and not isinstance(expected, list) and expected in value)


def validate_query(query):
    for field, condition in query.items():
        if field == '$or':
            for item in condition:
                validate_query(item)
        elif field.startswith('$'):
            raise ValueError(f'Unsupported query operator: {field}')
        elif isinstance(condition, dict) and any(str(key).startswith('$') for key in condition):
            if set(condition) - {'$exists', '$ne', '$in', '$nin', '$all', '$lt', '$regex', '$options'}:
                raise ValueError('Unsupported query operator')
            if '$options' in condition and ('$regex' not in condition or set(condition['$options']) - {'i'}):
                raise ValueError('Unsupported regex options')
            if '$regex' in condition:
                re.compile(condition['$regex'], re.I if 'i' in condition.get('$options', '') else 0)


def matches(document, query):
    for field, condition in query.items():
        if field == '$or':
            if not any(matches(document, item) for item in condition):
                return False
            continue
        if field.startswith('$'):
            raise ValueError(f'Unsupported query operator: {field}')
        value = get_path(document, field)
        if not isinstance(condition, dict) or not any(str(key).startswith('$') for key in condition):
            if not equal(value, condition):
                return False
            continue
        for operator, expected in condition.items():
            if operator == '$options':
                if '$regex' not in condition or set(expected) - {'i'}:
                    raise ValueError('Unsupported regex options')
                continue
            if operator == '$exists':
                ok = (value is not MISSING) == bool(expected)
            elif operator == '$ne':
                ok = not equal(value, expected)
            elif operator in ('$in', '$nin'):
                ok = any(equal(value, candidate) for candidate in expected)
                if operator == '$nin':
                    ok = not ok
            elif operator == '$all':
                ok = isinstance(value, list) and all(item in value for item in expected)
            elif operator == '$lt':
                ok = value is not MISSING and value is not None and value < expected
            elif operator == '$regex':
                pattern = re.compile(expected, re.I if 'i' in condition.get('$options', '') else 0)
                values = value if isinstance(value, list) else [value]
                ok = any(isinstance(item, str) and pattern.search(item) for item in values)
            else:
                raise ValueError(f'Unsupported query operator: {operator}')
            if not ok:
                return False
    return True


def project(document, projection):
    if not projection:
        return deepcopy(document)
    includes = [key for key, enabled in projection.items() if enabled]
    if includes:
        if any(not enabled and key != '_id' for key, enabled in projection.items()):
            raise ValueError('Cannot mix inclusion and exclusion projections')
        output = {}
        for key in includes:
            value = get_path(document, key)
            if value is not MISSING:
                set_path(output, key, value)
        if projection.get('_id', 1) and '_id' in document:
            output['_id'] = deepcopy(document['_id'])
        return output
    output = deepcopy(document)
    for path in projection:
        parts = path.split('.')
        parent = get_path(output, '.'.join(parts[:-1])) if len(parts) > 1 else output
        if isinstance(parent, dict):
            parent.pop(parts[-1], None)
    return output


def sort_documents(documents, keys):
    def compare(left, right):
        for field, direction in keys:
            a, b = get_path(left, field), get_path(right, field)
            a = None if a is MISSING else a
            b = None if b is MISSING else b
            if a == b:
                continue
            if a is None or b is None:
                order = -1 if a is None else 1
            else:
                try:
                    order = -1 if a < b else 1
                except TypeError:
                    order = -1 if encode(a) < encode(b) else 1
            return order * direction
        return 0
    return sorted(documents, key=cmp_to_key(compare))


class Cursor:
    def __init__(self, collection, query=None, projection=None, pipeline=None):
        self.collection = collection
        self.query = deepcopy(query or {})
        self.projection = deepcopy(projection)
        self.pipeline = deepcopy(pipeline)
        self.keys = []
        self.offset = 0

    def sort(self, field, direction=None):
        self.keys = [(field, direction)] if isinstance(field, str) else list(field)
        if any(direction not in (-1, 1) for _, direction in self.keys):
            raise ValueError('Sort direction must be 1 or -1')
        return self

    def skip(self, count):
        if count < 0:
            raise ValueError('Skip cannot be negative')
        self.offset = count
        return self

    async def to_list(self, length=None):
        if length is not None and length < 0:
            raise ValueError('Length cannot be negative')
        def read():
            docs = self.collection._read(self.query)
            if self.pipeline is not None:
                docs = aggregate(docs, self.pipeline)
            docs = sort_documents(docs, self.keys)
            docs = docs[self.offset:] if length is None else docs[self.offset:self.offset + length]
            return [project(doc, self.projection) for doc in docs]
        return await self.collection.database.run(read)


def aggregate(documents, pipeline):
    for stage in pipeline:
        if len(stage) != 1:
            raise ValueError('Aggregation stages must have one operator')
        operator, value = next(iter(stage.items()))
        if operator == '$match':
            documents = [doc for doc in documents if matches(doc, value)]
        elif operator == '$sort':
            documents = sort_documents(documents, list(value.items()))
        elif operator == '$unwind':
            if not isinstance(value, str) or not value.startswith('$'):
                raise ValueError('Unsupported unwind expression')
            unwound = []
            for doc in documents:
                values = get_path(doc, value[1:])
                if values is MISSING or values is None:
                    continue
                for item in values if isinstance(values, list) else [values]:
                    copy = deepcopy(doc)
                    set_path(copy, value[1:], item)
                    unwound.append(copy)
            documents = unwound
        elif operator == '$group':
            groups = {}
            for doc in documents:
                key = expression(doc, value['_id'])
                key = None if key is MISSING else key
                encoded = encode(key)
                first = encoded not in groups
                group = groups.setdefault(encoded, {'_id': key})
                for field, accumulator in value.items():
                    if field == '_id':
                        continue
                    if len(accumulator) != 1:
                        raise ValueError('Unsupported group accumulator')
                    op, operand = next(iter(accumulator.items()))
                    item = expression(doc, operand)
                    if op == '$first':
                        if first:
                            group[field] = None if item is MISSING else deepcopy(item)
                    elif op == '$sum':
                        group[field] = group.get(field, 0) + (item if isinstance(item, (int, float)) else 0)
                    else:
                        raise ValueError(f'Unsupported group accumulator: {op}')
            documents = list(groups.values())
        elif operator == '$project':
            projected = []
            for doc in documents:
                output = project(doc, {key: val for key, val in value.items() if isinstance(val, int)})
                for key, val in value.items():
                    if isinstance(val, str):
                        item = expression(doc, val)
                        if item is not MISSING:
                            set_path(output, key, item)
                    elif not isinstance(val, int):
                        raise ValueError('Unsupported projection expression')
                projected.append(output)
            documents = projected
        else:
            raise ValueError(f'Unsupported aggregation stage: {operator}')
    return documents


def expression(document, value):
    return get_path(document, value[1:]) if isinstance(value, str) and value.startswith('$') else value


class Collection:
    def __init__(self, database, name):
        self.database, self.name = database, name

    def _read(self, query):
        validate_query(query)
        sql = 'SELECT document_json FROM documents WHERE collection_name = ?'
        parameters = [self.name]
        # Common character/render/job lookups avoid decoding an entire collection.
        if isinstance(query.get('id'), str):
            sql += ' AND app_id = ?'
            parameters.append(query['id'])
        return [doc for payload, in self.database.connection.execute(sql, parameters)
                if matches(doc := json_util.loads(payload), query)]

    def find(self, query=None, projection=None):
        return Cursor(self, query, projection)

    async def find_one(self, query=None, projection=None, sort=None):
        cursor = self.find(query, projection)
        if sort:
            cursor.sort(sort)
        documents = await cursor.to_list(1)
        return documents[0] if documents else None

    def aggregate(self, pipeline):
        return Cursor(self, pipeline=pipeline)

    def _write(self, document):
        connection = self.database.connection
        key = encode(document['_id'])
        for fields_json, in connection.execute('SELECT fields FROM unique_indexes WHERE collection_name = ?', (self.name,)):
            fields = json.loads(fields_json)
            candidate = [None if (val := get_path(document, field)) is MISSING else val for field in fields]
            for existing in self._read({}):
                if encode(existing['_id']) != key and candidate == [None if (val := get_path(existing, field)) is MISSING else val for field in fields]:
                    raise DuplicateKeyError('Duplicate compound index value')
        connection.execute('INSERT OR IGNORE INTO collections VALUES (?)', (self.name,))
        connection.execute('INSERT INTO documents VALUES (?, ?, ?, ?) ON CONFLICT(collection_name, document_key) DO UPDATE SET document_json=excluded.document_json, app_id=excluded.app_id',
                           (self.name, key, encode(document), document.get('id') if isinstance(document.get('id'), str) else None))

    async def insert_one(self, document):
        saved = deepcopy(document)
        saved.setdefault('_id', ObjectId())
        def write():
            if self.database.connection.execute('SELECT 1 FROM documents WHERE collection_name=? AND document_key=?', (self.name, encode(saved['_id']))).fetchone():
                raise DuplicateKeyError('Duplicate document identity')
            self._write(saved)
            return SimpleNamespace(inserted_id=saved['_id'])
        return await self.database.run(write, write=True)

    async def update_one(self, query, update, upsert=False):
        return await self._update(query, update, upsert, many=False)

    async def update_many(self, query, update, upsert=False):
        return await self._update(query, update, upsert, many=True)

    async def _update(self, query, update, upsert, many):
        if not update or set(update) - {'$set', '$setOnInsert'}:
            raise ValueError('Unsupported update operator')
        if any(path == '_id' or path.startswith('_id.') for changes in update.values() for path in changes):
            raise ValueError('Document identity is immutable')
        def write():
            documents = self._read(query)
            if not many:
                documents = documents[:1]
            inserted = not documents and upsert
            if inserted:
                doc = {}
                for key, value in query.items():
                    if not key.startswith('$') and not isinstance(value, dict):
                        set_path(doc, key, value)
                doc.setdefault('_id', ObjectId())
                documents = [doc]
            modified = 0
            for document in documents:
                before = deepcopy(document)
                for operator, changes in update.items():
                    if operator == '$setOnInsert' and not inserted:
                        continue
                    for field, value in changes.items():
                        set_path(document, field, value)
                if inserted or before != document:
                    if inserted and self.database.connection.execute('SELECT 1 FROM documents WHERE collection_name=? AND document_key=?', (self.name, encode(document['_id']))).fetchone():
                        raise DuplicateKeyError('Duplicate document identity')
                    self._write(document)
                    modified += int(not inserted)
            return SimpleNamespace(matched_count=0 if inserted else len(documents), modified_count=modified,
                                   upserted_id=documents[0]['_id'] if inserted else None)
        return await self.database.run(write, write=True)

    async def delete_one(self, query):
        return await self._delete(query, many=False)

    async def delete_many(self, query):
        return await self._delete(query, many=True)

    async def _delete(self, query, many):
        def write():
            documents = self._read(query)
            if not many:
                documents = documents[:1]
            self.database.connection.executemany('DELETE FROM documents WHERE collection_name=? AND document_key=?', [(self.name, encode(doc['_id'])) for doc in documents])
            return SimpleNamespace(deleted_count=len(documents))
        return await self.database.run(write, write=True)

    async def count_documents(self, query):
        return await self.database.run(lambda: len(self._read(query)))

    async def distinct(self, field, query=None):
        def read():
            values = {}
            for doc in self._read(query or {}):
                value = get_path(doc, field)
                if value is MISSING:
                    continue
                for item in value if isinstance(value, list) else [value]:
                    values[encode(item)] = item
            return list(values.values())
        return await self.database.run(read)

    async def create_index(self, keys, unique=False):
        fields = [field for field, _ in keys]
        if not unique:
            raise ValueError('Only application compound unique indexes are supported')
        def write():
            seen = set()
            for doc in self._read({}):
                key = encode([None if (val := get_path(doc, field)) is MISSING else val for field in fields])
                if key in seen:
                    raise DuplicateKeyError('Existing documents violate compound unique index')
                seen.add(key)
            self.database.connection.execute('INSERT OR IGNORE INTO unique_indexes VALUES (?, ?)', (self.name, json.dumps(fields)))
            return '_'.join(fields)
        return await self.database.run(write, write=True)


class SQLiteDatabase:
    def __init__(self, path):
        self.path = Path(path).resolve()
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.lock = threading.RLock()
        self.connection = sqlite3.connect(self.path, check_same_thread=False, timeout=30)
        try:
            tables = {row[0] for row in self.connection.execute("SELECT name FROM sqlite_master WHERE type='table'")}
            if tables:
                metadata = dict(self.connection.execute('SELECT key, value FROM metadata')) if 'metadata' in tables else {}
                if metadata.get('format') != json.dumps(FORMAT) or metadata.get('schema_version') != json.dumps(VERSION):
                    raise ValueError('Unsupported live SQLite database. Import migration snapshots explicitly into a new file.')
            with self.connection:
                self.connection.execute('CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL)')
                self.connection.executemany('INSERT OR IGNORE INTO metadata VALUES (?, ?)', [('format', json.dumps(FORMAT)), ('schema_version', json.dumps(VERSION))])
                self.connection.execute('CREATE TABLE IF NOT EXISTS collections (name TEXT PRIMARY KEY)')
                self.connection.execute('CREATE TABLE IF NOT EXISTS documents (collection_name TEXT NOT NULL, document_key TEXT NOT NULL, document_json TEXT NOT NULL, app_id TEXT, PRIMARY KEY(collection_name, document_key))')
                self.connection.execute('CREATE INDEX IF NOT EXISTS document_app_id ON documents(collection_name, app_id)')
                self.connection.execute('CREATE TABLE IF NOT EXISTS unique_indexes (collection_name TEXT NOT NULL, fields TEXT NOT NULL, PRIMARY KEY(collection_name, fields))')
            self.connection.execute('PRAGMA journal_mode=WAL')
            self.connection.execute('PRAGMA synchronous=FULL')
        except BaseException:
            self.connection.close()
            raise

    def __getitem__(self, name):
        return Collection(self, name)

    def __getattr__(self, name):
        if name.startswith('_'):
            raise AttributeError(name)
        return self[name]

    async def run(self, callback, write=False):
        def locked():
            with self.lock:
                if write:
                    self.connection.execute('BEGIN IMMEDIATE')
                try:
                    result = callback()
                    if write:
                        self.connection.commit()
                    return result
                except BaseException:
                    if write:
                        self.connection.rollback()
                    raise
        return await asyncio.to_thread(locked)

    async def command(self, command):
        if command != 'ping':
            raise ValueError('Unsupported database command')
        return await self.run(lambda: {'ok': self.connection.execute('SELECT 1').fetchone()[0]})

    def close(self):
        with self.lock:
            self.connection.close()
