<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" 
    xmlns:html="http://www.w3.org/TR/REC-html40"
    xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
    xmlns:xhtml="http://www.w3.org/1999/xhtml"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html xmlns="http://www.w3.org/1999/xhtml" lang="en">
      <head>
        <title>
          <xsl:choose>
            <xsl:when test="sitemap:sitemapindex">XML Sitemap Index — Steel Rebar Calculator</xsl:when>
            <xsl:otherwise>XML Sitemap — Steel Rebar Calculator</xsl:otherwise>
          </xsl:choose>
        </title>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style type="text/css">
          :root {
            --brand: #f97316;
            --brand-dark: #ea580c;
            --bg: #0f172a;
            --surface: #ffffff;
            --surface-subtle: #f8fafc;
            --ink: #0f172a;
            --ink-soft: #475569;
            --ink-muted: #64748b;
            --line: #e2e8f0;
            --good: #16a34a;
            --accent: #2563eb;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background: #f1f5f9;
            color: var(--ink);
            line-height: 1.5;
            padding: 24px 16px 48px;
          }
          .container {
            max-width: 1200px;
            margin: 0 auto;
          }
          .header-card {
            background: var(--surface);
            border: 1px solid var(--line);
            border-radius: 12px;
            padding: 28px 32px;
            margin-bottom: 24px;
            box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.05);
          }
          .brand-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 16px;
            margin-bottom: 12px;
            padding-bottom: 16px;
            border-bottom: 1px solid var(--line);
          }
          .brand-logo {
            display: flex;
            align-items: center;
            gap: 10px;
            text-decoration: none;
            color: var(--ink);
            font-weight: 800;
            font-size: 1.25rem;
          }
          .brand-badge {
            background: #fff7ed;
            color: var(--brand-dark);
            border: 1px solid #fed7aa;
            font-size: 0.75rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            padding: 3px 8px;
            border-radius: 9999px;
          }
          .back-link {
            color: var(--accent);
            text-decoration: none;
            font-size: 0.9rem;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            gap: 6px;
          }
          .back-link:hover {
            text-decoration: underline;
          }
          h1 {
            font-size: 1.75rem;
            font-weight: 800;
            color: var(--ink);
            margin-bottom: 8px;
          }
          p.lead {
            color: var(--ink-soft);
            font-size: 0.95rem;
            margin-bottom: 16px;
            max-width: 800px;
          }
          .stats-bar {
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
            padding-top: 12px;
          }
          .stat-pill {
            background: var(--surface-subtle);
            border: 1px solid var(--line);
            border-radius: 8px;
            padding: 8px 14px;
            font-size: 0.85rem;
            color: var(--ink-soft);
          }
          .stat-pill strong {
            color: var(--ink);
            font-weight: 700;
          }
          .table-wrapper {
            background: var(--surface);
            border: 1px solid var(--line);
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.05);
          }
          table {
            width: 100%;
            border-collapse: collapse;
            text-align: left;
            font-size: 0.88rem;
          }
          thead {
            background: #0f172a;
            color: #f8fafc;
          }
          th {
            padding: 14px 16px;
            font-weight: 600;
            font-size: 0.78rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          tbody tr {
            border-bottom: 1px solid var(--line);
            transition: background 0.15s ease;
          }
          tbody tr:last-child {
            border-bottom: none;
          }
          tbody tr:hover {
            background: #f8fafc;
          }
          td {
            padding: 12px 16px;
            vertical-align: middle;
          }
          td.url-cell {
            word-break: break-all;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-size: 0.84rem;
          }
          td.url-cell a {
            color: var(--accent);
            text-decoration: none;
          }
          td.url-cell a:hover {
            text-decoration: underline;
            color: #1d4ed8;
          }
          .badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 6px;
            font-size: 0.75rem;
            font-weight: 600;
            text-align: center;
          }
          .badge-priority-high {
            background: #dcfce7;
            color: #15803d;
            font-weight: 700;
          }
          .badge-priority-mid {
            background: #e0f2fe;
            color: #0369a1;
          }
          .badge-priority-norm {
            background: #f1f5f9;
            color: #475569;
          }
          .badge-freq {
            background: #f8fafc;
            border: 1px solid var(--line);
            color: var(--ink-soft);
          }
          .hreflang-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
            max-width: 280px;
          }
          .tag-lang {
            background: #f1f5f9;
            border: 1px solid var(--line);
            color: var(--ink-soft);
            font-size: 0.7rem;
            font-weight: 700;
            text-transform: uppercase;
            padding: 1px 5px;
            border-radius: 4px;
            text-decoration: none;
          }
          .tag-lang:hover {
            background: #fed7aa;
            color: var(--brand-dark);
            border-color: #fdba74;
          }
          .footer-note {
            text-align: center;
            margin-top: 24px;
            font-size: 0.82rem;
            color: var(--ink-muted);
          }
          .footer-note a {
            color: var(--ink-soft);
          }
          @media (max-width: 768px) {
            .hide-mobile {
              display: none;
            }
            .header-card {
              padding: 20px;
            }
            th, td {
              padding: 10px 12px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header-card">
            <div class="brand-row">
              <a href="https://steelrebarcalculator.com/" class="brand-logo">
                <span>Steel Rebar Calculator</span>
                <span class="brand-badge">Sitemap</span>
              </a>
              <a href="https://steelrebarcalculator.com/" class="back-link">
                ← Return to Website
              </a>
            </div>

            <xsl:choose>
              <!-- SITEMAP INDEX VIEW -->
              <xsl:when test="sitemap:sitemapindex">
                <h1>XML Sitemap Index</h1>
                <p class="lead">
                  This sitemap index coordinates crawl coverage across all languages and silos on steelrebarcalculator.com. Generated in accordance with the sitemaps.org XML protocol.
                </p>
                <div class="stats-bar">
                  <div class="stat-pill">
                    Total Sitemaps: <strong><xsl:value-of select="count(sitemap:sitemapindex/sitemap:sitemap)"/></strong>
                  </div>
                  <div class="stat-pill">
                    Standard: <strong>Sitemaps.org Protocol</strong>
                  </div>
                </div>
              </xsl:when>

              <!-- URLSET VIEW -->
              <xsl:otherwise>
                <h1>XML Sitemap</h1>
                <p class="lead">
                  This sitemap lists canonical URLs, hierarchical silo structures, and reciprocal hreflang translations for search engines (Google, Bing).
                </p>
                <div class="stats-bar">
                  <div class="stat-pill">
                    Total URLs: <strong><xsl:value-of select="count(sitemap:urlset/sitemap:url)"/></strong>
                  </div>
                  <div class="stat-pill">
                    Multilingual: <strong>hreflang reciprocal links enabled</strong>
                  </div>
                  <div class="stat-pill">
                    Structure: <strong>Hierarchical Silo Workflow</strong>
                  </div>
                </div>
              </xsl:otherwise>
            </xsl:choose>
          </div>

          <div class="table-wrapper">
            <xsl:choose>
              <!-- SITEMAP INDEX TABLE -->
              <xsl:when test="sitemap:sitemapindex">
                <table>
                  <thead>
                    <tr>
                      <th style="width: 50px;">#</th>
                      <th>Sitemap URL</th>
                      <th style="width: 180px;">Last Modified</th>
                    </tr>
                  </thead>
                  <tbody>
                    <xsl:for-each select="sitemap:sitemapindex/sitemap:sitemap">
                      <tr>
                        <td><xsl:value-of select="position()"/></td>
                        <td class="url-cell">
                          <a href="{sitemap:loc}"><xsl:value-of select="sitemap:loc"/></a>
                        </td>
                        <td>
                          <xsl:value-of select="sitemap:lastmod"/>
                        </td>
                      </tr>
                    </xsl:for-each>
                  </tbody>
                </table>
              </xsl:when>

              <!-- URLSET TABLE -->
              <xsl:otherwise>
                <table>
                  <thead>
                    <tr>
                      <th style="width: 50px;">#</th>
                      <th>Page URL</th>
                      <th style="width: 220px;" class="hide-mobile">Alternate Languages</th>
                      <th style="width: 110px;" class="hide-mobile">Changefreq</th>
                      <th style="width: 90px;">Priority</th>
                      <th style="width: 130px;">Last Modified</th>
                    </tr>
                  </thead>
                  <tbody>
                    <xsl:for-each select="sitemap:urlset/sitemap:url">
                      <tr>
                        <td><xsl:value-of select="position()"/></td>
                        <td class="url-cell">
                          <a href="{sitemap:loc}"><xsl:value-of select="sitemap:loc"/></a>
                        </td>
                        <td class="hide-mobile">
                          <div class="hreflang-tags">
                            <xsl:for-each select="xhtml:link[@rel='alternate']">
                              <a class="tag-lang" href="{@href}" title="{@href}">
                                <xsl:value-of select="@hreflang"/>
                              </a>
                            </xsl:for-each>
                          </div>
                        </td>
                        <td class="hide-mobile">
                          <span class="badge badge-freq"><xsl:value-of select="sitemap:changefreq"/></span>
                        </td>
                        <td>
                          <xsl:choose>
                            <xsl:when test="sitemap:priority &gt;= 0.8">
                              <span class="badge badge-priority-high"><xsl:value-of select="sitemap:priority"/></span>
                            </xsl:when>
                            <xsl:when test="sitemap:priority &gt;= 0.6">
                              <span class="badge badge-priority-mid"><xsl:value-of select="sitemap:priority"/></span>
                            </xsl:when>
                            <xsl:otherwise>
                              <span class="badge badge-priority-norm"><xsl:value-of select="sitemap:priority"/></span>
                            </xsl:otherwise>
                          </xsl:choose>
                        </td>
                        <td>
                          <xsl:value-of select="sitemap:lastmod"/>
                        </td>
                      </tr>
                    </xsl:for-each>
                  </tbody>
                </table>
              </xsl:otherwise>
            </xsl:choose>
          </div>

          <div class="footer-note">
            <p>Generated by Steel Rebar Calculator Engine • Fully compatible with Google Search Console &amp; Bing Webmaster Tools</p>
          </div>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
