import datetime as dt
import json
import unittest
from pathlib import Path

import scout

FIXTURES = Path(__file__).resolve().parent / "fixtures" / "scout"
UTC = dt.timezone.utc
TODAY = dt.date(2026, 10, 19)


def fixture(name: str) -> bytes:
    return (FIXTURES / name).read_bytes()


def pageviews(article: str, access: str) -> dict:
    return scout.parse_pageviews(json.loads(fixture(f"pv_{article}_{access}.json")))


def attention(article: str) -> scout.Attention:
    end = dt.date(2026, 10, 18)
    return scout.Attention(
        article=article,
        desktop=scout.summarize(pageviews(article, "desktop"), end),
        mobile_web=scout.summarize(pageviews(article, "mobile-web"), end),
        mobile_app=scout.summarize(pageviews(article, "mobile-app"), end),
    )


class FeedParsingTest(unittest.TestCase):
    def test_rss_items_keep_headline_link_and_date(self):
        items = scout.parse_rss(fixture("sciencedaily.xml"), "ScienceDaily")
        self.assertEqual(len(items), 5)
        self.assertEqual(items[0].title, "Just 3,000 steps a day may help slow Alzheimer's, scientists find")
        self.assertEqual(items[0].url, "https://www.sciencedaily.com/releases/2026/10/261018205058.htm")
        self.assertEqual(items[0].published.date(), TODAY)

    def test_nasa_apod_items_are_dropped(self):
        titles = [i.title for i in scout.parse_rss(fixture("nasa.xml"), "NASA")]
        self.assertIn("Martian Dawn", titles)
        self.assertFalse([t for t in titles if t.startswith("APOD")])

    def test_eurekalert_news_sitemap(self):
        items = scout.parse_news_sitemap(fixture("eurekalert_sitemap.xml"), "EurekAlert")
        self.assertEqual(len(items), 6)
        self.assertEqual(items[0].url, "https://www.eurekalert.org/news-releases/1146030")
        self.assertTrue(items[0].title.startswith("Open databases, more freedom"))
        self.assertIn("Machine learning", items[0].keywords)

    def test_usgs_quake_atom(self):
        items = scout.parse_atom(fixture("usgs_quakes.atom"), "USGS")
        self.assertTrue(items)
        self.assertEqual(items[0].title, "M 5.7 - 48 km WNW of Khuzdar, Pakistan")
        self.assertTrue(items[0].url.startswith("https://earthquake.usgs.gov/earthquakes/eventpage/"))

    def test_rss_tolerates_junk_after_the_document(self):
        body = (b'<?xml version="1.0"?><rss><channel><item><title>T</title><link>https://x/1</link>'
                b'<pubDate>Mon, 19 Oct 2026 07:23:26 EDT</pubDate></item></channel></rss>\n'
                b'<!-- cached Mon, 19 Oct 2026 09:09:40 EDT --> -->')
        self.assertEqual([i.title for i in scout.parse_rss(body, "ScienceDaily")], ["T"])

    def test_window_keeps_only_recent_items(self):
        now = dt.datetime(2026, 10, 19, 12, tzinfo=UTC)
        items = scout.parse_rss(fixture("noaa.xml"), "NOAA")
        kept = scout.in_window(items, now, days=7)
        self.assertIn("El Nino looms large over U.S. Winter Outlook", [i.title for i in kept])
        self.assertNotIn("NOAA to issue 2026-2027 U.S. Winter Outlook October 15", [i.title for i in kept])


