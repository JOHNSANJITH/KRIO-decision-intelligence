import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from app.services.engine import build_decision_snapshot


if __name__ == "__main__":
    output = build_decision_snapshot()
    print(json.dumps(output, indent=2))
