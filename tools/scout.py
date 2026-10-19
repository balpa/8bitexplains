"""Weekly topic scout: rank this week's science stories that can legally become an episode.

Headlines from ScienceDaily, EurekAlert, NASA, NOAA and USGS are only a popularity signal.
Attention comes from Wikipedia pageviews (user agent, bot-like desktop spikes thrown out) and
every shortlisted story needs a public-domain or CC BY / CC0 primary source.

Usage: tools/.venv/bin/python -I tools/scout.py [--date YYYY-MM-DD] [--email you@example.org]
"""
import argparse
import concurrent.futures
import dataclasses
import datetime as dt
import email.utils
import html
import json
import os
import re
import sys
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from dataclasses import dataclass, field
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
USER_AGENT = "8bitexplains-scout/0.1 (+https://github.com/balpa/8bitexplains)"
TIMEOUT_S = 20
MAX_BYTES = 25_000_000
RETRIES = 4
DEFAULT_INTERVAL_S = 0.1
HOST_INTERVAL_S = {"wikimedia.org": 0.25, "en.wikipedia.org": 0.2}

WINDOW_DAYS = 7
BASELINE_DAYS = 28
PVIP_DAYS = 42
TREND_SPIKE = 1.5
COVERAGE_BONUS = 0.25
MIN_WEEK_VIEWS = 500
SPLIT_CLUSTERS = 30
LICENCE_CHECKS = 25
MAX_GUESSES = 14

BOT_MIN_VIEWS = 1000
BOT_DESKTOP_RATIO = 6.0
BOT_RATIO_JUMP = 3.0

ACCEPT, REJECT, UNKNOWN = "accept", "reject", "unknown"
FEDERAL_DOMAINS = ("nasa.gov", "noaa.gov", "usgs.gov", "nih.gov")
# JPL is run by Caltech, so its pages are not US government works.
NOT_FEDERAL_WORK = ("jpl.nasa.gov",)
PUBLIC_DOMAIN = "Public domain (US federal government work, 17 U.S.C. 105)"
UNPAYWALL_OPEN = {"cc-by": "CC BY", "cc0": "CC0", "public-domain": "Public domain"}

SCIENCEDAILY_FEEDS = ("https://www.sciencedaily.com/rss/top/science.xml",
                      "https://www.sciencedaily.com/rss/all.xml")
NASA_FEED = "https://www.nasa.gov/feed/"
NASA_PAGES = 6
NOAA_FEED = "https://www.noaa.gov/rss.xml"
USGS_QUAKES = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_week.atom"
EUREKALERT_SITEMAP = "https://www.eurekalert.org/sitemap/{month}/sitemap.xml"
MEDIAWIKI_API = "https://en.wikipedia.org/w/api.php"
PAGEVIEWS_API = ("https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/"
                 "{access}/user/{title}/daily/{start:%Y%m%d}00/{end:%Y%m%d}00")
CROSSREF_API = "https://api.crossref.org/works/{doi}"
UNPAYWALL_API = "https://api.unpaywall.org/v2/{doi}?email={email}"

SOURCE_ORDER = ("NASA", "NOAA", "USGS", "ScienceDaily", "EurekAlert")
NS = {
    "atom": "http://www.w3.org/2005/Atom",
    "sm": "http://www.sitemaps.org/schemas/sitemap/0.9",
    "news": "http://www.google.com/schemas/sitemap-news/0.9",
}
STOPWORDS = set("""
a about above after again against all almost also among an and any are around as at away back be
because been before behind being below between beyond both but by can could did do does doing down
during each even ever every few find finds first for found from get gets give gives go goes had has
have help helps here how however if in inside into is it its just like made make makes many may
might more most much new news no not now of off on once one only or other our out over own per
really reveal reveals revealed same scientists researchers research see seen shows show showed
should since so some still study studies such than that the their them then there these they this
those through time times to too under until up upon us use used using very via was way ways we
were what when where which while who why will with within without would year years day days week
weeks you your
""".split())
SPLIT_RE = re.compile(r"\s+[-–—|]\s+|[,;:!?]\s*|\.\s+")
NUMERIC_RE = re.compile(r"[\d.,%\-–/]+[a-z]{0,2}")
QUAKE_RE = re.compile(r"^M\s*[\d.]+\s*-\s*(?:.*?\bof\s+)?(.+)$")
DOI_RE = re.compile(r"10\.\d{4,9}/[^\s\"'<>]+")
HREF_RE = re.compile(r'href="([^"]+)"')