class TitleGuessTest(unittest.TestCase):
    def test_guesses_skip_stopwords_and_numbers(self):
        guesses = scout.title_guesses("Just 3,000 steps a day may help slow Alzheimer's, scientists find")
        self.assertIn("Alzheimer's", guesses)
        self.assertNotIn("Just", guesses)
        self.assertNotIn("3,000", guesses)
        self.assertNotIn("a day", guesses)

    def test_longer_phrases_come_first(self):
        guesses = scout.title_guesses("NASA Satellites Observe Historic 2026 El Niño")
        self.assertIn("El Niño", guesses)
        self.assertLess(guesses.index("El Niño"), guesses.index("Niño"))

    def test_quake_headline_guesses_the_event_article(self):
        item = scout.Item("USGS", "M 5.7 - 48 km WNW of Khuzdar, Pakistan", "u",
                          dt.datetime(2026, 10, 17, tzinfo=UTC))
        guesses = scout.item_guesses(item)
        self.assertEqual(guesses[0], "2026 Khuzdar earthquake")
        self.assertIn("2026 Pakistan earthquake", guesses)

    def test_subject_keywords_are_not_guesses(self):
        item = scout.Item("EurekAlert", "New monolithic ion trap developed for accessible quantum simulations", "u",
                          dt.datetime(2026, 10, 15, tzinfo=UTC), ["Epidemiology"])
        self.assertNotIn("Epidemiology", scout.item_guesses(item))
        self.assertIn("ion trap", scout.item_guesses(item))

    def test_resolve_follows_redirects_and_drops_missing_and_disambiguation(self):
        resolved = scout.parse_title_query(json.loads(fixture("mediawiki_titles.json")))
        self.assertEqual(resolved["Alzheimer's"].title, "Alzheimer's disease")
        self.assertEqual(resolved["El Niño"].title, "El Niño–Southern Oscillation")
        self.assertEqual(resolved["Tsunami"].description, "Series of water waves")
        self.assertNotIn("Monster tsunami", resolved)
        self.assertNotIn("Step", resolved)

    def test_title_query_pageviews_skip_days_not_published_yet(self):
        data = {"query": {"pages": [{"ns": 0, "title": "Tsunami", "pageviews": {
            "2026-10-14": 1016, "2026-10-15": 1100, "2026-10-16": None}}]}}
        article = scout.parse_title_query(data)["Tsunami"]
        self.assertEqual(article.daily, {dt.date(2026, 10, 14): 1016, dt.date(2026, 10, 15): 1100})

    def test_continued_title_queries_merge_pageviews(self):
        first = scout.parse_title_query({"query": {
            "redirects": [{"from": "El Niño", "to": "ENSO"}],
            "pages": [{"ns": 0, "title": "ENSO", "description": "climate", "pageviews": {"2026-10-14": 5}}]}})
        second = scout.parse_title_query({"query": {
            "pages": [{"ns": 0, "title": "ENSO", "pageviews": {"2026-10-15": 7}}]}})
        merged = scout.merge_title_queries([first, second])
        self.assertIs(merged["El Niño"], merged["ENSO"])
        self.assertEqual(merged["ENSO"].daily, {dt.date(2026, 10, 14): 5, dt.date(2026, 10, 15): 7})
        self.assertEqual(merged["ENSO"].description, "climate")


