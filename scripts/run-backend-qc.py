"""Run the offline backend QC suites; never discover live-service CRUD tests."""
from pathlib import Path
import subprocess
import sys

backend = Path(__file__).resolve().parents[1] / 'backend'
tests = backend / 'tests'
extra = {'test_assistant_research.py', 'test_comfy_health_status.py',
         'test_media_library_connection.py', 'test_ollama_model_selection.py', 'test_ollama_prompt_models.py'}
selected = sorted(path for path in tests.glob('test_*.py') if path.name.endswith('_unit.py') or path.name in extra)
if not selected:
    raise SystemExit('No offline QC suites were found.')
raise SystemExit(subprocess.call([sys.executable, '-m', 'pytest', '-q', *[str(path.relative_to(backend)) for path in selected]], cwd=backend))
