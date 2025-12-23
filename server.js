import express from "express";
import fetch from "node-fetch";
import * as cheerio from "cheerio";

const app = express();

app.get("/extract-gpx", async (req, res) => {
  try {
    const pageUrl = req.query.url;
    if (!pageUrl) {
      return res.status(400).send("URL manquante");
    }

    const html = await (await fetch(pageUrl)).text();
    const $ = cheerio.load(html);

    const nextDataRaw = $("#__NEXT_DATA__").html();
    if (!nextDataRaw) {
      return res.status(404).send("Données Visorando introuvables");
    }

    const data = JSON.parse(nextDataRaw);
    const pageProps = data?.props?.pageProps;

    const randonneeId =
      pageProps?.idRandonnee ||
      pageProps?.randonnee?.id ||
      pageProps?.hike?.id ||
      pageProps?.hikeId;

    if (!randonneeId) {
      return res.status(404).send("ID de randonnée introuvable");
    }

    const gpxUrl = `https://www.visorando.com/telechargement/randonnee/gpx/${randonneeId}`;
    const gpx = await (await fetch(gpxUrl)).text();

    res.set("Content-Type", "application/gpx+xml");
    res.send(gpx);

  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur serveur");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Serveur GPX actif sur le port", PORT);
});
