"use client";

import { useCallback, useEffect, useState } from "react";
import { TOOLS } from "@/lib/catalog";
import { api, type ClientJob } from "@/lib/client";
import { JobCard } from "@/components/job-card";
import { Button, Chips } from "@/components/ui";

const FILTERS = [{ id: "", label: "Tất cả" }, ...TOOLS.map((t) => ({ id: t.id as string, label: t.short }))];
const PAGE = 18;

export default function GalleryPage() {
  const [type, setType] = useState("");
  const [jobs, setJobs] = useState<ClientJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(false);

  const load = useCallback(
    async (before?: number) => {
      setLoading(true);
      const qs = new URLSearchParams({ limit: String(PAGE) });
      if (type) qs.set("type", type);
      if (before) qs.set("before", String(before));
      try {
        const r = await api<{ jobs: ClientJob[] }>(`/api/jobs?${qs}`);
        setJobs((js) => (before ? [...js, ...r.jobs] : r.jobs));
        setMore(r.jobs.length === PAGE);
      } finally {
        setLoading(false);
      }
    },
    [type],
  );

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Thư viện</h1>
        <Chips options={FILTERS} value={type} onChange={setType} />
      </div>
      {!loading && jobs.length === 0 && <p className="rounded-xl border border-dashed border-line p-10 text-center text-sm text-muted">Chưa có kết quả nào.</p>}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {jobs.map((j) => (
          <JobCard key={j.id} job={j} />
        ))}
        {loading && Array.from({ length: 3 }).map((_, i) => <div key={i} className="shimmer h-64 rounded-xl" />)}
      </div>
      {more && !loading && (
        <div className="text-center">
          <Button variant="ghost" onClick={() => load(jobs[jobs.length - 1]?.createdAt)}>
            Xem thêm
          </Button>
        </div>
      )}
    </div>
  );
}
