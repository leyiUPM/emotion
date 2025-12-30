"use client";

import { useMemo, useState } from "react";
import { Activity, BarChart3, Filter, RefreshCcw, Trash2 } from "lucide-react";
import { Card, CardBody, CardHeader, Chip, Container, Pill } from "@/components/ui";
import { Tabs, type TabKey } from "@/components/tabs";
import { DistributionBar, TrendLines } from "@/components/charts";
import { usePredictionStore } from "@/lib/store";
import type { Prediction, LabelScore } from "@/lib/types";
import { emotionDistribution, mean, rollingTrend, topEmotions } from "@/lib/stats";

function scorePill(x: LabelScore) {
  return (
    <Pill key={x.label}>
      {x.label}&nbsp;<span className="font-semibold text-slate-100">{x.score.toFixed(2)}</span>
    </Pill>
  );
}

export default function Page() {
  const [tab, setTab] = useState<TabKey>("analyze");
  const store = usePredictionStore();

  const [error, setError] = useState<string>("");

  // Analyze state
  const [text, setText] = useState<string>(
    "I love the new features, but the rollout was messy and communication was disappointing."
  );
  const [batchText, setBatchText] = useState<string>(
    [
      "The support team solved my issue quickly. Thank you!",
      "This update broke my workflow. I'm frustrated.",
      "The product is okay, nothing special.",
    ].join("\n")
  );
  const [threshold, setThreshold] = useState<number>(0.5);
  const [topK, setTopK] = useState<number>(5);
  const [running, setRunning] = useState<boolean>(false);
  const [last, setLast] = useState<Prediction | null>(null);

  async function callPredict(t: string): Promise<Prediction> {
    const r = await fetch("/api/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: t, threshold, top_k: topK }),
    });
    const j = await r.json();
    const ended = performance.now();

    if (!j.ok) {
      throw new Error(j.error || "Prediction failed");
    }

    const data = j.data as {
      labels_over_threshold: LabelScore[];
      top: LabelScore[];
      threshold: number;
      text: string;
    };

    return {
      id: crypto.randomUUID(),
      text: data.text,
      createdAt: Date.now(),
      threshold: data.threshold,
      labelsOverThreshold: data.labels_over_threshold,
      top: data.top,
    };
  }

  async function runSingle() {
    setRunning(true);
    setError("");
    try {
      const p = await callPredict(text);
      setLast(p);
      store.add(p);
    } catch (e: any) {
      setError(e?.message || "Prediction failed. Make sure the backend is running on port 8000.");
    } finally {
      setRunning(false);
    }
  }

  async function runBatch() {
    const lines = batchText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    if (lines.length === 0) return;

    setRunning(true);
    setError("");
    try {
      const out: Prediction[] = [];
      for (const line of lines) {
        // sequential keeps it simple and avoids flooding the backend
        const p = await callPredict(line);
        out.push(p);
      }
      store.addMany(out);
      setLast(out[0] || null);
      setTab("dashboard");
    } catch (e: any) {
      setError(e?.message || "Batch failed. Make sure the backend is running on port 8000.");
    } finally {
      setRunning(false);
    }
  }

  const topEmotionCounts = useMemo(() => topEmotions(store.items, 6), [store.items]);
  const distribution = useMemo(() => emotionDistribution(store.items).slice(0, 12), [store.items]);
  const trendLabels = useMemo(() => topEmotionCounts.map((x) => x.label), [topEmotionCounts]);
  const trendData = useMemo(() => rollingTrend(store.items, trendLabels, 10), [store.items, trendLabels]);

  const strongShare = useMemo(() => {
    if (store.items.length === 0) return 0;
    const hasAny = store.items.filter((p) => p.labelsOverThreshold.length > 0).length;
    return (hasAny / store.items.length) * 100;
  }, [store.items]);

  const avgDetected = useMemo(() => {
    if (store.items.length === 0) return 0;
    return mean(store.items.map((p) => p.labelsOverThreshold.length));
  }, [store.items]);

  // Explore state
  const [query, setQuery] = useState<string>("");
  const [emotion, setEmotion] = useState<string>("");
  const [minScore, setMinScore] = useState<number>(0.5);
  const [sort, setSort] = useState<"newest" | "highest">("newest");

  const explored = useMemo(() => {
    let rows = [...store.items];

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      rows = rows.filter((p) => p.text.toLowerCase().includes(q));
    }

    if (emotion.trim()) {
      const e = emotion.trim();
      rows = rows.filter((p) => p.labelsOverThreshold.some((x) => x.label === e && x.score >= minScore));
    }

    if (sort === "newest") rows.sort((a, b) => b.createdAt - a.createdAt);
    else {
      rows.sort((a, b) => {
        const aMax = Math.max(...a.labelsOverThreshold.map((x) => x.score), 0);
        const bMax = Math.max(...b.labelsOverThreshold.map((x) => x.score), 0);
        return bMax - aMax;
      });
    }

    return rows;
  }, [store.items, query, emotion, minScore, sort]);

  const uniqueLabels = useMemo(() => {
    const set = new Set<string>();
    for (const p of store.items) for (const l of p.top) set.add(l.label);
    return [...set].sort();
  }, [store.items]);

  return (
    <Container>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-2xl font-semibold tracking-tight">Emotion Insight</div>
            <div className="mt-1 text-sm text-slate-400">
              Made by Group 11. Fine-tuned ELECTRA on GoEmotions dataset.
            </div>
          </div>
        </div>

        <Tabs value={tab} onChange={setTab} />

        {tab === "analyze" ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader
                title="Analyze feedback"
                subtitle="Run emotion detection on a single comment, or batch multiple lines"
                right={<Activity className="h-4 w-4 text-slate-300" />}
              />
              <CardBody className="space-y-5">
                <div>
                  <div className="text-xs font-semibold text-slate-300">Single comment</div>
                  <textarea
                    className="mt-2 h-32 w-full rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-sm text-slate-100 outline-none focus:border-slate-600"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                  />
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2 text-xs text-slate-300">
                      Threshold
                      <input
                        type="number"
                        step={0.05}
                        min={0}
                        max={1}
                        className="w-20 rounded-lg border border-slate-800 bg-slate-950/40 px-2 py-1 text-slate-100"
                        value={threshold}
                        onChange={(e) => setThreshold(Number(e.target.value))}
                      />
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-300">
                      Top K
                      <input
                        type="number"
                        step={1}
                        min={1}
                        max={20}
                        className="w-20 rounded-lg border border-slate-800 bg-slate-950/40 px-2 py-1 text-slate-100"
                        value={topK}
                        onChange={(e) => setTopK(Number(e.target.value))}
                      />
                    </label>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      disabled={running}
                      onClick={runSingle}
                      className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 disabled:opacity-50"
                    >
                      <RefreshCcw className="h-4 w-4" />
                      Run
                    </button>
                    <button
                      disabled={running}
                      onClick={() => setText("")}
                      className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-200 disabled:opacity-50"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-5">
                  <div className="text-xs font-semibold text-slate-300">Batch (one comment per line)</div>
                  <textarea
                    className="mt-2 h-32 w-full rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-sm text-slate-100 outline-none focus:border-slate-600"
                    value={batchText}
                    onChange={(e) => setBatchText(e.target.value)}
                  />
                  <div className="mt-3 flex gap-2">
                    <button
                      disabled={running}
                      onClick={runBatch}
                      className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 disabled:opacity-50"
                    >
                      Process batch
                    </button>
                    <button
                      disabled={running}
                      onClick={() => setBatchText("")}
                      className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-200 disabled:opacity-50"
                    >
                      Clear
                    </button>
                    <button
                      disabled={running}
                      onClick={store.clear}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-200 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Clear history
                    </button>
                  </div>
                </div>

                {error ? (
                  <div className="rounded-xl border border-amber-800/50 bg-amber-950/20 p-3 text-sm text-amber-200">
                    {error}
                  </div>
                ) : null}
              </CardBody>
            </Card>

            <Card>
              <CardHeader
                title="Result"
                subtitle={last ? `Threshold ${last.threshold}` : "Run a prediction to see the output"}
                right={<BarChart3 className="h-4 w-4 text-slate-300" />}
              />
              <CardBody>
                {last ? (
                  <div className="space-y-5">
                    <div>
                      <div className="text-xs font-semibold text-slate-300">Comment</div>
                      <div className="mt-2 rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-sm text-slate-100">
                        {last.text}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-slate-300">Detected emotions (over threshold)</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {last.labelsOverThreshold.length > 0 ? (
                          last.labelsOverThreshold.map(scorePill)
                        ) : (
                          <div className="text-sm text-slate-400">None above threshold. Check Top K below.</div>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-slate-300">Top K</div>
                      <div className="mt-2 flex flex-wrap gap-2">{last.top.map(scorePill)}</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-slate-400">
                    No results yet. Use the Analyze panel to run a comment through the model.
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        ) : null}

        {tab === "dashboard" ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader title="Total processed" right={<Activity className="h-4 w-4 text-slate-300" />} />
                <CardBody>
                  <div className="text-3xl font-semibold">{store.items.length}</div>
                  <div className="mt-1 text-xs text-slate-400">Stored in local browser history</div>
                </CardBody>
              </Card>
              <Card>
                <CardHeader title="Most common emotions" right={<BarChart3 className="h-4 w-4 text-slate-300" />} />
                <CardBody>
                  <div className="text-3xl font-semibold">
                    {topEmotionCounts.length ? topEmotionCounts.map((x) => x.label).slice(0, 2).join(", ") : "—"}
                  </div>
                  <div className="mt-1 text-xs text-slate-400">Detected over threshold</div>
                </CardBody>
              </Card>
              <Card>
                <CardHeader title="Emotion Over Threshold" right={<BarChart3 className="h-4 w-4 text-slate-300" />} />
                <CardBody>
                  <div className="text-3xl font-semibold">{store.items.length ? `${strongShare.toFixed(0)}%` : "—"}</div>
                  <div className="mt-1 text-xs text-slate-400">Comments with ≥1 label over threshold</div>
                </CardBody>
              </Card>
              <Card>
                <CardHeader title="Avg emotions per comment" right={<Activity className="h-4 w-4 text-slate-300" />} />
                <CardBody>
                  <div className="text-3xl font-semibold">{store.items.length ? avgDetected.toFixed(1) : "—"}</div>
                  <div className="mt-1 text-xs text-slate-400">Count of labels over threshold</div>
                </CardBody>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader title="Emotion distribution" subtitle="Count of labels appearing in Top K" />
                <CardBody>
                  {distribution.length ? (
                    <DistributionBar data={distribution} />
                  ) : (
                    <div className="text-sm text-slate-400">Run a batch to populate charts.</div>
                  )}
                </CardBody>
              </Card>

              <Card>
                <CardHeader title="Emotion trend" subtitle="Rolling window of detected emotions" />
                <CardBody>
                  {trendData.length && trendLabels.length ? (
                    <TrendLines data={trendData} labels={trendLabels} />
                  ) : (
                    <div className="text-sm text-slate-400">Run a batch to see trends.</div>
                  )}
                </CardBody>
              </Card>
            </div>

            <Card>
              <CardHeader title="Quick insights" subtitle="Simple summary from recent predictions" />
              <CardBody>
                {store.items.length ? (
                  <div className="space-y-2 text-sm text-slate-200">
                    <div>
                      Most frequent (detected over threshold):{" "}
                      <span className="font-semibold">
                        {topEmotionCounts.length ? topEmotionCounts.map((x) => x.label).join(", ") : "—"}
                      </span>
                    </div>
                    <div className="text-slate-400">
                      Tip: adjust threshold in Analyze to control precision vs recall for multi-label output.
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-slate-400">No data yet. Start in Analyze.</div>
                )}
              </CardBody>
            </Card>
          </div>
        ) : null}

        {tab === "explore" ? (
          <div className="space-y-6">
            <Card>
              <CardHeader title="Filter & search feedback" right={<Filter className="h-4 w-4 text-slate-300" />} />
              <CardBody>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                  <div className="md:col-span-2">
                    <div className="text-xs font-semibold text-slate-300">Keyword</div>
                    <input
                      className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm outline-none focus:border-slate-600"
                      placeholder="Search comment text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-300">Emotion</div>
                    <select
                      className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm outline-none focus:border-slate-600"
                      value={emotion}
                      onChange={(e) => setEmotion(e.target.value)}
                    >
                      <option value="">All</option>
                      {uniqueLabels.map((l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-300">Min score</div>
                    <input
                      type="number"
                      step={0.05}
                      min={0}
                      max={1}
                      className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm outline-none focus:border-slate-600"
                      value={minScore}
                      onChange={(e) => setMinScore(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <label className="text-xs text-slate-300">Sort</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSort("newest")}
                      className={
                        sort === "newest"
                          ? "rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-900"
                          : "rounded-xl border border-slate-700 px-3 py-1.5 text-xs text-slate-200"
                      }
                    >
                      Newest
                    </button>
                    <button
                      onClick={() => setSort("highest")}
                      className={
                        sort === "highest"
                          ? "rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-900"
                          : "rounded-xl border border-slate-700 px-3 py-1.5 text-xs text-slate-200"
                      }
                    >
                      Highest emotion
                    </button>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader
                title="Results"
                subtitle={store.items.length ? `${explored.length} / ${store.items.length} comments` : "No data yet"}
              />
              <CardBody>
                {explored.length ? (
                  <div className="space-y-3">
                    {explored.slice(0, 20).map((p) => (
                      <div key={p.id} className="rounded-2xl border border-slate-800 bg-slate-950/30 p-4">
                        <div className="text-sm text-slate-100">{p.text}</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {p.labelsOverThreshold.length ? (
                            p.labelsOverThreshold.slice(0, 6).map(scorePill)
                          ) : (
                            <span className="text-xs text-slate-400">No labels over threshold</span>
                          )}
                        </div>
                      </div>
                    ))}
                    {explored.length > 20 ? (
                      <div className="text-xs text-slate-400">Showing first 20 results.</div>
                    ) : null}
                  </div>
                ) : (
                  <div className="text-sm text-slate-400">
                    No matches. Try removing filters, or run a batch first.
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        ) : null}

      </div>
    </Container>
  );
}
