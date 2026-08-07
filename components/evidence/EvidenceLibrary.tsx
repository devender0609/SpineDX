"use client";
import { useMemo, useState } from "react";
import { EVIDENCE_REGISTRY, EVIDENCE_DOMAIN_LABELS, LINK_LABEL, ACCESS_LABEL } from "@/lib/evidence";
import type { SourceLinks } from "@/lib/evidence";
import type { EvidenceDomain, EvidenceItem, VerificationStage } from "@/lib/evidence";

const VERIFICATION_LABEL: Record<VerificationStage, string> = {
  "source-verified": "Source verified",
  "metadata-verified": "Metadata verified",
  "summary-verified": "Summary verified",
  "mapping-verified": "Mapping verified",
  "pending": "Pending verification",
};

function VerificationBadge({ item }: { item: EvidenceItem }) {
  const pending = item.verification === "pending";
  return (
    <span className={`verify-badge ${pending ? "pending" : "checked"}`}>
      <span aria-hidden="true">{pending ? "◌" : "✓"}</span>
      {VERIFICATION_LABEL[item.verification]}
      {item.verifiedOn ? ` · ${item.verifiedOn}` : ""}
    </span>
  );
}

function EvidenceCard({ item }: { item: EvidenceItem }) {
  const [open, setOpen] = useState(false);
  const pending = item.verification === "pending";
  return (
    <article className={`evidence-entry ${pending ? "is-pending" : ""}`}>
      <header>
        <div className="evidence-entry-tags">
          <span className="ev-id">{item.id}</span>
          <span className="ev-type">{item.studyType.replaceAll("-", " ")}</span>
          <VerificationBadge item={item} />
          {item.superseded && <span className="ev-superseded">Superseded by {item.superseded}</span>}
        </div>
        <h4>{item.citation}</h4>
      </header>

      {pending && (
        <p className="pending-note">
          This summary has not been checked against the source document. Treat it as a pointer
          to the literature, not as authoritative guidance.
        </p>
      )}

      <p className="ev-finding">{item.mainFinding}</p>

      <dl className="ev-meta">
        <div><dt>Population</dt><dd>{item.population}</dd></div>
        {item.evidenceLevel && <div><dt>Level</dt><dd>{item.evidenceLevel}</dd></div>}
        <div><dt>Reviewed</dt><dd>{item.reviewDate}</dd></div>
      </dl>

      <button type="button" className="link-button" onClick={() => setOpen(o => !o)} aria-expanded={open}>
        {open ? "Hide applicability and limitations" : "Applicability and limitations"}
      </button>

      {open && (
        <dl className="ev-meta expanded">
          <div><dt>Applicability to the framework</dt><dd>{item.applicability}</dd></div>
          <div><dt>Major exclusions</dt><dd>{item.keyExclusions}</dd></div>
          <div><dt>Limitations</dt><dd>{item.limitations}</dd></div>
        </dl>
      )}

      {/* Labels name the destination; a generic label would wrongly imply open access. */}
      <div className="ev-links">
        {item.sourceLinks
          ? (Object.keys(item.sourceLinks) as (keyof SourceLinks)[])
              .filter(k => item.sourceLinks?.[k])
              .map(k => (
                <a key={k} className="ev-link" href={item.sourceLinks![k]} target="_blank" rel="noreferrer">
                  {LINK_LABEL[k]}
                </a>
              ))
          : <a className="ev-link" href={item.url} target="_blank" rel="noreferrer">Source record</a>}
        {item.accessStatus && <span className="ev-access">{ACCESS_LABEL[item.accessStatus]}</span>}
      </div>
    </article>
  );
}

export default function EvidenceLibrary() {
  const [domain, setDomain] = useState<EvidenceDomain | "all">("all");
  const [query, setQuery] = useState("");

  const all = useMemo(() => Object.values(EVIDENCE_REGISTRY), []);
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const e of all) c[e.domain] = (c[e.domain] ?? 0) + 1;
    return c;
  }, [all]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter(e => {
      if (domain !== "all" && e.domain !== domain) return false;
      if (!q) return true;
      // Search covers author/organisation, title, trial or guideline name, topic and ID.
      return [e.id, e.citation, e.mainFinding, e.population, e.applicability, e.studyType, e.domain]
        .join(" ").toLowerCase().includes(q);
    });
  }, [all, domain, query]);

  const pendingCount = all.filter(e => e.verification === "pending").length;

  return (
    <section className="evidence-library">
      <header className="evidence-header">
        <div>
          <h2>Curated evidence supporting the current framework</h2>
          <p>
            {all.length} sources. Not a systematic review and not comprehensive.{" "}
            {pendingCount > 0 && `${pendingCount} entries are pending verification and are marked.`}
          </p>
        </div>
        <input
          type="search"
          className="evidence-search"
          placeholder="Search author, title, trial, topic or evidence ID"
          value={query}
          onChange={e => setQuery(e.target.value)}
          aria-label="Search evidence"
        />
      </header>

      <div className="evidence-filters" role="group" aria-label="Filter by clinical domain">
        <button type="button" className={domain === "all" ? "active" : ""} onClick={() => setDomain("all")}>
          All <span className="chip-count">{all.length}</span>
        </button>
        {(Object.keys(EVIDENCE_DOMAIN_LABELS) as EvidenceDomain[])
          .filter(d => counts[d])
          .map(d => (
            <button key={d} type="button" className={domain === d ? "active" : ""} onClick={() => setDomain(d)}>
              {EVIDENCE_DOMAIN_LABELS[d]} <span className="chip-count">{counts[d]}</span>
            </button>
          ))}
      </div>

      {visible.length === 0 ? (
        <p className="empty-state">No sources match this filter and search.</p>
      ) : (
        <div className="evidence-list">
          {visible.map(item => <EvidenceCard key={item.id} item={item} />)}
        </div>
      )}
    </section>
  );
}