class FetchError(Exception):
    def __init__(self, message: str, status: int | None = None):
        super().__init__(message)
        self.status = status


_throttle_lock = threading.Lock()
_next_slot: dict[str, float] = {}


def throttle(url: str) -> None:
    host = urllib.parse.urlparse(url).hostname or ""
    interval = HOST_INTERVAL_S.get(host, DEFAULT_INTERVAL_S)
    with _throttle_lock:
        now = time.monotonic()
        slot = max(now, _next_slot.get(host, 0.0))
        _next_slot[host] = slot + interval
    time.sleep(max(0.0, slot - now))


def retry_delay(error: urllib.error.HTTPError, attempt: int) -> float:
    try:
        after = float(error.headers.get("Retry-After", 0))
    except (TypeError, ValueError):
        after = 0.0
    return min(max(after, 2.0 * 2 ** attempt), 60.0)


def fetch(url: str) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    for attempt in range(RETRIES):
        throttle(url)
        try:
            with urllib.request.urlopen(request, timeout=TIMEOUT_S) as response:
                body = response.read(MAX_BYTES + 1)
            if len(body) > MAX_BYTES:
                raise FetchError(f"{url}: response larger than {MAX_BYTES} bytes")
            return body
        except urllib.error.HTTPError as e:
            if e.code in (429, 500, 502, 503, 504) and attempt < RETRIES - 1:
                time.sleep(retry_delay(e, attempt))
                continue
            raise FetchError(f"{url}: HTTP {e.code}", e.code) from e
        except (urllib.error.URLError, TimeoutError, ConnectionError) as e:
            if attempt < RETRIES - 1:
                time.sleep(2 ** attempt)
                continue
            raise FetchError(f"{url}: {e}") from e
    raise FetchError(f"{url}: gave up")


def fetch_json(url: str, get=fetch) -> dict:
    try:
        data = json.loads(get(url))
    except ValueError as e:
        raise FetchError(f"{url}: not JSON ({e})") from e
    if not isinstance(data, dict):
        raise FetchError(f"{url}: expected a JSON object")
    return data


# ---------------------------------------------------------------- feeds

@dataclass
class Item:
    source: str
    title: str
    url: str
    published: dt.datetime
    keywords: list[str] = field(default_factory=list)


def clean_text(text: str | None) -> str:
    text = html.unescape(html.unescape(text or ""))
    return re.sub(r"\s+", " ", text.replace("’", "'").replace("‘", "'")).strip()


def aware(moment: dt.datetime) -> dt.datetime:
    return moment if moment.tzinfo else moment.replace(tzinfo=dt.timezone.utc)


def parse_rss(body: bytes, source: str) -> list[Item]:
    end = body.rfind(b"</rss>")
    if end >= 0:
        body = body[:end + len(b"</rss>")]
    items = []
    for node in ET.fromstring(body).iter("item"):
        title = clean_text(node.findtext("title"))
        url = (node.findtext("link") or "").strip()
        date = node.findtext("pubDate")
        if not (title and url and date) or title.startswith("APOD:"):
            continue
        items.append(Item(source, title, url, aware(email.utils.parsedate_to_datetime(date))))
    return items


def parse_atom(body: bytes, source: str) -> list[Item]:
    items = []
    for node in ET.fromstring(body).iter(f"{{{NS['atom']}}}entry"):
        title = clean_text(node.findtext("atom:title", namespaces=NS))
        link = node.find("atom:link[@rel='alternate']", NS)
        updated = node.findtext("atom:updated", namespaces=NS)
        if not (title and link is not None and updated):
            continue
        items.append(Item(source, title, link.get("href", ""), aware(dt.datetime.fromisoformat(updated))))
    return items


def parse_news_sitemap(body: bytes, source: str) -> list[Item]:
    items = []
    for node in ET.fromstring(body).iter(f"{{{NS['sm']}}}url"):
        url = (node.findtext("sm:loc", namespaces=NS) or "").strip()
        news = node.find("news:news", NS)
        if news is None or not url:
            continue
        title = clean_text(news.findtext("news:title", namespaces=NS))
        date = news.findtext("news:publication_date", namespaces=NS)
        if not (title and date):
            continue
        published = aware(dt.datetime.fromisoformat(date.strip()))
        keywords = [k.strip().rsplit("/", 1)[-1] for k in (news.findtext("news:keywords", namespaces=NS) or "").split(",")]
        items.append(Item(source, title, url, published, [k for k in keywords if k]))
    return items