class ScoringTest(unittest.TestCase):
    def test_summarize_splits_week_from_baseline(self):
        views = scout.summarize(pageviews("Limonene", "desktop"), dt.date(2026, 10, 18))
        self.assertEqual(views.week, 483764)
        self.assertAlmostEqual(views.base_week, 409758, delta=1)

    def test_summarize_scales_gappy_days_to_a_full_week(self):
        daily = {dt.date(2026, 10, 18): 700, dt.date(2026, 10, 10): 100}
        views = scout.summarize(daily, dt.date(2026, 10, 18))
        self.assertEqual(views.week, 4900)
        self.assertEqual(views.base_week, 700)

    def test_limonene_desktop_spike_is_flagged_as_bots(self):
        att = attention("Limonene")
        self.assertEqual(att.total, 487014)
        self.assertEqual(att.mobile_web.week, 2828)
        reason = scout.bot_reason(att)
        self.assertIsNotNone(reason)
        self.assertIn("desktop", reason)

    def test_human_traffic_passes(self):
        self.assertIsNone(scout.bot_reason(attention("El_Nino-Southern_Oscillation")))

    def test_desktop_share_jump_is_flagged_even_below_the_absolute_ratio(self):
        att = scout.Attention(
            "X",
            desktop=scout.Views(week=40000, base_week=5000),
            mobile_web=scout.Views(week=10000, base_week=10000),
            mobile_app=scout.Views(week=500, base_week=500),
        )
        self.assertIn("jumped", scout.bot_reason(att))

    def test_small_articles_are_not_bot_checked(self):
        att = scout.Attention(
            "X",
            desktop=scout.Views(week=900, base_week=100),
            mobile_web=scout.Views(week=0, base_week=0),
            mobile_app=scout.Views(week=0, base_week=0),
        )
        self.assertIsNone(scout.bot_reason(att))

    def test_score_is_extra_views_over_the_usual_week(self):
        self.assertEqual(scout.score(scout.Views(week=10000, base_week=2500), 1), 7500)
        self.assertEqual(scout.score(scout.Views(week=10000, base_week=10000), 1), 0)
        self.assertEqual(scout.score(scout.Views(week=5000, base_week=8000), 1), 0)
        self.assertEqual(scout.score(scout.Views(week=10000, base_week=0), 1), 10000)

    def test_score_rewards_coverage_across_feeds(self):
        views = scout.Views(week=10000, base_week=2500)
        self.assertGreater(scout.score(views, 3), scout.score(views, 1))

    def test_trending_needs_a_spike_and_real_volume(self):
        self.assertTrue(scout.Views(week=3000, base_week=1500).trending)
        self.assertFalse(scout.Views(week=300000, base_week=270000).trending)
        self.assertFalse(scout.Views(week=400, base_week=10).trending)
        self.assertTrue(scout.Views(week=900, base_week=0).trending)

    def test_recent_uses_the_latest_day_the_api_has(self):
        daily = {dt.date(2026, 10, 15): 700, dt.date(2026, 10, 1): 100}
        self.assertEqual(scout.recent(daily), scout.Views(week=4900, base_week=700))
        self.assertEqual(scout.recent({}), scout.Views(0, 0.0))


