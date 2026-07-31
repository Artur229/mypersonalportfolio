import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the complete portfolio", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Arthur Timoshenko — Product Developer<\/title>/i);
  assert.match(html, /I turn ideas into/);
  assert.match(html, /Luxury Eats/);
  assert.match(html, /AI Study Planner/);
  assert.match(html, /Jojo Shop/);
  assert.match(html, /action="\/api\/contact"/);
});

test("keeps project videos lazy and provides balanced fallbacks", async () => {
  const response = await render();
  const html = await response.text();
  const videoTags = html.match(/<video\b[^>]*>/gi) ?? [];

  assert.equal(videoTags.length, 3);
  for (const videoTag of videoTags) {
    assert.match(videoTag, /preload="none"/);
    assert.match(videoTag, /poster="\/media\/.+\.webp"/);
    assert.match(videoTag, /data-balanced-source="\/media\/.+-balanced\.mp4"/);
    assert.doesNotMatch(videoTag, /\ssrc=/);
  }

  const pageSource = await readFile(
    new URL("../app/page.tsx", import.meta.url),
    "utf8",
  );
  assert.match(pageSource, /type ExperienceMode = "full" \| "balanced" \| "light"/);
  assert.match(pageSource, /navigator\.hardwareConcurrency/);
  assert.match(pageSource, /connection\?\.saveData/);
  assert.match(pageSource, /new IntersectionObserver/);

  await Promise.all([
    access(new URL("../public/media/luxury-eats-balanced.mp4", import.meta.url)),
    access(
      new URL("../public/media/ai-study-planner-balanced.mp4", import.meta.url),
    ),
    access(new URL("../public/media/jojo-shop-balanced.mp4", import.meta.url)),
  ]);
});