def in_window(items: list[Item], now: dt.datetime, days: int = WINDOW_DAYS) -> list[Item]:
    start = now - dt.timedelta(days=days)
    return [i for i in items if start <= i.published <= now + dt.timedelta(days=1)]


def collect_items(now: dt.datetime, get, notes: list[str]) -> list[Item]:
    start = now - dt.timedelta(days=WINDOW_DAYS)
    jobs = [("ScienceDaily", url, parse_rss) for url in SCIENCEDAILY_FEEDS]
    months = sorted({start.strftime("%Y-%m"), now.strftime("%Y-%m")})
    jobs += [("EurekAlert", EUREKALERT_SITEMAP.format(month=m), parse_news_sitemap) for m in months]
    jobs += [("NOAA", NOAA_FEED, parse_rss), ("USGS", USGS_QUAKES, parse_atom)]
    items = []
    for source, url, parse in jobs:
        try:
            items += parse(get(url), source)
        except (FetchError, ET.ParseError, ValueError) as e:
            notes.append(f"{source} feed failed: {e}")
    for page in range(1, NASA_PAGES + 1):
        url = NASA_FEED if page == 1 else f"{NASA_FEED}?paged={page}"
        try:
            batch = parse_rss(get(url), "NASA")
        except (FetchError, ET.ParseError, ValueError) as e:
            notes.append(f"NASA feed page {page} failed: {e}")
            break
        items += batch
        if not batch or min(i.published for i in batch) < start:
            break
    seen, unique = set(), []
    for item in in_window(items, now):
        if item.url not in seen:
            seen.add(item.url)
            unique.append(item)
    for source in SOURCE_ORDER:
        if not any(i.source == source for i in unique):
            notes.append(f"{source}: no headlines in the window")
    return unique


# ------------------------------------------------------- headline -> article

@dataclass
class Article:
    title: str
    description: str = ""
    daily: dict = field(default_factory=dict, repr=False, compare=False)

    @property
    def url(self) -> str:
        return "https://en.wikipedia.org/wiki/" + urllib.parse.quote(self.title.replace(" ", "_"))


def is_content(token: str) -> bool:
    return len(token) > 1 and token.lower() not in STOPWORDS and not NUMERIC_RE.fullmatch(token.lower())


def sentence_case(phrase: str) -> str:
    words = phrase.split()
    return " ".join([words[0]] + [w if w.isupper() else w.lower() for w in words[1:]])


def title_guesses(headline: str) -> list[str]:
    headline = clean_text(headline)
    title_case = sum(w[:1].isupper() for w in headline.split()) > len(headline.split()) / 2
    guesses, variants = [], []
    for segment in SPLIT_RE.split(headline):
        tokens = [t.strip("\"'()[]#") for t in segment.split()]
        tokens = [t for t in tokens if t]
        for n in (3, 2, 1):
            for i in range(len(tokens) - n + 1):
                gram = tokens[i:i + n]
                if not (is_content(gram[0]) and is_content(gram[-1])):
                    continue
                if any(NUMERIC_RE.fullmatch(t.lower()) for t in gram):
                    continue
                phrase = " ".join(gram)
                guesses.append(phrase)
                if "'s" in phrase:
                    guesses.append(re.sub(r"'s\b", "", phrase))
                if title_case and n > 1:
                    variants.append(sentence_case(phrase))
    return list(dict.fromkeys(g for g in guesses + variants if g and "|" not in g))[:MAX_GUESSES]


def item_guesses(item: Item) -> list[str]:
    match = QUAKE_RE.match(item.title) if item.source == "USGS" else None
    if match:
        places = [p.strip() for p in match.group(1).split(",") if p.strip()]
        return [f"{item.published.year} {p} earthquake" for p in places] + places
    return title_guesses(item.title)


