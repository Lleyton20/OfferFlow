"""Run scheduled jobs by hand: `python -m app.tasks refresh` or `python -m app.tasks digest`."""

import json
import logging
import os
import sys
from dataclasses import asdict

from dotenv import load_dotenv


def main(argv: list[str]) -> int:
    load_dotenv()
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")

    from app.database import SessionLocal
    from app.services import job_service

    command = argv[1] if len(argv) > 1 else ""
    with SessionLocal() as db:
        if command == "refresh":
            result = asdict(job_service.refresh_jobs(db))
        elif command == "digest":
            app_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
            result = asdict(job_service.send_digests(db, app_url))
        else:
            print(__doc__)
            return 2
    print(json.dumps(result, indent=2, default=str))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
