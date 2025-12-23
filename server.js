import express from "express";
import fetch from "node-fetch";
import * as cheerio from "cheerio";
import cors from "cors";

const app = express();
app.use(cors());

// Endpoint principal
app.get("/extract-gpx", async (req, res) => {
  try {
    const pageUrl = req.query.url;
    if (!pageUrl) {
      return res.status(400).send("URL manquante");
    }

    /* --------------------------------------------------
       1. Télécharger la page HTML Visorando
    -------------------------------------------------- */
    const pageResponse = await fetch(pageUrl);
    if (!pageResponse.ok) {
      return res.status(400).send("Impossible de charger la page Visorando");
    }

    const html = await pageResponse.text();

    /* --------------------------------------------------
       2. Charger le HTML dans Cheerio
    -------------------------------------------------- */
    const $ = cheerio.load(html);

    /* --------------------------------------------------
       3. Extraire les données Next.js (__NEXT_DATA__)
    -------------------------------------------------- */
    const nextDataRaw = $("#__NEXT_DATA__").html();
    if (!nextDataRaw) {
      return res.status(404).send("Données Visorando introuvables");
    }

    let nextData;
    try {
      nextData = JSON.parse(nextDataRaw);
    } catch (e) {
      return res.status(500).send("JSON Visorando invalide");
    }

    /* --------------------------------------------------
       4. Extraire l’ID de la randonnée (robuste)
    -------------------------------------------------- */
    const pageProps = nextData?.props?.pageProps;

    const randonneeId =
      pageProps?.idRandonnee ||
      pageProps?.randonnee?.id ||
      pageProps?.hike?.id ||
      pageProps?.hikeId;

    if (!randonneeId) {
      return res.status(404).send("ID de randonnée introuvable");
    }

    /* --------------------------------------------------
       5. Construire l’URL GPX Visorando
    -------------------------------------------------- */
    const gpxUrl = `https://www.visorando.com/telechargement/randonnee/gpx/${randonneeId}`;

    /* --------------------------------------------------
       6. Télécharger le GPX
    -------------------------------------------------- */
    const gpxResponse = await fetch(gpxUrl);
    if (!gpxResponse.ok) {
      return res.status(404).send("Téléchargement GPX échoué");
    }

    const gpx = await gpxResponse.text();

    /* --------------------------------------------------
       7. Renvoyer le GPX au client
    -------------------------------------------------- */
    res.set("Content-Type", "application/gpx+xml");
    res.send(gpx);

  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur serveur");
  }
});

/* --------------------------------------------------
   Démarrage serveur (Render-compatible)
-------------------------------------------------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Serveur GPX actif sur le port", PORT);
});