def parse_title_query(data: dict) -> dict[str, Article]:
    query = data.get("query") or {}
    pages = {}
    for page in query.get("pages") or []:
        if not isinstance(page, dict) or not page.get("title") or page.get("missing") or page.get("invalid") or page.get("ns") != 0:
            continue
        if "disambiguation" in (page.get("pageprops") or {}):
            continue
        title = page["title"]
        if title.startswith("List of") or title.isdigit():
            continue
        daily = {}
        for day, views in (page.get("pageviews") or {}).items():
            if isinstance(views, int):
                daily[dt.date.fromisoformat(day)] = views
        pages[title] = Article(title, page.get("description", ""), daily)
    alias = {}
    for key in ("normalized", "redirects"):
        for entry in query.get(key) or []:
            if isinstance(entry, dict) and entry.get("from") and entry.get("to"):
                alias[entry["from"]] = entry["to"]
    resolved = dict(pages)
    for start in alias:
        title, hops = start, 0
        while title in alias and hops < 5:
            title, hops = alias[title], hops + 1
        if title in pages:
            resolved[start] = pages[title]
    return resolved


def merge_title_queries(parts: list[dict[str, Article]]) -> dict[str, Article]:
    merged: dict[str, Article] = {}
    for part in parts:
        for key, article in part.items():
            known = merged.get(key)
            if known:
                known.daily.update(article.daily)
                known.description = known.description or article.description
            else:
                merged[key] = article
    by_title = {a.title: a for a in merged.values()}
    return {key: by_title[a.title] for key, a in merged.items()}


def query_titles(titles: list[str], prop: str, get) -> dict[str, Article]:
    params = {"action": "query", "format": "json", "formatversion": "2", "redirects": "1",
              "prop": prop, "ppprop": "disambiguation", "pvipdays": str(PVIP_DAYS),
              "titles": "|".join(titles)}
    parts = []
    for _ in range(20):
        data = fetch_json(MEDIAWIKI_API + "?" + urllib.parse.urlencode(params), get)
        parts.append(parse_title_query(data))
        more = data.get("continue")
        if not isinstance(more, dict):
            break
        params.update({k: str(v) for k, v in more.items()})
    return merge_title_queries(parts)


def batched_query(titles: list[str], prop: str, get, notes: list[str], workers: int) -> dict[str, Article]:
    unique = list(dict.fromkeys(titles))
    batches = [unique[i:i + 50] for i in range(0, len(unique), 50)]

    def one(batch):
        try:
            return query_titles(batch, prop, get)
        except FetchError as e:
            notes.append(f"Wikipedia {prop} lookup failed for {len(batch)} titles: {e}")
            return {}

    resolved = {}
    for part in parallel(one, batches, workers):
        resolved.update(part)
    return resolved


def resolve_titles(guesses: list[str], get, notes: list[str], workers: int = 4) -> dict[str, Article]:
    """Resolve title guesses to articles, then attach the daily views MediaWiki has so far."""
    resolved = batched_query(guesses, "pageprops|description", get, notes, workers)
    articles = {a.title: a for a in resolved.values()}
    views = batched_query(list(articles), "pageviews", get, notes, workers)
    for title, article in articles.items():
        if title in views:
            article.daily = views[title].daily
    return resolved


# ---------------------------------------------------------------- attention

@dataclass
class Views:
    week: int
    base_week: float

    @property
    def spike(self) -> float:
        return self.week / max(self.base_week, 1.0)

    @property
    def excess(self) -> float:
        return max(self.week - self.base_week, 0.0)

    @property
    def trending(self) -> bool:
        return self.week >= MIN_WEEK_VIEWS and self.spike >= TREND_SPIKE


@dataclass
class Attention:
    article: str
    desktop: Views
    mobile_web: Views
    mobile_app: Views

    @property
    def total(self) -> int:
        return self.desktop.week + self.mobile_web.week + self.mobile_app.week

    @property
    def combined(self) -> Views:
        base = self.desktop.base_week + self.mobile_web.base_week + self.mobile_app.base_week
        return Views(self.total, base)

    @property
    def desktop_ratio(self) -> float:
        return self.desktop.week / max(self.mobile_web.week, 1)


def parse_pageviews(data: dict) -> dict[dt.date, int]:
    daily = {}
    for row in data.get("items") or []:
        if isinstance(row, dict) and isinstance(row.get("views"), int):
            daily[dt.datetime.strptime(row["timestamp"][:8], "%Y%m%d").date()] = row["views"]
    return daily


