#!/usr/bin/env python3
"""Build a real personal corpus for second-brain-search from Gmail + Google Calendar.

Reads the user's own mail and calendar through the connected hatch_gws_cli
skills and emits data.js (window.CORPUS + window.CORPUS_META) in the exact
shape the in-browser BM25/LSA engine expects.

Privacy defaults (safe to commit to a PRIVATE repo):
  - Email docs contain subject + Gmail snippet only (no full bodies).
  - Calendar docs contain summary + truncated description.
  - Use --full-bodies for a richer local-only corpus; do NOT commit that output.

Usage:
  python3 tools/build-corpus.py [--days 90] [--max 500] [--include-promos]
                                [--full-bodies] [--refresh] [--no-cache] [--out data.js]

Knobs:
  --days          lookback window for mail; calendar also gets +30d upcoming
  --max           cap on total documents (newest first)
  --include-promos  include Promotions/Social mail (default: excluded)
  --full-bodies   fetch full message bodies instead of snippets (local use only)
  --refresh       ignore the local message cache and re-fetch everything
  --no-cache      do not read or write the local message cache
  --out           output path (default: data.js next to the repo root)

Rebuilds are fast: raw Gmail responses are cached in tools/.cache/ (gitignored),
so only the cheap list call re-runs. Use --refresh for a fully fresh pull.
"""
import argparse
import html
import json
import os
import re
import subprocess
import sys
from datetime import datetime, timedelta, timezone

REPO = None  # set in main

TOPIC_RULES = [
    (r"\b(invoice|payment|receipt|refund|charge|billing|venmo|zelle|bank|credit card)\b", "finance"),
    (r"\b(flight|hotel|airbnb|itinerary|trip|vacation|boarding pass)\b", "travel"),
    (r"\b(interview|offer letter|recruit|job application|resume)\b", "career"),
    (r"\b(doctor|dentist|appointment|prescription|lab result|vaccine|clinic)\b", "health"),
    (r"\b(mortgage|rent|lease|landlord|apartment)\b", "housing"),
    (r"\b(wedding|rsvp|baby|birthday)\b", "family"),
    (r"\b(deploy|release|incident|outage|postmortem|pull request|code review|standup|sprint)\b", "engineering"),
    (r"\b(meeting|1:1|sync|all-hands|offsite|okr|review)\b", "work"),
    (r"\b(order|shipped|delivered|tracking|package|amazon)\b", "shopping"),
    (r"\b(subscription|renewal|trial|plan|upgrade)\b", "subscriptions"),
    (r"\b(security|password|verification code|2fa|login alert|suspicious)\b", "security"),
    (r"\b(cat|dog|vet|pet)\b", "pets"),
    (r"\b(church|small group|bible|devotion)\b", "faith"),
    (r"\b(restaurant|reservation|dinner|opentable)\b", "dining"),
]

def run(cmd):
    p = subprocess.run(cmd, capture_output=True, text=True)
    if p.returncode != 0:
        raise RuntimeError("command failed: %s\n%s" % (" ".join(cmd[:4]), p.stderr[:500]))
    return p.stdout

def gws(service, *args):
    return json.loads(run(["hatch_gws_cli", service] + list(args)))

def parse_from(raw):
    raw = raw or ""
    m = re.match(r'^\s*"?(.*?)"?\s*<([^>]+)>', raw)
    if m:
        return m.group(1).strip() or m.group(2), m.group(2)
    m = re.match(r"^\s*([^<>\s]+@[^<>\s]+)\s*$", raw)
    if m:
        return m.group(1).split("@")[0], m.group(1)
    return raw.strip()[:80], ""

def gmail_date(msg):
    for h in msg.get("payload", {}).get("headers", []):
        if h["name"].lower() == "date":
            try:
                dt = datetime.strptime(h["value"][:31].strip(), "%a, %d %b %Y %H:%M:%S %z")
                return dt.strftime("%Y-%m-%d")
            except Exception:
                pass
    try:
        ts = int(msg.get("internalDate", 0)) / 1000
        return datetime.fromtimestamp(ts, tz=timezone.utc).strftime("%Y-%m-%d")
    except Exception:
        return datetime.now(timezone.utc).strftime("%Y-%m-%d")

def tag_topics(text):
    t = text.lower()
    return sorted({topic for pat, topic in TOPIC_RULES if re.search(pat, t)})

def clean_snippet(s):
    return html.unescape(re.sub(r"\s+", " ", s or "")).strip()

