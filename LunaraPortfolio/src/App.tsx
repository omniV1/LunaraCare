import { useEffect, useMemo, useRef, useState } from 'react';
import { layoutNextLine, prepareWithSegments } from '@chenglou/pretext';
import {
  architectureLayers,
  artifactLinks,
  brandImages,
  codeSamples,
  featureColumns,
  heroNarrative,
  highlights,
  implementationNotes,
  portfolioStats,
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

  return (
    <div className="page-shell">
      <header className="hero-shell">
        <div className="topbar">
          <div className="topbar-wordmark">
            <span className="topbar-script">Lunara</span>
            <span className="topbar-divider" />
            <span className="topbar-label">Project Portfolio</span>
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
                This standalone site explains the application behind the capstone through the same warm,
                editorial visual language as the main LUNARA experience.
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
                <p className="obstacle-label">Why Pretext here?</p>
                <h2>Editorial text flow without DOM reflow.</h2>
                <p>
                  The body copy on the left is laid out line by line with Pretext so it can route around
                  this card while keeping browser-accurate text measurement.
                </p>
                <ul>
                  <li>Canvas-based text measurement</li>
                  <li>Obstacle-aware wrapping</li>
                  <li>No `getBoundingClientRect` hot-path layout reads</li>
                </ul>
              </aside>
            ) : null}
          </div>
          <p className="editorial-caption">
            The hero paragraph uses <code>@chenglou/pretext</code> to compute each line and wrap it
            around a summary card, matching the portfolio’s editorial presentation goal.
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
          description="LUNARA is the core deliverable; this site is the explanatory layer around it."
        >
          <div className="card-grid">
            {highlights.map((item) => (
              <article key={item.title} className="content-card">
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </Section>

        <Section
          title="Architecture in one view"
          description="A simple portfolio-facing system diagram that mirrors the deeper documentation set."
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
          description="The MVP is broad enough to support both employer-facing discussion and capstone evaluation."
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
            {artifactLinks.map((artifact) => (
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

        <section className="split-banner">
          <div className="split-banner-copy">
            <p className="eyebrow">Visual continuity</p>
            <h2>The portfolio now borrows the same visual cues as the product itself.</h2>
            <p>
              Cream paper surfaces, deep brown framing, soft sage accents, large photography, and
              serif/script typography all echo the main LUNARA website so the portfolio feels like part
              of the same brand world.
            </p>
          </div>
          <div className="split-banner-media">
            <img src={brandImages.baby} alt="Lunara visual styling reference" />
          </div>
        </section>

        <Section
          title="Implementation notes"
          description="The portfolio requirement also needs practical access details, not just visuals."
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
          description="Short snippets that show how the project handles seeded access, guarded routes, and the portfolio site’s own Pretext layout."
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
              A capstone portfolio companion to the live application at{' '}
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