def summarize(daily: dict[dt.date, int], end: dt.date) -> Views:
    week_start = end - dt.timedelta(days=WINDOW_DAYS - 1)
    base_start = week_start - dt.timedelta(days=BASELINE_DAYS)
    week = [v for d, v in daily.items() if week_start <= d <= end]
    base = [v for d, v in daily.items() if base_start <= d < week_start]
    return Views(
        week=round(sum(week) / len(week) * WINDOW_DAYS) if week else 0,
        base_week=sum(base) / len(base) * WINDOW_DAYS if base else 0.0,
    )


def fetch_pageviews(title: str, access: str, end: dt.date, get) -> dict[dt.date, int]:
    start = end - dt.timedelta(days=WINDOW_DAYS + BASELINE_DAYS - 1)
    url = PAGEVIEWS_API.format(access=access, title=urllib.parse.quote(title.replace(" ", "_"), safe=""),
                               start=start, end=end)
    try:
        return parse_pageviews(fetch_json(url, get))
    except FetchError as e:
        if e.status == 404:
            return {}
        raise


def bot_reason(att: Attention) -> str | None:
    if att.total < BOT_MIN_VIEWS:
        return None
    ratio = att.desktop_ratio
    if ratio > BOT_DESKTOP_RATIO:
        return (f"desktop/mobile-web {ratio:.0f}:1 ({att.desktop.week:,} desktop vs "
                f"{att.mobile_web.week:,} mobile web); human traffic is mostly mobile")
    base_ratio = att.desktop.base_week / max(att.mobile_web.base_week, 1)
    if ratio > 2 and base_ratio > 0 and ratio / base_ratio > BOT_RATIO_JUMP:
        return f"desktop share jumped from {base_ratio:.1f}:1 to {ratio:.1f}:1 against mobile web"
    return None


def recent(daily: dict[dt.date, int]) -> Views:
    return summarize(daily, max(daily)) if daily else Views(0, 0.0)


def score(views: Views, n_feeds: int) -> float:
    """Extra human views this week over the article's usual week, plus a bonus per extra feed."""
    return views.excess * (1 + COVERAGE_BONUS * (n_feeds - 1))


def specificity(article: Article) -> float:
    return 1.0 if " " in article.title else 0.6


# ------------------------------------------------------------------ licences

@dataclass
class Licence:
    status: str
    name: str
    via: str
    url: str


def classify_licence_url(url: str) -> tuple[str, str]:
    match = re.search(r"creativecommons\.org/(licenses|publicdomain)/([a-z-]+)/(\d+(?:\.\d+)?)", url.lower())
    if not match:
        return REJECT, url
    kind, code, version = match.groups()
    if kind == "publicdomain":
        names = {"zero": "CC0", "mark": "Public Domain Mark"}
        return (ACCEPT, f"{names[code]} {version}") if code in names else (REJECT, url)
    name = f"CC {code.upper()} {version}"
    return (ACCEPT if code == "by" else REJECT), name


def crossref_licence(message: dict, today: dt.date) -> Licence:
    entries = [e for e in message.get("license") or []
               if isinstance(e, dict) and e.get("URL") and e.get("content-version") != "tdm"]
    if not entries:
        return Licence(UNKNOWN, "Crossref lists no licence", "Crossref", "")
    rank = {"vor": 0, "am": 1}
    entry = min(entries, key=lambda e: rank.get(e.get("content-version"), 2))
    status, name = classify_licence_url(entry["URL"])
    via = f"Crossref ({entry.get('content-version', 'unspecified')})"
    parts = ((entry.get("start") or {}).get("date-parts") or [[None]])[0]
    if status == ACCEPT and len(parts) == 3 and all(isinstance(p, int) for p in parts):
        start = dt.date(*parts)
        if start > today:
            return Licence(REJECT, f"{name} only from {start.isoformat()}", via, "")
    return Licence(status, name, via, "")


def unpaywall_licence(record: dict) -> Licence:
    locations = [record.get("best_oa_location")] + list(record.get("oa_locations") or [])
    licences = [loc.get("license") for loc in locations if isinstance(loc, dict) and loc.get("license")]
    for lic in licences:
        if lic in UNPAYWALL_OPEN:
            return Licence(ACCEPT, UNPAYWALL_OPEN[lic], "Unpaywall", "")
    if licences:
        return Licence(REJECT, licences[0], "Unpaywall", "")
    return Licence(UNKNOWN, "Unpaywall lists no licence", "Unpaywall", "")