def body_from_payload(payload, max_chars):
    """Extract plain text from a full message payload (local-use mode)."""
    texts = []
    def walk(p):
        mt = p.get("mimeType", "")
        body = p.get("body", {})
        data = body.get("data")
        if data and mt.startswith("text/plain"):
            import base64
            try:
                texts.append(base64.urlsafe_b64decode(data + "=" * (-len(data) % 4)).decode("utf-8", "replace"))
            except Exception:
                pass
        for part in p.get("parts", []) or []:
            walk(part)
    walk(payload or {})
    text = re.sub(r"\s+", " ", " ".join(texts)).strip()
    # strip quoted replies / signatures roughly
    text = re.split(r"\nOn .* wrote:\n", text)[0]
    return text[:max_chars]

def fetch_gmail(days, max_docs, include_promos, full_bodies, cache_dir, refresh):
    q = "newer_than:%dd" % days
    if not include_promos:
        q += " -category:promotions -category:social"
    ids = []
    page = None
    while True:
        params = {"userId": "me", "q": q, "maxResults": 100}
        if page:
            params["pageToken"] = page
        res = gws("gmail", "users", "messages", "list", "--params", json.dumps(params))
        ids.extend(m["id"] for m in res.get("messages", []))
        page = res.get("nextPageToken")
        if not page or len(ids) >= max_docs:
            break
    ids = ids[:max_docs]
    print("gmail: %d messages in window" % len(ids), file=sys.stderr)
    if cache_dir:
        os.makedirs(cache_dir, exist_ok=True)

    def get_message(mid):
        cpath = os.path.join(cache_dir, "gm-%s.json" % mid) if cache_dir else None
        if cpath and not refresh and os.path.exists(cpath):
            with open(cpath, encoding="utf-8") as f:
                return json.load(f)
        params = {"userId": "me", "id": mid, "format": "full" if full_bodies else "metadata",
                  "metadataHeaders": ["From", "Subject", "Date"]}
        msg = gws("gmail", "users", "messages", "get", "--params", json.dumps(params))
        if cpath:
            with open(cpath, "w", encoding="utf-8") as f:
                json.dump(msg, f)
        return msg

    docs = []
    for i, mid in enumerate(ids):
        if i and i % 50 == 0:
            print("  fetched %d/%d" % (i, len(ids)), file=sys.stderr)
        msg = get_message(mid)
        headers = {h["name"].lower(): h["value"] for h in msg.get("payload", {}).get("headers", [])}
        subject = headers.get("subject", "(no subject)").strip() or "(no subject)"
        name, addr = parse_from(headers.get("from", ""))
        date = gmail_date(msg)
        if full_bodies:
            body = body_from_payload(msg.get("payload"), 4000) or clean_snippet(msg.get("snippet", ""))
        else:
            body = clean_snippet(msg.get("snippet", ""))
        if not body and subject == "(no subject)":
            continue  # empty shell of a message — nothing to index
        if not body:
            body = subject
        people = [name] if name and name.lower() not in ("me",) else []
        docs.append({
            "id": "gm-" + mid,
            "type": "email",
            "title": subject[:160],
            "date": date,
            "from": name,
            "to": "me",
            "body": body,
            "entities": {"people": people, "projects": [], "topics": tag_topics(subject + " " + body)},
        })
    return docs

def fetch_calendar(days):
    now = datetime.now(timezone.utc)
    time_min = (now - timedelta(days=days)).isoformat()
    time_max = (now + timedelta(days=30)).isoformat()
    # all of the user's calendars except holiday feeds
    try:
        cl = gws("calendar", "calendarList", "list", "--params", json.dumps({"maxResults": 50}))
        cal_ids = [c["id"] for c in cl.get("items", [])
                   if "holiday" not in c.get("id", "").lower()]
    except Exception:
        cal_ids = ["primary"]
    if not cal_ids:
        cal_ids = ["primary"]
    events = []
    for cal_id in cal_ids:
        page = None
        while True:
            params = {"calendarId": cal_id, "timeMin": time_min, "timeMax": time_max,
                      "singleEvents": True, "orderBy": "startTime", "maxResults": 250}
            if page:
                params["pageToken"] = page
            res = gws("calendar", "events", "list", "--params", json.dumps(params))
            for ev in res.get("items", []):
                ev["_cal"] = cal_id
            events.extend(res.get("items", []))
            page = res.get("nextPageToken")
            if not page:
                break
    print("calendar: %d events in window (%d calendars)" % (len(events), len(cal_ids)), file=sys.stderr)

    docs = []
    for ev in events:
        if ev.get("status") == "cancelled":
            continue
        start = ev.get("start", {})
        dt = start.get("dateTime") or start.get("date", "")
        date = dt[:10]
        time = ""
        if "T" in dt:
            try:
                t = datetime.fromisoformat(dt.replace("Z", "+00:00"))
                local = t.astimezone()
                time = local.strftime("%-I:%M %p")
            except Exception:
                pass
        summary = ev.get("summary", "(no title)")
        desc = clean_snippet(ev.get("description", ""))[:600]
        loc = ev.get("location", "")
        attendees = [a.get("displayName") or a.get("email", "").split("@")[0]
                     for a in ev.get("attendees", []) if not a.get("self")]
        body_bits = [d for d in [desc, ("Location: " + loc) if loc else "",
                                 ("With: " + ", ".join(attendees)) if attendees else ""] if d]
        docs.append({
            "id": "cal-" + ev.get("id", str(abs(hash(summary + date)))),
            "type": "calendar",
            "title": summary[:160],
            "date": date,
            "time": time,
            "location": loc[:120],
            "body": " ".join(body_bits) or summary,
            "entities": {"people": attendees[:8], "projects": [],
                         "topics": tag_topics(summary + " " + desc)},
        })
    return docs

