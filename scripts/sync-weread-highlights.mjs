import fs from "node:fs/promises";

const API_URL = "https://i.weread.qq.com/api/agent/gateway";
const SKILL_VERSION = "1.0.3";
const OUTPUT_PATH = new URL("../highlights.json", import.meta.url);
const WEREAD_API_KEY = process.env.WEREAD_API_KEY;
const MAX_BOOKS = Number(process.env.WEREAD_MAX_BOOKS || 50);
const MAX_HIGHLIGHTS = Number(process.env.WEREAD_MAX_HIGHLIGHTS || 300);

if (!WEREAD_API_KEY) {
  throw new Error("Missing WEREAD_API_KEY. Add it as a GitHub Actions secret before running sync.");
}

async function weread(apiName, params = {}) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${WEREAD_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      api_name: apiName,
      skill_version: SKILL_VERSION,
      ...params
    })
  });

  if (!response.ok) {
    throw new Error(`WeRead request failed: ${apiName} ${response.status}`);
  }

  const data = await response.json();
  if (data.upgrade_info) {
    throw new Error(`WeRead skill upgrade required: ${data.upgrade_info.message || JSON.stringify(data.upgrade_info)}`);
  }
  if (data.errcode && data.errcode !== 0) {
    throw new Error(`WeRead API error: ${apiName} ${data.errcode} ${data.errmsg || ""}`);
  }
  return data;
}

async function getNotebooks() {
  const books = [];
  let lastSort;

  while (books.length < MAX_BOOKS) {
    const payload = { count: Math.min(100, MAX_BOOKS - books.length) };
    if (lastSort) {
      payload.lastSort = lastSort;
    }

    const data = await weread("/user/notebooks", payload);
    const pageBooks = data.books || [];
    books.push(...pageBooks);

    if (!data.hasMore || !pageBooks.length) {
      break;
    }
    lastSort = pageBooks[pageBooks.length - 1].sort;
  }

  return books.filter((item) => item.noteCount > 0);
}

function chapterTitle(chapters = [], chapterUid) {
  const chapter = chapters.find((item) => String(item.chapterUid) === String(chapterUid));
  return chapter ? chapter.title : "";
}

function normalizeHighlight(bookItem, bookmark, chapters) {
  const book = bookItem.book || {};
  return {
    id: bookmark.bookmarkId,
    text: String(bookmark.markText || "").trim(),
    bookId: bookmark.bookId || bookItem.bookId,
    bookTitle: book.title || "",
    author: book.author || "",
    chapter: chapterTitle(chapters, bookmark.chapterUid),
    chapterUid: bookmark.chapterUid || null,
    range: bookmark.range || "",
    createdAt: bookmark.createTime ? new Date(bookmark.createTime * 1000).toISOString() : null
  };
}

async function getHighlights() {
  const notebooks = await getNotebooks();
  const highlights = [];

  for (const bookItem of notebooks) {
    const bookId = bookItem.bookId;
    if (!bookId) {
      continue;
    }

    const data = await weread("/book/bookmarklist", { bookId });
    const chapters = data.chapters || [];
    const items = data.updated || [];

    for (const bookmark of items) {
      const highlight = normalizeHighlight(bookItem, bookmark, chapters);
      if (highlight.text) {
        highlights.push(highlight);
      }
    }

    if (highlights.length >= MAX_HIGHLIGHTS) {
      break;
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  return highlights
    .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")))
    .slice(0, MAX_HIGHLIGHTS);
}

const highlights = await getHighlights();
const payload = {
  generatedAt: new Date().toISOString(),
  source: "weread",
  count: highlights.length,
  highlights
};

await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log(`Synced ${highlights.length} WeRead highlights to highlights.json`);