def federal_licence(url: str) -> Licence | None:
    parsed = urllib.parse.urlparse(url)
    host = (parsed.hostname or "").lower().rstrip(".")
    if parsed.scheme not in ("http", "https"):
        return None

    def under(domains):
        return any(host == d or host.endswith("." + d) for d in domains)

    if under(NOT_FEDERAL_WORK):
        return Licence(REJECT, "JPL pages are (c) Caltech, not a US government work", "domain check", url)
    if under(FEDERAL_DOMAINS):
        return Licence(ACCEPT, PUBLIC_DOMAIN, "US federal domain", url)
    return None


def clean_doi(doi: str) -> str:
    return urllib.parse.unquote(doi).rstrip(".,;")


def sciencedaily_sources(page: str) -> tuple[list[str], list[str]]:
    links = []
    start = page.find('id="story_source"')
    if start >= 0:
        end = page.find("</div>", start)
        links = HREF_RE.findall(page[start:end if end > 0 else None])
    dois = []
    start = page.find('id="journal_references"')
    if start >= 0:
        end = page.find("<!-- /journal_references -->", start)
        dois = [clean_doi(d) for d in DOI_RE.findall(page[start:end if end > 0 else None])]
    return list(dict.fromkeys(links)), list(dict.fromkeys(dois))


def eurekalert_dois(page: str) -> list[str]:
    found = re.findall(r'<h4>\s*DOI\s*</h4>\s*<p>\s*<a[^>]*href="https?://(?:dx\.)?doi\.org/([^"]+)"', page)
    return list(dict.fromkeys(clean_doi(d) for d in found))


def doi_licence(doi: str, get, today: dt.date, contact: str | None) -> Licence:
    url = "https://doi.org/" + doi
    try:
        message = fetch_json(CROSSREF_API.format(doi=urllib.parse.quote(doi, safe="/")), get).get("message")
        if not isinstance(message, dict):
            raise FetchError("Crossref response has no message object")
        lic = crossref_licence(message, today)
    except FetchError as e:
        lic = Licence(UNKNOWN, f"Crossref lookup failed: {e}", "Crossref", "")
    if lic.status == UNKNOWN and contact:
        try:
            record = fetch_json(UNPAYWALL_API.format(doi=urllib.parse.quote(doi, safe="/"),
                                                     email=urllib.parse.quote(contact)), get)
            lic = unpaywall_licence(record)
        except FetchError as e:
            lic = Licence(UNKNOWN, f"{lic.name}; Unpaywall lookup failed: {e}", "Unpaywall", "")
    return dataclasses.replace(lic, url=url)


def find_primary_source(items: list[Item], get, today: dt.date,
                        contact: str | None = None) -> tuple[Licence, list[str]]:
    notes, best = [], None
    rank = {s: i for i, s in enumerate(SOURCE_ORDER)}
    for item in sorted(items, key=lambda i: rank.get(i.source, len(rank))):
        lic = federal_licence(item.url)
        if lic and lic.status == ACCEPT:
            return dataclasses.replace(lic, via=f"{item.source} page on a US federal domain"), notes
        if lic:
            notes.append(f"{item.url}: {lic.name}")
            best = best or lic
            continue
        if item.source not in ("ScienceDaily", "EurekAlert"):
            continue
        try:
            page = get(item.url).decode("utf-8", "replace")
        except FetchError as e:
            notes.append(f"{item.url}: page fetch failed ({e})")
            best = best or Licence(UNKNOWN, "source page could not be fetched", item.source, item.url)
            continue
        if item.source == "ScienceDaily":
            links, dois = sciencedaily_sources(page)
            for link in links:
                lic = federal_licence(link)
                if lic and lic.status == ACCEPT:
                    return dataclasses.replace(lic, via="ScienceDaily story source on a US federal domain"), notes
        else:
            dois = eurekalert_dois(page)
        if not dois:
            notes.append(f"{item.url}: no DOI listed")
        for doi in dois:
            lic = doi_licence(doi, get, today, contact)
            notes.append(f"doi {doi}: {lic.status} ({lic.name}, {lic.via})")
            if lic.status == ACCEPT:
                return lic, notes
            if best is None or (best.status == UNKNOWN and lic.status == REJECT):
                best = lic
    return best or Licence(UNKNOWN, "no primary source found", "", ""), notes