class LicenceFilterTest(unittest.TestCase):
    def crossref(self, name: str) -> scout.Licence:
        message = json.loads(fixture(name))["message"]
        return scout.crossref_licence(message, TODAY)

    def test_cc_by_vor_is_accepted_and_tdm_entries_ignored(self):
        lic = self.crossref("crossref_10_1016_j_oneear_2026_101863.json")
        self.assertEqual(lic.status, scout.ACCEPT)
        self.assertEqual(lic.name, "CC BY 4.0")
        self.assertIn("vor", lic.via)

    def test_nc_nd_is_rejected(self):
        lic = self.crossref("crossref_10_1002_trc2_70069.json")
        self.assertEqual(lic.status, scout.REJECT)
        self.assertEqual(lic.name, "CC BY-NC-ND 4.0")

    def test_publisher_licence_is_rejected(self):
        lic = self.crossref("crossref_10_1038_d41586-025-03596-2.json")
        self.assertEqual(lic.status, scout.REJECT)

    def test_missing_licence_is_unknown_not_rejected(self):
        lic = self.crossref("crossref_10_18632_oncoscience_672.json")
        self.assertEqual(lic.status, scout.UNKNOWN)

    def test_future_cc_by_start_is_rejected_as_embargoed(self):
        message = {"license": [{"content-version": "vor", "URL": "https://creativecommons.org/licenses/by/4.0/",
                                "start": {"date-parts": [[2027, 1, 1]]}}]}
        lic = scout.crossref_licence(message, TODAY)
        self.assertEqual(lic.status, scout.REJECT)
        self.assertIn("2027-01-01", lic.name)

    def test_licence_urls(self):
        cases = {
            "http://creativecommons.org/licenses/by/4.0/": (scout.ACCEPT, "CC BY 4.0"),
            "https://creativecommons.org/licenses/by/3.0/igo/": (scout.ACCEPT, "CC BY 3.0"),
            "https://creativecommons.org/publicdomain/zero/1.0/": (scout.ACCEPT, "CC0 1.0"),
            "https://creativecommons.org/publicdomain/mark/1.0/": (scout.ACCEPT, "Public Domain Mark 1.0"),
            "https://creativecommons.org/licenses/by-sa/4.0/": (scout.REJECT, "CC BY-SA 4.0"),
            "https://creativecommons.org/licenses/by-nc/4.0/": (scout.REJECT, "CC BY-NC 4.0"),
            "https://creativecommons.org/licenses/by-nd/4.0/": (scout.REJECT, "CC BY-ND 4.0"),
            "https://www.elsevier.com/tdm/userlicense/1.0/": (scout.REJECT, "https://www.elsevier.com/tdm/userlicense/1.0/"),
        }
        for url, expected in cases.items():
            self.assertEqual(scout.classify_licence_url(url), expected, url)

    def test_unpaywall_licence(self):
        record = {"best_oa_location": {"license": "cc-by-nc"},
                  "oa_locations": [{"license": "cc-by-nc"}, {"license": "cc-by"}]}
        self.assertEqual(scout.unpaywall_licence(record).status, scout.ACCEPT)
        self.assertEqual(scout.unpaywall_licence({"oa_locations": [{"license": "cc-by-sa"}]}).status, scout.REJECT)
        self.assertEqual(scout.unpaywall_licence({"oa_locations": []}).status, scout.UNKNOWN)

    def test_federal_domains(self):
        self.assertEqual(scout.federal_licence("https://science.nasa.gov/earth/x").status, scout.ACCEPT)
        self.assertEqual(scout.federal_licence("https://www.cpc.ncep.noaa.gov/products/").status, scout.ACCEPT)
        self.assertEqual(scout.federal_licence("https://earthquake.usgs.gov/e/1").status, scout.ACCEPT)
        self.assertEqual(scout.federal_licence("https://www.nih.gov/news-events/x").status, scout.ACCEPT)
        self.assertEqual(scout.federal_licence("https://www.jpl.nasa.gov/news/x").status, scout.REJECT)
        self.assertIsNone(scout.federal_licence("https://nasa.gov.example.com/x"))
        self.assertIsNone(scout.federal_licence("https://notnasa.gov/x"))
        self.assertIsNone(scout.federal_licence("https://www.sciencedaily.com/x"))


