import express from "express";
import fetch from "node-fetch";
import cheerio from "cheerio";

const app = express();

app.get("/extract-gpx", async (req, res) => {
  try {
    const pageUrl = req.query.url;
    if (!pageUrl) {
      return res.status(400).send("URL manquante");
    }

    // 1. Télécharger la page HTML
    const html = await (await fetch(pageUrl)).text();

    // 2. Charger le HTML dans Cheerio
    const $ = cheerio.load(html);

    // 3. Trouver le lien GPX (cas Visorando)
    let gpxLink = null;

    $("a").each((i, el) => {
      const href = $(el).attr("href");
      if (href && href.toLowerCase().includes("gpx")) {
        gpxLink = href;
      }
    });

    if (!gpxLink) {
      return res.status(404).send("Lien GPX introuvable");
    }

    // 4. Lien relatif → absolu
    if (gpxLink.startsWith("/")) {
      const base = new URL(pageUrl).origin;
      gpxLink = base + gpxLink;
    }

    // 5. Télécharger le GPX
    const gpx = await (await fetch(gpxLink)).text();

    // 6. Renvoyer le GPX à Bubble
    res.set("Content-Type", "application/gpx+xml");
    res.send(gpx);

  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur serveur");
  }
});

app.listen(3000, () => {
  console.log("Serveur GPX actif");
});