# ------------------------------------------------------------------- ranking

@dataclass
class Cluster:
    article: Article
    items: list[Item]
    prelim: Views | None = None
    attention: Attention | None = None
    bot: str | None = None
    licence: Licence | None = None
    notes: list[str] = field(default_factory=list)

    @property
    def feeds(self) -> list[str]:
        return list(dict.fromkeys(i.source for i in self.items))

    @property
    def headline(self) -> str:
        rank = {s: i for i, s in enumerate(SOURCE_ORDER)}
        return min(self.items, key=lambda i: rank.get(i.source, len(rank))).title

    @property
    def score(self) -> float:
        views = self.attention.combined if self.attention else self.prelim
        return score(views, len(self.feeds)) if views else 0.0


def shortlist(clusters: list[Cluster], size: int) -> list[Cluster]:
    ok = [c for c in clusters if c.attention and c.attention.combined.trending and not c.bot
          and c.licence and c.licence.status == ACCEPT]
    return sorted(ok, key=lambda c: c.score, reverse=True)[:size]


def angle(cluster: Cluster) -> str:
    desc = cluster.article.description
    if desc[1:2].islower():
        desc = desc[:1].lower() + desc[1:]
    what = f" ({desc})" if desc else ""
    return (f"How {cluster.article.title}{what} works: open on this week's hook, then show the "
            f"mechanism step by step. (auto-drafted, rewrite before scripting)")


def render_report(today: dt.date, picks: list[Cluster], excluded: list[tuple[Cluster, str]],
                  notes: list[str]) -> str:
    end = today - dt.timedelta(days=1)
    lines = [f"# Scout {today.isoformat()}", "",
             f"Headlines published {(today - dt.timedelta(days=WINDOW_DAYS)).isoformat()} to {today.isoformat()}; "
             f"Wikipedia user pageviews for the 7 days to {end.isoformat()} against the 4 weeks before.",
             "Headlines are only a popularity signal: write every script from the primary source, from scratch.",
             ""]
    if len(picks) < 3:
        lines += [f"**Only {len(picks)} candidate(s) passed the attention and licence filters this week.**", ""]
    for n, c in enumerate(picks, 1):
        att, lic = c.attention, c.licence
        links = "; ".join(f"[{i.title}]({i.url}) ({i.source})" for i in c.items[:4])
        more = f" (+{len(c.items) - 4} more)" if len(c.items) > 4 else ""
        lines += [
            f"## {n}. {c.headline}",
            "",
            f"- **Coverage:** {', '.join(c.feeds)}: {links}{more}",
            f"- **Attention:** Wikipedia [{c.article.title}]({c.article.url}) had {att.total:,} user views "
            f"(desktop {att.desktop.week:,} / mobile web {att.mobile_web.week:,} / app {att.mobile_app.week:,}), "
            f"x{att.combined.spike:.1f} vs its 4-week average, desktop/mobile-web {att.desktop_ratio:.1f}:1; "
            f"score {c.score:,.0f}",
            f"- **Primary source:** {lic.url} ({lic.name}, via {lic.via})",
            f"- **How it works:** {angle(c)}",
            "",
        ]
    if excluded:
        lines += ["## Left out", ""]
        for c, reason in excluded:
            lines.append(f"- {c.headline} ([{c.article.title}]({c.article.url}), score {c.score:,.0f}): {reason}")
        lines.append("")
    if notes:
        lines += ["## Run notes", ""] + [f"- {n}" for n in notes] + [""]
    return "\n".join(lines)


# ---------------------------------------------------------------------- main

def parallel(fn, args: list, workers: int) -> list:
    with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as pool:
        return list(pool.map(fn, args))


def log(message: str) -> None:
    print(message, file=sys.stderr, flush=True)


