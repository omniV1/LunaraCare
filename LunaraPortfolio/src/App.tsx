import { useEffect, useMemo, useRef, useState } from 'react';
import { layoutNextLine, prepareWithSegments } from '@chenglou/pretext';
import posterPdf from './assets/lunara-showcase-poster-revised.pdf';
import {
  architectureNarrative,
  architectureLayers,
  artifactLinks,
  brandImages,
  codeSamples,
  featureColumns,
  heroNarrative,
  highlights,
  implementationNotes,
  portfolioStats,
  posterBoardNotes,
  runSteps,
  showcaseSections,
  teamLinks,
} from './siteContent';

type EditorialLine = {
  text: string;
  top: number;
  width: number;
};

type EditorialLayout = {
  lines: EditorialLine[];
  height: number;
  obstacleWidth: number;
  obstacleHeight: number;
};

const BODY_FONT = '500 20px Georgia';
const BODY_LINE_HEIGHT = 34;

function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const nextWidth = entries[0]?.contentRect.width ?? 0;
      setWidth(nextWidth);
    });

    observer.observe(element);
    setWidth(element.getBoundingClientRect().width);

    return () => observer.disconnect();
  }, []);

  return { ref, width };
}

function buildEditorialLayout(stageWidth: number): EditorialLayout {
  if (stageWidth <= 0) {
    return { lines: [], height: 0, obstacleWidth: 0, obstacleHeight: 0 };
  }

  const prepared = prepareWithSegments(heroNarrative, BODY_FONT);
  const obstacleWidth = stageWidth >= 940 ? 290 : stageWidth >= 720 ? 240 : 0;
  const obstacleHeight = obstacleWidth > 0 ? 260 : 0;
  const gap = obstacleWidth > 0 ? 28 : 0;
  const minimumWidth = Math.max(260, stageWidth - obstacleWidth - gap);

  let cursor = { segmentIndex: 0, graphemeIndex: 0 };
  let y = 0;
  const lines: EditorialLine[] = [];

  while (true) {
    const availableWidth = obstacleWidth > 0 && y < obstacleHeight ? minimumWidth : stageWidth;
    const line = layoutNextLine(prepared, cursor, availableWidth);

    if (!line) {
      break;
    }

    lines.push({ text: line.text, top: y, width: line.width });
    cursor = line.end;
    y += BODY_LINE_HEIGHT;
  }

  return {
    lines,
    height: Math.max(y, obstacleHeight),
    obstacleWidth,
    obstacleHeight,
  };
}

