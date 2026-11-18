"""Serve the public weather app and proxy the fixed NMC weather feed."""

import json
from pathlib import Path
import time

from flask import Flask, jsonify, send_from_directory
import requests

app = Flask(__name__, static_folder=None)
DIST = Path(__file__).resolve().parents[1] / "dist"
NMC_BASE = "https://typhoon.nmc.cn/weatherservice/typhoon/jsons"
MAX_RESPONSE_BYTES = 2 * 1024 * 1024


def weather_response(resource: str, expected_field: str):
    try:
        with requests.get(
            f"{NMC_BASE}/{resource}",
            params={"t": time.time_ns() // 1_000_000},
            timeout=(3, 6),
            allow_redirects=False,
            stream=True,
        ) as upstream:
            if upstream.status_code != 200:
                raise ValueError("Unexpected upstream status")
            content = bytearray()
            for chunk in upstream.iter_content(chunk_size=16_384):
                content.extend(chunk)
                if len(content) > MAX_RESPONSE_BYTES:
                    raise ValueError("Upstream response is too large")

        start, end = content.find(b"{"), content.rfind(b"}")
        if not 0 <= start < end:
            raise ValueError("Missing JSON object")
        data = json.loads(content[start : end + 1])
        if not isinstance(data, dict) or not isinstance(data.get(expected_field), list):
            raise ValueError("Unexpected upstream data")
        return jsonify({expected_field: data[expected_field]})
    except (requests.RequestException, ValueError):
        return jsonify(error="Weather data temporarily unavailable"), 502


@app.get("/api/typhoon/list")
def typhoon_list():
    return weather_response("list_default", "typhoonList")


@app.get("/api/typhoon/<int:typhoon_id>")
def typhoon_detail(typhoon_id: int):
    if not 0 < typhoon_id < 1_000_000_000:
        return jsonify(error="Invalid typhoon ID"), 404
    return weather_response(f"view_{typhoon_id}", "typhoon")


@app.get("/")
def index():
    return send_from_directory(DIST, "index.html")


@app.get("/assets/<path:filename>")
def asset(filename: str):
    return send_from_directory(DIST / "assets", filename)


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5001, debug=False)