class SourceExtractionTest(unittest.TestCase):
    def test_sciencedaily_dois_come_from_the_journal_reference_only(self):
        links, dois = scout.sciencedaily_sources(fixture("sciencedaily_story.html").decode())
        self.assertEqual(dois, ["10.1038/d41586-025-03596-2"])
        self.assertEqual(links, [
            "https://theconversation.com/even-a-few-thousand-steps-a-day-can-reduce-your-risk-of-alzheimers-new-study-269020",
            "https://theconversation.com/",
        ])

    def test_sciencedaily_federal_story_source(self):
        html = ('<div id="story_source"><p><a href="https://www.nasa.gov/missions/x/">Materials</a> '
                'provided by <a href="https://www.nasa.gov/"><strong>NASA</strong></a>.</p></div>')
        links, dois = scout.sciencedaily_sources(html)
        self.assertEqual(links, ["https://www.nasa.gov/missions/x/", "https://www.nasa.gov/"])
        self.assertEqual(dois, [])

    def test_eurekalert_doi(self):
        self.assertEqual(scout.eurekalert_dois(fixture("eurekalert_release.html").decode()),
                         ["10.1016/j.oneear.2026.101863"])

    def test_primary_source_walks_items_until_an_open_licence(self):
        pages = {
            "https://www.sciencedaily.com/s": fixture("sciencedaily_story.html"),
            "https://www.eurekalert.org/news-releases/1": fixture("eurekalert_release.html"),
            "https://api.crossref.org/works/10.1038/d41586-025-03596-2": fixture("crossref_10_1038_d41586-025-03596-2.json"),
            "https://api.crossref.org/works/10.1016/j.oneear.2026.101863": fixture("crossref_10_1016_j_oneear_2026_101863.json"),
        }
        now = dt.datetime(2026, 10, 18, tzinfo=UTC)
        items = [scout.Item("ScienceDaily", "a", "https://www.sciencedaily.com/s", now),
                 scout.Item("EurekAlert", "b", "https://www.eurekalert.org/news-releases/1", now)]
        lic, notes = scout.find_primary_source(items, pages.__getitem__, TODAY)
        self.assertEqual(lic.status, scout.ACCEPT)
        self.assertEqual(lic.url, "https://doi.org/10.1016/j.oneear.2026.101863")
        self.assertTrue(any("10.1038/d41586-025-03596-2" in n for n in notes))

    def test_federal_item_needs_no_lookup(self):
        def no_fetch(url):
            raise AssertionError(url)
        item = scout.Item("NOAA", "El Nino looms large", "https://www.noaa.gov/news-release/x",
                          dt.datetime(2026, 10, 14, tzinfo=UTC))
        lic, _ = scout.find_primary_source([item], no_fetch, TODAY)
        self.assertEqual(lic.status, scout.ACCEPT)
        self.assertEqual(lic.url, "https://www.noaa.gov/news-release/x")

    def test_lookup_failure_is_unknown_with_the_error(self):
        def failing(url):
            raise scout.FetchError(f"{url}: timed out")
        item = scout.Item("EurekAlert", "b", "https://www.eurekalert.org/news-releases/1",
                          dt.datetime(2026, 10, 14, tzinfo=UTC))
        lic, notes = scout.find_primary_source([item], failing, TODAY)
        self.assertEqual(lic.status, scout.UNKNOWN)
        self.assertIn("timed out", " ".join(notes))


class ShortlistTest(unittest.TestCase):
    def cluster(self, article, week, base, status, feeds=("ScienceDaily",)):
        now = dt.datetime(2026, 10, 18, tzinfo=UTC)
        items = [scout.Item(f, f"{article} headline", f"https://example.org/{article}/{f}", now) for f in feeds]
        c = scout.Cluster(scout.Article(article, "desc"), items)
        c.attention = scout.Attention(article, scout.Views(week, base), scout.Views(week, base), scout.Views(0, 0))
        c.licence = scout.Licence(status, "CC BY 4.0", "test", "https://doi.org/x")
        return c

    def test_shortlist_keeps_trending_accepted_stories_by_score(self):
        clusters = [
            self.cluster("Flat", 50000, 50000, scout.ACCEPT),
            self.cluster("Mild", 30000, 15000, scout.ACCEPT),
            self.cluster("Spike", 50000, 10000, scout.ACCEPT),
            self.cluster("Closed", 90000, 10000, scout.REJECT),
        ]
        shortlist = scout.shortlist(clusters, size=5)
        self.assertEqual([c.article.title for c in shortlist], ["Spike", "Mild"])
        self.assertEqual(scout.shortlist(clusters, size=1)[0].article.title, "Spike")

    def test_bot_clusters_never_make_the_shortlist(self):
        c = self.cluster("Spike", 50000, 10000, scout.ACCEPT)
        c.bot = "desktop/mobile-web 171:1"
        self.assertEqual(scout.shortlist([c], size=5), [])

    def test_report_lists_each_field(self):
        c = self.cluster("Spike", 50000, 10000, scout.ACCEPT, feeds=("NASA", "ScienceDaily"))
        text = scout.render_report(TODAY, [c], excluded=[], notes=["feed X failed: boom"])
        self.assertIn("# Scout 2026-10-19", text)
        self.assertIn("Spike headline", text)
        self.assertIn("100,000 user views", text)
        self.assertIn("https://doi.org/x", text)
        self.assertIn("CC BY 4.0", text)
        self.assertIn("How it works", text)
        self.assertIn("feed X failed: boom", text)


if __name__ == "__main__":
    unittest.main()