function App() {
  const { ref, width } = useElementWidth<HTMLDivElement>();

  const editorialLayout = useMemo(() => {
    const stageWidth = Math.max(320, width);
    return buildEditorialLayout(stageWidth);
  }, [width]);

  const resolvedArtifactLinks = useMemo(
    () =>
      artifactLinks.map((artifact) =>
        artifact.title === 'Showcase poster' ? { ...artifact, href: posterPdf } : artifact
      ),
    []
  );

  return (
    <div className="page-shell">
      <header className="hero-shell">
        <div className="topbar">
          <div className="topbar-wordmark">
            <span className="topbar-script">Lunara</span>
            <span className="topbar-divider" />
            <span className="topbar-label">Senior Project</span>
          </div>
          <nav className="topbar-nav">
            <a href="https://www.lunaracare.org" target="_blank" rel="noreferrer">
              Live App
            </a>
            <a href="https://github.com/omniV1/lunaraCare" target="_blank" rel="noreferrer">
              Repository
            </a>
            <a href="https://lunara.onrender.com/api-docs" target="_blank" rel="noreferrer">
              API Docs
            </a>
          </nav>
        </div>

        <div className="hero-stage">
          <div className="hero-backdrop">
            <img src={brandImages.hero} alt="" />
          </div>
          <div className="hero-overlay" />
          <div className="hero-stage-content">
            <div className="hero-copy">
              <p className="eyebrow">LUNARA PROJECT PORTFOLIO</p>
              <h1>Postpartum care continuity, packaged as a production-ready full-stack platform.</h1>
              <p className="hero-summary">
                LUNARA unifies the public brand experience, provider operations, and client recovery
                workflows into one coordinated platform built for secure communication, sustained
                support, and long-term maintainability.
              </p>
              <div className="hero-links">
                <a href="https://www.lunaracare.org" target="_blank" rel="noreferrer">
                  Open the live application
                </a>
                <a href="https://github.com/omniV1/lunaraCare" target="_blank" rel="noreferrer">
                  Browse the repository
                </a>
                <a href="https://lunara.onrender.com/api-docs" target="_blank" rel="noreferrer">
                  Review the API surface
                </a>
              </div>
            </div>

            <div className="hero-stats">
              {portfolioStats.map((stat) => (
                <article key={stat.label} className="stat-pill">
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </article>
              ))}
            </div>
          </div>
        </div>

        <div className="editorial-shell" ref={ref}>
          <div className="editorial-stage" style={{ minHeight: editorialLayout.height || 260 }}>
            {editorialLayout.lines.map((line) => (
              <span
                key={`${line.top}-${line.text}`}
                className="editorial-line"
                style={{ top: line.top, width: line.width }}
              >
                {line.text}
              </span>
            ))}

            {editorialLayout.obstacleWidth > 0 ? (
              <aside
                className="editorial-obstacle"
                style={{
                  width: editorialLayout.obstacleWidth,
                  minHeight: editorialLayout.obstacleHeight,
                }}
              >
                <img className="editorial-seal" src={brandImages.seal} alt="Lunara seal" />
                <p className="obstacle-label">Operational snapshot</p>
                <h2>A single product surface for recovery, scheduling, messaging, and care planning.</h2>
                <p>
                  The application ties together public discovery, provider coordination, and client
                  engagement without breaking the emotional tone of the brand.
                </p>
                <ul>
                  <li>Role-aware dashboards for providers and clients</li>
                  <li>Realtime messaging, appointments, and document workflows</li>
                  <li>Content, care plans, and recovery context in one system</li>
                </ul>
              </aside>
            ) : null}
          </div>
          <p className="editorial-caption">
            A dense opening narrative establishes the full scope of the product before moving into the
            architecture, workflow, and submission evidence behind the release.
          </p>
        </div>
      </header>

      <main className="content-shell">
        <section className="showcase-rail">
          {showcaseSections.map((section) => (
            <article
              key={section.title}
              className={`showcase-card ${
                section.align === 'image-left' ? 'showcase-card--reverse' : ''
              }`}
            >
              <div className="showcase-media">
                <img src={section.image} alt={section.title} />
              </div>
              <div className="showcase-copy">
                <p className="eyebrow">{section.kicker}</p>
                <h2>{section.title}</h2>
                <p>{section.description}</p>
              </div>
            </article>
          ))}
        </section>

        <Section
          title="Project overview"
          description="A coordinated postpartum platform across public, provider, and client experiences."
        >
          <div className="narrative-grid">
            <div className="narrative-column">
              {architectureNarrative.map((paragraph) => (
                <p key={paragraph} className="narrative-paragraph">
                  {paragraph}
                </p>
              ))}
            </div>
            <div className="narrative-column narrative-column--tight">
              <div className="highlight-list">
                {highlights.map((item) => (
                  <article key={item.title} className="highlight-item">
                    <h3>{item.title}</h3>
                    <p>{item.body}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </Section>

        <section className="poster-board">
          <div className="poster-board-frame">
            <iframe src={posterPdf} title="LUNARA showcase poster" />
          </div>
          <div className="poster-board-copy">
            <p className="eyebrow">Presentation asset</p>
            <h2>The showcase poster sits beside the same implementation story the live app proves out.</h2>
            <p>
              The poster is only one artifact in the release package. It now lives directly inside this
              deployment so reviewers can open it without depending on an external GitHub binary link.
            </p>
            <ul className="bullet-list">
              {posterBoardNotes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className="hero-links poster-actions">
              <a href={posterPdf} target="_blank" rel="noreferrer">
                Open the poster
              </a>
              <a href="https://www.lunaracare.org" target="_blank" rel="noreferrer">
                Compare with the live product
              </a>
            </div>
          </div>
        </section>

        <Section
          title="Architecture in one view"
          description="Application flow, coordination services, persistence, and operations are all deliberate parts of the release story."
        >
          <div className="architecture-stack">
            {architectureLayers.map((layer, index) => (
              <div key={layer.name} className="architecture-row">
                <div className="architecture-node">
                  <p className="architecture-name">{layer.name}</p>
                  <p>{layer.detail}</p>
                </div>
                {index < architectureLayers.length - 1 ? <div className="architecture-arrow" /> : null}
              </div>
            ))}
          </div>
        </Section>

        <Section
          title="Feature coverage"
          description="Provider and client flows were designed as parallel workspaces with different responsibilities but the same source of truth."
        >
          <div className="column-grid">
            {featureColumns.map((column) => (
              <article key={column.heading} className="content-card">
                <h3>{column.heading}</h3>
                <ul className="bullet-list">
                  {column.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </Section>

        <Section
          title="Artifacts and evidence"
          description="Everything a reviewer needs to validate the build, from docs to presentation materials."
        >
          <div className="artifact-list">
            {resolvedArtifactLinks.map((artifact) => (
              <a
                key={artifact.title}
                className="artifact-card"
                href={artifact.href}
                target="_blank"
                rel="noreferrer"
              >
                <div>
                  <p className="artifact-meta">{artifact.meta}</p>
                  <h3>{artifact.title}</h3>
                  <p>{artifact.description}</p>
                </div>
                <span className="artifact-arrow">Open</span>
              </a>
            ))}
          </div>
        </Section>

        <Section
          title="Implementation notes"
          description="Access details, deployment footprint, and demo setup matter because this system was built to be reviewed and run."
        >
          <div className="column-grid">
            <article className="content-card">
              <h3>Access and demo setup</h3>
              <ul className="bullet-list">
                {implementationNotes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
            <article className="content-card">
              <h3>Run locally</h3>
              <ol className="step-list">
                {runSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </article>
          </div>
        </Section>

        <Section
          title="Code excerpts"
          description="Small implementation slices show how the product handles seeded access, guarded workflows, and realtime communication."
        >
          <div className="snippet-grid">
            {codeSamples.map((sample) => (
              <article key={sample.title} className="snippet-card">
                <div className="snippet-header">
                  <h3>{sample.title}</h3>
                  <span>{sample.language}</span>
                </div>
                <pre>
                  <code>{sample.snippet}</code>
                </pre>
              </article>
            ))}
          </div>
        </Section>

        <Section
          title="Team references"
          description="Personal websites are included as supplemental professional references, not as the main project portfolio."
        >
          <div className="team-grid">
            {teamLinks.map((member) => (
              <article key={member.name} className="content-card">
                <h3>{member.name}</h3>
                <p className="team-role">{member.role}</p>
                <p>{member.note}</p>
                {member.href ? (
                  <a href={member.href} target="_blank" rel="noreferrer">
                    Visit site
                  </a>
                ) : (
                  <span className="team-unavailable">No public site linked</span>
                )}
              </article>
            ))}
          </div>
        </Section>

        <footer className="portfolio-footer">
          <div className="portfolio-footer-copy">
            <span className="topbar-script">Lunara</span>
            <p>
              A senior project showcase anchored by the live application at{' '}
              <a href="https://www.lunaracare.org" target="_blank" rel="noreferrer">
                lunaracare.org
              </a>
              .
            </p>
          </div>
          <div className="portfolio-footer-links">
            <a href="https://www.lunaracare.org" target="_blank" rel="noreferrer">
              Live app
            </a>
            <a href="https://github.com/omniV1/lunaraCare" target="_blank" rel="noreferrer">
              GitHub
            </a>
            <a href="https://lunara.onrender.com/api-docs" target="_blank" rel="noreferrer">
              API docs
            </a>
          </div>
        </footer>
      </main>
    </div>
  );
}

type SectionProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

function Section({ title, description, children }: SectionProps) {
  return (
    <section className="section-block">
      <div className="section-heading">
        <p className="eyebrow">{title}</p>
        <h2>{description}</h2>
      </div>
      {children}
    </section>
  );
}

export default App;
