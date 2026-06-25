<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:s="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <xsl:output method="html" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <title>Sitemap · Jotazo Telecom</title>
        <style>
          :root { color-scheme: light; }
          * { box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, sans-serif;
            margin: 0; background: #f6f8fb; color: #0f1b3d;
          }
          header {
            background: linear-gradient(135deg, #0f1b3d 0%, #1e3a5f 100%);
            color: #fff; padding: 32px 24px;
          }
          header .wrap { max-width: 1100px; margin: 0 auto; }
          h1 { margin: 0 0 6px; font-size: 22px; font-weight: 700; letter-spacing: -0.01em; }
          header p { margin: 0; opacity: 0.8; font-size: 14px; }
          main { max-width: 1100px; margin: -16px auto 48px; padding: 0 24px; }
          .card {
            background: #fff; border: 1px solid #e6eaf2; border-radius: 14px;
            box-shadow: 0 4px 20px -8px rgba(15,27,61,0.08);
            margin-top: 24px; overflow: hidden;
          }
          .card h2 {
            margin: 0; padding: 16px 20px; font-size: 14px; font-weight: 600;
            text-transform: uppercase; letter-spacing: 0.06em;
            color: #1e3a5f; background: #f1f5fb; border-bottom: 1px solid #e6eaf2;
            display: flex; justify-content: space-between; align-items: center;
          }
          .card h2 .count {
            background: #1e3a5f; color: #fff; font-size: 11px; padding: 3px 10px;
            border-radius: 999px; font-weight: 600; letter-spacing: 0;
          }
          table { width: 100%; border-collapse: collapse; font-size: 13px; }
          th, td { text-align: left; padding: 10px 20px; border-bottom: 1px solid #f0f3f8; }
          th { background: #fafbfd; color: #6b7a99; font-weight: 600; font-size: 11px;
               text-transform: uppercase; letter-spacing: 0.05em; }
          tr:last-child td { border-bottom: none; }
          tr:hover td { background: #fafcff; }
          a { color: #1e3a5f; text-decoration: none; word-break: break-all; }
          a:hover { color: #e85d3a; text-decoration: underline; }
          .meta { color: #6b7a99; white-space: nowrap; font-variant-numeric: tabular-nums; }
          .pri { display: inline-block; min-width: 36px; padding: 2px 8px; border-radius: 6px;
                 background: #eef3fb; color: #1e3a5f; font-weight: 600; text-align: center; }
          footer { max-width: 1100px; margin: 0 auto; padding: 16px 24px;
                   color: #6b7a99; font-size: 12px; }
        </style>
      </head>
      <body>
        <header>
          <div class="wrap">
            <h1>Sitemap · Jotazo Telecom</h1>
            <p>Visualização organizada — <xsl:value-of select="count(s:urlset/s:url)"/> URLs no total</p>
          </div>
        </header>
        <main>
          <xsl:call-template name="section">
            <xsl:with-param name="title" select="'Páginas principais'"/>
            <xsl:with-param name="match" select="'main'"/>
          </xsl:call-template>
          <xsl:call-template name="section">
            <xsl:with-param name="title" select="'Blog'"/>
            <xsl:with-param name="match" select="'blog'"/>
          </xsl:call-template>
          <xsl:call-template name="section">
            <xsl:with-param name="title" select="'Cobertura por cidade'"/>
            <xsl:with-param name="match" select="'cobertura'"/>
          </xsl:call-template>
        </main>
        <footer>Gerado automaticamente · jotazo.com.br/sitemap.xml</footer>
      </body>
    </html>
  </xsl:template>

  <xsl:template name="section">
    <xsl:param name="title"/>
    <xsl:param name="match"/>
    <xsl:variable name="rows" select="s:urlset/s:url[
      ($match='blog'      and contains(s:loc,'/blog/')) or
      ($match='cobertura' and contains(s:loc,'/cobertura/')) or
      ($match='main'      and not(contains(s:loc,'/blog/')) and not(contains(s:loc,'/cobertura/')))
    ]"/>
    <xsl:if test="count($rows) &gt; 0">
      <section class="card">
        <h2><xsl:value-of select="$title"/><span class="count"><xsl:value-of select="count($rows)"/></span></h2>
        <table>
          <thead>
            <tr><th>URL</th><th class="meta">Atualizado</th><th class="meta">Frequência</th><th class="meta">Prioridade</th></tr>
          </thead>
          <tbody>
            <xsl:for-each select="$rows">
              <tr>
                <td><a href="{s:loc}"><xsl:value-of select="s:loc"/></a></td>
                <td class="meta"><xsl:value-of select="s:lastmod"/></td>
                <td class="meta"><xsl:value-of select="s:changefreq"/></td>
                <td class="meta"><span class="pri"><xsl:value-of select="s:priority"/></span></td>
              </tr>
            </xsl:for-each>
          </tbody>
        </table>
      </section>
    </xsl:if>
  </xsl:template>
</xsl:stylesheet>