def run(today: dt.date, size: int, contact: str | None, workers: int, get=fetch) -> tuple[str, list[Cluster]]:
    notes: list[str] = []
    now = dt.datetime.combine(today, dt.time(23, 59, tzinfo=dt.timezone.utc))
    end = today - dt.timedelta(days=1)

    items = collect_items(now, get, notes)
    log(f"{len(items)} headlines in the window")

    guesses = {item.url: item_guesses(item) for item in items}
    resolved = resolve_titles([g for gs in guesses.values() for g in gs], get, notes, workers)
    articles = {a.title: a for a in resolved.values()}
    prelim = {title: recent(a.daily) for title, a in articles.items()}
    log(f"{len(articles)} Wikipedia articles matched, "
        f"{sum(v.trending for v in prelim.values())} trending (x{TREND_SPIKE}+ vs their usual week)")
    if articles and not any(a.daily for a in articles.values()):
        notes.append("MediaWiki returned no pageviews for any article; nothing could be scored")

    clusters: dict[str, Cluster] = {}
    for item in items:
        best, best_score = None, 0.0
        for guess in guesses[item.url]:
            article = resolved.get(guess)
            views = prelim.get(article.title) if article else None
            if not views or not views.trending:
                continue
            s = score(views, 1) * specificity(article)
            if s > best_score:
                best, best_score = article, s
        if best:
            clusters.setdefault(best.title, Cluster(best, [], prelim[best.title])).items.append(item)
    ranked = sorted(clusters.values(), key=lambda c: c.score, reverse=True)[:SPLIT_CLUSTERS]
    log(f"{len(clusters)} trending stories; splitting traffic for the top {len(ranked)}")

    def split(cluster):
        try:
            daily = {a: fetch_pageviews(cluster.article.title, a, end, get)
                     for a in ("desktop", "mobile-web", "mobile-app")}
        except FetchError as e:
            cluster.notes.append(f"traffic split failed: {e}")
            return cluster
        cluster.attention = Attention(cluster.article.title,
                                      *(summarize(daily[a], end) for a in ("desktop", "mobile-web", "mobile-app")))
        cluster.bot = bot_reason(cluster.attention)
        if not cluster.attention.combined.trending:
            cluster.notes.append(f"not trending on the full week (x{cluster.attention.combined.spike:.1f})")
        return cluster

    ranked = sorted(parallel(split, ranked, workers), key=lambda c: c.score, reverse=True)

    accepted, checked = 0, 0
    for cluster in ranked:
        if not cluster.attention or cluster.bot or not cluster.attention.combined.trending:
            continue
        if accepted >= size or checked >= LICENCE_CHECKS:
            break
        checked += 1
        cluster.licence, found = find_primary_source(cluster.items, get, today, contact)
        cluster.notes += found
        accepted += cluster.licence.status == ACCEPT

    picks = shortlist(ranked, size)
    excluded = []
    for c in ranked:
        if c in picks:
            continue
        if c.bot:
            excluded.append((c, f"bot-like traffic: {c.bot}"))
        elif not c.attention or not c.attention.combined.trending:
            excluded.append((c, "; ".join(c.notes) or "no traffic split"))
        elif c.licence and c.licence.status != ACCEPT:
            detail = "; ".join(c.notes[-3:])
            excluded.append((c, f"no open primary source ({c.licence.status}: {c.licence.name})"
                                + (f" [{detail}]" if detail else "")))
    if not contact:
        notes.append("Unpaywall skipped (needs --email or SCOUT_EMAIL); papers were checked with Crossref only")
    return render_report(today, picks, excluded[:12], notes), picks


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--date", type=dt.date.fromisoformat, default=dt.date.today(),
                        help="report date; headlines from the 7 days before it (default: today)")
    parser.add_argument("--size", type=int, default=5, help="shortlist size (default 5)")
    parser.add_argument("--email", default=os.environ.get("SCOUT_EMAIL"),
                        help="contact address for the Unpaywall API (or set SCOUT_EMAIL); omitted = Crossref only")
    parser.add_argument("--workers", type=int, default=8, help="parallel HTTP requests (default 8)")
    parser.add_argument("--out", type=Path, default=ROOT / "out", help="output folder (default out/)")
    args = parser.parse_args(argv)

    report, picks = run(args.date, args.size, args.email, args.workers)
    args.out.mkdir(parents=True, exist_ok=True)
    path = args.out / f"scout-{args.date.isoformat()}.md"
    path.write_text(report)
    log(f"{len(picks)} candidates -> {path}")


if __name__ == "__main__":
    main()
