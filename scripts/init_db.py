"""keirin.db を作る（何度実行しても壊れない）。使い方: python3 scripts/init_db.py [keirin.db]"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from keirin.db import connect, init_db  # noqa: E402
from keirin.features import register_definitions  # noqa: E402

path = sys.argv[1] if len(sys.argv) > 1 else "keirin.db"
conn = connect(path)
init_db(conn)
register_definitions(conn)
conn.commit()
print(path, "tables:", [r[0] for r in conn.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")])
