import json
import re
import unicodedata
from pathlib import Path
from urllib.parse import urlparse

from db import database, query

KINDS = {"帖碑", "文献", "网站", "字典"}


def normalize(value):
    return "".join(c for c in unicodedata.normalize("NFKC", value).casefold()
                   if c.isalnum())


def ingest(path):
    """Replace the evidence and relationships for each supplied source ID."""
    payload = json.loads(Path(path).read_text(encoding="utf-8-sig"))
    with database() as conn:
        for entity in payload["entities"]:
            query(conn, """
                INSERT INTO kb_entities (id, name, kind) VALUES (%(id)s, %(name)s, %(kind)s)
                ON CONFLICT (id) DO UPDATE SET name = excluded.name, kind = excluded.kind
            """, **entity)
            query(conn, "DELETE FROM kb_terms WHERE entity_id = %(id)s", id=entity["id"])
            terms = {normalize(alias) for alias in [entity["name"], *entity.get("aliases", [])]}
            for term in sorted(terms):
                if not 1 <= len(term) <= 32:
                    raise ValueError("实体名称及别名标准化后须为 1–32 字")
                query(conn, "INSERT INTO kb_terms (entity_id, term) VALUES (%(id)s, %(term)s)",
                      id=entity["id"], term=term)
        for source in payload["sources"]:
            url = urlparse(source["url"])
            if (url.scheme != "https" or not url.hostname or url.username or
                    re.search(r'[\s<>()"\[\]]', source["url"])):
                raise ValueError(f"来源须提供可引用的 HTTPS 地址：{source['id']}")
            if source["kind"] not in KINDS or not source["summary"].strip():
                raise ValueError(f"来源类别或摘要有误：{source['id']}")
            query(conn, """
                INSERT INTO kb_sources (id, title, kind, url, summary)
                VALUES (%(id)s, %(title)s, %(kind)s, %(url)s, %(summary)s)
                ON CONFLICT (id) DO UPDATE SET title = excluded.title,
                    kind = excluded.kind, url = excluded.url, summary = excluded.summary
            """, **source)
            query(conn, "DELETE FROM kb_source_entities WHERE source_id = %(id)s", id=source["id"])
            query(conn, "DELETE FROM kb_edges WHERE source_id = %(id)s", id=source["id"])
            linked = set(source["entities"])
            for subject, predicate, obj in source.get("edges", []):
                linked.update((subject, obj))
                query(conn, """
                    INSERT INTO kb_edges (source_id, subject_id, predicate, object_id)
                    VALUES (%(source)s, %(subject)s, %(predicate)s, %(obj)s) ON CONFLICT DO NOTHING
                """, source=source["id"], subject=subject, predicate=predicate, obj=obj)
            for entity_id in sorted(linked):
                query(conn, "INSERT INTO kb_source_entities VALUES (%(source)s, %(entity)s)",
                      source=source["id"], entity=entity_id)
    return len(payload["sources"])


def retrieve(question, previous=""):
    """Match Chinese aliases, then traverse one hop of source-backed graph edges."""
    def terms_for(value):
        value = normalize(value)[:180]
        return {value[i:i + size] for i in range(len(value))
                for size in range(1, min(32, len(value) - i) + 1)}

    current_terms = terms_for(question)
    if not current_terms:
        return [], []
    allow_single_character = len(normalize(question)) == 1
    with database() as conn:
        def match(terms):
            scores = {}
            for row in query(conn, """SELECT entity_id, term FROM kb_terms
                                       WHERE term = ANY(%(terms)s)""", terms=sorted(terms)).fetchall():
                if len(row["term"]) > 1 or allow_single_character:
                    scores[row["entity_id"]] = max(scores.get(row["entity_id"], 0), len(row["term"]))
            return scores

        scores = match(current_terms)
        if not scores and previous:
            scores = match(terms_for(previous))
        if not scores:
            return [], []
        seeds = sorted(scores, key=lambda item: (-scores[item], item))[:8]
        relations = query(conn, """
            SELECT e.source_id, e.subject_id, e.object_id, s.name AS subject,
                   e.predicate, o.name AS object
            FROM kb_edges e
            JOIN kb_entities s ON s.id = e.subject_id
            JOIN kb_entities o ON o.id = e.object_id
            WHERE e.subject_id = ANY(%(seeds)s) OR e.object_id = ANY(%(seeds)s)
            ORDER BY e.source_id, e.subject_id, e.predicate, e.object_id LIMIT 80
        """, seeds=seeds).fetchall()
        weights = {item: scores[item] * 4 for item in seeds}
        for edge in relations:
            weights.setdefault(edge["subject_id"], 1)
            weights.setdefault(edge["object_id"], 1)
        evidence = query(conn, """
            SELECT s.id, s.title, s.kind, s.url, s.summary, se.entity_id
            FROM kb_source_entities se JOIN kb_sources s ON s.id = se.source_id
            WHERE se.entity_id = ANY(%(entities)s)
        """, entities=list(weights)).fetchall()
    sources = {}
    rankings = {}
    for row in evidence:
        sources[row["id"]] = {key: row[key] for key in ("id", "title", "kind", "url", "summary")}
        rankings[row["id"]] = rankings.get(row["id"], 0) + weights[row["entity_id"]]
    chosen = sorted(sources, key=lambda item: (-rankings[item], item))[:5]
    numbers = {item: index for index, item in enumerate(chosen, 1)}
    facts = [{"source": numbers[e["source_id"]], "subject": e["subject"],
              "relation": e["predicate"], "object": e["object"]}
             for e in relations if e["source_id"] in numbers][:18]
    return [sources[item] for item in chosen], facts
