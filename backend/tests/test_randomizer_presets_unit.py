import sys
import unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from randomizer_presets import validate_randomizer
class PresetTests(unittest.TestCase):
    def test_deduplicates_and_keeps_named_rules(self):
        name,rules=validate_randomizer(' My scene ',[{'section':'scene','field':'environment','values':['studio','studio']}])
        self.assertEqual(name,'My scene')
        self.assertEqual(rules[0]['values'],['studio'])
    def test_rejects_empty_duplicate_and_invalid_rules(self):
        for rules in ([],[{'section':'unknown','field':'x','values':['a']}],[{'section':'scene','field':'environment','values':[]}],
                      [{'section':'scene','field':'environment','values':['a']}] * 2):
            with self.assertRaises(ValueError): validate_randomizer('test',rules)

class PersistenceTests(unittest.IsolatedAsyncioTestCase):
    async def test_crud_round_trip_and_missing_preset(self):
        import ast
        import tempfile
        from types import SimpleNamespace
        from sqlite_storage import SQLiteDatabase
        class HTTPException(Exception):
            def __init__(self, status_code, detail): self.status_code, self.detail = status_code, detail
        names={'_randomizer_payload','list_randomizer_presets','create_randomizer_preset','update_randomizer_preset','delete_randomizer_preset'}
        tree=ast.parse((Path(__file__).resolve().parents[1]/'server.py').read_text())
        nodes=[node for node in tree.body if isinstance(node,(ast.FunctionDef,ast.AsyncFunctionDef)) and node.name in names]
        for node in nodes:
            node.decorator_list=[];node.returns=None
            for arg in node.args.args: arg.annotation=None
        with tempfile.TemporaryDirectory() as folder:
            db=SQLiteDatabase(Path(folder)/'test.sqlite')
            ns=dict(db=db,validate_randomizer=validate_randomizer,HTTPException=HTTPException,new_id=lambda:'preset',now_iso=lambda:'2026-10-17')
            exec(compile(ast.Module(body=nodes,type_ignores=[]),'<presets>','exec'),ns)
            body=SimpleNamespace(name='Outdoor',rules=[{'section':'scene','field':'environment','values':['beach']}])
            saved=await ns['create_randomizer_preset'](body)
            self.assertEqual(saved['id'],'preset')
            listed=await ns['list_randomizer_presets']()
            self.assertEqual(listed[0]['rules'],body.rules)
            body.name='Updated'
            await ns['update_randomizer_preset']('preset',body)
            self.assertEqual((await ns['list_randomizer_presets']())[0]['name'],'Updated')
            await ns['delete_randomizer_preset']('preset')
            self.assertEqual(await ns['list_randomizer_presets'](),[])
            with self.assertRaises(HTTPException): await ns['delete_randomizer_preset']('preset')
            db.connection.close()
