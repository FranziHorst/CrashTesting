# N. Sane Transformation — Landingpage

Landingpage für **N. Sane Transformation**, eine fiktive Disruptions- und Change-Management-Beratung,
gegründet von Crash Bandicoot. Zielgruppe: Führungskräfte, die verkrustete Strukturen aufbrechen wollen.
Ton: selbstbewusst, leicht chaotisch-verspielt, aber erwachsen.

Reines Static-Web-Projekt — kein Build-Step, keine Abhängigkeiten, kein Framework.

## Starten

```bash
npx http-server -p 8080 .      # oder: python3 -m http.server 8080
```

Dann `http://localhost:8080` öffnen. Die Seite läuft auch direkt per `file://`, Schriften und Bilder
sind lokal eingebunden.

## Struktur

```
index.html              komplette Seite (semantisches Markup, 9 Sektionen)
assets/css/style.css    Design-System + alle Sektionen, mobile-first Breakpoints
assets/js/main.js       sämtliche Interaktionen, eine rAF-Schleife, IntersectionObserver
assets/fonts.css        @font-face-Deklarationen
assets/fonts/*.woff2    selbst gehostete Subsets (Anton, Space Grotesk, Space Mono)
assets/img/*.webp       Heldenbild in vier Größen (responsive srcset)
```

## Design

| Rolle   | Wert                                            |
|---------|-------------------------------------------------|
| Schwarz | `#0a0a0a` (durchgehende Basis)                  |
| Weiß    | `#ffffff` (Text), Hairlines mit 14 % Deckung    |
| Orange  | `#ff4b12` (Akzent, punktuell und laut)          |
| Display | Anton — Plakatschrift, randlos gesetzt          |
| UI      | Space Grotesk                                   |
| Mono    | Space Mono — Labels, Zähler, Kleinkram          |

Der Hintergrund bleibt über die gesamte Seite schwarz — kein Farbwechsel beim Scrollen. Den Rhythmus
tragen stattdessen Typo-Größen, Haarlinien an jeder Sektionsmarke und punktuelle Orange-Flächen:
die Leistungs-Zeilen beim Hover, die Crash-o-Meter-Karte, die CTA-Karte am Ende der Methode und die
Stimmen-Karten beim Hover.

## Features & Micro-Interactions

- **Preloader** mit Zähler, Balken und Vorhang-Wipe
- **Hero-Typo, die sich selbst setzt** — Zeile 1 wird per Font-Size auf Spaltenbreite skaliert,
  Zeile 2 per Laufweite exakt auf dieselbe Breite ausgetrieben; passt sich Viewport und Resthöhe an
- **Eigener Cursor** (Punkt + Ring) mit Kontext-Labels („Boom", „Öffnen", „Spin!")
- **Magnetische Buttons**, die dem Zeiger entgegenkommen
- **Scramble-Text** auf Navigations- und Footer-Links
- **Parallax-Held**: Maus-Tilt plus Scroll-Versatz, per Lerp geglättet
- **Ticker-Marquee**, dessen Tempo mit der Scroll-Geschwindigkeit ansteigt
- **Stimmen-Marquee**, das bei Hover oder Tastaturfokus anhält, damit die Zitate lesbar bleiben
- **Wortweise Scroll-Reveal** im Manifest-Statement
- **Horizontale Scroll-Sektion** für die vier Phasen (gepinnt, mit Fortschrittsbalken und aktiver Karte)
- **Crash-o-Meter**: orange Karte mit Slider, fünf Eskalationsstufen, Equalizer und Shake-Feedback
- **Case-Karten** mit 3D-Tilt und zeigerfolgendem Glow
- **Akkordeons** für Leistungen (mehrfach offen) und FAQ (exklusiv)
- Zähler-Animationen, Scroll-Progress, Auto-Hide-Navigation, Grain-Overlay, rotierendes Siegel
- Logo-Klick dreht die Wortmarke einmal um sich selbst

## Technik

- Eine einzige `requestAnimationFrame`-Schleife für Cursor, Marquees, Parallax und Horizontal-Scroll;
  alles andere läuft über IntersectionObserver statt Scroll-Handler.
- Animiert wird ausschließlich `transform` und `opacity`.
- `prefers-reduced-motion: reduce` schaltet Animationen ab, entfernt den Preloader sofort und
  klappt die horizontale Sektion zu einer normalen vertikalen Liste auf.
- Tastaturbedienbar: Skip-Link, sichtbare Fokus-Ringe, `aria-expanded` an allen Togglern,
  Escape schließt das mobile Menü.
- Das Kontaktformular ist eine Demo und sendet nichts.

## Rechtliches

Fiktives Parodie-Projekt ohne kommerziellen Zweck. Crash Bandicoot ist eine Marke von
Activision Publishing, Inc. Alle Zahlen, Cases und Zitate sind erfunden.