def js_escape(s):
    return json.dumps(s, ensure_ascii=False)

def main():
    ap = argparse.ArgumentParser(description="Build second-brain-search corpus from Gmail + Calendar")
    ap.add_argument("--days", type=int, default=90)
    ap.add_argument("--max", type=int, default=500, dest="max_docs")
    ap.add_argument("--include-promos", action="store_true")
    ap.add_argument("--full-bodies", action="store_true",
                    help="fetch full email bodies (LOCAL USE ONLY — do not commit the output)")
    ap.add_argument("--refresh", action="store_true",
                    help="ignore the local message cache and re-fetch everything")
    ap.add_argument("--no-cache", action="store_true",
                    help="do not read or write the local message cache")
    ap.add_argument("--out", default=None)
    args = ap.parse_args()

    repo = REPO or subprocess.run(["pwd"], capture_output=True, text=True).stdout.strip()
    out = args.out or (repo + "/data.js")
    cache_dir = None if args.no_cache else os.path.join(repo, "tools", ".cache")

    docs = fetch_gmail(args.days, args.max_docs, args.include_promos, args.full_bodies,
                       cache_dir, args.refresh)
    remaining = args.max_docs - len(docs)
    cal = fetch_calendar(args.days)
    docs.extend(cal[:max(0, remaining)])
    # newest first
    docs.sort(key=lambda d: d["date"], reverse=True)
    docs = docs[:args.max_docs]

    # suggested example queries: top topics/people with >=3 docs
    counts = {}
    for d in docs:
        for e in (d["entities"]["people"] + d["entities"]["topics"]):
            counts[e] = counts.get(e, 0) + 1
    examples = sorted([e for e, c in counts.items() if c >= 3],
                      key=lambda e: -counts[e])[:5]
    if not examples:
        examples = ["meeting", "receipt", "flight"]

    meta = {
        "builtAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "days": args.days,
        "sources": ["gmail", "google-calendar"],
        "fullBodies": args.full_bodies,
        "examples": examples,
    }

    with open(out, "w", encoding="utf-8") as f:
        f.write("/* Second Brain — personal corpus, built from the user's own Gmail + Google Calendar.\n")
        f.write("   Generated by tools/build-corpus.py — DO NOT hand-edit; rebuild instead.\n")
        f.write("   Email bodies are snippets only (see --full-bodies for local full-text mode).\n")
        f.write("   Built: %s · %d docs · window: %d days */\n" % (meta["builtAt"], len(docs), args.days))
        f.write("window.CORPUS_META = %s;\n" % js_escape(meta))
        f.write("window.CORPUS = [\n")
        for d in docs:
            parts = ['id:%s' % js_escape(d["id"]), 'type:%s' % js_escape(d["type"]),
                     'title:%s' % js_escape(d["title"]), 'date:%s' % js_escape(d["date"])]
            for k in ("from", "to", "time", "location"):
                if d.get(k):
                    parts.append('%s:%s' % (k, js_escape(d[k])))
            parts.append('body:%s' % js_escape(d["body"]))
            parts.append('entities:%s' % js_escape(d["entities"]))
            f.write("{%s},\n" % ",".join(parts))
        f.write("];\n")

    n_email = sum(1 for d in docs if d["type"] == "email")
    n_cal = sum(1 for d in docs if d["type"] == "calendar")
    print("wrote %s: %d docs (%d email, %d calendar)" % (out, len(docs), n_email, n_cal))
    print("examples: %s" % ", ".join(examples))
    if args.full_bodies:
        print("WARNING: full bodies included — do NOT commit this output.", file=sys.stderr)

if __name__ == "__main__":
    main()
