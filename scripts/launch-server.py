"""Inicia o servidor de forma independente no Windows e registra seu PID."""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

root = Path(sys.argv[1]).resolve()
logs = root / "logs"
data = root / "data"
logs.mkdir(exist_ok=True)
data.mkdir(exist_ok=True)

creation_flags = 0
if sys.platform == "win32":
    creation_flags = (
        subprocess.CREATE_NEW_PROCESS_GROUP
        | subprocess.DETACHED_PROCESS
        | subprocess.CREATE_NO_WINDOW
    )

with (logs / "server.log").open("ab") as stdout, (logs / "server-error.log").open("ab") as stderr:
    process = subprocess.Popen(
        [sys.executable, "app.py"],
        cwd=root,
        stdin=subprocess.DEVNULL,
        stdout=stdout,
        stderr=stderr,
        creationflags=creation_flags,
        close_fds=True,
    )

(data / "server.pid").write_text(str(process.pid), encoding="ascii")
